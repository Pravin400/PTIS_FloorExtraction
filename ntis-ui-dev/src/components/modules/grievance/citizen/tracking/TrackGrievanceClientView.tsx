'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { GrievanceTrackerView } from './GrievanceTrackerView';

export function TrackGrievanceClientView() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-5 h-full lg:h-[calc(100vh-5.5rem)] flex flex-col min-h-0">
      <GrievanceTrackerView
        onNewIssueClick={() => router.push(`/${locale}/grievance/raise`)}
      />
    </div>
  );
}
