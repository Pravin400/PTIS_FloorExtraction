import { useTranslations } from 'next-intl';
import { SearchInput, Select, PrevPageButton, NextPageButton } from '@/components/common';
import { WardItem } from '@/types/wardMaster.types';
import { WardListItem } from './WardListItem';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface ViewWardsProps {
  wards: WardItem[];
  checkedWards: Set<string>;
  onToggleWard: (wardNo: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  totalPages: number;
  pageSizeOptions: Array<{ label: string; value: string }>;
  getZoneLabel: (zoneId: number | undefined | null) => string | null;
  isWardAssigned: (ward: WardItem) => boolean;
  onSelectAllChange?: (isChecked: boolean) => void;
  isSelectAllActive?: boolean;
  selectAllLoading?: boolean;
  totalCount?: number;
}

export function ViewWards({
  wards,
  checkedWards,
  onToggleWard,
  searchTerm,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalPages,
  pageSizeOptions,
  onSelectAllChange,
  isSelectAllActive = false,
  selectAllLoading = false,
  totalCount = 0,
}: ViewWardsProps) {
  const t = useTranslations('zoneMaster');
  const wardAlias = useAliasLabel('Ward', t('defaults.ward'));
  const wardsAlias = useAliasLabel('Wards', t('defaults.wards'));

  const handleSelectAllChange = () => {
    if (onSelectAllChange) {
      onSelectAllChange(!isSelectAllActive);
    }
  };

  return (
    <>
      <div className="px-4 py-2 bg-white/40 border-b border-blue-100/50">
        <SearchInput
          className="w-full rounded-sm border-gray-300 mb-0"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('wardList.searchPlaceholder', { ward: wardAlias })}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {onSelectAllChange && (
          <label
            className={`flex items-center gap-3 px-4 py-1 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg cursor-pointer transition-all duration-200 border border-blue-100/50 hover:border-blue-300/50 hover:shadow-md group ${selectAllLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelectAllActive}
              onChange={handleSelectAllChange}
              disabled={selectAllLoading}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors flex items-center gap-2 flex-1">
              {selectAllLoading ? t('wardList.loadingAll', { wards: wardsAlias }) : t('wardList.selectAll')}
              {isSelectAllActive && totalCount > 0 && (
                <span className="text-xs text-blue-500">({totalCount})</span>
              )}
            </span>
          </label>
        )}
        {wards.map((ward) => (
            <WardListItem
              key={ward.wardNo}
              wardNo={ward.wardNo}
              description={ward.description ?? undefined}
              checked={checkedWards.has(ward.wardNo)}
              onToggle={() => onToggleWard(ward.wardNo)}
              colorScheme="blue"
              disabled={isSelectAllActive}
            />
        ))}
        {wards.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            {t('wardList.noWardsFound', { wards: wardsAlias })}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center px-4 py-2 bg-white/40 border-t border-blue-100/50">
        <div className="flex items-center gap-2">
          <Select
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
            {page} / {totalPages || 1}
          </span>
          <NextPageButton
            onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
            disabled={page >= (totalPages || 1)}
            aria-label={t('pagination.next')}
          />
        </div>
      </div>
    </>
  );
}
