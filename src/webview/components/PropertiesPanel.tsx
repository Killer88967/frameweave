import type { ElementSelection, SourceMatch } from "../../shared/protocol.js";

interface PropertiesPanelProps {
  selection: ElementSelection | null;
  match: SourceMatch | null;
  classNameDraft: string;
  status: { ok: boolean; message: string } | null;
  onDraftChange(value: string): void;
  onApply(): void;
  onReset(): void;
}

export function PropertiesPanel({
  selection,
  match,
  classNameDraft,
  status,
  onDraftChange,
  onApply,
  onReset,
}: PropertiesPanelProps) {
  const styles = selection?.styles;
  const editable = match?.classNameEditable === true;
  const events = match?.events ?? [];

  return (
    <aside className="panel properties-panel">
      <div className="panel-heading">
        <span>Properties</span>
        {selection ? (
          <span className="heading-detail">&lt;{selection.tagName}&gt;</span>
        ) : null}
      </div>

      <div className="panel-body">
        <section>
          <h2>Classes</h2>

          <textarea
            value={classNameDraft}
            disabled={!editable}
            placeholder="Select an editable element"
            spellCheck={false}
            onChange={(event) => onDraftChange(event.target.value)}
          />

          <div className="property-actions">
            <button
              type="button"
              className="primary"
              disabled={
                !match ||
                !editable ||
                classNameDraft === (match.className ?? "")
              }
              onClick={onApply}
            >
              Apply classes
            </button>

            <button type="button" disabled={!match} onClick={onReset}>
              Reset
            </button>
          </div>

          {status ? (
            <span
              className={`update-status ${status.ok ? "success" : "error"}`}
            >
              {status.message}
            </span>
          ) : null}

          {match && !editable ? (
            <span className="muted-value">
              Dynamic className expressions are read-only for now.
            </span>
          ) : null}
        </section>

        <section>
          <h2>Layout</h2>

          <div className="property-grid">
            <Field label="Display" value={styles?.display} />
            <Field label="Position" value={styles?.position} />
            <Field
              label="W"
              value={
                selection
                  ? `${Math.round(selection.rectangle.width)}`
                  : undefined
              }
            />
            <Field
              label="H"
              value={
                selection
                  ? `${Math.round(selection.rectangle.height)}`
                  : undefined
              }
            />
          </div>
        </section>

        <section>
          <h2>Spacing</h2>

          <div className="property-grid">
            <Field label="Padding" value={styles?.padding} wide />
            <Field label="Margin" value={styles?.margin} wide />
            <Field label="Gap" value={styles?.gap} />
          </div>
        </section>

        <section>
          <h2>Typography</h2>

          <div className="property-grid">
            <Field label="Size" value={styles?.fontSize} />
            <Field label="Weight" value={styles?.fontWeight} />
            <Field label="Line height" value={styles?.lineHeight} />
            <Field label="Align" value={styles?.textAlign} />
            <ColorField label="Color" value={styles?.color} />
            <ColorField label="Background" value={styles?.backgroundColor} />
          </div>
        </section>

        <section>
          <h2>Events</h2>

          {events.length > 0 ? (
            <ul className="event-list">
              {events.map((event) => (
                <li key={event.name}>
                  <span className="event-name">{event.name}</span>
                  <code title={event.handler}>{event.handler}</code>
                </li>
              ))}
            </ul>
          ) : (
            <span className="muted-value">
              {match
                ? "No event handlers on this element."
                : "Nothing selected."}
            </span>
          )}

          <button
            className="wide-button"
            type="button"
            disabled
            title="Coming soon"
          >
            Add event
          </button>
        </section>
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | undefined;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : undefined}>
      {label}
      <input value={value ?? "—"} readOnly />
    </label>
  );
}

function ColorField({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <label>
      {label}
      <div className="color-property">
        <span style={{ background: value ?? "transparent" }} />
        <input value={value ?? "—"} readOnly />
      </div>
    </label>
  );
}
