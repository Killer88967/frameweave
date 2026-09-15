import type {
  DetectionContext,
  TechnologyAdapter,
} from "../detection/types.js";
import type { NextProfile } from "../profile/types.js";

export class NextAdapter implements TechnologyAdapter {
  readonly name = "next" as const;

  async detect(context: DetectionContext): Promise<NextProfile | undefined> {
    const resolved = await context.resolvePackageVersion("next");

    if (!resolved) {
      return undefined;
    }

    const [appRouterFiles, pagesRouterFiles, configurationFiles] =
      await Promise.all([
        context.findFiles("{app,src/app}/**/{page,layout}.{js,jsx,ts,tsx}", 2),
        context.findFiles("{pages,src/pages}/**/*.{js,jsx,ts,tsx}", 2),
        context.findFiles("next.config.{js,cjs,mjs,ts}", 4),
      ]);

    const hasAppRouter = appRouterFiles.length > 0;
    const hasPagesRouter = pagesRouterFiles.length > 0;

    const router: NextProfile["router"] =
      hasAppRouter && hasPagesRouter
        ? "mixed"
        : hasAppRouter
          ? "app"
          : hasPagesRouter
            ? "pages"
            : "unknown";

    const routeFiles = [...appRouterFiles, ...pagesRouterFiles];

    const usesSourceDirectory = routeFiles.some((uri) => {
      const path = context.relativePath(uri);

      return path.split(/[\\/]/).includes("src");
    });

    const capabilities = ["jsx", "components", "file-system-routing"];

    if (hasAppRouter) {
      capabilities.push(
        "app-router",
        "layouts",
        "server-components",
        "client-components",
        "route-handlers",
      );
    }

    if (hasPagesRouter) {
      capabilities.push("pages-router", "api-routes");
    }

    return {
      name: "next",
      displayName: "Next.js",
      category: "meta-framework",
      packageName: "next",
      version: resolved.version,
      rootPath: ".",
      router,
      sourceDirectory:
        routeFiles.length === 0
          ? "unknown"
          : usesSourceDirectory
            ? "src"
            : "root",
      capabilities,
      configurationFiles: configurationFiles.map(context.relativePath),
    };
  }
}
