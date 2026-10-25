export const dynamic = 'force-dynamic';

/**
 * Asset Master Dashboard Page
 * 
 * IMPORTANT: This page displays AssetIntroVideo component before the dashboard.
 * - Video plays once per session (tracked via sessionStorage: 'ntis_asset_management_intro_played')
 * - To test video again: Open browser console and run: sessionStorage.removeItem('ntis_asset_management_intro_played')
 * - Check browser console for video debugging logs
 * - Video ONLY plays when navigating to Asset Management from home page
 */

import { fetchDashboardData } from '@/app/[locale]/assets/dashboard/master-dashboard/actions';
import { AssetMasterDashboard } from '@/components/modules/assets/dashboard/master-dashboard/AssetMasterDashboard';
import { authService } from '@/lib/api/auth.service';
import { cookies } from 'next/headers';
import { sanitizeDashboardParams } from '@/lib/utils/asset-utils/asset-dashboard-helpers';

export interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AssetMasterDashboardPage({ params, searchParams }: PageProps) {
    await params; // Awaiting as per Next.js 15+ patterns even if unused
    const search = await searchParams;
    const cookieStore = await cookies();
    let districtName = cookieStore.get('ulb_name')?.value || '';

    const { zone, ward, typeId, categoryId } = sanitizeDashboardParams(search);
    const assetIdParam = search.asset && !Array.isArray(search.asset) ? Number(search.asset) : null;

    // Fetch all dashboard data with filter params passed to the API
    const [dashboardRes, ulbRes] = await Promise.all([
        fetchDashboardData(
            null,
            null,
            categoryId,
            typeId,
            zone !== 'all' ? zone : null,
            ward !== 'all' ? ward : null,
            assetIdParam && !isNaN(assetIdParam) ? assetIdParam : null
        ),
        districtName ? Promise.resolve(null) : authService.getUlbConfig().catch(() => null),
    ]);

    if (!districtName && ulbRes && ulbRes.success && ulbRes.data?.ulbName) {
        districtName = ulbRes.data.ulbName;
    }

    // Dynamic clean-up (e.g. "Akola Municipal Corporation" -> "Akola")
    if (districtName) {
        districtName = districtName.replace(/\s+(Municipal\s+Corporation|Council|ULB|Corporation)$/i, '').trim();
    } else {
        districtName = ''; // ULB name unavailable; let the component render a generic label
    }

    if (!dashboardRes.success || !dashboardRes.data) {
        throw new Error(dashboardRes.message || 'Failed to load dashboard data');
    }

    const initialDashboardData = dashboardRes.data;

    return (
        <>
            <div className="bg-slate-50/50 overflow-y-auto custom-scrollbar">
                <div className="mx-auto w-full max-w-full">
                    <AssetMasterDashboard
                        initialData={initialDashboardData}
                        selectedDistrict={districtName}
                    />
                </div>
            </div>
        </>
    );
}
