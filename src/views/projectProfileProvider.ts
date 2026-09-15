import * as vscode from "vscode";

import type {
  ApplicationProfile,
  TechnologyProfile,
  WorkspaceProfile,
} from "../profile/types.js";

interface ProjectProfileNode {
  label: string;
  description?: string;
  icon: string;
  tooltip?: string;
  children?: ProjectProfileNode[];
}

export class ProjectProfileProvider implements vscode.TreeDataProvider<ProjectProfileNode> {
  private profiles: WorkspaceProfile[] = [];

  private readonly changeEmitter = new vscode.EventEmitter<
    ProjectProfileNode | undefined
  >();

  readonly onDidChangeTreeData = this.changeEmitter.event;

  setProfiles(profiles: WorkspaceProfile[]): void {
    this.profiles = profiles;
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(element: ProjectProfileNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.children
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );

    if (element.description !== undefined) {
      item.description = element.description;
    }

    if (element.tooltip !== undefined) {
      item.tooltip = new vscode.MarkdownString(element.tooltip);
    }

    item.iconPath = new vscode.ThemeIcon(element.icon);

    return item;
  }

  getChildren(element?: ProjectProfileNode): ProjectProfileNode[] {
    if (element) {
      return element.children ?? [];
    }

    if (this.profiles.length === 0) {
      return [
        {
          label: "No project profile available",
          description: "Open a workspace",
          icon: "warning",
        },
      ];
    }

    return this.profiles.map(createWorkspaceNode);
  }

  dispose(): void {
    this.changeEmitter.dispose();
  }
}

function createWorkspaceNode(profile: WorkspaceProfile): ProjectProfileNode {
  const children =
    profile.applications.length > 0
      ? profile.applications.map(createApplicationNode)
      : [
          {
            label: "No application detected",
            description: "No package.json was found",
            icon: "warning",
          },
        ];

  return {
    label: profile.name,
    description: profile.packageManager,
    icon: "root-folder",
    tooltip: [
      `**Workspace:** ${profile.name}`,
      "",
      `Package manager: ${profile.packageManager}`,
      "",
      `Root: \`${profile.rootPath}\``,
    ].join("\n"),
    children,
  };
}

function createApplicationNode(
  profile: ApplicationProfile,
): ProjectProfileNode {
  const children =
    profile.technologies.length > 0
      ? profile.technologies.map(createTechnologyNode)
      : [
          {
            label: "No supported technologies detected",
            icon: "info",
          },
        ];

  return {
    label: profile.name,
    description: profile.rootPath,
    icon: "package",
    children,
  };
}

function createTechnologyNode(profile: TechnologyProfile): ProjectProfileNode {
  return {
    label: profile.displayName,
    description: profile.version,
    icon: profile.category === "styling" ? "symbol-color" : "symbol-class",
    tooltip: [
      `**${profile.displayName}**`,
      "",
      `Version: \`${profile.version}\``,
      "",
      `Package: \`${profile.packageName}\``,
      "",
      `Capabilities: ${profile.capabilities.join(", ")}`,
    ].join("\n"),
    children: createTechnologyDetails(profile),
  };
}

function createTechnologyDetails(
  profile: TechnologyProfile,
): ProjectProfileNode[] {
  const details: ProjectProfileNode[] = [];

  switch (profile.name) {
    case "next":
      details.push(
        {
          label: "Router",
          description: profile.router,
          icon: "type-hierarchy",
        },
        {
          label: "Source directory",
          description: profile.sourceDirectory,
          icon: "folder",
        },
      );
      break;

    case "react":
      details.push({
        label: "JSX runtime",
        description: profile.jsxRuntime,
        icon: "symbol-method",
      });
      break;

    case "tailwind":
      details.push(
        {
          label: "Configuration",
          description: profile.strategy,
          icon: "settings-gear",
        },
        {
          label: "Major version",
          description: profile.majorVersion?.toString() ?? "unknown",
          icon: "versions",
        },
      );
      break;
  }

  details.push({
    label: "Capabilities",
    description: profile.capabilities.length.toString(),
    icon: "tools",
    children: profile.capabilities.map((capability) => ({
      label: capability,
      icon: "check",
    })),
  });

  if (profile.configurationFiles.length > 0) {
    details.push({
      label: "Configuration files",
      description: profile.configurationFiles.length.toString(),
      icon: "files",
      children: profile.configurationFiles.map((path) => ({
        label: path,
        icon: "file-code",
      })),
    });
  }

  return details;
}
