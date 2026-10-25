import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { PropertySubGridProperty } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';

export const getPropertyDashboardHeaderRows = (t: (key: string) => string): HeaderCell[][] => {
  const commonHeaderClass = 'p-2 font-bold text-slate-900 border !border-slate-400';
  const centerHeaderClass = `${commonHeaderClass} text-center`;
  const defaultHeaderClass = `${centerHeaderClass} bg-slate-50`;

  return [
    [
      {
        label: t('columns.srNo'),
        rowSpan: 2,
        headerClassName: `${defaultHeaderClass} w-8 text-[13px]`
      },
      {
        label: (
          <>
            {t('columns.propertyDetails')}
            <div className="text-[10px] font-bold text-slate-900 normal-case mt-0.5">
              {t('columns.newOldPropertyNo')}
              <br />
              {t('columns.oldWardNoConstructionYear')}
            </div>
          </>
        ),
        rowSpan: 2,
        headerClassName: `${commonHeaderClass} text-left bg-slate-50 w-[190px] min-w-[190px]`
      },
      {
        label: t('columns.categoryAndDesc'),
        rowSpan: 2,
        headerClassName: `${defaultHeaderClass} w-[200px] min-w-[200px] max-w-[200px]`
      },
      {
        label: t('columns.ownerAndOccupier'),
        rowSpan: 2,
        headerClassName: `${defaultHeaderClass} whitespace-normal break-words w-[270px] min-w-[270px]`
      },
      {
        label: t('columns.mobile'),
        rowSpan: 2,
        headerClassName: `${defaultHeaderClass} w-[90px]`
      },
      {
        label: t('columns.address'),
        rowSpan: 2,
        headerClassName: `${defaultHeaderClass} whitespace-normal break-words w-[250px] min-w-[250px]`
      },
      {
        label: t('columns.propertyDetailsNewVsOld'),
        colSpan: 2,
        align: 'center',
        headerClassName: `${centerHeaderClass} bg-amber-100`
      },
      {
        label: (
          <div className="whitespace-pre-line">
            {t('columns.additionalRevenue')}
          </div>
        ),
        rowSpan: 2,
        headerClassName: `${centerHeaderClass} bg-emerald-100 w-[90px]`
      },
      {
        label: (
          <div className="whitespace-pre-line">
            {t('columns.propertyType')}
          </div>
        ),
        rowSpan: 2,
        headerClassName: `${centerHeaderClass} bg-purple-100 w-[80px]`
      },
      {
        label: (
          <>
            {t('columns.documents')}<br /><span className="text-[10px] font-bold normal-case">{t('columns.image')}</span>
          </>
        ),
        rowSpan: 2,
        headerClassName: `${centerHeaderClass} bg-blue-100 w-[90px]`
      },
      {
        label: t('columns.actions'),
        rowSpan: 2,
        align: 'center',
        headerClassName: `${defaultHeaderClass} w-[60px]`
      }
    ],
    [
      {
        label: t('columns.oldRecord'),
        align: 'center',
        headerClassName: `${centerHeaderClass} bg-red-50 w-[130px] min-w-[130px] max-w-[130px]`
      },
      {
        label: t('columns.newRecord'),
        align: 'center',
        headerClassName: `${centerHeaderClass} bg-emerald-50 w-[130px] min-w-[130px] max-w-[130px]`
      }
    ]
  ];
};

const formatTitleCase = (text: string | null | undefined): string => {
  if (!text || text === '-') return '-';
   return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

export const getPropertyDashboardColumns = (
  t: (key: string) => string,
  onImageClick?: (row: PropertySubGridProperty) => void,
  pageNumber: number = 1,
  pageSize: number = 10
): Column<PropertySubGridProperty>[] => {
  const commonCellClass = 'border !border-slate-400';
  return [
    {
      key: 'propertyId',
      label: t('columns.srNo'),
      cellClassName: `${commonCellClass} w-12`,
      render: (_val, _row, index) => (
        <div className="flex items-center justify-center text-xs font-normal text-slate-700 px-1 text-[13px]">
          <span>{(pageNumber - 1) * pageSize + index + 1}</span>
        </div>
      )
    },
    {
      key: 'propertyNo',
      label: t('columns.propertyDetails'),
      cellClassName: commonCellClass,
      render: (_, row) => {
        let wingsList: string[] = [];
        if (row.wingName) {
          wingsList = row.wingName.split(',').map(w => w.trim()).filter(Boolean);
        }

        return (
          <div className="flex flex-col text-[11px] leading-tight">
            <div className="font-normal text-slate-800">{row.propertyNo || '-'} <span className="text-slate-500 font-normal">{'| -'}</span></div>
            <div className="mt-1 text-xs text-indigo-600 font-normal">{'-'} <span className="text-xs text-indigo-600 font-normal">{'| -'}</span></div>
            {wingsList.length > 0 && (
              <div className="mt-2">
                <div className="text-[9px] font-normal text-indigo-700 tracking-wider uppercase mb-1">{t('labels.wings')}</div>
                <div className="flex flex-wrap gap-1">
                  {wingsList.map((wingText, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 border border-indigo-200 bg-white rounded text-indigo-700 font-normal text-[10px] shadow-sm">
                      {wingText}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'category',
      label: t('columns.categoryAndDesc'),
      cellClassName: `${commonCellClass} w-[160px] min-w-[160px] max-w-[160px] whitespace-normal break-words`,
      render: (_, row) => (
        <div className="flex flex-col text-[11px] leading-tight gap-0.5">
          <div className="inline-flex items-center font-semibold justify-center rounded-md px-2 py-0.5 w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-primary/90 bg-gray-100 text-blue-700 border-0 text-xs">
            {row.category || '-'}
          </div>
          <div className="text-gray-800 text-xs break-words">{row.propertyDescription || '-'}</div>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {row.floorCount != null && row.floorCount !== '' && (
              <div className="inline-flex items-center justify-center rounded-md border w-fit shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-normal px-1.5 py-0 h-4 whitespace-nowrap">
                {t('labels.floors')}: {row.floorCount}
              </div>
            )}
            {row.propertyDetailsCount > 0 && (
              <div className="inline-flex items-center justify-center rounded-md border w-fit shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden bg-green-50 text-green-700 border-green-100 text-[10px] font-normal px-1.5 py-0 h-4 whitespace-nowrap">
                {t('labels.units')}: {row.propertyDetailsCount}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'ownerName',
      label: t('columns.ownerAndOccupier'),
      cellClassName: commonCellClass,
      render: (_, row) => (
        <div className="flex flex-col text-xs leading-tight gap-1">
          <div><span className="font-bold text-gray-700">{t('labels.owner')}</span> <span className="font-normal text-gray-800">{formatTitleCase(row.ownerName)}</span></div>
          <div><span className="font-bold text-gray-700">{t('labels.occupier')}</span> <span className="font-normal text-gray-800">{formatTitleCase(row.occupierName)}</span></div>
          {row.flatOrShopName && row.flatOrShopName !== '.' && (
            <div><span className="font-bold text-purple-700 text-[11px]">{t('labels.shopName')}</span> <span className="font-normal text-purple-600 text-[11px]">{formatTitleCase(row.flatOrShopName)}</span></div>
          )}
        </div>
      )
    },
    {
      key: 'mobileNo',
      label: t('columns.mobile'),
      align: 'center',
      cellClassName: commonCellClass,
      render: (val) => <div className="text-xs font-normal text-gray-800">{val as string || '-'}</div>
    },
    {
      key: 'address',
      label: t('columns.address'),
      cellClassName: commonCellClass,
      render: (val) => <div className="text-[13px] font-normal text-black leading-tight">{formatTitleCase(val as string)}</div>
    },
    {
      key: 'oldRecord',
      label: t('columns.oldRecord'),
      cellClassName: `${commonCellClass} bg-red-50 w-[130px] min-w-[130px] max-w-[130px] `,
      render: (_, row) => {
        const r = row.propertyDetailsComparison?.oldRecord;
        return (
          <div className="space-y-1 text-xs leading-tight">
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-normal">{t('labels.area')}</span>
              <span className="font-normal text-slate-800">{r?.area ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-normal">{t('labels.use')}</span>
              <span className="font-normal text-slate-800">{r?.use ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-normal">{t('labels.rv')}</span>
              <span className="font-normal text-slate-800">{r?.rv ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-normal">{t('labels.cTax')}</span>
              <span className="font-normal text-slate-800">{r?.cValue ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-normal">{t('labels.rTax')}</span>
              <span className="font-normal text-slate-800">{r?.rTax ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between items-center gap-1 pt-1 mt-1 border-t border-red-200 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-slate-700 font-normal shrink-0">{t('labels.totalTax')}</span>
              <span className="font-normal text-slate-800 truncate">{r?.totalTax ?? t('labels.na')}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'newRecord',
      label: t('columns.newRecord'),
      cellClassName: `${commonCellClass} bg-emerald-50 w-[130px] min-w-[130px] max-w-[130px]`,
      render: (_, row) => {
        const r = row.propertyDetailsComparison?.newRecord;
        return (
          <div className="space-y-1 text-xs leading-tight">
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-semibold">{t('labels.area')}</span>
              <span className="font-semibold text-slate-800">{r?.area ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-semibold">{t('labels.use')}</span>
              <span className="font-semibold text-slate-800">{r?.use ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-semibold">{t('labels.rv')}</span>
              <span className="font-semibold text-slate-800">{r?.rv ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-semibold">{t('labels.cTax')}</span>
              <span className="font-semibold text-slate-800">{r?.cValue ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span className="text-slate-600 font-semibold">{t('labels.rTax')}</span>
              <span className="font-semibold text-slate-800">{r?.rTax ?? t('labels.na')}</span>
            </div>
            <div className="flex justify-between items-center gap-1 pt-1 mt-1 border-t border-emerald-200 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-slate-700 font-semibold shrink-0">{t('labels.totalTax')}</span>
              <span className="font-semibold text-slate-800 truncate">{r?.totalTax ?? t('labels.na')}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'additionalRevenue', // Changed from propertyId to prevent duplicate key warning
      label: t('columns.additionalRevenue'),
      align: 'center',
      cellClassName: `${commonCellClass} bg-emerald-50/50`,
      render: () => <div className="text-[11px] font-semibold text-gray-800">0</div>
    },
    {
      key: 'assessmentStatus',
      label: t('columns.propertyType'),
      align: 'center',
      cellClassName: `${commonCellClass} bg-purple-50/50`,
      render: (_, row) => {
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span className="px-1.5 py-0.5 text-[11px] rounded-sm font-semibold border border-teal-100 text-teal-600  bg-teal-50/50 bg-purple-500 whitespace-nowrap">
              {row.assessmentStatus || '-'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'documentGuid',
      label: t('columns.documents'),
      align: 'center',
      cellClassName: commonCellClass,
      render: (_, row) => {
        const documentGuid = row.documentGuid?.trim();

        return (
          <div className="flex justify-center cursor-pointer" onClick={() => onImageClick?.(row)}>
            {documentGuid ? (
              <div className="relative w-10 h-10 bg-gray-100 border-2 border-gray-200 rounded overflow-hidden hover:border-blue-400 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getViewDocumentUrl(documentGuid)}
                  alt={t('columns.documents')}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 border-2 border-gray-200 rounded overflow-hidden flex flex-wrap gap-[1px] p-[1px] hover:border-blue-400 transition-colors">
                <div className="w-[calc(50%-1px)] h-[calc(50%-1px)] bg-gray-300"></div>
                <div className="w-[calc(50%-1px)] h-[calc(50%-1px)] bg-gray-400"></div>
                <div className="w-[calc(50%-1px)] h-[calc(50%-1px)] bg-gray-400"></div>
                <div className="w-[calc(50%-1px)] h-[calc(50%-1px)] bg-gray-300"></div>
              </div>
            )}
          </div>
        )
      }
    },
  ];
};
