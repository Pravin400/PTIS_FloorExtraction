import { setRequestLocale } from "next-intl/server";
import { FireAuditCatalogMaster } from "@/components/modules/fire-audit/masters/FireAuditCatalogMaster";

export const dynamic = "force-dynamic";

export default async function StationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FireAuditCatalogMaster catalogId="stations" />;
}
