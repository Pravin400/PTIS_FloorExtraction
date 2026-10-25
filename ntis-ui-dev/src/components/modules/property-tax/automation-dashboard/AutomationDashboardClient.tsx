'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useCallback } from 'react';

import {
    ClipboardList,
    FileText,
    ThumbsUp,
    Scale,
    Layout as LayoutIcon,
    FileSearch,
    CheckCircle,
    FileCheck,
    Bell
} from 'lucide-react';

import { Props } from '@/types/automation-dashboard/automation-dashboard.type';
import { DashboardSummaryCards } from './SummaryCards/DashboardSummaryCards';
import { getTabColors } from './StageNavigationCard/TabColorList';
import { WorkflowTabButton } from './StageNavigationCard/TabCardStyles';
import { useToast } from '@/components/common/ToastProvider';
import { Tooltip } from '@/components/common';

const getStageConfig = (stageName: string) => {
    switch (stageName) {
        case 'GeoSequencing': return { icon: ClipboardList, value: 'geo-sequencing' };
        case 'InternalSurvey': return { icon: FileSearch, value: 'internal-survey' };
        case 'DataEntry': return { icon: CheckCircle, value: 'quality-check' };
        case 'Assessment': return { icon: FileCheck, value: 'assessment' };
        case 'ApprovalByULB': return { icon: ThumbsUp, value: 'approval-by-ulb' };
        case 'NoticeDistribution': return { icon: Bell, value: 'notice-distribution' };
        case 'HearingAndAppeal': return { icon: Scale, value: 'hearing-appeals' };
        case 'BillDistribution': return { icon: FileText, value: 'bills-distribution' };
        case 'BillGeneration': return { icon: FileText, value: 'bill-generation' };
        case 'MissingDataAnalysis': return { icon: FileSearch, value: 'missing-data-analysis' };
        default: return {
            icon: LayoutIcon,
            value: stageName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
        };
    }
};

export function ClientWrapper({ children, workflowCardsData, serverData }: Props) {

    const pathname = usePathname();
    const locale = useLocale();
    const router = useRouter();
    const { info } = useToast();
    const t = useTranslations('automationDashboard');
    const basePath = `/${locale}/property-tax/automation-dashboard`;

    const isIsolatedView = pathname.includes('/ward-wise-summary') ||
        pathname.includes('/property-details-dashboard') ||
        pathname.includes('/quality-check/update-common-details') ||
        pathname.includes('/send-to-approve') ||
        pathname.includes('/pending-structures-ward-wise') ||
        pathname.includes('/building-wise-property') ||
        pathname.includes('/approval-by-ulb/ulb-pending-signs') ||
        pathname.includes('/missing-data-analysis');

    const rawTabs = useMemo(() => {
        return (workflowCardsData || []).map(card => {
            const config = getStageConfig(card.stageName);
            return {
                id: card.id,
                value: config.value,
                title: card.stageName,
                icon: config.icon,
                data: {
                    structure: card.structureCount?.toString() || "0",
                    unit: card.unitCount?.toString() || "0",
                }
            };
        });
    }, [workflowCardsData]);

    const activeTabObj = rawTabs?.find(t => pathname.includes(`/${t.value}`));
    const activeTab = activeTabObj ? activeTabObj.value : (rawTabs[0]?.value || '');

    const handleTabClick = useCallback((isClickable: boolean, tabValue: string, tabId: string | number) => {
        if (isClickable) {
            router.push(`${basePath}/${tabValue}?workflowStageId=${tabId}`);
        } else {
            info(t('featureWip') || 'This feature is currently Work in Progress.');
        }
    }, [router, basePath, info, t]);

    return (
        <div className={`flex flex-col h-full ${isIsolatedView ? 'p-0 bg-white' : 'gap-2 bg-white rounded-xl'}`}>
            {!isIsolatedView && (
                <>
                    {/* TOP CARDS RENDERED IN CLIENT MODULE, USING SERVER DATA */}
                    <DashboardSummaryCards serverData={serverData} />

                    <div
                        className="grid gap-2 w-full no-scrollbar"
                        style={{ gridTemplateColumns: `repeat(${rawTabs.length}, minmax(0, 1fr))` }}
                    >
                        {rawTabs.map((tab, index) => {
                            const isActive = activeTab === tab.value;
                            const Icon = tab.icon;
                            const colors = getTabColors(tab.value);
                            const isClickable = index < 5 || tab.value === 'missing-data-analysis';

                            const innerContent = (
                                <div
                                    onClick={() => handleTabClick(isClickable, tab.value, tab.id)}
                                    className={`min-w-0 w-full h-full text-left outline-none block ${isClickable ? 'cursor-pointer transition-transform active:scale-[0.98]' : 'cursor-not-allowed'}`}
                                >
                                    <div className={`w-full h-full ${!isClickable ? 'pointer-events-none' : ''}`}>
                                        <WorkflowTabButton tab={tab} isActive={isActive} icon={Icon} colors={colors} isClickable={isClickable} />
                                    </div>
                                </div>
                            );

                            return (
                                <div key={tab.value}>
                                    {!isClickable ? (
                                        <Tooltip content={t('wip') || 'Work in Progress'} placement="bottom">
                                            {innerContent}
                                        </Tooltip>
                                    ) : innerContent}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <div className={`flex-1 bg-white ${isIsolatedView ? '' : 'rounded-lg shadow-sm'}`}>
                {children}
            </div>
        </div>
    );
}
