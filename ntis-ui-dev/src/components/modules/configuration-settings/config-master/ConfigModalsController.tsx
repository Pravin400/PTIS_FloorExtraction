'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import AddCategoryModal from './AddCategoryModal';
import AddConfigKeyModal from './AddConfigKeyModal';
import { AddConfigValueModal } from './AddConfigValueModal';
import DepartmentConfigModal from './DepartmentConfigModal';
import type { ConfigCategory, ConfigItem, DepartmentApiResponse } from '@/types/configMaster.types';

interface ConfigModalsControllerProps {
  categories: ConfigCategory[];
  items: ConfigItem[];
  departmentData: DepartmentApiResponse[] | null;
  serverAction?: string;
  serverEditCategory?: string;
  serverEditKey?: string;
  serverConfigKeyId?: string;
}

export function ConfigModalsController({
  categories,
  items,
  departmentData,
  serverAction,
  serverEditCategory,
  serverEditKey,
  serverConfigKeyId,
}: ConfigModalsControllerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Use server props for initial render to follow "Full SSR", fallback to client searchParams
  const action = serverAction || searchParams.get('action');
  const editCategory = serverEditCategory || searchParams.get('editCategory');
  const editKey = serverEditKey || searchParams.get('editKey');
  const configKeyIdStr = serverConfigKeyId || searchParams.get('configKeyId');

  const closeModals = () => {
    const params = new URLSearchParams(searchParams.toString());
    const originalString = params.toString();
    
    params.delete('action');
    params.delete('editCategory');
    params.delete('editKey');
    params.delete('configKeyId');
    
    const newQueryString = params.toString();
    if (newQueryString !== originalString) {
      router.push(newQueryString ? `${pathname}?${newQueryString}` : pathname, { scroll: false });
    }
  };

  const isAddCategoryOpen = action === 'addCategory' || !!editCategory;
  const isAddKeyOpen = action === 'addConfigKey' || !!editKey;
  const isAddValueOpen = action === 'addValue';
  const isDeptModalOpen = !!configKeyIdStr;

  const activeCategoryForEdit = editCategory
    ? categories.find((c) => c.id === editCategory)
    : undefined;

  const activeKeyForEdit = editKey ? items.find((i) => i.id === editKey) : undefined;

  const configKeyItem = configKeyIdStr
    ? items.find((i) => i.configKeyId.toString() === configKeyIdStr)
    : undefined;

  const currentCategoryId = searchParams.get('categoryId') || categories[0]?.id || '0';
  const parsedCategoryId = parseInt(currentCategoryId, 10);
  const selectedCategoryId = Number.isFinite(parsedCategoryId) && parsedCategoryId > 0
    ? parsedCategoryId
    : undefined;

  return (
    <>
      <AddCategoryModal
        key={activeCategoryForEdit?.id ?? 'new-category'}
        isOpen={isAddCategoryOpen}
        onClose={closeModals}
        onSuccess={closeModals}
        categories={categories}
        initialData={activeCategoryForEdit}
      />
      <AddConfigKeyModal
        isOpen={isAddKeyOpen}
        onClose={closeModals}
        onSuccess={closeModals}
        categories={categories}
        categoryId={selectedCategoryId}
        initialData={activeKeyForEdit}
      />
      <AddConfigValueModal
        isOpen={isAddValueOpen}
        onClose={closeModals}
        onSuccess={closeModals}
        categories={categories}
        configItems={items}
      />
      {configKeyItem && (
        <DepartmentConfigModal
          isOpen={isDeptModalOpen}
          onClose={closeModals}
          onSuccess={closeModals}
          configKeyId={configKeyItem.configKeyId}
          configKeyName={configKeyItem.name}
          configKeyDescription={configKeyItem.description}
          dataType={configKeyItem.dataType}
          controlType={configKeyItem.controlType}
          options={configKeyItem.options}
          defaultValue={configKeyItem.defaultValue}
          initialData={departmentData}
        />
      )}
    </>
  );
}