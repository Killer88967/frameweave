import type {
  DetectionContext,
  TechnologyAdapter,
} from "../detection/types.js";
import type { ReactProfile } from "../profile/types.js";

export class ReactAdapter implements TechnologyAdapter {
  readonly name = "react" as const;

  async detect(context: DetectionContext): Promise<ReactProfile | undefined> {
    const resolved = await context.resolvePackageVersion("react");

    if (!resolved) {
      return undefined;
    }

    const configurationFiles = await context.findFiles(
      "{tsconfig,jsconfig}.json",
      2,
    );

    let jsxRuntime: ReactProfile["jsxRuntime"] = "unknown";

    for (const configurationUri of configurationFiles) {
      const contents = await context.readText(configurationUri);

      if (/"jsx"\s*:\s*"react-jsx(?:dev)?"/.test(contents)) {
        jsxRuntime = "automatic";
        break;
      }

      if (/"jsx"\s*:\s*"react"/.test(contents)) {
        jsxRuntime = "classic";
      }
    }

    return {
      name: "react",
      displayName: "React",
      category: "ui-framework",
      packageName: "react",
      version: resolved.version,
      rootPath: ".",
      jsxRuntime,
      capabilities: [
        "jsx",
        "components",
        "props",
        "hooks",
        "context",
        "events",
      ],
      configurationFiles: configurationFiles.map(context.relativePath),
    };
  }
}
