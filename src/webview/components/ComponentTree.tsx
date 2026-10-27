import type { ComponentTreeNode } from "../../shared/protocol.js";

interface ComponentTreeProps {
  nodes: ComponentTreeNode[];
  selectedId: number | null;
  connected: boolean;
  onSelect(id: number): void;
  onHover(id: number | null): void;
}

export function ComponentTree({
  nodes,
  selectedId,
  connected,
  onSelect,
  onHover,
}: ComponentTreeProps) {
  return (
    <aside className="panel tree-panel">
      <div className="panel-heading">
        <span>Component Tree</span>
      </div>

      <div className="panel-body" onPointerLeave={() => onHover(null)}>
        {nodes.length > 0 ? (
          <ul className="tree" role="tree">
            {nodes.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={onSelect}
                onHover={onHover}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            {connected
              ? "Waiting for the page… Make sure the app uses withFrameweave()."
              : "Connect a preview to see its components."}
          </p>
        )}
      </div>
    </aside>
  );
}

interface TreeItemProps {
  node: ComponentTreeNode;
  depth: number;
  selectedId: number | null;
  onSelect(id: number): void;
  onHover(id: number | null): void;
}

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onHover,
}: TreeItemProps) {
  const selected = node.id === selectedId;

  return (
    <li role="treeitem" aria-selected={selected}>
      <button
        type="button"
        className={`tree-row ${node.kind} ${selected ? "selected" : ""}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => onSelect(node.id)}
        onPointerEnter={() => onHover(node.id)}
      >
        {depth > 0 ? <span className="tree-branch">└─</span> : null}
        <span className="tree-label">
          {node.kind === "element" ? `<${node.label}>` : node.label}
        </span>
      </button>

      {node.children.length > 0 ? (
        <ul role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
