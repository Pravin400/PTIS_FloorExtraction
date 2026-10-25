import { useTranslations } from 'next-intl';
import { Input,SearchSelect, ApplyButton, Tabs, TabList, Tab } from '@/components/common';
import { clampPercentInput } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface ValueHeaderExtraProps {
  valBaseType: 'RV' | 'ALV';
  setValBaseType: (v: 'RV' | 'ALV') => void;
  valYearId: number;
  yearSelectOptions: { label: string; value: string }[];
  onValYearChange: (v: string) => void;
  valUserGroup: string;
  userGroupOptions: { label: string; value: string }[];
  onValGroupChange: (v: string) => void;
  valBulk: string;
  setValBulk: (v: string) => void;
  valBusy: boolean;
  handleValBulkApply: () => void;
}

/** Value tab's toolbar: Base Type toggle, Assessment Year, User Group, and Bulk % apply. */
export function ValueHeaderExtra({
  valBaseType, setValBaseType, valYearId, yearSelectOptions, onValYearChange,
  valUserGroup, userGroupOptions, onValGroupChange, valBulk, setValBulk, valBusy, handleValBulkApply,
}: ValueHeaderExtraProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentYearRangeLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.yearRangeSuffix')}`;
  return (
    <div className="bg-white border-b border-slate-200 px-5 py-3.5">
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('value.baseType')}</span>
          <Tabs
            value={valBaseType}
            onChange={(v) => setValBaseType(v as 'RV' | 'ALV')}
            variant="pills"
            size="sm"
            activeTabClassName="!bg-blue-600 !text-white shadow-none"
          >
            <TabList className="!bg-white !p-0 rounded-lg overflow-hidden border border-slate-200 h-8 w-fit">
              <Tab
                value="RV"
                className="px-3 !font-extrabold data-[state=inactive]:hover:!bg-slate-50 data-[state=inactive]:hover:!text-slate-700"
              >
                RV
              </Tab>
              <Tab
                value="ALV"
                className="px-3 border-l border-slate-200 !font-extrabold data-[state=inactive]:hover:!bg-slate-50 data-[state=inactive]:hover:!text-slate-700"
              >
                ALV
              </Tab>
            </TabList>
          </Tabs>
          {/* Save Configuration below applies this toggle to EVERY row of this tax + year, not
              just the rows visible on the current page — easy to miss since the toggle sits next
              to a page-scoped grid. */}
          <span className="text-[10px] text-amber-600 font-medium max-w-[220px] leading-tight">
            {t('value.baseTypeScopeHint')}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{assessmentYearRangeLabel}</span>
          <SearchSelect value={String(valYearId)} onChange={(_, v) => onValYearChange(v)} options={yearSelectOptions} />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('value.userGroup')}</span>
          <SearchSelect
            value={valUserGroup}
            onChange={(_, v) => onValGroupChange(v)}
            options={[{ label: t('value.allTypes'), value: 'all' }, ...userGroupOptions]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('value.bulkTaxPercent')}</span>
          <div className="flex items-center gap-1.5 h-9">
            <Input
              type="number"
              min="0"
              value={valBulk}
              onChange={(e) => setValBulk(clampPercentInput(e.target.value, 999))}
              placeholder={t('value.bulkTaxPlaceholder')}
              className="h-9 text-sm text-center font-bold w-16"
            />
            <span className="text-slate-400 font-bold text-sm">%</span>
          </div>
        </div>

        <ApplyButton
          label={t('value.bulkApply')}
          size="sm"
          disabled={valBusy}
          onClick={handleValBulkApply}
          className="self-end active:scale-95 transition-all"
        />
      </div>
    </div>
  );
}
