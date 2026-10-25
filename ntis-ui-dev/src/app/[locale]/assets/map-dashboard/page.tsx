import MapDashboardClient from '@/components/modules/assets/MapDashboard/MapDashboardClient';
import { getMapDashboardStats } from './action';
import { setRequestLocale } from 'next-intl/server';

import type { MapDashboardPageProps } from '@/types/assets/map-dashboard.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MapDashboardPage({ params, searchParams }: MapDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawSearchParams = searchParams ? await searchParams : {};
  
  // Sanitize query params per ssr-route-standards
  const initialDistrict = typeof rawSearchParams.district === 'string' ? rawSearchParams.district.trim() : '';
  const initialTab = typeof rawSearchParams.tab === 'string' ? rawSearchParams.tab.trim() : '';
  const initialCouncilFilter = typeof rawSearchParams.councilFilter === 'string' ? rawSearchParams.councilFilter.trim() : '';
  const initialPanchayatFilter = typeof rawSearchParams.panchayatFilter === 'string' ? rawSearchParams.panchayatFilter.trim() : '';

  const initialData = await getMapDashboardStats({
    districtId: initialDistrict || undefined,
  });

  return (
    <MapDashboardClient 
      initialData={initialData} 
      initialDistrict={initialDistrict}
      initialTab={initialTab}
      initialCouncilFilter={initialCouncilFilter}
      initialPanchayatFilter={initialPanchayatFilter}
      locale={locale}
    />
  );
}
