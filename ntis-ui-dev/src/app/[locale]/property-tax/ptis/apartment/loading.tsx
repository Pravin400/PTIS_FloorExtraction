import React from 'react';
import { PropertyMasterCardSkeleton } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterCardSkeleton';
import { ApartmentWingSkeleton } from '@/components/modules/property-tax/ptis/apartment/wing-intelligence/ApartmentWingSkeleton';
import { ApartmentTaxDetailsSkeleton } from '@/components/modules/property-tax/ptis/apartment/tables/ApartmentTaxDetailsSkeleton';

/**
 * ApartmentLoading
 * Next.js route-level loading boundary for the PTIS Apartment screen.
 * Prevents blank white screen on route navigation and displays
 * the dashboard layout structure while data is being prepared.
 */
export default function ApartmentLoading(): React.ReactElement {
  return (
    <div className="w-full flex flex-col bg-slate-100 min-h-screen text-zinc-900 select-none pb-16 font-sans">
      {/* 1. Top Search Bar Shell Skeleton */}
      <div className="px-3 pt-2">
        <div className="rounded-xl border border-blue-200/80 shadow-xs bg-white p-3 flex flex-wrap items-center gap-3">
          <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-36 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-9 w-10 bg-blue-100 rounded-lg ml-auto animate-pulse" />
        </div>
      </div>

      {/* 2. Property Master Card Skeleton */}
      <div className="px-3 pt-2">
        <PropertyMasterCardSkeleton />
      </div>

      {/* 3. Status Metrics Header Skeleton */}
      <div className="px-3 pt-2">
        <div className="w-full bg-white rounded-xl border border-zinc-200 shadow-xs py-2 px-4 flex items-center gap-3 min-h-[36px]">
          <div className="h-5 w-24 bg-blue-100 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-5 w-24 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-slate-100 rounded-full ml-auto animate-pulse" />
        </div>
      </div>

      {/* 4. Wing Intelligence Skeleton */}
      <div className="px-3 pt-2">
        <ApartmentWingSkeleton />
      </div>

      {/* 5. Apartment Tax Details Skeleton */}
      <ApartmentTaxDetailsSkeleton />
    </div>
  );
}

