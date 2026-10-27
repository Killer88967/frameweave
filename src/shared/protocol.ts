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
  /** Component tree node this element belongs to. */
  nodeId?: number | null;
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
    margin: string;
    gap: string;
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    textAlign: string;
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
  snippet?: SourceSnippet | null;
  events?: EventBinding[];
}

export interface SourceSnippet {
  /** Line number of the first line in `code`. */
  startLine: number;
  code: string;
  truncated: boolean;
}

export interface EventBinding {
  /** e.g. "onClick" */
  name: string;
  /** Handler source, e.g. "handleClick" or "() => setOpen(true)" */
  handler: string;
}

export interface ComponentTreeNode {
  id: number;
  label: string;
  kind: "component" | "element";
  children: ComponentTreeNode[];
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

export type PreviewMessage =
  | {
      source: "frameweave-preview";
      type: "element-selected";
      payload: ElementSelection;
    }
  | {
      source: "frameweave-preview";
      type: "tree-updated";
      payload: ComponentTreeNode[];
    };

/** Messages the designer sends into the preview iframe. */
export type HostToPreviewMessage =
  | { source: "frameweave-host"; type: "request-tree" }
  | { source: "frameweave-host"; type: "select-node"; id: number }
  | { source: "frameweave-host"; type: "hover-node"; id: number | null };
