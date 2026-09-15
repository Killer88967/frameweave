import * as vscode from "vscode";

import type { AdapterRegistry } from "./adapterRegistry.js";
import { createDetectionContext } from "./context.js";
import type { ApplicationProfile, WorkspaceProfile } from "../profile/types.js";

export class ProjectDetector {
  constructor(private readonly registry: AdapterRegistry) {}

  async detectWorkspace(
    folder: vscode.WorkspaceFolder,
  ): Promise<WorkspaceProfile> {
    const manifestUris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(
        folder.uri,
        "{package.json,apps/*/package.json}",
      ),
      "**/{node_modules,.git,dist,.next,out,coverage}/**",
      100,
    );

    manifestUris.sort((left, right) => left.path.localeCompare(right.path));

    const detectedApplications = await Promise.all(
      manifestUris.map((manifestUri) =>
        this.detectApplication(folder, manifestUri),
      ),
    );

    const applications = detectedApplications.filter(
      (application): application is ApplicationProfile =>
        application !== undefined,
    );

    return {
      name: folder.name,
      rootPath: folder.uri.fsPath,
      packageManager: await this.detectPackageManager(folder.uri),
      applications,
    };
  }

  private async detectApplication(
    folder: vscode.WorkspaceFolder,
    manifestUri: vscode.Uri,
  ): Promise<ApplicationProfile | undefined> {
    try {
      const rootUri = vscode.Uri.joinPath(manifestUri, "..");
      const context = await createDetectionContext(rootUri, manifestUri);
      const technologies = await this.registry.detectAll(context);
      const fallbackName = rootUri.path.split("/").at(-1) ?? folder.name;

      return {
        name: context.manifest.name ?? fallbackName,
        rootPath: vscode.workspace.asRelativePath(rootUri, false) || ".",
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
