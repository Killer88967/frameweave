export type TechnologyCategory = "meta-framework" | "ui-framework" | "styling";

interface TechnologyBase {
  displayName: string;
  packageName: string;
  version: string;
  rootPath: string;
  capabilities: string[];
  configurationFiles: string[];
}

export interface NextProfile extends TechnologyBase {
  name: "next";
  category: "meta-framework";
  router: "app" | "pages" | "mixed" | "unknown";
  sourceDirectory: "src" | "root" | "unknown";
}

export interface ReactProfile extends TechnologyBase {
  name: "react";
  category: "ui-framework";
  jsxRuntime: "automatic" | "classic" | "unknown";
}

export interface TailwindProfile extends TechnologyBase {
  name: "tailwind";
  category: "styling";
  majorVersion: number | null;
  strategy: "javascript-config" | "css-first" | "unknown";
  stylesheetPaths: string[];
}

export type TechnologyProfile = NextProfile | ReactProfile | TailwindProfile;

export interface ApplicationProfile {
  name: string;
  rootPath: string;
  technologies: TechnologyProfile[];
}

export interface WorkspaceProfile {
  name: string;
  rootPath: string;
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "unknown";
  applications: ApplicationProfile[];
}
