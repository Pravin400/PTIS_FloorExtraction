import { setRequestLocale, getTranslations } from "next-intl/server";
import { FireAuditRouteFrame } from "@/components/modules/fire-audit/shared/FireAuditRouteFrame";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fireAudit.routes.verify");
  return <FireAuditRouteFrame title={t("title")} purpose={t("purpose", { token })} />;
}
