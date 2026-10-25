import { Settings, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card';
import { ConfigurationCards } from './ConfigurationCards';
import { ConfigurationList } from './ConfigurationList';
import { ConfigSearchBar } from './ConfigSearchBar';
import type { ConfigCategory, ConfigItem } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';

interface ConfigurationMasterContentProps {
  categories: ConfigCategory[];
  activeCategoryId: string;
  activeCategory: ConfigCategory;
  displayItems: ConfigItem[];
  search?: string;
  locale: string;
  noSearchResultsLabel: string;
  noItemsFoundLabel: string;
  searchTipLabel: string;
  fetchError?: string;
}

export function ConfigurationMasterContent({
  categories,
  activeCategoryId,
  activeCategory,
  displayItems,
  search,
  locale,
  noSearchResultsLabel,
  noItemsFoundLabel,
  searchTipLabel,
  fetchError,
}: ConfigurationMasterContentProps) {
  const tCommon = useTranslations('common');

  return (
    <div className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 overflow-x-hidden">
      <div className="max-w-500 mx-auto space-y-3.5">
        {fetchError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">
                {tCommon('errors.fetchFailed')}
              </h3>
              <p className="text-xs text-red-700 mt-1 font-mono">{fetchError}</p>
            </div>
          </div>
        )}

        <section className="space-y-2.5">
          <ConfigurationCards
            categories={categories}
            activeCategoryId={activeCategoryId}
            search={search}
          />
          <div className="w-full">
            <ConfigSearchBar />
          </div>
        </section>

        <main className="min-h-150">
          <Card padding="none" className="p-2 sm:p-3 border-0 shadow-sm bg-white overflow-visible">
            <CardContent className="p-0 sm:p-1 overflow-visible">
              {displayItems.length > 0 ? (
                <ConfigurationList
                  items={displayItems}
                  activeCategory={activeCategory}
                  searchTerm={search}
                  locale={locale}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-semibold">
                    {search ? noSearchResultsLabel : noItemsFoundLabel}
                  </p>
                  {search && <p className="text-xs mt-2 opacity-60">{searchTipLabel}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
