export interface SourceLocation {
  /** Absolute path, as stamped by @frameweave/next. */
  filePath: string;
  line: number;
  column: number;
}

export interface ElementSelection {
  tagName: string;
  id: string;
  classNames: string[];
  text: string | null;
  attributes: Record<string, string>;
  /** Exact JSX location when the app runs with @frameweave/next. */
  sourceLocation?: SourceLocation | null;
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

export interface SourceMatch {
  componentName: string;
  renderedTagName: string;
  importSource: string | null;
  filePath: string;
  line: number;
  column: number;
  confidence: "exact" | "high" | "medium" | "low";
  className?: string | null;
  classNameEditable?: boolean;
}

export type WebviewToExtensionMessage =
  | {
      type: "connectPreview";
    }
  | {
      type: "resolveSource";
      selection: ElementSelection;
    }
  | {
      type: "openSource";
      match: SourceMatch;
    }
  | {
      type: "updateClassName";
      match: SourceMatch;
      className: string;
    };

export type ExtensionToWebviewMessage =
  | {
      type: "sourceResolved";
      match: SourceMatch | null;
    }
  | {
      type: "sourceUpdated";
      ok: boolean;
      message: string;
      match: SourceMatch | null;
    };

export interface PreviewSelectionMessage {
  source: "frameweave-preview";
  type: "element-selected";
  payload: ElementSelection;
}
