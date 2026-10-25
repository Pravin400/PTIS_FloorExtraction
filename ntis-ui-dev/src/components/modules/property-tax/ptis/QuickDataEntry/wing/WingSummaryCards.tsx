'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Home, Edit, Trash2, ShieldCheck, User } from 'lucide-react';
import { SocietyDetailItem } from '@/types/zone-master/properties/societyDetails.types';
import { SocietyWingDetailItem } from '@/types/zone-master/properties/society-wing-details.types';

interface WingSummaryCardsProps {
  wings: SocietyDetailItem[];
  wingStats: SocietyWingDetailItem[];
  onEdit: (wing: SocietyDetailItem) => void;
  onDelete: (wing: SocietyDetailItem) => void;
  onSelectWing?: (wing: SocietyDetailItem) => void;
}

export const WingSummaryCards: React.FC<WingSummaryCardsProps> = ({
  wings,
  wingStats,
  onEdit,
  onDelete,
  onSelectWing,
}) => {
  const t = useTranslations('quickDataEntry');

  const getStats = (wingId: number | null, societyDetailId: number) => {
    const stat = wingStats.find(
      (s) =>
        s.societyDetailId === societyDetailId ||
        (wingId !== null && s.wingId === wingId)
    );
    return {
      propertyCount: stat?.propertyCount ?? 0,
      aminityCount: stat?.aminityCount ?? 0,
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {wings.map((wing) => {
        const { propertyCount, aminityCount } = getStats(wing.wingId, wing.id);

        return (
          <div
            key={wing.id}
            onClick={() => onSelectWing?.(wing)}
            className="group relative bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:border-blue-400 flex flex-col justify-between"
          >
            {/* Header / Wing Letter & Name */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {wing.wingNo || wing.wingName?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {wing.wingName}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {wing.wingNo ? `${t('wing.wingNo')}: ${wing.wingNo}` : `ID: ${wing.id}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(wing);
                    }}
                    aria-label={t('wing.editWing')}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(wing);
                    }}
                    aria-label="Delete Wing"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Counts Badges */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-emerald-600">
                      {t('wing.properties')}
                    </div>
                    <div className="text-xs font-bold text-emerald-900">
                      {propertyCount} {t('wing.units')}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-blue-600">
                      {t('wing.amenities')}
                    </div>
                    <div className="text-xs font-bold text-blue-900">
                      {aminityCount} {t('wing.units')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Management details (if available) */}
              {(wing.secretaryName || wing.managerName) && (
                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                  {wing.secretaryName && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">{t('wing.secretaryName')}:</span>
                      <span className="font-medium text-gray-800 truncate">{wing.secretaryName}</span>
                    </div>
                  )}
                  {wing.managerName && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">{t('wing.managerName')}:</span>
                      <span className="font-medium text-gray-800 truncate">{wing.managerName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
