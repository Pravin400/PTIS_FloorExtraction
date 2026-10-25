import { setRequestLocale, getTranslations } from "next-intl/server";
import { FireAuditRouteFrame } from "@/components/modules/fire-audit/shared/FireAuditRouteFrame";

export const dynamic = "force-dynamic";

export default async function AuditorApplicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fireAudit.routes.auditorApplication");
  return <FireAuditRouteFrame title={t("title", { id })} purpose={t("purpose")} />;
}
