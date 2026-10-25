'use client';

import React from 'react';
import {
  MapPin,
  Tag,
  FileSpreadsheet,
  Crosshair,
  Grid,
  User,
  Building2,
  Mail,
  Phone,
  Home,
  Maximize2,
  Layers,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropertyMasterData } from '@/types/property-tax/apartment';
import { Tooltip } from '@/components/common/Tooltip';
import { PropertyMasterInfoRow } from './PropertyMasterInfoRow';

interface PropertyMasterDetailsGridProps {
  data?: PropertyMasterData;
  isMiddleSectionVisible?: boolean;
  onToggleMiddleSection?: () => void;
}

export const PropertyMasterDetailsGrid: React.FC<PropertyMasterDetailsGridProps> = ({
  data,
  isMiddleSectionVisible = false,
  onToggleMiddleSection,
}) => {
  const t = useTranslations('appartmentQC');

  const renderAreaRow = (currentVal?: string, oldVal?: string, fallbackVal?: string) => {
    const hasCurrent = Boolean(currentVal && currentVal !== '-' && currentVal.trim() !== '');
    const hasOld = Boolean(oldVal && oldVal !== '-' && oldVal.trim() !== '');

    if (!hasCurrent && !hasOld) {
      return fallbackVal && fallbackVal !== '-' && fallbackVal.trim() !== '' ? fallbackVal : '-';
    }

    return (
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 leading-tight text-left">
        <div className="inline-flex items-center whitespace-nowrap">
          <span
            className={hasCurrent ? 'font-bold text-[#1d4ed8]' : 'font-semibold text-slate-400'}
          >
            {hasCurrent ? currentVal : '-'}
          </span>
        </div>
        <span className="text-slate-300 font-normal">|</span>
        <div className="inline-flex items-center whitespace-nowrap">
          <span className="text-slate-600 font-semibold mr-1">{t('grid.old') || 'Old:'}</span>
          <span className={hasOld ? 'font-bold text-[#1d4ed8]' : 'font-semibold text-slate-400'}>
            {hasOld ? oldVal : '-'}
          </span>
        </div>
      </div>
    );
  };

  const renderWingsAndFloorsRow = (totalWings?: number | string, totalFloors?: string) => {
    const wingsVal =
      totalWings != null && totalWings !== '' && totalWings !== 0
        ? totalWings
        : data?.wings && data.wings.length > 0
          ? data.wings.length
          : totalWings != null && totalWings !== ''
            ? totalWings
            : '-';

    const floorsVal =
      totalFloors != null && totalFloors !== '' && totalFloors !== '-' ? totalFloors : '-';

    return (
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 leading-tight text-left">
        <div className="inline-flex items-center whitespace-nowrap">
          <span className="font-bold text-[#1d4ed8]">{wingsVal}</span>
        </div>
        <span className="text-slate-300 font-normal">|</span>
        <div className="inline-flex items-center whitespace-nowrap gap-1">
          <Layers className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-600 font-semibold">
            {t('grid.totalFloors') || 'Total Floors:'}
          </span>
          <span className="font-bold text-[#1d4ed8] ml-0.5">{floorsVal}</span>
        </div>
      </div>
    );
  };

  const parseTotalPropertiesCounts = (val?: string) => {
    if (!val || val === '-' || val.trim() === '') return null;

    const cleanStr = val.trim();
    const slashParts = cleanStr.split(/[/|]/).map((p) => p.trim());
    const extractNum = (s: string) => {
      const match = s.match(/\d+/);
      return match ? match[0] : s.replace(/[^0-9]/g, '') || '0';
    };

    if (slashParts.length >= 3) {
      return {
        res: extractNum(slashParts[0]),
        comm: extractNum(slashParts[1]),
        amen: extractNum(slashParts[2]),
      };
    }

    if (slashParts.length === 2) {
      return {
        res: extractNum(slashParts[0]),
        comm: extractNum(slashParts[1]),
        amen: '0',
      };
    }

    const singleMatch = cleanStr.match(/^\d+$/);
    if (singleMatch) {
      return {
        res: cleanStr,
        comm: '0',
        amen: '0',
      };
    }

    return null;
  };

  const renderTotalPropertiesRow = (
    counts: { res: string; comm: string; amen: string } | null,
    rawVal?: string
  ) => {
    if (!counts) {
      return rawVal && rawVal !== '-' && rawVal.trim() !== '' ? rawVal.trim() : '-';
    }

    const sanitizeLabel = (lbl?: string, fallback = '') => {
      if (!lbl) return fallback;
      return lbl.replace(/[:-]+$/, '').trim() || fallback;
    };
    const resLabel = sanitizeLabel(t('grid.res'), 'Res');
    const commLabel = sanitizeLabel(t('grid.comm'), 'Comm');
    const amenLabel = sanitizeLabel(t('grid.amen'), 'Amen');

    return (
      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 leading-tight text-left">
        <div className="inline-flex items-center whitespace-nowrap">
          <span className="font-semibold text-slate-600 mr-0.5">{resLabel}:</span>
          <span className="font-bold text-[#1d4ed8]">{counts.res}</span>
        </div>
        <span className="text-slate-300 font-normal">|</span>
        <div className="inline-flex items-center whitespace-nowrap">
          <span className="font-semibold text-slate-600 mr-0.5">{commLabel}:</span>
          <span className="font-bold text-[#1d4ed8]">{counts.comm}</span>
        </div>
        <span className="text-slate-300 font-normal">|</span>
        <div className="inline-flex items-center whitespace-nowrap">
          <span className="font-semibold text-slate-600 mr-0.5">{amenLabel}:</span>
          <span className="font-bold text-[#1d4ed8]">{counts.amen}</span>
        </div>
      </div>
    );
  };

  const totalCounts = parseTotalPropertiesCounts(data?.totalPropertiesResCommAmen);
  const resFullName = t('grid.residential') || 'Residential';
  const commFullName = t('grid.commercial') || 'Commercial';
  const amenFullName = t('grid.amenity') || 'Amenity';

  const totalPropertiesTooltip = totalCounts
    ? `${resFullName}: ${totalCounts.res} | ${commFullName}: ${totalCounts.comm} | ${amenFullName}: ${totalCounts.amen}`
    : undefined;

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-x-2 lg:gap-x-3 xl:gap-x-4 h-full flex-1 text-[11px] sm:text-[11.5px] xl:text-[12px] pt-0.5 xl:pt-1 min-w-0">
      {/* SECTION 1: General & Location Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 overflow-hidden gap-y-1 xl:gap-y-1.5 md:border-r md:border-slate-100 md:pr-2.5 lg:md:pr-3">
        <div className="h-5 flex items-center pb-0.5 border-b border-transparent -mt-0.5 mb-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{t('grid.generalInfo') || 'Location & Info'}</span>
          </span>
        </div>
        <PropertyMasterInfoRow
          icon={MapPin}
          label={t('grid.division') || 'Division:'}
          value={data?.division}
          minWidth="min-w-[90px] lg:min-w-[100px] xl:min-w-[115px]"
        />
        <PropertyMasterInfoRow
          icon={Tag}
          label={t('grid.category') || 'Category:'}
          value={data?.category}
          minWidth="min-w-[90px] lg:min-w-[100px] xl:min-w-[115px]"
        />
        <PropertyMasterInfoRow
          icon={FileSpreadsheet}
          label={t('grid.taxZoneAndName') || 'Tax Zone & Name:'}
          value={data?.taxZoneAndName || data?.taxZone}
          minWidth="min-w-[90px] lg:min-w-[100px] xl:min-w-[115px]"
        />
        <PropertyMasterInfoRow
          icon={Crosshair}
          label={t('grid.subZoneCsn') || 'Sub Zone & CSN:'}
          value={data?.subZoneCsnNo}
          minWidth="min-w-[90px] lg:min-w-[100px] xl:min-w-[115px]"
        />
        <PropertyMasterInfoRow
          icon={Grid}
          label={t('grid.plotNo') || 'Plot No.:'}
          value={data?.plotNo}
          minWidth="min-w-[90px] lg:min-w-[100px] xl:min-w-[115px]"
        />
        <PropertyMasterInfoRow
          icon={User}
          label={t('grid.landOwnerName') || 'Land Owner Name:'}
          value={data?.landOwnerName || data?.owner}
          minWidth="min-w-[100px] lg:min-w-[110px] xl:min-w-[125px]"
        />
      </div>

      {/* SECTION 2: Society Address & Property Metrics (Middle Section) */}
      <div
        className={`${isMiddleSectionVisible ? 'flex-[1.25]' : 'flex-[1.4]'} flex flex-col justify-between min-w-0 overflow-hidden gap-y-1 xl:gap-y-1.5`}
      >
        <div className="h-5 flex items-center pb-0.5 border-b border-transparent -mt-0.5 mb-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Home className="w-3 h-3 text-slate-400" />
            <span>{t('grid.metrics') || 'Address & Area'}</span>
          </span>
        </div>
        <PropertyMasterInfoRow
          icon={Home}
          label={t('grid.address') || 'Address:'}
          value={data?.societyAddress || data?.address}
          minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          isMultiline
        />
        <PropertyMasterInfoRow
          icon={Maximize2}
          label={t('grid.carpetArea') || 'Carpet Area:'}
          value={renderAreaRow(
            data?.carpetAreaFtMtr,
            data?.oldCarpetAreaFtMtr,
            data?.carpetBuiltUpArea
          )}
          minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          isMultiline
        />
        <PropertyMasterInfoRow
          icon={Building2}
          label={t('grid.builtUpArea') || 'Built-up Area:'}
          value={renderAreaRow(
            data?.builtUpAreaFtMtr,
            data?.oldBuiltUpAreaFtMtr,
            data?.oldCarpetBuiltUp
          )}
          minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          isMultiline
        />
        <PropertyMasterInfoRow
          icon={Building2}
          label={t('grid.totalWings') || 'Total Wings:'}
          value={renderWingsAndFloorsRow(data?.totalWings, data?.totalFloors)}
          minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          isMultiline
        />
        {totalPropertiesTooltip ? (
          <Tooltip
            content={<span className="whitespace-nowrap font-semibold">{totalPropertiesTooltip}</span>}
            placement="top"
            className="max-w-none whitespace-nowrap shadow-md"
          >
            <div className="cursor-pointer">
              <PropertyMasterInfoRow
                icon={Clock}
                label={t('grid.totalUnits') || t('grid.totalProperties') || 'Total Units:'}
                value={renderTotalPropertiesRow(totalCounts, data?.totalPropertiesResCommAmen)}
                minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
                isMultiline
              />
            </div>
          </Tooltip>
        ) : (
          <PropertyMasterInfoRow
            icon={Clock}
            label={t('grid.totalUnits') || t('grid.totalProperties') || 'Total Units:'}
            value={renderTotalPropertiesRow(totalCounts, data?.totalPropertiesResCommAmen)}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
            isMultiline
          />
        )}
      </div>

      {/* TOGGLE DIVIDER ON DESKTOP (Between Address Section and Management Section) */}
      <div className="hidden md:flex items-center justify-center shrink-0 self-stretch px-1 relative group/divider">
        <div className="absolute inset-y-1 w-px bg-slate-200/90 group-hover/divider:bg-blue-400 transition-colors" />
        <Tooltip
          content={
            <span className="font-semibold text-xs whitespace-nowrap">
              {isMiddleSectionVisible
                ? t('header.hideManagementDetails') || 'Hide Management Details'
                : t('header.showManagementDetails') || 'Show Management Details'}
            </span>
          }
          placement="top"
        >
          <button
            type="button"
            onClick={onToggleMiddleSection}
            aria-label={
              isMiddleSectionVisible
                ? t('header.hideManagementDetails') || 'Hide Management Details'
                : t('header.showManagementDetails') || 'Show Management Details'
            }
            className={`relative z-10 w-6.5 h-6.5 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
              isMiddleSectionVisible
                ? 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-300 hover:border-blue-600 shadow-2xs hover:shadow-xs ring-2 ring-blue-100/60'
                : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm hover:shadow-md ring-2 ring-blue-200/80 hover:ring-blue-300'
            }`}
          >
            {isMiddleSectionVisible ? (
              <ChevronLeft className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-all group-hover:-translate-x-0.5 stroke-[2.2]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white transition-all group-hover:translate-x-0.5 stroke-[2.5]" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* TOGGLE ON MOBILE (When management section is hidden) */}
      {!isMiddleSectionVisible && (
        <div className="md:hidden py-1">
          <button
            type="button"
            onClick={onToggleMiddleSection}
            aria-label={t('header.showManagementDetails') || 'Show Management Details'}
            className="w-full py-1.5 px-3 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <span>{t('header.showManagementDetails') || 'Show Management Details'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 3: Ownership & Management (Hide/Unhide Section) */}
      {isMiddleSectionVisible && (
        <div className="flex-1 flex flex-col justify-between min-w-0 overflow-hidden gap-y-1 xl:gap-y-1.5">
          <div className="h-5 flex items-center justify-between pb-0.5 border-b border-slate-100/90 -mt-0.5 mb-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{t('grid.management') || 'Management'}</span>
            </span>
            {onToggleMiddleSection && (
              <button
                type="button"
                onClick={onToggleMiddleSection}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200/80 hover:border-red-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                title={t('header.hideManagementDetails') || 'Hide Management Details'}
                aria-label={t('header.hideManagementDetails') || 'Hide Management Details'}
              >
                <ChevronLeft className="w-3 h-3" />
                <span>{t('actions.hide') || 'Hide'}</span>
              </button>
            )}
          </div>
          <PropertyMasterInfoRow
            icon={Building2}
            label={t('grid.builderName') || 'Builder Name:'}
            value={data?.builderName}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          />
          <PropertyMasterInfoRow
            icon={Mail}
            label={t('grid.societyEmail') || 'Society Email:'}
            value={data?.societyEmail}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          />
          <PropertyMasterInfoRow
            icon={User}
            label={t('grid.secretaryName') || 'Secretary Name:'}
            value={data?.secretaryName}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          />
          <PropertyMasterInfoRow
            icon={Phone}
            label={t('grid.secretaryMobile') || 'Secretary Mobile:'}
            value={data?.secretaryMobileNo}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          />
          <PropertyMasterInfoRow
            icon={Mail}
            label={t('grid.secretaryEmail') || 'Secretary Email:'}
            value={data?.secretaryEmail}
            minWidth="min-w-[95px] lg:min-w-[105px] xl:min-w-[120px]"
          />
          <PropertyMasterInfoRow
            icon={User}
            label={t('grid.managerNameEnglish') || 'Manager Name (Eng):'}
            value={data?.managerNameEnglish || data?.managerName}
            minWidth="min-w-[105px] lg:min-w-[115px] xl:min-w-[125px]"
          />
        </div>
      )}
    </div>
  );
};
