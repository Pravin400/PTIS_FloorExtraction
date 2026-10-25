import { redirect } from "next/navigation";

interface PageProps {
  params: { locale: string };
}

export default function AddZonePage({ params }: PageProps) {
  const { locale } = params;
  redirect(`/${locale}/property-tax/zone-master?addZone=`);
}
