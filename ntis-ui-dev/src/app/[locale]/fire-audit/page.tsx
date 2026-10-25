import { setRequestLocale } from "next-intl/server";
import { FireAuditHomeView } from "@/components/modules/fire-audit/home";

export const dynamic = "force-dynamic";

export default async function FireAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FireAuditHomeView locale={locale} />;
}
