import { redirect } from 'next/navigation';

export default async function TariffWorkbenchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/water-bill/tariff-workbench/master`);
}
