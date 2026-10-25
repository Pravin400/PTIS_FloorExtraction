import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AssessmentYearRangeRootPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/assets/configuration/master-data/assessment-year-range/capitalvalue`);
}
