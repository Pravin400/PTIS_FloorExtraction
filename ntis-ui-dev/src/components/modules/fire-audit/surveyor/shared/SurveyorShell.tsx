'use client';

import { SurveyorHeader } from './SurveyorHeader';
import { SurveyorSidebar } from './SurveyorSidebar';
import { SurveyorBottomNav } from './SurveyorBottomNav';

export interface SurveyorShellProps {
  children: React.ReactNode;
}

export function SurveyorShell({ children }: SurveyorShellProps) {
  return (
    <div className="h-dvh w-full bg-[#E8EEF5] text-slate-800 antialiased selection:bg-orange-100 selection:text-orange-600 flex flex-col font-devanagari overflow-hidden">
      <SurveyorHeader />
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        <SurveyorSidebar />
        <main className="flex-1 relative flex flex-col w-full h-full min-w-0 min-h-0 p-0 lg:px-8 lg:py-4 overflow-hidden">
          {children}
        </main>
      </div>
      <SurveyorBottomNav />
    </div>
  );
}
