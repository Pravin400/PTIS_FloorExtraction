'use client';

import React, { memo, useMemo } from 'react';
import { Phone, AtSign, Home, Paperclip, Maximize2, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IndividualPropertyMasterData } from '@/types/property-tax/individual';
import { PropertyMasterInfoRow } from '@/components/modules/property-tax/ptis/apartment/apartment-tabSection/components/PropertyMasterInfoRow';
import { formatAddressWithWingAndPincode } from '@/lib/api/ptis/individual/individual-property.mapper';

export interface IndividualMasterContactColumnProps {
  data?: IndividualPropertyMasterData;
}

function sanitizeAreaString(val?: unknown): string {
  if (val == null) return '-';
  const str = String(val).trim();
  if (!str || str === '-' || str === 'undefined' || str === 'null') return '-';
  return str.replace(/(\d+\.\d{3,})/g, (match) => {
    const num = parseFloat(match);
    return isNaN(num) ? match : num.toFixed(2);
  });
}

export const IndividualMasterContactColumn: React.FC<IndividualMasterContactColumnProps> = memo(
  ({ data }) => {
    const t = useTranslations('individual');

    const addressNode = useMemo(() => {
      const enAddr = data?.addressEnglish;
      const regAddr = data?.addressRegional;
      if (enAddr && regAddr && enAddr !== regAddr) {
        const formattedEn = formatAddressWithWingAndPincode(enAddr, data?.wingName, data?.pinCode);
        const formattedReg = formatAddressWithWingAndPincode(regAddr, data?.wingName, data?.pinCode);
        return (
          <div className="flex flex-col min-w-0" title={`${formattedEn} | ${formattedReg}`}>
            <span className="text-[12px] leading-[15px] text-[#1d4ed8] font-bold truncate pt-[0.5px]">{formattedEn}</span>
            <span className="text-[10px] leading-[13px] text-slate-500 font-medium truncate pt-[0.5px]">{formattedReg}</span>
          </div>
        );
      }
      const raw = data?.address || data?.societyAddress || '-';
      return formatAddressWithWingAndPincode(raw, data?.wingName, data?.pinCode);
    }, [data?.addressEnglish, data?.addressRegional, data?.address, data?.societyAddress, data?.wingName, data?.pinCode]);

    const hasOldCarpet = useMemo(() => {
      const current = sanitizeAreaString(data?.carpetAreaFtMtr);
      const old = sanitizeAreaString(data?.oldCarpetAreaFtMtr);
      return Boolean(current && current !== '-' && old && old !== '-' && old !== current);
    }, [data?.carpetAreaFtMtr, data?.oldCarpetAreaFtMtr]);

    const hasOldBuiltUp = useMemo(() => {
      const current = sanitizeAreaString(data?.builtUpAreaFtMtr);
      const old = sanitizeAreaString(data?.oldBuiltUpAreaFtMtr);
      return Boolean(current && current !== '-' && old && old !== '-' && old !== current);
    }, [data?.builtUpAreaFtMtr, data?.oldBuiltUpAreaFtMtr]);

    const carpetAreaNode = useMemo(() => {
      const current = sanitizeAreaString(data?.carpetAreaFtMtr);
      const old = sanitizeAreaString(data?.oldCarpetAreaFtMtr);
      const hasCurrent = Boolean(current && current !== '-');
      const hasOld = Boolean(old && old !== '-' && old !== current);

      if (hasOld) {
        if (!hasCurrent) {
          return (
            <div
              className="inline-flex items-center gap-1 text-[10px] xl:text-[10.5px] text-slate-500 font-medium truncate"
              title={t('grid.oldAssessment', { value: old })}
            >
              <span className="bg-amber-100/90 text-amber-900 font-bold px-1 py-0.5 rounded text-[9px] uppercase tracking-wider border border-amber-300/80 shrink-0 leading-none">
                {t('grid.oldLabel')}
              </span>
              <span className="text-slate-600 font-semibold truncate">{old}</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[#1d4ed8] text-[11px] xl:text-[12px] truncate" title={current}>
              {current}
            </span>
            <div
              className="inline-flex items-center gap-1 text-[10px] xl:text-[10.5px] text-slate-500 font-medium truncate pt-0.5"
              title={t('grid.oldAssessment', { value: old })}
            >
              <span className="bg-amber-100/90 text-amber-900 font-bold px-1 py-0.5 rounded text-[9px] uppercase tracking-wider border border-amber-300/80 shrink-0 leading-none">
                {t('grid.oldLabel')}
              </span>
              <span className="text-slate-600 font-semibold truncate">{old}</span>
            </div>
          </div>
        );
      }
      return current;
    }, [data?.carpetAreaFtMtr, data?.oldCarpetAreaFtMtr, t]);

    const builtUpAreaNode = useMemo(() => {
      const current = sanitizeAreaString(data?.builtUpAreaFtMtr);
      const old = sanitizeAreaString(data?.oldBuiltUpAreaFtMtr);
      const hasCurrent = Boolean(current && current !== '-');
      const hasOld = Boolean(old && old !== '-' && old !== current);

      if (hasOld) {
        if (!hasCurrent) {
          return (
            <div
              className="inline-flex items-center gap-1 text-[10px] xl:text-[10.5px] text-slate-500 font-medium truncate"
              title={t('grid.oldAssessment', { value: old })}
            >
              <span className="bg-amber-100/90 text-amber-900 font-bold px-1 py-0.5 rounded text-[9px] uppercase tracking-wider border border-amber-300/80 shrink-0 leading-none">
                {t('grid.oldLabel')}
              </span>
              <span className="text-slate-600 font-semibold truncate">{old}</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[#1d4ed8] text-[11px] xl:text-[12px] truncate" title={current}>
              {current}
            </span>
            <div
              className="inline-flex items-center gap-1 text-[10px] xl:text-[10.5px] text-slate-500 font-medium truncate pt-0.5"
              title={t('grid.oldAssessment', { value: old })}
            >
              <span className="bg-amber-100/90 text-amber-900 font-bold px-1 py-0.5 rounded text-[9px] uppercase tracking-wider border border-amber-300/80 shrink-0 leading-none">
                {t('grid.oldLabel')}
              </span>
              <span className="text-slate-600 font-semibold truncate">{old}</span>
            </div>
          </div>
        );
      }
      return current;
    }, [data?.builtUpAreaFtMtr, data?.oldBuiltUpAreaFtMtr, t]);

    const altMobileDisplay =
      data?.alternateMobileNo && data.alternateMobileNo !== '-'
        ? data.alternateMobileNo
        : data?.altMobileNo && data.altMobileNo !== '-'
          ? data.altMobileNo
          : '-';

    return (
      <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
        <PropertyMasterInfoRow
          icon={Phone}
          label={t('grid.mobileNo') || 'Mobile No.'}
          value={data?.mobileNo || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[80px] 2xl:min-w-[105px]"
        />
        <PropertyMasterInfoRow
          icon={Phone}
          label={t('grid.altMobileNo') || 'Alt Mobile No.'}
          value={altMobileDisplay}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[80px] 2xl:min-w-[105px]"
        />
        <PropertyMasterInfoRow
          icon={AtSign}
          label={t('grid.emailId') || 'Email ID'}
          value={data?.emailId || '-'}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[80px] 2xl:min-w-[105px]"
        />
        <PropertyMasterInfoRow
          icon={Home}
          label={t('grid.address') || 'Address'}
          value={addressNode}
          minWidth="min-w-[65px] lg:min-w-[70px] xl:min-w-[80px] 2xl:min-w-[105px]"
          isMultiline
        />
        <PropertyMasterInfoRow
          icon={Paperclip}
          label={t('grid.plotAreaFtMtr') || 'Plot Area (sqft/sq mtr)'}
          value={sanitizeAreaString(data?.plotAreaFtMtr)}
          minWidth="min-w-[85px] lg:min-w-[95px] xl:min-w-[110px] 2xl:min-w-[140px]"
        />
        <PropertyMasterInfoRow
          icon={Maximize2}
          label={t('grid.carpetAreaFtMtr') || 'Carpet Area (sqft/sq mtr)'}
          value={carpetAreaNode}
          minWidth="min-w-[85px] lg:min-w-[95px] xl:min-w-[110px] 2xl:min-w-[140px]"
          isMultiline={hasOldCarpet}
        />
        <PropertyMasterInfoRow
          icon={Layers}
          label={t('grid.builtUpAreaFtMtr') || 'Built-Up Area (sqft/sq mtr)'}
          value={builtUpAreaNode}
          minWidth="min-w-[85px] lg:min-w-[95px] xl:min-w-[110px] 2xl:min-w-[140px]"
          isMultiline={hasOldBuiltUp}
        />
      </div>
    );
  }
);

IndividualMasterContactColumn.displayName = 'IndividualMasterContactColumn';
