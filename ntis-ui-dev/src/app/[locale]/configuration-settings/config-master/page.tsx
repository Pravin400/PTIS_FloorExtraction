import { ConfigurationMaster } from '@/components/modules/configuration-settings/config-master/ConfigurationMaster';
import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import { getDepartmentConfigurationAction } from '@/app/[locale]/configuration-settings/config-master/actions';
import type { ConfigCategory, ConfigItem, DepartmentApiResponse } from '@/types/configMaster.types';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Configuration Master | NTIS',
  description: 'Configure global and department-specific security settings',
};

export default async function ConfigMasterPage({
  params: _params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await _params;
  const rawSearchParams = await searchParams;

  // Safely extract search params on the server for Full SSR support
  const configKeyId =
    typeof rawSearchParams.configKeyId === 'string' ? rawSearchParams.configKeyId : undefined;
  const categoryId =
    typeof rawSearchParams.categoryId === 'string' ? rawSearchParams.categoryId : undefined;
  const search = typeof rawSearchParams.search === 'string' ? rawSearchParams.search : undefined;
  const action = typeof rawSearchParams.action === 'string' ? rawSearchParams.action : undefined;
  const editCategory =
    typeof rawSearchParams.editCategory === 'string' ? rawSearchParams.editCategory : undefined;
  const editKey = typeof rawSearchParams.editKey === 'string' ? rawSearchParams.editKey : undefined;

  let fetchError: string | undefined;
  let statusCode: number | undefined;

  let categories: ConfigCategory[] = [];
  let items: ConfigItem[] = [];
  let departmentData: DepartmentApiResponse[] | null = null;

  try {
    const categoriesRes = await configMasterService.getAllCategories();
    if (!categoriesRes.success) {
      fetchError = categoriesRes.error;
    } else {
      categories = (categoriesRes.data || []).filter(c => c.isActive);
    }

    const activeCategoryId = categoryId || categories[0]?.id || 'all';
    const isGlobalSearch = !!search && search.length >= 2;
    const itemsCategoryToFetch = isGlobalSearch ? 'all' : activeCategoryId;

    const parsedConfigKeyId =
      configKeyId && !isNaN(parseInt(configKeyId)) ? parseInt(configKeyId) : null;
    const shouldLoadDepartmentData = parsedConfigKeyId !== null;

    const [itemsRes, departmentDataRes] = await Promise.all([
      configMasterService.getItemsByCategory(itemsCategoryToFetch),
      shouldLoadDepartmentData
        ? getDepartmentConfigurationAction(parsedConfigKeyId)
        : Promise.resolve(null),
    ]);

    if (!itemsRes.success) {
      fetchError = fetchError || itemsRes.error;
    } else {
      items = itemsRes.data || [];
    }

    if (shouldLoadDepartmentData) {
      if (departmentDataRes?.success) {
        departmentData = departmentDataRes.data || null;
      } else {
        fetchError = fetchError || departmentDataRes?.error;
      }
    }
  } catch (error) {
    const { ApiError } = await import('@/lib/utils/api');
    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      if (error.statusCode === 401) {
        redirect(`/${locale}/login`);
      }
      fetchError = error.responseText || error.message;
    } else {
      fetchError = error instanceof Error ? error.message : String(error);
    }
  }

  const activeCategoryId = categoryId || categories[0]?.id || 'all';

  return (
    <ConfigurationMaster
      categories={categories}
      initialItems={items}
      departmentData={departmentData}
      categoryId={activeCategoryId}
      search={search}
      action={action}
      editCategory={editCategory}
      editKey={editKey}
      configKeyId={configKeyId}
      locale={locale}
      fetchError={fetchError}
      statusCode={statusCode}
    />
  );
}
