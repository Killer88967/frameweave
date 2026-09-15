import { extractMajorVersion } from "../detection/version.js";
import type {
  DetectionContext,
  TechnologyAdapter,
} from "../detection/types.js";
import type { TailwindProfile } from "../profile/types.js";

export class TailwindAdapter implements TechnologyAdapter {
  readonly name = "tailwind" as const;

  async detect(
    context: DetectionContext,
  ): Promise<TailwindProfile | undefined> {
    const resolved = await context.resolvePackageVersion("tailwindcss");

    if (!resolved) {
      return undefined;
    }

    const [configurationFiles, candidateStylesheets] = await Promise.all([
      context.findFiles("tailwind.config.{js,cjs,mjs,ts}", 4),
      context.findFiles("**/*.css", 100),
    ]);

    const stylesheetPaths: string[] = [];
    let usesThemeDirective = false;

    for (const stylesheetUri of candidateStylesheets) {
      const contents = await context.readText(stylesheetUri);

      const usesTailwind =
        /@import\s+["']tailwindcss["']/.test(contents) ||
        /@tailwind\s+(?:base|components|utilities)/.test(contents) ||
        /@theme\b/.test(contents);

      if (!usesTailwind) {
        continue;
      }

      stylesheetPaths.push(context.relativePath(stylesheetUri));

      if (/@theme\b/.test(contents)) {
        usesThemeDirective = true;
      }
    }

    const majorVersion = extractMajorVersion(resolved.version);

    const strategy: TailwindProfile["strategy"] =
      majorVersion !== null && majorVersion >= 4
        ? "css-first"
        : majorVersion === 3
          ? "javascript-config"
          : usesThemeDirective
            ? "css-first"
            : configurationFiles.length > 0
              ? "javascript-config"
              : "unknown";

    const capabilities = [
      "utility-classes",
      "responsive-variants",
      "state-variants",
    ];

    if (strategy === "css-first") {
      capabilities.push("css-theme", "theme-variables", "custom-utilities");
    }

    if (strategy === "javascript-config") {
      capabilities.push("theme-extend", "javascript-plugins");
    }

    return {
      name: "tailwind",
      displayName: "Tailwind CSS",
      category: "styling",
      packageName: "tailwindcss",
      version: resolved.version,
      rootPath: ".",
      majorVersion,
      strategy,
      stylesheetPaths,
      capabilities,
      configurationFiles: configurationFiles.map(context.relativePath),
    };
  }
}
