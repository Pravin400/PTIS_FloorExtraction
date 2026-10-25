'use client';

import { Settings, Plus } from 'lucide-react';
import { Button } from '@/components/common';
import { useRouter } from 'next/navigation';

import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';

interface ConfigurationMasterHeaderProps {
  title: string;
  subtitle: string;
  systemLevelLabel: string;
  addCategoryLabel: string;
  addConfigKeyLabel: string;
  activeCategoryId: string;
  search?: string;
}

export function ConfigurationMasterHeader({
  title,
  subtitle,
  systemLevelLabel,
  addCategoryLabel,
  addConfigKeyLabel,
  activeCategoryId,
  search,
}: ConfigurationMasterHeaderProps) {
  const router = useRouter();
  const { haveFullAccess } = useActivePagePermissions();

  const buildActionHref = (action: 'addCategory' | 'addConfigKey') => {
    const params = new URLSearchParams();
    params.set('categoryId', activeCategoryId);
    if (search) params.set('search', search);
    params.set('action', action);
    return `?${params.toString()}`;
  };

  return (
    <div className="px-2 sm:px-3 pt-2 sm:pt-2.5">
      <div className="max-w-500 mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm px-4 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 transition-transform hover:scale-105">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {title}
              </h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 uppercase tracking-widest border border-indigo-100/50">
                {systemLevelLabel}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
        </div>

        {haveFullAccess && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(buildActionHref('addCategory'), { scroll: false })}
              variant="secondary"
              icon={Plus}
              className="h-10 px-4 bg-white border-2 border-slate-200 hover:border-blue-300 !text-[#1d4ed8] font-black transition-all shadow-sm rounded-xl inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest hover:bg-blue-50/50 cursor-pointer"
            >
              {addCategoryLabel}
            </Button>

            <Button
              onClick={() => router.push(buildActionHref('addConfigKey'), { scroll: false })}
              variant="secondary"
              icon={Plus}
              className="h-10 px-4 bg-white border-2 border-slate-200 hover:border-blue-300 !text-[#1d4ed8] font-black transition-all shadow-sm rounded-xl inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest hover:bg-blue-50/50 cursor-pointer"
            >
              {addConfigKeyLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
