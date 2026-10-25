import { AllComplaintsView, AdminRouteGuard } from '@/components/modules/grievance/admin';

export default function ComplaintsPage() {
  return (
    <AdminRouteGuard>
      <div className="flex-1 min-h-0 m-2 sm:m-4 p-2 sm:p-4 flex flex-col">
        <AllComplaintsView className="w-full" />
      </div>
    </AdminRouteGuard>
  );
}
