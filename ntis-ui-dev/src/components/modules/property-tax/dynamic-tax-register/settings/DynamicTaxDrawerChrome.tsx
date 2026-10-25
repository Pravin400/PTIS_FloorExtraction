import { useTranslations } from 'next-intl';
import { Badge, CancelButton, SaveButton } from '@/components/common';
import { DynamicTaxRegisterRow, RuleCategory } from '@/types/dynamic-tax-register.types';

export interface DynamicTaxDrawerTitleProps {
  isNew: boolean;
  taxName: string;
  taxRow: DynamicTaxRegisterRow | null;
  taxCode: string;
  ruleLabel: string;
}

export function DynamicTaxDrawerTitle({
  isNew,
  taxName,
  taxRow,
  taxCode,
  ruleLabel,
}: DynamicTaxDrawerTitleProps) {
  const t = useTranslations('dynamicTaxRegister');
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-tight">
        {isNew ? taxName || t('drawer.newTax') : taxRow?.taxName ?? t('drawer.taxSettings')}
      </h2>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-800 text-slate-100 uppercase tracking-widest">
          {taxCode || '—'}
        </span>
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-300 font-bold text-[10px] px-2.5 py-0.5 rounded-md">
          {ruleLabel}
        </Badge>
      </div>
    </div>
  );
}

export interface DynamicTaxDrawerFooterProps {
  isNew: boolean;
  savingSettings: boolean;
  handleClose: () => void;
  rawClose?: () => void;
  handleSaveSettings: () => Promise<{ ok: boolean; newTaxId?: number }>;
  selectedCategory: RuleCategory;
  routeBase: string;
  numericId: number;
  startTransition: (fn: () => void) => void;
  router: { push: (href: string) => void };
  rawRouter?: { push: (href: string) => void };
}

export function DynamicTaxDrawerFooter({
  isNew,
  savingSettings,
  handleClose,
  rawClose,
  handleSaveSettings,
  selectedCategory,
  routeBase,
  startTransition,
  router,
  rawRouter,
}: DynamicTaxDrawerFooterProps) {
  const t = useTranslations('dynamicTaxRegister');
  const closeFn = rawClose ?? handleClose;
  const navRouter = rawRouter ?? router;

  return (
    <div className="w-full flex items-center justify-between">
      <span className="text-[11px] text-slate-400 font-medium">
        {isNew ? t('drawer.savingHint') : t('drawer.saveSettingsHint')}
      </span>
      <div className="flex items-center gap-3">
        <CancelButton size="sm" onClick={handleClose} className="!border-slate-300 !text-slate-700 font-bold" />
        <SaveButton
          label={t('drawer.saveSettings')}
          size="sm"
          disabled={savingSettings}
          onClick={async () => {
            const result = await handleSaveSettings();
            if (!result.ok) return;
            if (isNew && result.newTaxId) {
              startTransition(() =>
                navRouter.push(
                  `${routeBase}/add/${result.newTaxId}?tab=config&category=${encodeURIComponent(selectedCategory)}`
                )
              );
            } else {
              closeFn();
            }
          }}
          className="shadow-md active:scale-95 transition-all"
        />
      </div>
    </div>
  );
}

