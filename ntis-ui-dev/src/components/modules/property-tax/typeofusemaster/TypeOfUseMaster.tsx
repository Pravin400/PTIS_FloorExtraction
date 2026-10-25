"use client";
import { PageContainer } from "@/components/common";
import { useMemo } from "react";
import { useTranslations } from 'next-intl';
import { Layers3 } from "lucide-react";
import type {
  TypeOfUseMasterPageProps,
} from "@/types/typeOfUse.types";
import type { Column } from "@/components/common/MasterTable";
import TableHeader from "@/components/common/TableHeader";
import { getSubTypeColumns, type SubTypeTableRow } from "./TypeOfUseMasterColumns";
import { useTypeOfUseMasterUrl } from "@/hooks/TypeOfUseMaster/useTypeOfUseMasterUrl";
import { useTypeOfUseMasterSelection } from "@/hooks/TypeOfUseMaster/useTypeOfUseMasterSelection";
import { useSubTypeManagement } from "@/hooks/TypeOfUseMaster/useSubTypeManagement";
import { useTypeSearch } from "@/hooks/TypeOfUseMaster/useTypeSearch";
import { useTypeOfUseMasterActions } from "@/hooks/TypeOfUseMaster/useTypeOfUseMasterActions";
import { useTypePaginationHandlers } from "@/hooks/TypeOfUseMaster/useTypePaginationHandlers";
import { GroupSection } from "./GroupSection";
import { TypeSection } from "./TypeSection";
import { SubTypeSection } from "./SubTypeSection";

import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export default function TypeOfUseMaster({
  initialData,
  typesPagination,
  subTypesPagination,
  selectedTypeId: serverSelectedTypeId,
}: TypeOfUseMasterPageProps) {
  const t = useTranslations('typeofusemaster');

  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  // Destructure pagination props for cleaner usage
  const {
    paginatedTypes,
    totalCount: typesTotalCount,
    totalPages: typesTotalPages,
    pageNumber: typePageNumber,
    pageSize: typePageSize,
    searchFromServer: typeSearchFromServer,
  } = typesPagination;

  const {
    subTypes,
    totalCount: subTotalCount,
    totalPages: subTotalPages,
    pageNumber,
    pageSize,
  } = subTypesPagination;

  const allTypes = useMemo(() => initialData.types ?? [], [initialData.types]);
  const allGroups = useMemo(() => initialData.groups ?? [], [initialData.groups]);

  // Use custom hooks
  const { urlGroupId, urlTypeId, urlQ, pushUrl } = useTypeOfUseMasterUrl();

  const { selectedGroupId, selectedTypeId, selectedType } = useTypeOfUseMasterSelection({
    allGroups,
    allTypes,
    urlGroupId,
    urlTypeId: urlTypeId || serverSelectedTypeId,
    pageSize,
    pushUrl,
  });

  const { typeSearch, setTypeSearch, onTypeSearchChange } = useTypeSearch({
    typeSearchFromServer,
    selectedGroupId,
    pushUrl,
  });

  const {
    subTypeSearch,
    searchActive,
    subLoading,
    loadingAll,
    subPageSize,
    effectivePageNumber,
    effectiveTotalCount,
    effectiveTotalPages,
    subTypeTableRows,
    changeSubPage,
    changeSubPageSize,
    onSearchChange,
  } = useSubTypeManagement({
    subTypes,
    subTotalCount,
    subTotalPages,
    pageNumber,
    pageSize,
    urlQ,
    selectedTypeId,
    selectedGroupId,
    pushUrl,
  });

  // Get column definitions from separate file
  const subTypeColumns = useMemo<Column<SubTypeTableRow>[]>(
    () => getSubTypeColumns(t, subTypeOfUseLabel),
    [t, subTypeOfUseLabel]
  );

  // Use delete actions hook
  const { handleDeleteGroup, handleDeleteType, handleDeleteSubType } =
    useTypeOfUseMasterActions(t);

  // Use type pagination handlers hook
  const { handleTypePageChange, handleTypePageSizeChange } =
    useTypePaginationHandlers({
      selectedGroupId,
      typePageSize,
      pushUrl,
    });

  // Handler callbacks for child components
  const handleGroupSelect = (groupId: string, firstTypeId: string) => {
    setTypeSearch("");
    pushUrl({
      groupId,
      typeId: firstTypeId,
      pn: 1,
      ps: subPageSize,
      typePn: 1,
      typePs: 10,
      q: "",
      typeSearch: "",
    });
  };

  const handleTypeSelect = (groupId: string, typeId: string) => {
    pushUrl({
      groupId,
      typeId,
      pn: 1,
      ps: subPageSize,
      q: "",
    });
  };

  // ---------------- UI ----------------
  if (!initialData.groups?.length) {
    return (
      <PageContainer>
        <div className="p-6 text-sm text-slate-600">{t('messages.noGroups', { use: useLabel })}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4 p-0">
        <TableHeader
          title={t('title', { typeOfUse: typeOfUseLabel })}
          subtitle={t('subtitle', { use: useLabel, subTypeOfUse: subTypeOfUseLabel })}
          icon={Layers3}
        />

        <GroupSection
          groups={initialData.groups}
          allTypes={allTypes}
          selectedGroupId={selectedGroupId}
          subPageSize={subPageSize}
          onGroupSelect={handleGroupSelect}
          onDeleteGroup={handleDeleteGroup}
          t={t}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <TypeSection
            paginatedTypes={paginatedTypes}
            typeSearch={typeSearch}
            selectedTypeId={selectedTypeId}
            selectedGroupId={selectedGroupId}
            allGroups={allGroups}
            typesTotalCount={typesTotalCount}
            typesTotalPages={typesTotalPages}
            typePageNumber={typePageNumber}
            typePageSize={typePageSize}
            subPageSize={subPageSize}
            onTypeSearchChange={onTypeSearchChange}
            onTypeSelect={handleTypeSelect}
            onPageChange={handleTypePageChange}
            onPageSizeChange={handleTypePageSizeChange}
            onDeleteType={handleDeleteType}
            t={t}
          />

          <SubTypeSection
            selectedType={selectedType}
            selectedTypeId={selectedTypeId}
            subTypeSearch={subTypeSearch}
            searchActive={searchActive}
            subLoading={subLoading}
            loadingAll={loadingAll}
            subPageSize={subPageSize}
            effectivePageNumber={effectivePageNumber}
            effectiveTotalCount={effectiveTotalCount}
            effectiveTotalPages={effectiveTotalPages}
            subTypeTableRows={subTypeTableRows}
            subTotalCount={subTotalCount}
            subTypeColumns={subTypeColumns}
            onSearchChange={onSearchChange}
            changeSubPage={changeSubPage}
            changeSubPageSize={changeSubPageSize}
            onDeleteSubType={handleDeleteSubType}
            t={t}
            allTypes={allTypes}
            onTypeSelect={handleTypeSelect}
          />
        </div>
      </div>
    </PageContainer>
  );
}
