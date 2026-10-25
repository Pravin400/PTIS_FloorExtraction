import { setRequestLocale } from "next-intl/server";
import { FireAuditCitizenLoginView } from "@/components/modules/fire-audit/citizen";

export const dynamic = "force-dynamic";

export default async function FireAuditLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FireAuditCitizenLoginView locale={locale} />;
}
