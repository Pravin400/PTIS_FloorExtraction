import { redirect } from 'next/navigation';

export default async function BillingConfigurationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/water-bill/billing-configuration/billing-frequency`);
}
