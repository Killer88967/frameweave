import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const extensionOptions = {
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

const webviewOptions = {
  entryPoints: ["src/webview/index.tsx"],
  outfile: "dist/webview.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  sourcesContent: false,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      watch ? "development" : "production",
    ),
  },
  minify: !watch,
  treeShaking: true,
  legalComments: "none",
};

if (watch) {
  const extensionContext = await esbuild.context(extensionOptions);

  const webviewContext = await esbuild.context(webviewOptions);

  await Promise.all([extensionContext.watch(), webviewContext.watch()]);

  console.log("Watching Frameweave files...");
} else {
  await Promise.all([
    esbuild.build(extensionOptions),
    esbuild.build(webviewOptions),
  ]);
}
