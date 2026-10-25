import { WorkbenchView, AdminRouteGuard } from '@/components/modules/grievance/admin';

export default function WorkbenchPage() {
  return (
    <AdminRouteGuard>
      <div className="flex-1 min-h-0 m-2 sm:m-4 p-2 sm:p-4 flex flex-col">
        <WorkbenchView className="w-full" />
      </div>
    </AdminRouteGuard>
  );
}
