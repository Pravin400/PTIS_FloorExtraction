'use client';

import { Briefcase, Building2, Image as ImageIcon, Package } from 'lucide-react';
import { Badge, Tabs } from '@/components/common';
import type { ULBTabListProps, UlbTabDescriptor } from '@/types/ulbconfig-master.types';

export function ULBTabList({ activeTab, completionStatus, t }: ULBTabListProps) {
  const tabs: UlbTabDescriptor[] = [
    { id: 'ulb-info', icon: Building2, label: t('tabs.ulbInfo'), key: 'ulbInfo' },
    { id: 'logo-images', icon: ImageIcon, label: t('tabs.logoImages'), key: 'logoImages' },
    { id: 'project-license-info', icon: Briefcase, label: t('tabs.projectLicense'), key: 'projectLicenseInfo' },
    { id: 'department-license', icon: Package, label: t('tabs.departmentLicense'), key: 'departmentLicense' },
  ];

  return (
    <Tabs.TabList className="mb-3 grid flex-shrink-0 grid-cols-2 gap-2 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-1.5 lg:grid-cols-4">
      {tabs.map((tab) => {
        const ready = completionStatus[tab.key];
        const isActive = activeTab === tab.id;
        return (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
            className="rounded-xl py-3 transition-all data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            <div className="flex items-center gap-2.5">
              <div className={`rounded-lg p-1.5 ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400'}`}>
                <tab.icon className="h-4 w-4" />
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              <Badge
                className={`border px-2 py-0.5 text-[8px] font-black uppercase ${
                  ready
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                    : 'border-amber-100 bg-amber-50 text-amber-600'
                }`}
              >
                {ready ? t('status.ready') : t('status.pending')}
              </Badge>
            </div>
          </Tabs.Tab>
        );
      })}
    </Tabs.TabList>
  );
}
