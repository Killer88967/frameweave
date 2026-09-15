import * as vscode from "vscode";

interface ProjectProfileNode {
  label: string;
  description?: string;
  icon: string;
  children?: ProjectProfileNode[];
}

export class ProjectProfileProvider implements vscode.TreeDataProvider<ProjectProfileNode> {
  private readonly changeEmitter = new vscode.EventEmitter<
    ProjectProfileNode | undefined
  >();

  readonly onDidChangeTreeData = this.changeEmitter.event;

  refresh(): void {
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(element: ProjectProfileNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.children
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );

    if (element.description !== undefined)
      item.description = element.description;
    item.iconPath = new vscode.ThemeIcon(element.icon);

    return item;
  }

  getChildren(element?: ProjectProfileNode): ProjectProfileNode[] {
    if (element) {
      return element.children ?? [];
    }

    const folders = vscode.workspace.workspaceFolders ?? [];

    if (folders.length === 0) {
      return [
        {
          label: "No workspace is open",
          icon: "warning",
        },
      ];
    }

    return folders.map((folder) => ({
      label: folder.name,
      description: "Ready to scan",
      icon: "root-folder",
      children: [
        {
          label: "Frameworks",
          description: "Detection coming next",
          icon: "symbol-class",
        },
        {
          label: "Styling",
          description: "Detection coming next",
          icon: "symbol-color",
        },
      ],
    }));
  }

  dispose(): void {
    this.changeEmitter.dispose();
  }
}
