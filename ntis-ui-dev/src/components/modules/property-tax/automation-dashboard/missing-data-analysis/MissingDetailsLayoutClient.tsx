'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  User,
  Phone,
  UserCheck,
  MapPin,
  Camera,
  Store,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { MissingDetailsTabCard } from './MissingDetailsTabCard';

interface Props {
  children: React.ReactNode;
}

const MISSING_DATA_TABS = [
  {
    id: 'photo-plan',
    labelKey: 'tabs.photoPlan',
    defaultLabel: 'Photo / Plan',
    icon: Camera,
    path: 'photo-plan',
    colors: {
      text: 'text-violet-600',
      bgSolid: 'bg-violet-600',
      bgLight: 'bg-violet-50',
      border: 'border-violet-600',
      ring: 'ring-violet-200',
      bgTint: 'bg-violet-600/10',
    },
  },
  {
    id: 'mobile-no',
    labelKey: 'tabs.mobileNo',
    defaultLabel: 'Mobile No.',
    icon: Phone,
    path: 'mobile-no',
    colors: {
      text: 'text-emerald-600',
      bgSolid: 'bg-emerald-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-600',
      ring: 'ring-emerald-200',
      bgTint: 'bg-emerald-600/10',
    },
  },
  {
    id: 'owner-name',
    labelKey: 'tabs.ownerName',
    defaultLabel: 'Owner Name',
    icon: User,
    path: 'owner-name',
    colors: {
      text: 'text-blue-600',
      bgSolid: 'bg-blue-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-600',
      ring: 'ring-blue-200',
      bgTint: 'bg-blue-600/10',
    },
  },
  {
    id: 'address',
    labelKey: 'tabs.address',
    defaultLabel: 'Address',
    icon: MapPin,
    path: 'address',
    colors: {
      text: 'text-red-600',
      bgSolid: 'bg-red-600',
      bgLight: 'bg-red-50',
      border: 'border-red-600',
      ring: 'ring-red-200',
      bgTint: 'bg-red-600/10',
    },
  },
  {
    id: 'occupier-name',
    labelKey: 'tabs.occupierName',
    defaultLabel: 'Occupier Name',
    icon: UserCheck,
    path: 'occupier-name',
    colors: {
      text: 'text-amber-600',
      bgSolid: 'bg-amber-600',
      bgLight: 'bg-amber-50',
      border: 'border-amber-600',
      ring: 'ring-amber-200',
      bgTint: 'bg-amber-600/10',
    },
  },
  {
    id: 'shop-name',
    labelKey: 'tabs.shopName',
    defaultLabel: 'Shop Name',
    icon: Store,
    path: 'shop-name',
    colors: {
      text: 'text-indigo-600',
      bgSolid: 'bg-indigo-600',
      bgLight: 'bg-indigo-50',
      border: 'border-indigo-600',
      ring: 'ring-indigo-200',
      bgTint: 'bg-indigo-600/10',
    },
  },
  {
    id: 'registered-property-data',
    labelKey: 'tabs.registeredPropertyData',
    defaultLabel: 'Registered Property Data',
    icon: FileSpreadsheet,
    path: 'registered-property',
    colors: {
      text: 'text-teal-600',
      bgSolid: 'bg-teal-600',
      bgLight: 'bg-teal-50',
      border: 'border-teal-600',
      ring: 'ring-teal-200',
      bgTint: 'bg-teal-600/10',
    },
  },
];

export default function MissingDetailsLayoutClient({ children }: Props) {
  const t = useTranslations('automationDashboard.missingDataAnalysis');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const basePath = `/${locale}/property-tax/automation-dashboard/missing-data-analysis`;

  const getActiveTab = () => {
    for (const tab of MISSING_DATA_TABS) {
      if (pathname.includes(`/${tab.path}`)) {
        return tab.id;
      }
    }
    return MISSING_DATA_TABS[0].id;
  };

  const activeTabId = getActiveTab();

  const handleTabClick = (tabPath: string) => {
    const params = searchParams?.toString() ?? '';
    const query = params ? `?${params}` : '';
    router.push(`${basePath}/${tabPath}${query}`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl p-4 gap-4 border border-slate-200 shadow-sm">
      {/* Common Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-xs">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t('title')}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation Cards */}
      <div className="grid gap-2.5 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 no-scrollbar">
        {MISSING_DATA_TABS.map((tab) => {
          const isActive = activeTabId === tab.id;

          return (
            <MissingDetailsTabCard
              key={tab.id}
              title={t(tab.labelKey)}
              isActive={isActive}
              icon={tab.icon}
              colors={tab.colors}
              onClick={() => handleTabClick(tab.path)}
            />
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-auto bg-white rounded-lg border border-slate-100 p-1">
        {children}
      </div>
    </div>
  );
}