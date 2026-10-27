// Dev-only loader: stamps every intrinsic JSX element (<div>, <button>, ...)
// with data-fw-loc="<absolute file>:<line>:<column>" so the Frameweave bridge
// can report exactly where a clicked element came from.
//
// Components (<Card />) are left alone: the intrinsic elements they render
// carry their own locations, and props like data-* are not always forwarded.

const { parse } = require("@babel/parser");

const ATTRIBUTE = "data-fw-loc";

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

  visit(ast.program, (node) => {
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

    insertions.push({
      offset: node.name.end,
      text: ` ${ATTRIBUTE}="${filePath}:${line}:${column + 1}"`,
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

function visit(node, callback) {
  callback(node);

  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "extra" || key.endsWith("Comments")) continue;

    const child = node[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === "string") visit(item, callback);
      }
    } else if (child && typeof child.type === "string") {
      visit(child, callback);
    }
  }
}
