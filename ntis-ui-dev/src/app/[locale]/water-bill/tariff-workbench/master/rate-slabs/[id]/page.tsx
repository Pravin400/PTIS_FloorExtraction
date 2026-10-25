import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export interface RateSlabsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function RateSlabsPage({ params }: RateSlabsPageProps) {
  const { locale, id } = await params;
  redirect(`/${locale}/water-bill/tariff-workbench/slabs?tariffId=${id}`);
}
