import { setRequestLocale } from "next-intl/server";
import { FireAuditCitizenRegisterView } from "@/components/modules/fire-audit/citizen";

export const dynamic = "force-dynamic";

export default async function FireAuditRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FireAuditCitizenRegisterView locale={locale} />;
}
