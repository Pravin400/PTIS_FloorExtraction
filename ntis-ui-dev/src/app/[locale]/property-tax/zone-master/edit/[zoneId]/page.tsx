import { redirect } from "next/navigation";
import React from "react";

interface PageProps {
  params: Promise<{ locale: string; zoneId: string }>;
}

export default async function EditZonePage({ params }: PageProps): Promise<React.ReactElement> {
  const { locale, zoneId } = await params;
  redirect(`/${locale}/property-tax/zone-master?editZone=${zoneId}`);
}
