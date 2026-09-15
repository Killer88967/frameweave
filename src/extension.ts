import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand(
    "frameweave.open",
    async () => {
      await vscode.window.showInformationMessage("Frameweave is running.");
    },
  );

  context.subscriptions.push(openCommand);
}

export function deactivate(): void {}
