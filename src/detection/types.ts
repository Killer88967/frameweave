import type * as vscode from "vscode";
import type { TechnologyProfile } from "../profile/types.js";

export interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface ResolvedPackageVersion {
  version: string;
  source: "installed-package" | "package-manifest";
  path: string;
}

export interface DetectionContext {
  rootUri: vscode.Uri;
  manifestUri: vscode.Uri;
  manifest: PackageManifest;
  dependencies: ReadonlyMap<string, string>;

  findFiles(pattern: string, limit?: number): Promise<vscode.Uri[]>;
  fileExists(relativePath: string): Promise<boolean>;
  readText(uri: vscode.Uri): Promise<string>;
  resolvePackageVersion(
    packageName: string,
  ): Promise<ResolvedPackageVersion | undefined>;
  relativePath(uri: vscode.Uri): string;
}

export interface TechnologyAdapter {
  readonly name: TechnologyProfile["name"];

  detect(context: DetectionContext): Promise<TechnologyProfile | undefined>;
}
