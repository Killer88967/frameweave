// Dev-only loader: stamps every intrinsic JSX element (<div>, <button>, ...)
// with data-fw-loc="<absolute file>:<line>:<column>" so the Frameweave bridge
// can report exactly where a clicked element came from, and with
// data-fw-owner="<Component>" naming the component that renders it.
//
// Components (<Card />) are left alone: the intrinsic elements they render
// carry their own locations, and props like data-* are not always forwarded.

const { parse } = require("@babel/parser");

const ATTRIBUTE = "data-fw-loc";
const OWNER_ATTRIBUTE = "data-fw-owner";

/** @this {{ resourcePath: string }} */
module.exports = function frameweaveLoader(source) {
  const filePath = this.resourcePath;

  if (filePath.includes("node_modules") || filePath.includes('"')) {
    return source;
  }

  // Cheap bail-out before parsing files without JSX.
  if (!source.includes("<")) return source;

  let ast;

  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: filePath.endsWith(".tsx") ? ["jsx", "typescript"] : ["jsx"],
      errorRecovery: true,
    });
  } catch {
    // Let Next report the syntax error from the untouched source.
    return source;
  }

  const insertions = [];

  visit(ast.program, null, (node, owner) => {
    if (node.type !== "JSXOpeningElement") return;
    if (node.name.type !== "JSXIdentifier") return;
    if (!/^[a-z]/.test(node.name.name)) return;
    if (node.name.end == null || !node.loc) return;

    const alreadyStamped = node.attributes.some(
      (attribute) =>
        attribute.type === "JSXAttribute" &&
        attribute.name.type === "JSXIdentifier" &&
        attribute.name.name === ATTRIBUTE,
    );

    if (alreadyStamped) return;

    const { line, column } = node.loc.start;

    const ownerText = owner ? ` ${OWNER_ATTRIBUTE}="${owner}"` : "";

    insertions.push({
      offset: node.name.end,
      text: ` ${ATTRIBUTE}="${filePath}:${line}:${column + 1}"${ownerText}`,
    });
  });

  if (insertions.length === 0) return source;

  // Insert back to front so earlier offsets stay valid. Only text is added
  // after tag names, so line numbers in the output still match the source.
  insertions.sort((left, right) => right.offset - left.offset);

  let output = source;

  for (const { offset, text } of insertions) {
    output = output.slice(0, offset) + text + output.slice(offset);
  }

  return output;
};

function visit(node, owner, callback) {
  const currentOwner = readComponentName(node) ?? owner;

  callback(node, currentOwner);

  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "extra" || key.endsWith("Comments")) continue;

    const child = node[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === "string") {
          visit(item, currentOwner, callback);
        }
      }
    } else if (child && typeof child.type === "string") {
      visit(child, currentOwner, callback);
    }
  }
}

// function Card() {}  /  const Card = () => {}  /  const Card = memo(() => {})
function readComponentName(node) {
  let name = null;

  if (node.type === "FunctionDeclaration") {
    name = node.id?.name ?? null;
  } else if (
    node.type === "VariableDeclarator" &&
    node.id.type === "Identifier" &&
    node.init &&
    /Function|CallExpression/.test(node.init.type)
  ) {
    name = node.id.name;
  }

  return name && /^[A-Z]/.test(name) ? name : null;
}
