import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/property-tax/extended-area-assesment/single-assessment`);
}

