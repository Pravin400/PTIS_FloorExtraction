import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TaxZoneMasterPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/property-tax/taxzone-master/taxzone`);
}
