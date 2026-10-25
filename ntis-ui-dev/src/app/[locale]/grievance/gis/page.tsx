import { GrievanceGisDashboard, GisRouteGuard } from '@/components/modules/grievance/gis';

export const dynamic = 'force-dynamic';

export default function GrievanceGisPage() {
  return (
    <GisRouteGuard>
      <GrievanceGisDashboard />
    </GisRouteGuard>
  );
}
