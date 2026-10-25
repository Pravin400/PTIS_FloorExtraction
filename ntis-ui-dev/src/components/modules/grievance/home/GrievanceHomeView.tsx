'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMunicipalDepartments } from '@/hooks/grievance/shared';
import { CitySkylineIllustration } from './CitySkylineIllustration';
import { GatewayHeroSection } from './GatewayHeroSection';
import { GatewayFeatureBar } from './GatewayFeatureBar';

export interface GrievanceHomeViewProps {
  onTrackRequestClick?: () => void;
  onViewMapClick?: () => void;
  className?: string;
}

/**
 * GrievanceHomeView
 * Official Grievance Home Landing Page Component located in src/components/modules/grievance/home/
 * Strictly under 200 lines, delegating to specialized presentation sub-components.
 */
export function GrievanceHomeView({
  onTrackRequestClick,
  onViewMapClick,
  className = '',
}: GrievanceHomeViewProps) {
  const locale = useLocale();
  const router = useRouter();

  const { departments } = useMunicipalDepartments();
  const deptCount = departments.length || 67;

  const handleNavigateToDepartments = () => {
    router.push(`/${locale}/grievance/dashboard`);
  };

  return (
    <div className={`relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between bg-white overflow-x-hidden ${className}`}>
      {/* 1. Hero Main Section with City Skyline Line Art */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-36 sm:pt-16 sm:pb-44 md:pt-20 md:pb-52 text-center z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-100/40 via-sky-50/20 to-transparent blur-3xl pointer-events-none rounded-full" />

        <GatewayHeroSection
          deptCount={deptCount}
          onSelectDepartment={handleNavigateToDepartments}
          onTrackRequestClick={onTrackRequestClick}
          onViewMapClick={onViewMapClick || (() => router.push(`/${locale}/grievance/dashboard`))}
        />

        <CitySkylineIllustration />
      </div>

      {/* 2. Bottom Blue Highlight Bar */}
      <GatewayFeatureBar />
    </div>
  );
}
