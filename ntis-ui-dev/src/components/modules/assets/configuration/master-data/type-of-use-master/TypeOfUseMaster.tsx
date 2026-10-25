"use client";

import { useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import { PageContainer } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import type { TypeOfUseGroup, AssetTypeOfUse, AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import { useTypeOfUseMasterState } from "@/hooks/asset-masters/type-of-use/useTypeOfUseMasterState";
import { GroupHeaderSection } from "./GroupHeaderSection";
import GroupFormDrawer from "./GroupFormDrawer";
import TypeOfUseFormDrawer from "./TypeOfUseFormDrawer";
import SubTypeOfUseFormDrawer from "./SubTypeOfUseFormDrawer";
import { getSubTypeOfUseColumns } from "./TypeOfUseColumns";
import { TypeOfUseTableSection } from "./TypeOfUseTableSection";
import { SubTypeOfUseTableSection } from "./SubTypeOfUseTableSection";

interface TypeOfUseMasterProps {
  groups: TypeOfUseGroup[];
  selectedGroupId: number | null;
  selectedTypeOfUseId: number | null;
  groupPageNumber: number;
  groupPageSize: number;
  groupTotalCount: number;
  groupTotalPages: number;

  types: AssetTypeOfUse[];
  typePageNumber: number;
  typePageSize: number;
  typeTotalCount: number;
  typeTotalPages: number;

  subtypes: AssetSubTypeOfUse[];
  subTypePageNumber: number;
  subTypePageSize: number;
  subTypeTotalCount: number;
  subTypeTotalPages: number;

  action?: string;
  editId: number | null;
  categories: { id: number; name: string }[];
  dropdownGroups: { id: number; name: string }[];
  typeOfUses: { id: number; name: string }[];
  initialTypeData?: AssetTypeOfUse;
  initialSubtypeData?: AssetSubTypeOfUse;
  dropdownTypes?: { id: number; name: string }[];
}

export function TypeOfUseMaster(props: TypeOfUseMasterProps) {
  const {
    groups,
    selectedGroupId,
    selectedTypeOfUseId,
    types,
    typePageNumber,
    typePageSize,
    typeTotalCount,
    typeTotalPages,
    subtypes,
    subTypePageNumber,
    subTypePageSize,
    subTypeTotalCount,
    subTypeTotalPages,
    action,
    editId,
    categories,
    dropdownGroups,
    typeOfUses,
    initialTypeData,
    initialSubtypeData,
    dropdownTypes = [],
  } = props;
  


  const {
    t,
    tCommon,
    typeSearch,
    subTypeSearch,
    handleGroupSelect,
    handleRowClick,
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleAddType,
    handleEditType,
    handleDeleteType,
    handleAddSubtype,
    handleEditSubtype,
    handleDeleteSubtype,
    pushUrl,
    setTypeSearch,
    setSubTypeSearch,
  } = useTypeOfUseMasterState({
    selectedGroupId,
    selectedTypeOfUseId,
    typePageNumber,
    typePageSize,
    typeTotalPages,
    subTypePageNumber,
    subTypePageSize,
    subTypeTotalPages,
  });

  const activeGroupForEdit = editId
    ? groups.find((g) => g.id === editId)
    : undefined;

  const searchParams = useSearchParams();

  const handleDrawerClose = () => {
    pushUrl({
      action: null,
      id: null,
      assetCategoryId: null,
    });
  };

  const handleCategoryChange = (catId: number) => {
    pushUrl({ assetCategoryId: catId ? String(catId) : null });
  };

  const handleSubTypeSort = (columnKey: string) => {
    const isCurrent = searchParams.get("subTypeSortBy") === columnKey;
    const currentOrder = searchParams.get("subTypeSortOrder") || "asc";
    const newOrder = isCurrent && currentOrder === "asc" ? "desc" : "asc";
    pushUrl({
      subTypeSortBy: columnKey,
      subTypeSortOrder: newOrder,
      subTypePn: 1,
    });
  };

  const subTypeSortBy = searchParams.get("subTypeSortBy") || undefined;
  const subTypeSortOrder = searchParams.get("subTypeSortOrder") || undefined;

  const subtypeColumns = getSubTypeOfUseColumns(t, tCommon, subTypeSortBy, subTypeSortOrder, handleSubTypeSort);

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("title", { default: "Type of Use Master" })}
          subtitle={t("subtitle", { default: "Configure Type of Use Groups, Types, and Sub-Types" })}
          icon={Layers}
        />

        {/* Top Horizontal Groups Selection */}
        <GroupHeaderSection
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupSelect={handleGroupSelect}
          onAddGroup={handleAddGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          tCommon={tCommon}
        />

        {/* Double-Pane layout for Type (5/12) and SubType (7/12) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <TypeOfUseTableSection
            title={t("type.title", { default: "Types of Use" })}
            searchPlaceholder={t("type.searchPlaceholder", { default: "Search Code/Description..." })}
            addTypeLabel={t("type.addButton", { default: "Add Type" })}
            editLabel={tCommon("table.actions.edit")}
            deleteLabel={tCommon("table.actions.delete")}
            typeSearch={typeSearch}
            onSearchChange={setTypeSearch}
            onAddType={handleAddType}
            types={types}
            pageNumber={typePageNumber}
            pageSize={typePageSize}
            totalCount={typeTotalCount}
            totalPages={typeTotalPages}
            selectedTypeOfUseId={selectedTypeOfUseId ? String(selectedTypeOfUseId) : undefined}
            onPageChange={(p) => pushUrl({ typePn: p })}
            onPageSizeChange={(size) => pushUrl({ typePs: size, typePn: 1 })}
            onRowClick={handleRowClick}
            onEditType={handleEditType}
            onDeleteType={handleDeleteType}
          />

          {selectedTypeOfUseId ? (
            <SubTypeOfUseTableSection
              title={t("subtype.title", { default: "Sub-Types of Use" })}
              searchPlaceholder={t("subtype.searchPlaceholder", { default: "Search Subtype..." })}
              addSubtypeLabel={t("subtype.addButton", { default: "Add Sub-Type" })}
              actionsLabel={tCommon("table.columns.actions")}
              editLabel={tCommon("table.actions.edit")}
              deleteLabel={tCommon("table.actions.delete")}
              subtypeSearch={subTypeSearch}
              onSearchChange={setSubTypeSearch}
              onAddSubtype={handleAddSubtype}
              columns={subtypeColumns}
              subtypes={subtypes}
              pageNumber={subTypePageNumber}
              pageSize={subTypePageSize}
              totalCount={subTypeTotalCount}
              totalPages={subTypeTotalPages}
              onPageChange={(p) => pushUrl({ subTypePn: p })}
              onPageSizeChange={(size) => pushUrl({ subTypePs: size, subTypePn: 1 })}
              onEditSubtype={handleEditSubtype}
              onDeleteSubtype={handleDeleteSubtype}
              selectedType={types.find((t) => t.id === selectedTypeOfUseId) ?? null}
            />
          ) : (
            <div className="lg:col-span-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 min-h-[300px] flex flex-col justify-center items-center text-slate-400 text-sm">
              <Layers className="h-8 w-8 mb-2 text-slate-300" />
              <span>{t("list.selectTypeNotice", { default: "Please select a Type of Use from the list to view Sub-Types of Use." })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {action === "addGroup" && (
        <GroupFormDrawer
          id={null}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}

      {action === "editGroup" && activeGroupForEdit && (
        <GroupFormDrawer
          id={editId}
          initialData={activeGroupForEdit}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}

      {action === "addType" && (
        <TypeOfUseFormDrawer
          id={null}
          initialData={initialTypeData}
          categories={categories}
          groups={dropdownGroups}
          types={dropdownTypes}
          onCategoryChange={handleCategoryChange}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}

      {action === "editType" && initialTypeData && (
        <TypeOfUseFormDrawer
          id={editId}
          initialData={initialTypeData}
          categories={categories}
          groups={dropdownGroups}
          types={dropdownTypes}
          onCategoryChange={handleCategoryChange}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}

      {action === "addSubtype" && (
        <SubTypeOfUseFormDrawer
          id={null}
          initialData={initialSubtypeData}
          typeOfUses={typeOfUses}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}

      {action === "editSubtype" && initialSubtypeData && (
        <SubTypeOfUseFormDrawer
          id={editId}
          initialData={initialSubtypeData}
          typeOfUses={typeOfUses}
          onSuccess={handleDrawerClose}
          onCancel={handleDrawerClose}
        />
      )}
    </PageContainer>
  );
}
