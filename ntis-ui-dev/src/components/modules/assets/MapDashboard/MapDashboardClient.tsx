import { HighCommitteeDashboard } from '@/components/modules/assets/MapDashboard/HighCommitteeDashboard';
import type { MapDashboardClientProps } from '@/types/assets/map-dashboard.types';

export default function MapDashboardClient({
  initialData,
  initialDistrict,
  initialTab,
  initialCouncilFilter,
  initialPanchayatFilter,
  locale,
}: MapDashboardClientProps) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <HighCommitteeDashboard 
        dashboardStats={initialData} 
        initialDistrict={initialDistrict} 
        initialTab={initialTab}
        initialCouncilFilter={initialCouncilFilter}
        initialPanchayatFilter={initialPanchayatFilter}
        locale={locale}
      />
    </div>
  );
}
