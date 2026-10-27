import type { SourceMatch } from "../../shared/protocol.js";

interface SourceCodePanelProps {
  match: SourceMatch | null;
  resolving: boolean;
  onOpen(match: SourceMatch): void;
}

export function SourceCodePanel({
  match,
  resolving,
  onOpen,
}: SourceCodePanelProps) {
  const snippet = match?.snippet ?? null;

  return (
    <section className="panel source-panel">
      <div className="panel-heading">
        <span>Source Code</span>

        {match ? (
          <div className="source-meta">
            <span title={match.filePath}>
              {match.filePath}:{match.line}
            </span>
            <span className={`confidence ${match.confidence}`}>
              {match.confidence}
            </span>
            <button type="button" onClick={() => onOpen(match)}>
              Open in editor
            </button>
          </div>
        ) : null}
      </div>

      <div className="panel-body">
        {snippet ? (
          <pre className="code">
            {snippet.code.split("\n").map((line, index) => (
              <div className="code-line" key={index}>
                <span className="line-number">{snippet.startLine + index}</span>
                <code>{line || " "}</code>
              </div>
            ))}
            {snippet.truncated ? <div className="code-more">…</div> : null}
          </pre>
        ) : (
          <p className="empty-state">
            {resolving
              ? "Finding the source…"
              : match
                ? "Source preview unavailable for this element."
                : "Select an element to see its JSX."}
          </p>
        )}
      </div>
    </section>
  );
}
