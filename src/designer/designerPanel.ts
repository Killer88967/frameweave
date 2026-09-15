import { randomBytes } from "node:crypto";

import * as vscode from "vscode";

export class DesignerPanel {
  static currentPanel: DesignerPanel | undefined;

  static createOrShow(extensionUri: vscode.Uri): void {
    if (DesignerPanel.currentPanel) {
      DesignerPanel.currentPanel.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "frameweave.designer",
      "Frameweave Designer",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist")],
      },
    );

    DesignerPanel.currentPanel = new DesignerPanel(panel, extensionUri);
  }

  private readonly disposables: vscode.Disposable[] = [];

  private constructor(
    readonly panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
  ) {
    panel.webview.html = createWebviewHtml(panel.webview, extensionUri);

    panel.onDidDispose(
      () => {
        DesignerPanel.currentPanel = undefined;

        for (const disposable of this.disposables) {
          disposable.dispose();
        }
      },
      undefined,
      this.disposables,
    );
  }
}

function createWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const nonce = randomBytes(16).toString("base64");

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview.js"),
  );

  const stylesheetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview.css"),
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <meta
      http-equiv="Content-Security-Policy"
      content="
        default-src 'none';
        style-src ${webview.cspSource};
        script-src 'nonce-${nonce}';
      "
    />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <link
      rel="stylesheet"
      href="${stylesheetUri}"
    />

    <title>Frameweave Designer</title>
  </head>

  <body>
    <div id="root"></div>

    <script
      type="module"
      nonce="${nonce}"
      src="${scriptUri}"
    ></script>
  </body>
</html>`;
}
