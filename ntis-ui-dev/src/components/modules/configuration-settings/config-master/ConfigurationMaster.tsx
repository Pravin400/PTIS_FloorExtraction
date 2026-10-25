'use client';

import { ConfigModalsController } from './ConfigModalsController';
import { useTranslations } from 'next-intl';
import { ConfigItem, ConfigCategory } from '@/types/configMaster.types';
import type { DepartmentApiResponse } from '@/types/configMaster.types';
import { ConfigurationMasterHeader } from './ConfigurationMasterHeader';
import { ConfigurationMasterContent } from './ConfigurationMasterContent';
import { AlertCircle } from 'lucide-react';

export function ConfigurationMaster({
  categories,
  initialItems,
  departmentData,
  categoryId,
  search,
  action,
  editCategory,
  editKey,
  configKeyId,
  locale,
  fetchError,
  statusCode,
}: {
  categories: ConfigCategory[];
  initialItems: ConfigItem[];
  departmentData: DepartmentApiResponse[] | null;
  categoryId?: string;
  search?: string;
  action?: string;
  editCategory?: string;
  editKey?: string;
  configKeyId?: string;
  locale: string;
  fetchError?: string;
  statusCode?: number;
}) {
  const t = useTranslations('configMaster');
  const tCommon = useTranslations('common');

  const isUnauthorized =
    statusCode === 401 ||
    (fetchError &&
      (fetchError.toLowerCase().includes('unauthorized') ||
        fetchError.toLowerCase().includes('token') ||
        fetchError === 'messages.unauthorizedToken'));

  const activeCategoryId = categoryId || categories[0]?.id || 'all';

  if (isUnauthorized) {
    return (
      <div className="min-h-full flex flex-col bg-slate-50/50 light">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 bg-white m-6 rounded-xl border border-gray-200/80 shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-semibold text-gray-900">{tCommon('errors.unauthorized')}</h3>
        </div>
      </div>
    );
  }

  // Apply search filter locally on the server if needed (redundant if page.tsx does it, but safe)
  let displayItems = initialItems;
  if (search && search.length > 0) {
    const searchLower = search.toLowerCase();
    displayItems = displayItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(searchLower))
    );
  }

  // Ensure we have an active category even if categories list is empty
  // Provide a fully shaped fallback to satisfy ConfigCategory type and prevent runtime errors
  const fallbackCategory: ConfigCategory = {
    id: '',
    code: 'N/A',
    name: '...',
    displayOrder: 0,
    isActive: false,
    color: 'rose',
    icon: 'Shield',
    count: 0,
    total: 0,
  };

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) || categories[0] || fallbackCategory;

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50 light">
      <ConfigurationMasterHeader
        title={t('title')}
        subtitle={t('subtitle')}
        systemLevelLabel={t('systemLevel')}
        addCategoryLabel={t('addCategory')}
        addConfigKeyLabel={t('addConfigKey')}
        activeCategoryId={activeCategoryId}
        search={search}
      />

      <ConfigurationMasterContent
        categories={categories}
        activeCategoryId={activeCategoryId}
        activeCategory={activeCategory}
        displayItems={displayItems}
        search={search}
        locale={locale}
        noSearchResultsLabel={t('noSearchResults', { search: search || '' })}
        noItemsFoundLabel={t('noItemsFound', { category: activeCategory.name })}
        searchTipLabel={t('searchTip') || 'Try adjusting your search terms or category filter.'}
        fetchError={fetchError}
      />

      <ConfigModalsController
        categories={categories}
        items={displayItems}
        departmentData={departmentData as DepartmentApiResponse[] | null}
        serverAction={action}
        serverEditCategory={editCategory}
        serverEditKey={editKey}
        serverConfigKeyId={configKeyId}
      />
      <style dangerouslySetInnerHTML={{ __html: LIGHT_MODE_OVERRIDES }} />
    </div>
  );
}

const LIGHT_MODE_OVERRIDES = `
  .light .dark\\:text-slate-500 { color: #94a3b8 !important; }
  .light .dark\\:text-gray-200 { color: #374151 !important; }
  .light .dark\\:border-slate-700\\/30 { border-color: rgba(226, 232, 240, 0.6) !important; }
  .light .dark\\:bg-slate-800\\/20 { background-color: rgba(248, 250, 252, 0.5) !important; }
  .light .dark\\:bg-blue-900\\/10 { background-color: rgba(239, 246, 255, 0.3) !important; }
  .light .dark\\:bg-slate-800\\/50 { background-color: rgba(241, 245, 249, 0.5) !important; }
  .light .dark\\:border-slate-700 { border-color: rgb(226, 232, 240) !important; }
  .light .dark\\:bg-emerald-900\\/20 { background-color: rgb(240, 253, 244) !important; }
  .light .dark\\:text-emerald-400 { color: rgb(5, 150, 105) !important; }
  .light .dark\\:border-emerald-900\\/30 { border-color: rgb(220, 252, 231) !important; }
  .light .dark\\:bg-slate-700 { background-color: rgb(226, 232, 240) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:border-slate-600 { border-color: rgb(203, 213, 225) !important; }
  .light .dark\\:text-white { color: rgb(15, 23, 42) !important; }
  .light .dark\\:text-slate-300 { color: rgb(51, 65, 85) !important; }
  .light .dark\\:text-slate-400 { color: rgb(100, 116, 139) !important; }
  .light .dark\\:text-slate-500 { color: rgb(148, 163, 184) !important; }
`;
