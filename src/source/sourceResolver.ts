import { parse } from "@babel/parser";
import * as t from "@babel/types";
import * as vscode from "vscode";

import type {
  ElementSelection,
  EventBinding,
  SourceLocation,
  SourceMatch,
  SourceSnippet,
} from "../shared/protocol.js";

const SNIPPET_MAX_LINES = 40;

interface Candidate {
  match: SourceMatch;
  score: number;
}

export async function resolveElementSource(
  selection: ElementSelection,
): Promise<SourceMatch | null> {
  const exact = selection.sourceLocation
    ? await resolveFromLocation(selection, selection.sourceLocation)
    : null;

  const match = exact ?? (await guessElementSource(selection));

  return match ? withSourceDetails(match) : null;
}

/**
 * Adds what the Source Code and Events panels show: the element's JSX and
 * its on* handlers. Leaves the match as-is if the file can't be read.
 */
export async function withSourceDetails(
  match: SourceMatch,
): Promise<SourceMatch> {
  const uri = await findSourceUri(match.filePath);

  if (!uri) return match;

  let text: string;

  try {
    text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    return match;
  }

  const file = parse(text, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
    errorRecovery: true,
  });

  const element = findJsxElement(file, match.line, match.column);

  if (!element) return match;

  return {
    ...match,
    snippet: readSnippet(text, element),
    events: readEvents(text, element.openingElement),
  };
}

function findJsxElement(
  file: t.File,
  line: number,
  column: number,
): t.JSXElement | null {
  let result: t.JSXElement | null = null;

  visit(file.program, (node) => {
    if (!t.isJSXElement(node)) return;

    const start = node.openingElement.loc?.start;

    if (start && start.line === line && start.column + 1 === column) {
      result = node;
    }
  });

  return result;
}

function readSnippet(
  source: string,
  element: t.JSXElement,
): SourceSnippet | null {
  const location = element.loc;

  if (!location) return null;

  const lines = source
    .split(/\r?\n/)
    .slice(location.start.line - 1, location.end.line);

  const visible = lines.slice(0, SNIPPET_MAX_LINES);

  // Strip the shared indentation so deeply nested JSX still fits the panel.
  const indent = Math.min(
    ...visible
      .filter((line) => line.trim() !== "")
      .map((line) => line.length - line.trimStart().length),
  );

  return {
    startLine: location.start.line,
    code: visible.map((line) => line.slice(indent)).join("\n"),
    truncated: lines.length > visible.length,
  };
}

function readEvents(
  source: string,
  element: t.JSXOpeningElement,
): EventBinding[] {
  const events: EventBinding[] = [];

  for (const attribute of element.attributes) {
    if (!t.isJSXAttribute(attribute) || !t.isJSXIdentifier(attribute.name)) {
      continue;
    }

    const name = attribute.name.name;

    if (!/^on[A-Z]/.test(name)) continue;

    const value = attribute.value;
    const range = t.isJSXExpressionContainer(value)
      ? readNodeRange(value.expression)
      : null;

    const handler = range
      ? source.slice(range.start, range.end).replace(/\s+/g, " ")
      : "";

    events.push({
      name,
      handler: handler.length > 60 ? `${handler.slice(0, 57)}…` : handler,
    });
  }

  return events;
}

/**
 * Fast path: the app was started with @frameweave/next, so the clicked
 * element already says which file, line and column it came from.
 */
async function resolveFromLocation(
  selection: ElementSelection,
  location: SourceLocation,
): Promise<SourceMatch | null> {
  const uri = vscode.Uri.file(location.filePath);

  let text: string;

  try {
    text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
  } catch {
    return null;
  }

  const file = parse(text, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
    errorRecovery: true,
  });

  const filePath = vscode.workspace.asRelativePath(uri, false);
  const element = findOpeningElement(file, location.line, location.column);

  if (!element) return null;

  // The stamp may belong to an ancestor (when the click landed inside a
  // node_modules component), so the tag names are not required to match.
  const componentName = readElementName(element.name);
  const className = readStaticAttributes(element).get("className") ?? null;

  return {
    componentName,
    renderedTagName: selection.tagName,
    importSource: null,
    filePath,
    line: location.line,
    column: location.column,
    confidence: "exact",
    className,
    classNameEditable:
      findClassNameAttribute(element) === undefined || className !== null,
  };
}

/** Fallback for apps without @frameweave/next: score every JSX element. */
async function guessElementSource(
  selection: ElementSelection,
): Promise<SourceMatch | null> {
  const files = await vscode.workspace.findFiles(
    "**/*.{tsx,jsx}",
    "**/{node_modules,.git,dist,.next,out,coverage}/**",
    2_000,
  );
  const candidates: Candidate[] = [];

  await Promise.all(
    files.map(async (uri) => {
      try {
        const text = new TextDecoder().decode(
          await vscode.workspace.fs.readFile(uri),
        );
        const file = parse(text, {
          sourceType: "unambiguous",
          plugins: ["jsx", "typescript"],
          errorRecovery: true,
        });
        const imports = collectImports(file);

        visit(file.program, (node) => {
          if (!t.isJSXOpeningElement(node)) return;

          const candidate = scoreElement(node, uri, imports, selection);
          if (candidate) candidates.push(candidate);
        });
      } catch {
        // One temporarily invalid editor buffer should not stop other files
        // from being considered.
      }
    }),
  );

  candidates.sort((left, right) => right.score - left.score);

  const best = candidates[0];
  if (!best || best.score < 8) return null;

  const second = candidates[1];
  if (second && best.score - second.score < 2) return null;

  return best.match;
}

export async function openSourceMatch(match: SourceMatch): Promise<void> {
  const uri = await findSourceUri(match.filePath);

  if (!uri) throw new Error(`Could not find ${match.filePath}.`);

  const position = new vscode.Position(
    Math.max(0, match.line - 1),
    Math.max(0, match.column - 1),
  );

  // Open beside the designer so the canvas stays visible.
  await vscode.window.showTextDocument(uri, {
    viewColumn: vscode.ViewColumn.Beside,
    selection: new vscode.Range(position, position),
    preserveFocus: false,
  });
}

/**
 * Updates the className of an already-resolved element. Throws with a
 * user-facing message when the edit would not be safe.
 */
export async function updateElementClassName(
  match: SourceMatch,
  className: string,
): Promise<SourceMatch> {
  if (match.classNameEditable !== true) {
    throw new Error("Dynamic className expressions are read-only for now.");
  }

  const uri = await findSourceUri(match.filePath);

  if (!uri) throw new Error(`Could not find ${match.filePath}.`);

  const document = await vscode.workspace.openTextDocument(uri);

  // Avoid overwriting changes the user is currently making.
  if (document.isDirty) {
    throw new Error(
      `${match.filePath} has unsaved changes. Save it, then apply again.`,
    );
  }

  const source = document.getText();
  const element = findOpeningElement(
    parse(source, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    }),
    match.line,
    match.column,
  );

  if (!element) {
    throw new Error(
      "The element moved since it was selected. Select it again.",
    );
  }

  const classNameAttribute = findClassNameAttribute(element);
  const edit = new vscode.WorkspaceEdit();

  if (classNameAttribute) {
    const change = buildClassNameValueEdit(
      source,
      classNameAttribute,
      className,
    );

    if (!change) {
      throw new Error("Dynamic className expressions are read-only for now.");
    }

    edit.replace(
      uri,
      new vscode.Range(
        document.positionAt(change.start),
        document.positionAt(change.end),
      ),
      change.text,
    );
  } else {
    if (element.end === null || element.end === undefined) {
      throw new Error("Could not find where to add className.");
    }

    const insertionOffset = element.end - (element.selfClosing ? 2 : 1);
    const value = className.includes('"')
      ? `{${JSON.stringify(className)}}`
      : `"${className}"`;

    edit.insert(
      uri,
      document.positionAt(insertionOffset),
      ` className=${value}`,
    );
  }

  const applied = await vscode.workspace.applyEdit(edit);

  if (!applied || !(await document.save())) {
    throw new Error(`Could not save ${match.filePath}.`);
  }

  return withSourceDetails({
    ...match,
    className,
  });
}

/**
 * Replaces only the className value and keeps the author's style:
 * className="a" stays a quoted string, className={"a"} / {`a`} stay
 * expressions. Returns null for dynamic values (cn(...), variables, ...).
 */
function buildClassNameValueEdit(
  source: string,
  attribute: t.JSXAttribute,
  className: string,
): { start: number; end: number; text: string } | null {
  const value = attribute.value;

  if (t.isStringLiteral(value)) {
    const range = readNodeRange(value);

    if (!range) return null;

    const quote = source[range.start] === "'" ? "'" : '"';

    return {
      ...range,
      text: className.includes(quote)
        ? `{${JSON.stringify(className)}}`
        : `${quote}${className}${quote}`,
    };
  }

  if (!t.isJSXExpressionContainer(value)) return null;

  const expression = value.expression;
  const range = readNodeRange(expression);

  if (!range) return null;

  if (t.isStringLiteral(expression)) {
    return { ...range, text: JSON.stringify(className) };
  }

  if (t.isTemplateLiteral(expression) && expression.expressions.length === 0) {
    const needsEscaping = /[`\\]|\$\{/.test(className);

    return {
      ...range,
      text: needsEscaping ? JSON.stringify(className) : `\`${className}\``,
    };
  }

  return null;
}

function collectImports(file: t.File): Map<string, string> {
  const imports = new Map<string, string>();

  for (const statement of file.program.body) {
    if (!t.isImportDeclaration(statement)) continue;

    for (const specifier of statement.specifiers) {
      imports.set(specifier.local.name, statement.source.value);
    }
  }

  return imports;
}

async function findSourceUri(
  relativeFilePath: string,
): Promise<vscode.Uri | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];

  if (relativeFilePath.startsWith("/")) {
    const uri = vscode.Uri.file(relativeFilePath);

    try {
      await vscode.workspace.fs.stat(uri);
      return uri;
    } catch {
      return null;
    }
  }

  for (const folder of workspaceFolders) {
    const folderPrefix = `${folder.name}/`;

    const pathInsideFolder = relativeFilePath.startsWith(folderPrefix)
      ? relativeFilePath.slice(folderPrefix.length)
      : relativeFilePath;

    const uri = vscode.Uri.joinPath(folder.uri, ...pathInsideFolder.split("/"));

    try {
      await vscode.workspace.fs.stat(uri);
      return uri;
    } catch {
      // Try the next workspace folder.
    }
  }

  return null;
}

function findOpeningElement(
  file: t.File,
  line: number,
  column: number,
): t.JSXOpeningElement | null {
  let result: t.JSXOpeningElement | null = null;

  visit(file.program, (node) => {
    if (!t.isJSXOpeningElement(node) || !node.loc) return;
    if (node.loc.start.line === line && node.loc.start.column + 1 === column) {
      result = node;
    }
  });

  return result;
}

function readNodeRange(node: t.Node): { start: number; end: number } | null {
  if (
    node.start === null ||
    node.start === undefined ||
    node.end === null ||
    node.end === undefined
  ) {
    return null;
  }

  return {
    start: node.start,
    end: node.end,
  };
}

function visit(node: t.Node, callback: (node: t.Node) => void): void {
  callback(node);

  for (const key of t.VISITOR_KEYS[node.type] ?? []) {
    const child = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        if (isNode(item)) visit(item, callback);
      }
    } else if (isNode(child)) {
      visit(child, callback);
    }
  }
}

function isNode(value: unknown): value is t.Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string"
  );
}

function scoreElement(
  node: t.JSXOpeningElement,
  uri: vscode.Uri,
  imports: ReadonlyMap<string, string>,
  selection: ElementSelection,
): Candidate | null {
  const componentName = readElementName(node.name);
  const localName = componentName.split(".").at(-1) ?? componentName;
  const importSource = imports.get(localName) ?? null;
  const intrinsic = /^[a-z]/.test(componentName);
  const isNextImage = importSource === "next/image";

  if (intrinsic && componentName !== selection.tagName) return null;
  if (isNextImage && selection.tagName !== "img") return null;

  let score = intrinsic || isNextImage ? 6 : 1;
  const attributes = readStaticAttributes(node);
  const classNameAttribute = findClassNameAttribute(node);
  const className = attributes.get("className") ?? null;
  const classNameEditable =
    classNameAttribute === undefined || className !== null;

  score += scoreExactAttribute(attributes, selection.attributes, "id", 10);
  score += scoreExactAttribute(attributes, selection.attributes, "alt", 8);
  score += scoreExactAttribute(attributes, selection.attributes, "title", 5);
  score += scoreSource(attributes.get("src"), selection.attributes.src);
  score += scoreClasses(attributes.get("className"), selection.classNames);

  const position = node.loc?.start;
  if (!position) return null;

  return {
    score,
    match: {
      componentName,
      renderedTagName: selection.tagName,
      importSource,
      filePath: vscode.workspace.asRelativePath(uri, false),
      line: position.line,
      column: position.column + 1,
      confidence: score >= 20 ? "high" : score >= 12 ? "medium" : "low",
      className,
      classNameEditable,
    },
  };
}

function readElementName(name: t.JSXOpeningElement["name"]): string {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXNamespacedName(name)) {
    return `${name.namespace.name}:${name.name.name}`;
  }

  return `${readElementName(name.object)}.${name.property.name}`;
}

function findClassNameAttribute(
  node: t.JSXOpeningElement,
): t.JSXAttribute | undefined {
  return node.attributes.find(
    (attribute): attribute is t.JSXAttribute =>
      t.isJSXAttribute(attribute) &&
      t.isJSXIdentifier(attribute.name) &&
      attribute.name.name === "className",
  );
}

function readStaticAttributes(node: t.JSXOpeningElement): Map<string, string> {
  const result = new Map<string, string>();

  for (const property of node.attributes) {
    if (!t.isJSXAttribute(property) || !t.isJSXIdentifier(property.name)) {
      continue;
    }

    const value = property.value;
    if (t.isStringLiteral(value)) {
      result.set(property.name.name, value.value);
      continue;
    }

    if (!t.isJSXExpressionContainer(value)) continue;

    if (t.isStringLiteral(value.expression)) {
      result.set(property.name.name, value.expression.value);
    } else if (
      t.isTemplateLiteral(value.expression) &&
      value.expression.expressions.length === 0
    ) {
      result.set(
        property.name.name,
        value.expression.quasis[0]?.value.cooked ?? "",
      );
    }
  }

  return result;
}

function scoreExactAttribute(
  source: ReadonlyMap<string, string>,
  rendered: Readonly<Record<string, string>>,
  name: string,
  points: number,
): number {
  const sourceValue = source.get(name);
  const renderedValue = rendered[name];

  if (!sourceValue || !renderedValue) return 0;
  return sourceValue === renderedValue ? points : -2;
}

function scoreSource(
  source: string | undefined,
  rendered: string | undefined,
): number {
  if (!source || !rendered) return 0;
  return normalizeSource(rendered) === source ? 12 : -2;
}

function normalizeSource(value: string): string {
  try {
    const url = new URL(value, "http://frameweave.local");
    return url.pathname === "/_next/image"
      ? (url.searchParams.get("url") ?? url.pathname)
      : url.pathname;
  } catch {
    return value;
  }
}

function scoreClasses(source: string | undefined, rendered: string[]): number {
  if (!source || rendered.length === 0) return 0;

  const sourceClasses = new Set(source.split(/\s+/).filter(Boolean));
  const matches = rendered.filter((name) => sourceClasses.has(name)).length;

  if (matches === 0) return -2;
  if (matches === sourceClasses.size && matches === rendered.length) return 10;

  return Math.min(8, matches * 2);
}
