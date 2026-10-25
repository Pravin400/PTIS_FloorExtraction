/**
 * On-The-Go Grievance Intake Page (Next.js App Router Page)
 * Path: src/app/[locale]/grievance/on-the-go/page.tsx
 *
 * Provides dedicated executive and field officer quick-entry screen.
 * Guarded by AdminRouteGuard.
 */

import { Metadata } from 'next';
import { OnTheGoGrievanceView, AdminRouteGuard } from '@/components/modules/grievance/admin';

export const metadata: Metadata = {
  title: 'New Grievance | On-The-Go Intake | Amravati Municipal Corporation',
  description: 'Fast split-layout executive grievance submission and officer assignment.',
};

export default function OnTheGoPage() {
  return (
    <AdminRouteGuard>
      <div className="flex-1 min-h-0 w-full p-3 sm:p-4 lg:py-3.5 lg:px-6 flex flex-col">
        <OnTheGoGrievanceView className="w-full" />
      </div>
    </AdminRouteGuard>
  );
}
