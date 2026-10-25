import { DepartmentMasterClientPage, AdminRouteGuard } from '@/components/modules/grievance/admin';

export default function DepartmentMasterPage() {
  return (
    <AdminRouteGuard>
      <DepartmentMasterClientPage />
    </AdminRouteGuard>
  );
}

