export interface ElementSelection {
  tagName: string;
  id: string;
  classNames: string[];
  text: string | null;
  attributes: Record<string, string>;
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
  confidence: "high" | "medium" | "low";
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
      selection: ElementSelection;
    }
  | {
      type: "updateClassName";
      selection: ElementSelection;
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
