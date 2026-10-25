import { setRequestLocale } from "next-intl/server";
import { listJurisdictionOverlaysAction } from "./actions";
import { JurisdictionMaster } from "@/components/modules/fire-audit/masters/jurisdiction/JurisdictionMaster";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function JurisdictionPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const result = await listJurisdictionOverlaysAction();

  return (
    <JurisdictionMaster
      locale={locale}
      data={result.data ?? []}
      loadError={result.success ? null : (result.error ?? "load")}
    />
  );
}
