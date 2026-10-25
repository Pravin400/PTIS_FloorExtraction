/**
 * Fire Audit paths. Edge-safe: no Node or database imports.
 * Staff routes stay behind the council login. The whole module skips the PTIS shell.
 */
export function isFireAuditPath(pathWithoutLocale: string): boolean {
  return pathWithoutLocale === "/fire-audit" || pathWithoutLocale.startsWith("/fire-audit/");
}

export function isFireCitizenPublicPath(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale === "/fire-audit" ||
    pathWithoutLocale === "/fire-audit/login" ||
    pathWithoutLocale.startsWith("/fire-audit/login/") ||
    pathWithoutLocale === "/fire-audit/register" ||
    pathWithoutLocale.startsWith("/fire-audit/register/") ||
    pathWithoutLocale === "/fire-audit/citizen" ||
    pathWithoutLocale.startsWith("/fire-audit/citizen/") ||
    pathWithoutLocale === "/fire-audit/verify" ||
    pathWithoutLocale.startsWith("/fire-audit/verify/")
  );
}
