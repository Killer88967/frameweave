import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

interface VsCodeApi {
  postMessage(message: { type: "connectPreview" }): void;
}

interface AppProps {
  previewUrl?: string;
}

interface ElementSelection {
  tagName: string;
  id: string;
  classNames: string[];
  text?: string;
  rectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styles: {
    display: string;
    position: string;
    padding: string;
    gap: string;
    color: string;
    backgroundColor: string;
    fontSize: string;
  };
}

interface SelectionMessage {
  source: "frameweave-preview";
  type: "element-selected";
  payload: ElementSelection;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

function App({ previewUrl }: AppProps) {
  const [selection, setSelection] = useState<ElementSelection | null>(null);

  useEffect(() => {
    if (!previewUrl) return;

    const previewOrigin = new URL(previewUrl).origin;

    const receiveMessage = (event: MessageEvent<unknown>): void => {
      if (event.origin !== previewOrigin) return;
      if (!isSelectedMessage(event.data)) return;

      setSelection(event.data.payload);
    };

    window.addEventListener("message", receiveMessage);

    return () => window.removeEventListener("message", receiveMessage);
  }, [previewUrl]);

  return (
    <div className="designer">
      <header className="toolbar">
        <strong className="brand">Frameweave</strong>

        <div className="viewport-controls">
          <button type="button">Desktop</button>
          <button type="button">Tablet</button>
          <button type="button">Mobile</button>
        </div>

        <button className="preview-button" type="button">
          Preview
        </button>
      </header>

      <aside className="layers-panel">
        <div className="panel-heading">
          <span>Layers</span>
          <button type="button" aria-label="Add element">
            +
          </button>
        </div>

        <div className="layer active">
          <span>▾</span>
          <span>Page</span>
        </div>

        <div className="layer nested">
          <span>◇</span>
          <span>Main</span>
        </div>

        <div className="layer deeply-nested">
          <span>◇</span>
          <span>
            {selection ? `<${selection.tagName}>` : "No element selected"}
          </span>
        </div>
      </aside>

      <main className="canvas">
        <div className="canvas-header">
          {selection ? `<${selection.tagName}>` : "No element selected"}
          <span>100%</span>
        </div>

        <div className="canvas-workspace">
          <div className="page-frame">
            {previewUrl ? (
              <iframe
                className="live-preview"
                title="Application preview"
                src={previewUrl}
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
                  onClick={() => {
                    vscode.postMessage({
                      type: "connectPreview",
                    });
                  }}
                >
                  Connect preview
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="properties-panel">
        <div className="panel-heading">
          <span>Properties</span>
        </div>

        <section>
          <h2>Layout</h2>

          <div className="property-grid">
            <label>
              W
              <input
                value={
                  selection ? Math.round(selection.rectangle.width) : "Auto"
                }
                readOnly
              />
            </label>

            <label>
              H
              <input
                value={
                  selection ? Math.round(selection.rectangle.height) : "Auto"
                }
                readOnly
              />
            </label>
          </div>
        </section>

        <section>
          <h2>Spacing</h2>

          <div className="property-grid">
            <label>
              Padding
              <input value={selection?.styles.padding ?? "0px"} readOnly />
            </label>

            <label>
              Gap
              <input value={selection?.styles.gap ?? "normal"} readOnly />
            </label>
          </div>
        </section>

        <section>
          <h2>Appearance</h2>

          <label>
            Background
            <div className="color-property">
              <span />
              <input
                value={selection?.styles.backgroundColor ?? "transparent"}
                readOnly
              />
            </div>
          </label>
        </section>

        <section>
          <h2>Events</h2>

          <button className="wide-button" type="button">
            Add event
          </button>
        </section>
      </aside>
    </div>
  );
}

function isSelectedMessage(value: unknown): value is SelectionMessage {
  if (typeof value !== "object" || value === null) return false;

  return (
    "source" in value &&
    value.source === "frameweave-preview" &&
    "type" in value &&
    value.type === "element-selected" &&
    "payload" in value
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Frameweave webview root was not found.");
}

const previewUrl = rootElement.dataset.previewUrl || undefined;

createRoot(rootElement).render(
  <StrictMode>
    <App previewUrl={previewUrl !== undefined ? previewUrl : ""} />
  </StrictMode>,
);
