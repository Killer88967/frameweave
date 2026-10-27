import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import type {
  ComponentTreeNode,
  ElementSelection,
  ExtensionToWebviewMessage,
  HostToPreviewMessage,
  PreviewMessage,
  SourceMatch,
  WebviewToExtensionMessage,
} from "../shared/protocol.js";
import { ComponentTree } from "./components/ComponentTree.js";
import { PropertiesPanel } from "./components/PropertiesPanel.js";
import { SourceCodePanel } from "./components/SourceCodePanel.js";
import "./styles.css";

interface VsCodeApi {
  postMessage(message: WebviewToExtensionMessage): void;
}

interface AppProps {
  previewUrl?: string;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

const VIEWPORTS = {
  Desktop: "100%",
  Tablet: "768px",
  Mobile: "390px",
} as const;

type Viewport = keyof typeof VIEWPORTS;

function App({ previewUrl }: AppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const [tree, setTree] = useState<ComponentTreeNode[]>([]);
  const [viewport, setViewport] = useState<Viewport>("Desktop");
  const [selection, setSelection] = useState<ElementSelection | null>(null);
  const [sourceMatch, setSourceMatch] = useState<SourceMatch | null>(null);
  const [resolving, setResolving] = useState(false);
  const [classNameDraft, setClassNameDraft] = useState("");
  const [updateStatus, setUpdateStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const previewOrigin = previewUrl ? new URL(previewUrl).origin : null;

  const sendToPreview = (message: HostToPreviewMessage): void => {
    if (!previewOrigin) return;

    frameRef.current?.contentWindow?.postMessage(message, previewOrigin);
  };

  useEffect(() => {
    if (!previewOrigin) return;

    const receiveMessage = (event: MessageEvent<unknown>): void => {
      // From the extension host.
      if (isSourceResolvedMessage(event.data)) {
        setResolving(false);
        setSourceMatch(event.data.match);
        setClassNameDraft(event.data.match?.className ?? "");
        return;
      }

      if (isSourceUpdatedMessage(event.data)) {
        setUpdateStatus({ ok: event.data.ok, message: event.data.message });

        if (event.data.match) setSourceMatch(event.data.match);

        return;
      }

      // From the preview iframe.
      if (event.origin !== previewOrigin || !isPreviewMessage(event.data)) {
        return;
      }

      if (event.data.type === "tree-updated") {
        setTree(event.data.payload);
        return;
      }

      setSelection(event.data.payload);
      setSourceMatch(null);
      setResolving(true);
      setClassNameDraft(event.data.payload.classNames.join(" "));
      setUpdateStatus(null);

      vscode.postMessage({
        type: "resolveSource",
        selection: event.data.payload,
      });
    };

    window.addEventListener("message", receiveMessage);

    return () => window.removeEventListener("message", receiveMessage);
  }, [previewOrigin]);

  const selectedName =
    sourceMatch?.componentName ??
    (selection ? `<${selection.tagName}>` : "No element selected");

  return (
    <div className="designer">
      <header className="toolbar">
        <strong className="brand">Frameweave</strong>

        <div className="viewport-controls">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((name) => (
            <button
              key={name}
              type="button"
              className={name === viewport ? "active" : undefined}
              onClick={() => setViewport(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <button
          className="preview-button"
          type="button"
          onClick={() => vscode.postMessage({ type: "connectPreview" })}
        >
          {previewUrl ? "Reconnect" : "Connect preview"}
        </button>
      </header>

      <ComponentTree
        nodes={tree}
        selectedId={selection?.nodeId ?? null}
        connected={previewUrl !== undefined}
        onSelect={(id) =>
          sendToPreview({ source: "frameweave-host", type: "select-node", id })
        }
        onHover={(id) =>
          sendToPreview({ source: "frameweave-host", type: "hover-node", id })
        }
      />

      <main className="panel canvas">
        <div className="panel-heading">
          <span>Live Canvas</span>
          <span className="heading-detail">{selectedName}</span>
        </div>

        <div className="canvas-workspace">
          <div className="page-frame" style={{ width: VIEWPORTS[viewport] }}>
            {previewUrl ? (
              <iframe
                ref={frameRef}
                className="live-preview"
                title="Application preview"
                src={previewUrl}
                onLoad={() =>
                  sendToPreview({
                    source: "frameweave-host",
                    type: "request-tree",
                  })
                }
              />
            ) : (
              <div className="placeholder">
                <span className="placeholder-icon">◇</span>

                <strong>Live application canvas</strong>

                <p>
                  Start the development server and connect its port to begin
                  designing.
                </p>

                <button
                  className="connect-button"
                  type="button"
                  onClick={() => vscode.postMessage({ type: "connectPreview" })}
                >
                  Connect preview
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SourceCodePanel
        match={sourceMatch}
        resolving={resolving}
        onOpen={(match) => vscode.postMessage({ type: "openSource", match })}
      />

      <PropertiesPanel
        selection={selection}
        match={sourceMatch}
        classNameDraft={classNameDraft}
        status={updateStatus}
        onDraftChange={(value) => {
          setClassNameDraft(value);
          setUpdateStatus(null);
        }}
        onApply={() => {
          if (!sourceMatch) return;

          setUpdateStatus(null);

          vscode.postMessage({
            type: "updateClassName",
            match: sourceMatch,
            className: classNameDraft.trim().replace(/\s+/g, " "),
          });
        }}
        onReset={() => {
          setClassNameDraft(sourceMatch?.className ?? "");
          setUpdateStatus(null);
        }}
      />
    </div>
  );
}

function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (typeof value !== "object" || value === null) return false;

  return (
    "source" in value &&
    value.source === "frameweave-preview" &&
    "type" in value &&
    (value.type === "element-selected" || value.type === "tree-updated") &&
    "payload" in value
  );
}

function isSourceResolvedMessage(
  value: unknown,
): value is Extract<ExtensionToWebviewMessage, { type: "sourceResolved" }> {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "sourceResolved" &&
    "match" in value
  );
}

function isSourceUpdatedMessage(
  value: unknown,
): value is Extract<ExtensionToWebviewMessage, { type: "sourceUpdated" }> {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "sourceUpdated" &&
    "ok" in value &&
    "message" in value &&
    "match" in value
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Frameweave webview root was not found.");
}

const previewUrl = rootElement.dataset.previewUrl || undefined;

createRoot(rootElement).render(
  <StrictMode>
    <App {...(previewUrl !== undefined ? { previewUrl } : {})} />
  </StrictMode>,
);
