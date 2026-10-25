import { Shield, Search } from 'lucide-react';
import { CategoryEditDeleteActions, CategoryBulkActions } from './ConfigCategoryActions';
import { ConfigItemRow } from './ConfigItemRow';
import {
  type ConfigItem,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ConfigCategory,
} from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/common';

export interface ConfigurationListProps {
  items: ConfigItem[];
  activeCategory: ConfigCategory;
  searchTerm?: string;
  locale: string;
}

/**
 * ConfigurationList - Displays a list of configuration items.
 * Refactored to use ConfigItemRow and standard Card component.
 */
export function ConfigurationList({
  items,
  activeCategory,
  searchTerm = '',
  locale,
}: ConfigurationListProps) {
  const t = useTranslations('configMaster');
  const colors = CATEGORY_COLORS[activeCategory.color] || CATEGORY_COLORS['rose'];
  const Icon = CATEGORY_ICONS[activeCategory.icon] || Shield;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Card
          variant="default"
          padding="none"
          className="p-4 sm:p-5 bg-slate-50/50 border-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl shadow-sm border border-white/20', colors.badge)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">{activeCategory.name}</h2>
          </div>
        </Card>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-white shadow-sm border border-slate-100">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1 tracking-tight">
            {t('noItemsFound', { category: activeCategory.name })}
          </h3>
          <p className="text-sm font-medium text-slate-500 max-w-[280px] leading-relaxed">
            {t('searchTip')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* List Header */}
      <Card
        variant="default"
        padding="none"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/50 border-slate-200/60"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-xl shadow-sm border border-white/20 transition-transform group-hover:scale-105',
              colors.badge
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-tight">
                {activeCategory.name}
              </h2>
              <CategoryEditDeleteActions
                categoryId={activeCategory.id}
                categoryName={activeCategory.name}
              />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
              {items.filter((i) => i.isEnabled).length} {t('list.configurationsActive')}
            </p>
          </div>
        </div>

        <CategoryBulkActions categoryId={activeCategory.id} categoryName={activeCategory.name} />
      </Card>

      {/* Config Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8 overflow-visible">
        {items.map((item) => (
          <ConfigItemRow key={item.id} item={item} searchTerm={searchTerm} locale={locale} />
        ))}
      </div>
    </div>
  );
}
