'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/common';
import type { AssetRegisterRow } from '@/types/asset/asset-register/municipal-asset-register.types';

interface TableRowMiddleColumnsProps {
  row: AssetRegisterRow;
  subUnitCount: number;
}

export function TableRowMiddleColumns({ row, subUnitCount }: TableRowMiddleColumnsProps) {
  const t = useTranslations('assetRegister');
  const encroachmentStatus = row.encroachmentStatus?.trim().toLowerCase();

  return (
    <>
      {/* 4. Basic Details */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">{row.assetTypeName || '-'}</p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('CTS_Survey')}: <span className="text-slate-700">{row.csn || '-'}</span>
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {t('Constructed')}:{' '}
            <span className="font-semibold text-slate-600">
              {row.constructionYear || '—'}{row.constructionTypeName && row.constructionTypeName !== '-' ? ` • ${row.constructionTypeName}` : ''}
            </span>
          </p>
        </div>
      </td>

      {/* 5. Ownership */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">{row.ownershipType || '-'}</p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('Custodian')}: <span className="text-slate-700">{row.departmentName || '-'}</span>
          </p>
        </div>
      </td>

      {/* 6. Use Details */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge variant="outline" size="sm" className="inline-block h-auto gap-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shadow-3xs uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
              {row.typeOfUseName || (row.occupancyStatus && row.occupancyStatus !== '-' ? row.occupancyStatus : '-')}
            </Badge>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold leading-tight">
            {subUnitCount > 0 ? `${subUnitCount} ${t('Sub_Units')}` : t('Single_Unit')}
          </p>
        </div>
      </td>

      {/* 7. Area */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-slate-800">
            {t('Plot')}: {row.landAreaSqMeter && row.landAreaSqMeter !== '-' ? `${row.landAreaSqMeter} m²` : '—'}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('CarpetArea')}: <span className="text-slate-700">{row.carpetAreaSqMeter && row.carpetAreaSqMeter !== '-' ? `${row.carpetAreaSqMeter} m²` : '—'}</span>
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {t('Structure')}: <span className="font-semibold text-slate-600">{row.totalFloors && row.totalFloors !== '-' ? `G+${row.totalFloors} ${t('Floors')}` : '—'}</span>
          </p>
        </div>
      </td>

      {/* 8. Maintenance */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge variant="outline" size="sm" className="inline-block h-auto gap-0 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-3xs bg-amber-50 text-amber-700 border-amber-200">
              {row.assetCondition && row.assetCondition !== '-' ? row.assetCondition : '-'}
            </Badge>
          </div>
        </div>
      </td>

      {/* 9. Rent Details */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge variant="outline" size="sm" className="inline-block h-auto gap-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold border shadow-3xs uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200">
              {row.activeLeaseCount != null ? (row.activeLeaseCount > 0 ? `${row.activeLeaseCount} Lease(s)` : '0 Leases') : '-'}
            </Badge>
          </div>
        </div>
      </td>

      {/* 10. Encroachment */}
      <td className="py-2 px-2.5 text-slate-700 align-middle text-center border-r border-slate-100">
        <div className="space-y-1 text-xs text-center flex flex-col items-center justify-center">
          <div>
            <Badge
              variant="outline"
              size="sm"
              className={`inline-block h-auto gap-0 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-3xs ${
                encroachmentStatus === 'fully encroached'
                  ? 'bg-[#f7eaeb] text-[#a40036] border-[#f2b8c6]'
                  : encroachmentStatus === 'partially encroached'
                  ? 'bg-[#fffbeb] text-[#97482d] border-[#fde68a]'
                  : encroachmentStatus === 'clean'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {row.encroachmentStatus && row.encroachmentStatus !== '-' ? row.encroachmentStatus : '-'}
            </Badge>
          </div>
        </div>
      </td>

      {/* 11. Valuation */}
      <td className="py-2 px-2.5 align-middle text-center border-r border-slate-100">
        <div className="space-y-0.5 text-xs text-center">
          <p className="font-bold text-[#1E3A8A] text-xs">
            {row.capitalValue && row.capitalValue !== '-'
              ? `₹ ${Number(row.capitalValue).toLocaleString('en-IN')}`
              : '₹ 0'}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold">
            {t('Revenue')}{': '}
            <span className="text-slate-700">
              {`₹ ${row.annualRevenue && row.annualRevenue !== '-' ? Number(row.annualRevenue).toLocaleString('en-IN') : '0'}`}
            </span>
          </p>
        </div>
      </td>
    </>
  );
}
