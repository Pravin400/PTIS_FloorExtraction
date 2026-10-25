"use client";

import { MapPin } from "lucide-react";
import { PageContainer } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { MoujaSubZoneProps } from "@/types/asset-masters/mouja-subzone.types";
import { getMoujaColumns, getSubZoneColumns } from "./MoujaSubZoneColumns";
import { MoujaTableSection } from "./MoujaTableSection";
import { SubZoneTableSection } from "./SubZoneTableSection";
import { useMoujaSubZoneMasterState } from "@/hooks/asset-masters/mouja-subzone/useMoujaSubZoneMasterState";

export function MoujaSubZoneMaster(props: MoujaSubZoneProps) {
  const {
    moujas,
    subZones,
    moujaTotalCount,
    subZoneTotalCount,
    moujaPageNumber,
    subZonePageNumber,
    moujaPageSize,
    subZonePageSize,
    moujaTotalPages,
    subZoneTotalPages,
    selectedMoujaId,
    moujaSortBy,
    moujaSortOrder,
    subZoneSortBy,
    subZoneSortOrder,
  } = props;

  const {
    t,
    tCommon,
    moujaSearch,
    subZoneSearch,
    selectedMouja,
    pushUrl,
    setMoujaSearch,
    setSubZoneSearch,
    handleMoujaSort,
    handleSubZoneSort,
    handleMoujaRowClick,
    handleAddMouja,
    handleEditMouja,
    handleDeleteMouja,
    handleAddSubZone,
    handleEditSubZone,
    handleDeleteSubZone,
  } = useMoujaSubZoneMasterState(props);

  const moujaColumns = getMoujaColumns(t, tCommon, moujaSortBy, moujaSortOrder, handleMoujaSort);
  const subZoneColumns = getSubZoneColumns(t, tCommon, subZoneSortBy, subZoneSortOrder, handleSubZoneSort);

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader title={t("list.title")} subtitle={t("list.subtitle")} icon={MapPin} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MoujaTableSection
            title={t("list.moujaTitle")}
            searchPlaceholder={t("list.filters.searchMouja")}
            addMoujaLabel={t("list.buttons.addMouja")}
            actionsLabel={tCommon("table.columns.actions")}
            editLabel={tCommon("table.actions.edit")}
            deleteLabel={tCommon("table.actions.delete")}
            moujaSearch={moujaSearch}
            onSearchChange={setMoujaSearch}
            onAddMouja={handleAddMouja}
            columns={moujaColumns}
            moujas={moujas}
            pageNumber={moujaPageNumber}
            pageSize={moujaPageSize}
            totalCount={moujaTotalCount}
            totalPages={moujaTotalPages}
            selectedMoujaId={selectedMoujaId}
            onPageChange={(p) => pushUrl({ moujaPn: p })}
            onPageSizeChange={(size) => pushUrl({ moujaPs: size, moujaPn: 1 })}
            onRowClick={handleMoujaRowClick}
            onEditMouja={handleEditMouja}
            onDeleteMouja={handleDeleteMouja}
          />

          <SubZoneTableSection
            title={t("list.subZoneTitle")}
            moujaLabel={t("form.fields.moujaId.label")}
            searchPlaceholder={t("list.filters.searchSubZone")}
            addSubZoneLabel={t("list.buttons.addSubZone")}
            selectMoujaNotice={t("list.selectMoujaNotice")}
            cannotAddInactiveNotice={t("list.cannotAddInactiveMouja")}
            actionsLabel={tCommon("table.columns.actions")}
            editLabel={tCommon("table.actions.edit")}
            deleteLabel={tCommon("table.actions.delete")}
            selectedMoujaId={selectedMoujaId}
            selectedMouja={selectedMouja}
            isMoujaActive={selectedMouja ? selectedMouja.isActive : false}
            subZoneSearch={subZoneSearch}
            onSearchChange={setSubZoneSearch}
            onAddSubZone={handleAddSubZone}
            columns={subZoneColumns}
            subZones={subZones}
            pageNumber={subZonePageNumber}
            pageSize={subZonePageSize}
            totalCount={subZoneTotalCount}
            totalPages={subZoneTotalPages}
            onPageChange={(p) => pushUrl({ subZonePn: p })}
            onPageSizeChange={(size) => pushUrl({ subZonePs: size, subZonePn: 1 })}
            onEditSubZone={handleEditSubZone}
            onDeleteSubZone={handleDeleteSubZone}
          />
        </div>
      </div>
    </PageContainer>
  );
}
