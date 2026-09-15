import * as vscode from "vscode";

import { ProjectProfileProvider } from "./views/projectProfileProvider.js";

export function activate(context: vscode.ExtensionContext): void {
  const projectProfileProvider = new ProjectProfileProvider();

  const projectProfileView = vscode.window.createTreeView(
    "frameweave.projectProfile",
    {
      treeDataProvider: projectProfileProvider,
      showCollapseAll: true,
    },
  );

  const openCommand = vscode.commands.registerCommand(
    "frameweave.open",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.frameweave",
      );
    },
  );

  const refreshCommand = vscode.commands.registerCommand(
    "frameweave.refreshProjectProfile",
    () => {
      projectProfileProvider.refresh();
    },
  );

  context.subscriptions.push(
    projectProfileProvider,
    projectProfileView,
    openCommand,
    refreshCommand,
  );
}

export function deactivate(): void {}
