'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { GrievanceHeader } from '@/components/modules/grievance/shared/GrievanceHeader';
import { GrievanceSidebar } from '@/components/modules/grievance/shared/GrievanceSidebar';
import { GrievancePwaInstallBanner } from '@/components/modules/grievance/shared/GrievancePwaInstallBanner';

/**
 * Grievance Master Layout (Single unified layout)
 * Strictly under 200 lines.
 */
export default function GrievanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const pathname = usePathname() || '';

  const isLandingPage =
    pathname === `/${locale}/grievance/home` ||
    pathname === `/${locale}/grievance/home/` ||
    pathname === '/grievance/home';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100/70 text-slate-900 overflow-hidden">
      {/* 1. Global Civic Header (Fixed at top, h-20 / 80px) */}
      <GrievanceHeader />

      {/* 2. Civic Workspace with dynamic edge-to-edge layout on landing page */}
      <div className="flex-1 w-full h-[calc(100vh-5rem)] mt-20 flex flex-row overflow-hidden">
        {!isLandingPage && <GrievanceSidebar className="hidden md:flex shrink-0" />}
        <main className="flex-1 h-full min-w-0 flex flex-col overflow-y-auto custom-scrollbar p-0 m-0">
          {children}
        </main>
      </div>

      {/* 3. PWA Installation Banner for Android and iOS Safari */}
      <GrievancePwaInstallBanner />
    </div>
  );
}
