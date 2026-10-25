import { useTranslations } from 'next-intl';
import { SearchInput, Select, PrevPageButton, NextPageButton } from '@/components/common';
import { WardItem } from '@/types/wardMaster.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface ZoneWardsProps {
  wards: WardItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  totalPages: number;
  pageSizeOptions: Array<{ label: string; value: string }>;
  selectedWardCount?: number;
}

export function ZoneWards({
  wards,
  searchTerm,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalPages,
  pageSizeOptions,
}: ZoneWardsProps) {
  const t = useTranslations('zoneMaster');
  const wardAlias = useAliasLabel('Ward', t('defaults.ward'));
  const wardsAlias = useAliasLabel('Wards', t('defaults.wards'));

  return (
    <>
      <div className="px-4 py-2 bg-white/40 border-b border-purple-100/50">
        <SearchInput
          className="w-full rounded-sm border-gray-300 mb-0"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('wardList.searchPlaceholder', { ward: wardAlias })}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {wards.map((ward) => (
          <div
            key={ward.wardNo}
            className="flex items-center gap-3 px-4 py-1 bg-white/60 backdrop-blur-sm rounded-lg transition-all duration-200 border border-purple-100/50 hover:border-purple-300/50 hover:shadow-md group"
          >
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors flex items-center gap-2 flex-1">
              {ward.wardNo}
            </span>
          </div>
        ))}
        {wards.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {t('wardList.noWardsFound', { wards: wardsAlias })}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center px-4 py-2 bg-white/40 border-t border-purple-100/50">
        <div className="flex items-center gap-2">
          <Select
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(e) => {
              // Only call onPageSizeChange - it already handles resetting page to 1
              onPageSizeChange(Number(e.target.value));
            }}
            selectSize="sm"
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-1">
          <PrevPageButton
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label={t('pagination.previous')}
          />
          <span className="text-xs text-gray-600">
            {page} / {totalPages}
          </span>
          <NextPageButton
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label={t('pagination.next')}
          />
        </div>
      </div>
    </>
  );
}
