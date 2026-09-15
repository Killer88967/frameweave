export function extractMajorVersion(version: string): number | null {
  const match = version.match(/\d+/);
  if (!match) return null;

  const major = Number(match[0]);
  return Number.isFinite(major) ? major : null;
}
