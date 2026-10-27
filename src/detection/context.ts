import * as vscode from "vscode";

import type {
  DetectionContext,
  PackageManifest,
  ResolvedPackageVersion,
} from "./types.js";

const EXCLUDE_PATTERN = "**/{node_modules,.git,dist,.next,out,coverage}/**";

export async function createDetectionContext(
  rootUri: vscode.Uri,
  manifestUri: vscode.Uri,
): Promise<DetectionContext> {
  const manifest = await readManifest(manifestUri);

  const dependencies = new Map<string, string>([
    ...Object.entries(manifest.dependencies ?? {}),
    ...Object.entries(manifest.devDependencies ?? {}),
    ...Object.entries(manifest.peerDependencies ?? {}),
  ]);

  const relativePath = (uri: vscode.Uri): string =>
    vscode.workspace.asRelativePath(uri, false);

  return {
    rootUri,
    manifestUri,
    manifest,
    dependencies,

    findFiles: async (pattern: string, limit = 100): Promise<vscode.Uri[]> =>
      vscode.workspace.findFiles(
        new vscode.RelativePattern(rootUri, pattern),
        EXCLUDE_PATTERN,
        limit,
      ),

    fileExists: async (relativeFilePath: string): Promise<boolean> => {
      const uri = vscode.Uri.joinPath(rootUri, relativeFilePath);

      try {
        await vscode.workspace.fs.stat(uri);
        return true;
      } catch {
        return false;
      }
    },

    readText: async (uri: vscode.Uri): Promise<string> =>
      new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)),

    resolvePackageVersion: async (
      packageName: string,
    ): Promise<ResolvedPackageVersion | undefined> => {
      const installedVersion = await resolveInstalledVersion(
        rootUri,
        packageName,
        relativePath,
      );

      if (installedVersion) {
        return installedVersion;
      }

      const declaredVersion = dependencies.get(packageName);

      if (!declaredVersion) {
        return undefined;
      }

      return {
        version: declaredVersion,
        source: "package-manifest",
        path: relativePath(manifestUri),
      };
    },

    relativePath,
  };
}

async function readManifest(manifestUri: vscode.Uri): Promise<PackageManifest> {
  const contents = await vscode.workspace.fs.readFile(manifestUri);

  return JSON.parse(new TextDecoder().decode(contents)) as PackageManifest;
}

/**
 * Mirrors Node's lookup: check \<app>/node_modules, then each parent folder up
 * to the workspace root, so hoisted npm/yarn/bun workspaces resolve too.
 */
async function resolveInstalledVersion(
  rootUri: vscode.Uri,
  packageName: string,
  relativePath: (uri: vscode.Uri) => string,
): Promise<ResolvedPackageVersion | undefined> {
  const packageParts = packageName.split("/");
  const workspaceRoot = vscode.workspace.getWorkspaceFolder(rootUri)?.uri;

  let directory: vscode.Uri | undefined = rootUri;

  while (directory) {
    const installedManifestUri = vscode.Uri.joinPath(
      directory,
      "node_modules",
      ...packageParts,
      "package.json",
    );

    try {
      const contents = await vscode.workspace.fs.readFile(installedManifestUri);
      const installedManifest = JSON.parse(
        new TextDecoder().decode(contents),
      ) as { version?: string };

      if (installedManifest.version) {
        return {
          version: installedManifest.version,
          source: "installed-package",
          path: relativePath(installedManifestUri),
        };
      }
    } catch {
      // Not installed at this level; keep walking up.
    }

    if (!workspaceRoot || directory.path === workspaceRoot.path) break;

    const parent: vscode.Uri = vscode.Uri.joinPath(directory, "..");

    if (parent.path === directory.path) break;

    directory = parent;
  }

  return undefined;
}
