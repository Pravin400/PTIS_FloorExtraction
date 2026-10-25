import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ApartmentRedirectPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const { locale } = resolvedParams;

  const redirectParams = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([k, v]) => {
    if (typeof v === 'string') redirectParams.set(k, v);
  });

  const query = redirectParams.toString();
  redirect(`/${locale}/property-tax/ptis/apartment${query ? `?${query}` : ''}`);
}
