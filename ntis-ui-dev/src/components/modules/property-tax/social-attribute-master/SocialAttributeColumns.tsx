import type { Column } from '@/components/common/MasterTable';
import type { SocialAttribute } from '@/types/social-attribute.types';
import { Badge } from '@/components/common';
import { getDataTypeBadgeVariant } from './utils';

export interface TableRowItem extends SocialAttribute {
  isChild: boolean;
  parentCode?: string;
}

/**
 * Returns the table column configuration for Social Attribute Master.
 */
export function getSocialAttributeColumns(
  t: (key: string, values?: Record<string, string>) => string
): Column<TableRowItem>[] {
  return [
    {
      key: 'socialAttributeCode',
      label: t('list.table.socialAttributeCode'),
      width: '30%',
      render: (_, row) => {
        if (row.isChild) {
          return (
            <div className="flex items-center gap-1.5 pl-6 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-2.5 -top-3.5 bottom-2 w-[1.5px] bg-blue-200" />
              {/* Horizontal tick line */}
              <div className="absolute left-2.5 bottom-2 w-1.5 h-[1.5px] bg-blue-200" />
              <span className="text-blue-500 font-bold text-xs select-none">
                {t('list.subAttributeIndicator')}
              </span>
              <span className="text-slate-600 font-medium text-xs md:text-sm">
                {row.socialAttributeCode}
              </span>
            </div>
          );
        }
        return (
          <span className="font-semibold text-slate-900 text-xs md:text-sm">
            {row.socialAttributeCode}
          </span>
        );
      },
    },
    {
      key: 'socialAttributeName',
      label: t('list.table.socialAttributeName'),
      width: '35%',
      render: (_, row) => {
        const discountBadge = row.isDiscountApplicable && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
            {t('list.discount')}
          </span>
        );

        if (row.isChild) {
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-800 font-semibold text-xs md:text-sm">
                  {row.socialAttributeName}
                </span>
                {discountBadge}
              </div>
              <span className="text-xs text-slate-600 font-normal">
                {row.isRequiredWhenParentTrue
                  ? t('list.parentInfoWithRequired', { code: row.parentCode || '' })
                  : t('list.parentInfo', { code: row.parentCode || '' })}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-800 font-semibold text-xs md:text-sm">
              {row.socialAttributeName}
            </span>
            {discountBadge}
          </div>
        );
      },
    },
    {
      key: 'dataType',
      label: t('list.table.dataType'),
      width: '15%',
      render: (_, row) => (
        <Badge variant={getDataTypeBadgeVariant(row.dataType)} size="sm">
          {row.dataType}
        </Badge>
      ),
    },
    {
      key: 'unit',
      label: t('list.table.unit'),
      width: '10%',
      render: (_, row) => {
        if (!row.unit) return <span className="text-slate-400">-</span>;
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {row.unit}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: t('list.table.status'),
      width: '10%',
      isStatus: true,
    },
  ];
}
