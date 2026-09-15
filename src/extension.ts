import * as vscode from "vscode";

import { createDefaultAdapterRegistry } from "./adapters/index.js";
import { ProjectDetector } from "./detection/projectDetector.js";
// import type { WorkspaceProfile } from "./profile/types.js";
import { ProjectProfileProvider } from "./views/projectProfileProvider.js";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const registry = createDefaultAdapterRegistry();
  const detector = new ProjectDetector(registry);
  const projectProfileProvider = new ProjectProfileProvider();

  const projectProfileView = vscode.window.createTreeView(
    "frameweave.projectProfile",
    {
      treeDataProvider: projectProfileProvider,
      showCollapseAll: true,
    },
  );

  const refreshProjectProfile = async (): Promise<void> => {
    const folders = vscode.workspace.workspaceFolders ?? [];

    const profiles = await Promise.all(
      folders.map((folder) => detector.detectWorkspace(folder)),
    );

    projectProfileProvider.setProfiles(profiles);
  };

  const openCommand = vscode.commands.registerCommand(
    "frameweave.open",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.frameweave",
      );

      await refreshProjectProfile();
    },
  );

  const refreshCommand = vscode.commands.registerCommand(
    "frameweave.refreshProjectProfile",
    async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Scanning project",
        },
        refreshProjectProfile,
      );
    },
  );

  context.subscriptions.push(
    projectProfileProvider,
    projectProfileView,
    openCommand,
    refreshCommand,
  );

  await refreshProjectProfile();
}

export function deactivate(): void {}
