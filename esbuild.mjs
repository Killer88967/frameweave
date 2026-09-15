import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  external: ["vscode"],
  sourcemap: true,
  sourcesContent: false,
  logLevel: "info",
};

if (watch) {
  const context = await esbuild.context(buildOptions);

  await context.watch();

  console.log("Watching Frameweave extension files...");
} else {
  await esbuild.build(buildOptions);
}
