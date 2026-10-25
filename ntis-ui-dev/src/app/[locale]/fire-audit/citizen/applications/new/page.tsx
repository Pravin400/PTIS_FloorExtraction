import { setRequestLocale, getTranslations } from "next-intl/server";
import { FireAuditRouteFrame } from "@/components/modules/fire-audit/shared/FireAuditRouteFrame";

export const dynamic = "force-dynamic";

export default async function CitizenNewApplicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fireAudit.routes.citizenNew");
  return <FireAuditRouteFrame title={t("title")} purpose={t("purpose")} />;
}
