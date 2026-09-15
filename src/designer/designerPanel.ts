import { randomBytes } from "node:crypto";
import * as vscode from "vscode";

import {
  resolveElementSource,
  updateElementClassName,
} from "../source/sourceResolver.js";
import type { WebviewToExtensionMessage } from "../shared/protocol.js";

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

    panel.webview.onDidReceiveMessage(
      async (message: unknown) => {
        if (!isWebviewMessage(message)) return;

        if (message.type === "resolveSource") {
          const match = await resolveElementSource(message.selection);

          await panel.webview.postMessage({
            type: "sourceResolved",
            match,
          });
          return;
        }

        if (message.type === "updateClassName") {
          try {
            const match = await updateElementClassName(
              message.selection,
              message.className,
            );

            await panel.webview.postMessage({
              type: "sourceUpdated",
              ok: match !== null,
              message:
                match !== null
                  ? "Classes saved. Waiting for the preview to updated..."
                  : "Frameweave could not safely edit this className.",
              match,
            });
          } catch (error) {
            await panel.webview.postMessage({
              type: "sourceUpdated",
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : "Unable to update the selected element.",
              match: null,
            });
          }

          return;
        }

        const port = await vscode.window.showInputBox({
          title: "Connect Frameweave Preview",
          prompt: "Enter the application's development server port",
          value: "3000",
          validateInput: (value) =>
            /^\d+$/.test(value) ? undefined : "Enter a valid port number.",
        });

        if (!port) {
          return;
        }

        const externalUri = await vscode.env.asExternalUri(
          vscode.Uri.parse(`http://localhost:${port}`),
        );

        const previewUrl = new URL(externalUri.toString());

        previewUrl.searchParams.set("__frameweave", "1");

        panel.webview.html = createWebviewHtml(
          panel.webview,
          extensionUri,
          previewUrl.toString(),
        );
      },
      undefined,
      this.disposables,
    );
  }
}

function createWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  previewUrl?: string,
): string {
  const nonce = randomBytes(16).toString("base64");

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview.js"),
  );

  const stylesheetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "dist", "webview.css"),
  );

  const frameSource =
    previewUrl !== undefined ? new URL(previewUrl).origin : "'none'";

  const encodedPreviewUrl =
    previewUrl !== undefined ? escapeHtmlAttribute(previewUrl) : "";

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
        frame-src ${frameSource};
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
    <div
      id="root"
      data-preview-url="${encodedPreviewUrl}"
    ></div>

    <script
      type="module"
      nonce="${nonce}"
      src="${scriptUri}"
    ></script>
  </body>
</html>`;
}

function isWebviewMessage(value: unknown): value is WebviewToExtensionMessage {
  if (typeof value !== "object" || value === null || !("type" in value))
    return false;
  if (value.type === "connectPreview") return true;
  if (value.type === "resolveSource") return "selection" in value;

  return (
    value.type === "updateClassName" &&
    "selection" in value &&
    "className" in value &&
    typeof value.className === "string"
  );
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
