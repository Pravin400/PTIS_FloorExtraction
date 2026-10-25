import { setRequestLocale, getTranslations } from "next-intl/server";
import { FireAuditRouteFrame } from "@/components/modules/fire-audit/shared/FireAuditRouteFrame";

export const dynamic = "force-dynamic";

export default async function SurveyorVisitPage({
  params,
}: {
  params: Promise<{ locale: string; inspectionId: string }>;
}) {
  const { locale, inspectionId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fireAudit.routes.surveyorVisit");
  return (
    <FireAuditRouteFrame title={t("title", { id: inspectionId })} purpose={t("purpose")} />
  );
}
