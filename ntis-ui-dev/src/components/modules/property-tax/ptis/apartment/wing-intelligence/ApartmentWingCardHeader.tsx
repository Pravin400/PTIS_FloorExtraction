'use client';
import React from 'react';
import { FileText, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatBadgeProps, WingCardHeaderProps } from '@/types/property-tax/apartment';
import { Tooltip } from '@/components/common/Tooltip';

const StatBadge: React.FC<StatBadgeProps> = ({ label, value, highlight }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-[8px] px-2 py-1 min-w-[3.5rem] shadow-sm transition-all duration-150 hover:scale-105 hover:shadow-md select-none">
      <span className="text-[13px] font-black text-[#132c66] leading-none mb-0.5">{value}</span>
      <span className={`text-[7px] font-black uppercase tracking-wide ${highlight ? 'bg-emerald-500 text-white px-1 py-[1px] rounded-sm mt-0.5' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
  );
};

export const ApartmentWingCardHeader: React.FC<WingCardHeaderProps> = ({
  letter,
  name,
  stats,
  areaUnit,
  colorClass,
  onAmcClick,
  onEdit,
  isSelected,
  isCommonAmenity,
}) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');

  const isAmenityCard = Boolean(
    isCommonAmenity ||
    letter === 'CA' ||
    name?.toLowerCase().includes('common amenit')
  );

  const areaLabel = areaUnit
    ? `AREA ${areaUnit.toUpperCase()}`
    : (t('areaSqFt') || 'AREA FT²');    

  return (
    <div className="bg-[#0b28aa] rounded-t-xl px-3 py-1.5 flex justify-between items-center text-white border-b-2 border-slate-200">
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <Tooltip content={name} placement="top">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-white ${letter.length > 1 ? 'text-[11px] tracking-tight' : 'text-lg'} shadow-inner shrink-0 cursor-help transition-transform duration-200 group-hover:scale-105 ${colorClass}`}>
            {letter}
          </div>
        </Tooltip>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <h3
              className="font-extrabold text-[14px] leading-tight line-clamp-2 whitespace-normal break-words"
              title={name}
            >
              {name.length > 50 ? `${name.substring(0, 50)}...` : name}
            </h3>
            {onEdit && (
              <div
                className="bg-[#1e3a8a] hover:bg-blue-600 hover:scale-110 active:scale-95 p-1.5 rounded-full cursor-pointer ml-0.5 transition-all shrink-0"
                onClick={onEdit}
                title={t('editWing') || 'Edit Wing'}
              >
                <Pencil size={10} className="text-blue-100" />
              </div>
            )}
            {isSelected && (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-xs shrink-0 select-none animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {t('active') || 'ACTIVE'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {!isAmenityCard && (
          <StatBadge label={t('floors') || 'FLOORS'} value={`${stats.floors}`} />
        )}
        <StatBadge label={t('props') || 'PROPS'} value={stats.props} />
        <StatBadge label={areaLabel} value={stats.area.toLocaleString()} />
        <div
          className={`relative ml-2 transition-transform duration-200 ${
            isAmenityCard
              ? 'opacity-40 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer group/amc hover:scale-105 active:scale-95'
          }`}
          onClick={isAmenityCard ? undefined : onAmcClick}
        >
          <div className="bg-white/95 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white shadow-sm transition-colors">
            <FileText size={18} strokeWidth={2} className="text-blue-600 group-hover/amc:text-blue-700 transition-colors" />
          </div>
          <div className="absolute -bottom-1.5 -right-2 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-[2px] rounded-full border-2 border-[#1440aa]">
            {t('amc') || 'AMC'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentWingCardHeader;
