'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Building2, UserCheck, Users, History, Percent, FileText, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Tabs } from '@/components/common/Tabs';
import { Tooltip } from '@/components/common/Tooltip';
import type { PtisTabId } from '@/types/ptis.types';

interface PropertyTabHeadersProps {
  activeTab: PtisTabId;
  isBuildingPermissionExpanded?: boolean;
  onToggleBuildingPermissionExpand?: () => void;
}

export const PropertyTabHeaders: React.FC<PropertyTabHeadersProps> = ({
  activeTab,
  isBuildingPermissionExpanded,
  onToggleBuildingPermissionExpand,
}) => {
  const t = useTranslations('ptis');

  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-900" data-active-tab={activeTab}>
      <Tabs.TabList className="h-auto w-full justify-between border-0 bg-transparent overflow-y-hidden">
        <Tabs.Tab
          value="propertydetails"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center">
            <Building2 className="h-4 w-4" />
            <span className="ml-2">{t('tabs.propertyDetails')}</span>
          </span>
        </Tabs.Tab>
        <Tabs.Tab
          value="kycdetails"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center">
            <UserCheck className="h-4 w-4" />
            <span className="ml-2">{t('tabs.kycDetails')}</span>
          </span>
        </Tabs.Tab>
        <Tabs.Tab
          value="societydetails"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center">
            <Users className="h-4 w-4" />
            <span className="ml-2">{t('tabs.societyDetails')}</span>
          </span>
        </Tabs.Tab>
        <Tabs.Tab
          value="buildingpermission"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>{t('tabs.buildingPermission')}</span>
            {activeTab === 'buildingpermission' && onToggleBuildingPermissionExpand && (
              <Tooltip content={isBuildingPermissionExpanded ? 'Collapse' : 'Expand'} placement="top">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBuildingPermissionExpand();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleBuildingPermissionExpand();
                    }
                  }}
                  className="p-0.5 ml-1 rounded hover:bg-blue-100/50 text-current transition-colors cursor-pointer inline-flex items-center justify-center border-0 bg-transparent"
                  aria-label={isBuildingPermissionExpanded ? 'Collapse' : 'Expand'}
                >
                  {isBuildingPermissionExpanded ? (
                    <ChevronsUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronsDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </Tooltip>
            )}
          </span>
        </Tabs.Tab>
        <Tabs.Tab
          value="discountdetails"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center">
            <Percent className="h-4 w-4" />
            <span className="ml-2">{t('tabs.discountData')}</span>
          </span>
        </Tabs.Tab>
        <Tabs.Tab
          value="olddetails"
          className="rounded-b-none rounded-t-lg border-0 py-1.5 text-sm text-white data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-none hover:text-white justify-center"
        >
          <span className="inline-flex items-center">
            <History className="h-4 w-4" />
            <span className="ml-2">{t('tabs.oldDetails')}</span>
          </span>
        </Tabs.Tab>
      </Tabs.TabList>
    </div>
  );
};
