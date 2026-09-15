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

async function resolveInstalledVersion(
  rootUri: vscode.Uri,
  packageName: string,
  relativePath: (uri: vscode.Uri) => string,
): Promise<ResolvedPackageVersion | undefined> {
  const packageParts = packageName.split("/");

  const installedManifestUri = vscode.Uri.joinPath(
    rootUri,
    "node_modules",
    ...packageParts,
    "package.json",
  );

  try {
    const contents = await vscode.workspace.fs.readFile(installedManifestUri);

    const installedManifest = JSON.parse(
      new TextDecoder().decode(contents),
    ) as {
      version?: string;
    };

    if (!installedManifest.version) {
      return undefined;
    }

    return {
      version: installedManifest.version,
      source: "installed-package",
      path: relativePath(installedManifestUri),
    };
  } catch {
    return undefined;
  }
}
