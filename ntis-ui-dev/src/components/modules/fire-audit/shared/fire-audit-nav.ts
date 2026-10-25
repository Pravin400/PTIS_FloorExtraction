export function isFireCitizenPath(pathname: string): boolean {
  return pathname.includes("/fire-audit/citizen") || pathname.includes("/fire-audit/verify");
}

export function fireAuditPageHeading(pathname: string): string {
  if (pathname.includes("/masters/jurisdiction")) return "jurisdiction";
  if (pathname.includes("/masters/occupancy")) return "occupancy";
  if (pathname.includes("/masters/bands")) return "bands";
  if (pathname.includes("/masters/checklist")) return "checklistItems";
  if (pathname.includes("/masters/matrix")) return "matrix";
  if (pathname.includes("/masters/application-types")) return "applicationTypes";
  if (pathname.includes("/masters/document-types")) return "documentTypes";
  if (pathname.includes("/masters/stations")) return "stations";
  if (pathname.includes("/masters/fee-heads")) return "feeHeads";
  if (pathname.includes("/masters/fee-rules")) return "feeRules";
  if (pathname.includes("/masters/statuses")) return "statuses";
  if (pathname.includes("/clerk")) return "clerk";
  if (pathname.includes("/surveyor")) return "surveyor";
  if (pathname.includes("/auditor")) return "auditor";
  if (pathname.includes("/certificates")) return "certificates";
  if (pathname.includes("/verify")) return "verify";
  if (pathname.includes("/citizen/login")) return "citizenLogin";
  if (pathname.includes("/citizen/register")) return "citizenRegister";
  if (pathname.includes("/citizen/applications/new")) return "citizenNew";
  if (pathname.includes("/citizen/applications")) return "citizenApplications";
  if (pathname.includes("/citizen")) return "citizenHome";
  return "home";
}
