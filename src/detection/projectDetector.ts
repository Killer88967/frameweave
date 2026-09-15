import * as vscode from "vscode";

import type { AdapterRegistry } from "./adapterRegistry.js";
import { createDetectionContext } from "./context.js";
import type { ApplicationProfile, WorkspaceProfile } from "../profile/types.js";

export class ProjectDetector {
  constructor(private readonly registry: AdapterRegistry) {}

  async detectWorkspace(
    folder: vscode.WorkspaceFolder,
  ): Promise<WorkspaceProfile> {
    const manifestUri = vscode.Uri.joinPath(folder.uri, "package.json");

    const application = await this.detectApplication(folder, manifestUri);

    return {
      name: folder.name,
      rootPath: folder.uri.fsPath,
      packageManager: await this.detectPackageManager(folder.uri),
      applications: application ? [application] : [],
    };
  }

  private async detectApplication(
    folder: vscode.WorkspaceFolder,
    manifestUri: vscode.Uri,
  ): Promise<ApplicationProfile | undefined> {
    try {
      const context = await createDetectionContext(folder.uri, manifestUri);

      const technologies = await this.registry.detectAll(context);

      return {
        name: context.manifest.name ?? folder.name,
        rootPath: ".",
        technologies,
      };
    } catch {
      return undefined;
    }
  }

  private async detectPackageManager(
    rootUri: vscode.Uri,
  ): Promise<WorkspaceProfile["packageManager"]> {
    const candidates = [
      ["pnpm-lock.yaml", "pnpm"],
      ["bun.lock", "bun"],
      ["bun.lockb", "bun"],
      ["yarn.lock", "yarn"],
      ["package-lock.json", "npm"],
    ] as const;

    for (const [filename, packageManager] of candidates) {
      const lockfileUri = vscode.Uri.joinPath(rootUri, filename);

      try {
        await vscode.workspace.fs.stat(lockfileUri);
        return packageManager;
      } catch {
        // Continue checking other lockfiles.
      }
    }

    return "unknown";
  }
}
