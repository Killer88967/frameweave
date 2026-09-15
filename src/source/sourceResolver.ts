import { parse } from "@babel/parser";
import * as t from "@babel/types";
import * as vscode from "vscode";

import type { ElementSelection, SourceMatch } from "../shared/protocol.js";

interface Candidate {
  match: SourceMatch;
  score: number;
}

export async function resolveElementSource(
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

export async function updateElementClassName(
  selection: ElementSelection,
  className: string,
): Promise<SourceMatch | null> {
  const match = await resolveElementSource(selection);

  if (!match || match.classNameEditable !== true) return null;

  const uri = await findSourceUri(match.filePath);

  if (!uri) return null;

  const document = await vscode.workspace.openTextDocument(uri);

  // Avoid overwriting changes the user is currently making.
  if (document.isDirty) return null;

  const element = findOpeningElement(document.getText(), match);

  if (!element) return null;

  const classNameAttribute = findClassNameAttribute(element);
  const staticAttributes = readStaticAttributes(element);

  if (classNameAttribute !== undefined && !staticAttributes.has("className"))
    return null;

  const replacement = `className={${JSON.stringify(className)}}`;
  const edit = new vscode.WorkspaceEdit();

  if (classNameAttribute) {
    const range = readNodeRange(classNameAttribute);

    if (!range) return null;

    edit.replace(
      uri,
      new vscode.Range(
        document.positionAt(range.start),
        document.positionAt(range.end),
      ),
      replacement,
    );
  } else {
    if (element.end === null || element.end === undefined) return null;

    const insertionOffset = element.end - (element.selfClosing ? 2 : 1);

    edit.insert(uri, document.positionAt(insertionOffset), ` ${replacement}`);
  }

  const applied = await vscode.workspace.applyEdit(edit);

  if (!applied || !(await document.save())) return null;

  return {
    ...match,
    className,
  };
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
  source: string,
  match: SourceMatch,
): t.JSXOpeningElement | null {
  const file = parse(source, {
    sourceType: "unambiguous",
    plugins: ["jsx", "typescript"],
    errorRecovery: true,
  });

  let result: t.JSXOpeningElement | null = null;

  visit(file.program, (node) => {
    if (!t.isJSXOpeningElement(node) || !node.loc) return;
    if (
      node.loc.start.line === match.line &&
      node.loc.start.column + 1 === match.column
    ) {
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
