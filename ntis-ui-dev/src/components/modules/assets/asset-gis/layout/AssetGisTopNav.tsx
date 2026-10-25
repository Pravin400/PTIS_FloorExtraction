'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Maximize, Minimize, Download, Clock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { exportAssetExcelAction, exportExcelAction } from '@/app/[locale]/assets/gismapviewer/actions';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import { GIS_ROUTES } from '@/lib/utils/asset-gis-utils';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/common';
import type { AssetGisTopNavProps } from '@/types/asset-gis.types';

export function AssetGisTopNav(props: AssetGisTopNavProps) {
  const { ulbData, toggleFullscreen, isFullscreen, dashboardFilters } = props;

  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('assetGis');
  const activeModule = useCouncilBoundaryStore(s => s.activeModule);
  const [isExporting, setIsExporting] = useState(false);
  const [_isDeptDropdownOpen, _setIsDeptDropdownOpen] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const isAsset = activeModule === 'ASSET';

      // Clean query parameters from dashboardFilters
      const cleanFilters: Record<string, unknown> = {};
      if (dashboardFilters && typeof dashboardFilters === 'object') {
        for (const [key, val] of Object.entries(dashboardFilters)) {
          if (val !== undefined && val !== null && val !== '' && val !== 'all') {
            cleanFilters[key] = val;
          }
        }
      }

      const serverRes = isAsset
        ? await exportAssetExcelAction(cleanFilters)
        : await exportExcelAction(cleanFilters);

      if (!serverRes || !serverRes.success || !serverRes.data) {
        const errorMsg = serverRes?.error || t('errors.exportFailed');
        toast.error(errorMsg);
        return;
      }

      const byteCharacters = atob(serverRes.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const prefix = isAsset ? 'Akola_Municipal_Assets_Export' : 'GIS_Property_Tax_Export';
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `${prefix}_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success(t('messages.exportSuccess') || 'Export generated successfully');
      }
    } catch (error: unknown) {
      logger.error('Export failed:', { error: error as Error });
      const errorObj = error as { message?: string };
      toast.error(errorObj?.message || t('errors.exportFailed') || 'Export failed. Please check your connection.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header
      className="h-16 border-b border-white/10 flex-shrink-0 flex items-center justify-between px-6 relative z-[5000] shadow-xl overflow-visible bg-gradient-to-r from-blue-950 via-blue-900 to-blue-600"
    >
      {/* Left Section: Logo & Titles */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-md p-1 border border-white/30"
          >
            {ulbData?.ulbLogo ? (
              <Image
                src={
                  ulbData.ulbLogo.startsWith('data:') || ulbData.ulbLogo.startsWith('http') || ulbData.ulbLogo.startsWith('/')
                    ? ulbData.ulbLogo
                    : `data:image/png;base64,${ulbData.ulbLogo}`
                }
                alt={ulbData.ulbName ? `${ulbData.ulbName} Logo` : 'ULB Logo'}
                width={36}
                height={36}
                unoptimized
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallbackEl = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallbackEl) fallbackEl.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={cn(
                'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs uppercase',
                ulbData?.ulbLogo ? 'hidden' : 'flex'
              )}
            >
              {ulbData?.ulbName
                ? ulbData.ulbName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
                : 'AMC'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-white leading-tight drop-shadow-md">
              {ulbData?.ulbName || 'Akola Municipal Corporation'}
            </h1>

            {/* Department Label (Fixed to Asset Department) */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-white/20 shadow-md text-[10px] font-black uppercase tracking-wider text-white">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse border border-white/20" />
              <span>{t('header.assetDepartment')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Export, Fullscreen & Back Button */}
      <div className="flex items-center gap-4">
        {/* Export Excel Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          isLoading={isExporting}
          icon={isExporting ? Clock : Download}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all shadow-lg active:shadow-inner cursor-pointer text-white h-auto"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-white uppercase tracking-wider">{t('header.exportData')}</span>
            <span className="text-[8px] font-bold text-blue-200/80 uppercase mt-0.5">XLSX</span>
          </div>
        </Button>

        {/* Fullscreen Button */}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={toggleFullscreen}
          icon={isFullscreen ? Minimize : Maximize}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors group cursor-pointer border border-white/10 text-white h-auto p-0"
          title={t('header.fullscreen')}
          aria-label={t('header.fullscreen')}
        />

        <div className="h-6 w-[1px] bg-white/20" />

        {/* Back Button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/${locale}${GIS_ROUTES.ASSET_REGISTER}`)}
          icon={ArrowLeft}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer h-auto border-0"
          title={t('header.backToAssetRegister')}
        >
          {t('header.back')}
        </Button>
      </div>
    </header>
  );
}


