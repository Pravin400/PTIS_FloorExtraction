'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CitizenRegisterGrievanceModal } from './CitizenRegisterGrievanceModal';

function RaiseGrievanceContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const locale = (params?.locale as string) || '';
  const dashboardPath = locale ? `/${locale}/grievance/dashboard` : '/grievance/dashboard';

  const deptParam =
    searchParams.get('dept') ||
    searchParams.get('deptId') ||
    searchParams.get('departmentId') ||
    searchParams.get('department') ||
    undefined;
  const categoryParam = searchParams.get('category') || undefined;

  return (
    <div className="w-full h-full flex-1 flex flex-col overflow-hidden bg-slate-100/60">
      <CitizenRegisterGrievanceModal
        isOpen={true}
        isPageMode={true}
        closeOnBackdropClick={false}
        showOfficerContact={true}
        defaultDepartmentId={deptParam}
        defaultCategory={categoryParam}
        onClose={() => router.push(dashboardPath)}
        onSuccess={() => {
          // Success view with tracking ticket ID and clipboard copy is rendered directly inside CitizenRegisterGrievanceModal
        }}
      />
    </div>
  );
}

export function RaiseGrievanceClientView() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-slate-100/60 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      }
    >
      <RaiseGrievanceContent />
    </Suspense>
  );
}

