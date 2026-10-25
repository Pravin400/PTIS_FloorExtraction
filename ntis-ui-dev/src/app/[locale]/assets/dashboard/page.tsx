import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function AssetRevenueDashboardRootPage({ params }: PageProps) {
    const { locale } = await params;
    redirect(`/${locale}/assets/dashboard/master-dashboard`);
}
