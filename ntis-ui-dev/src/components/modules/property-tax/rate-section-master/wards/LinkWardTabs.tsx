import { Badge } from "@/components/common";
import { Tabs } from "@/components/common/Tabs";
import AvailableWards from "./AvailableWards";
import ViewWards from "./ViewWards";
import { LinkWardTabsProps } from "@/types/rateSectionMaster.types";

export default function LinkWardTabs({
  activeTab,
  totalUnassignedForHeader,
  totalViewAllCount,
  allAvailableWards,
  wardAssignments,
  selectedWards,
  availableSearch,
  availablePage,
  availablePageSize,
  checkedAvailable,
  loading,
  viewAllWards,
  viewAllSearch,
  viewWardPage,
  viewWardPageSize,
  totalViewAllPages,
  onTabChange,
  onAvailableSearch,
  onToggleAvailable,
  onAvailablePageChange,
  onAvailablePageSizeChange,
  onViewAllSearch,
  onViewWardPageChange,
  onViewWardPageSizeChange,
  isAvailableSelectAllActive,
  isViewAllSelectAllActive,
  availableSelectAllLoading,
  viewAllSelectAllLoading,
  onAvailableSelectAll,
  onViewAllSelectAll,
  t,
  wardAlias,
  wardsAlias
}: LinkWardTabsProps) {
  const ward = wardAlias || t("defaults.ward");
  const wards = wardsAlias || t("defaults.wards");

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-visible bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-md border-2 border-blue-200/50 shadow-lg">
      <div className="bg-gradient-to-r from-[#1A86E8] via-[#1A86E8] to-[#1A86E8] px-2 py-2 shadow-md">
        <Tabs
          value={activeTab}
          onChange={onTabChange}
          variant="pills"
          size="md"
          className="flex items-center"
          items={[
            {
              value: "available",
              label: (
                <span className="flex items-center gap-2">
                  {t("wards.availableWards", { wards })}
                  <Badge size="sm" variant="default">
                    {totalUnassignedForHeader}
                  </Badge>
                </span>
              ),
              content: null,
            },
            {
              value: "viewAll",
              label: (
                <span className="flex items-center gap-2">
                  {t("wards.viewWards", { wards })}
                  <Badge size="sm" variant="default">
                    {totalViewAllCount}
                  </Badge>
                </span>
              ),
              content: null,
            },
          ]}
        />
      </div>

      {activeTab === "available" && (
        <AvailableWards
          allAvailableWards={allAvailableWards}
          wardAssignments={wardAssignments}
          selectedWards={selectedWards}
          availableSearch={availableSearch}
          availablePage={availablePage}
          availablePageSize={availablePageSize}
          checkedAvailable={checkedAvailable}
          loading={loading}
          onSearch={onAvailableSearch}
          onToggle={onToggleAvailable}
          onPageChange={onAvailablePageChange}
          onPageSizeChange={onAvailablePageSizeChange}
          onSelectAll={onAvailableSelectAll}
          isSelectAllActive={isAvailableSelectAllActive}
          selectAllLoading={availableSelectAllLoading}
          wardAlias={ward}
          wardsAlias={wards}
        />
      )}

      {activeTab === "viewAll" && (
        <ViewWards
          viewAllWards={viewAllWards}
          wardAssignments={wardAssignments}
          selectedWards={selectedWards}
          viewAllSearch={viewAllSearch}
          viewWardPage={viewWardPage}
          viewWardPageSize={viewWardPageSize}
          totalViewAllPages={totalViewAllPages}
          checkedAvailable={checkedAvailable}
          loading={loading}
          onSearch={onViewAllSearch}
          onToggle={onToggleAvailable}
          onPageChange={onViewWardPageChange}
          onPageSizeChange={onViewWardPageSizeChange}
          onSelectAll={onViewAllSelectAll}
          isSelectAllActive={isViewAllSelectAllActive}
          selectAllLoading={viewAllSelectAllLoading}
          wardAlias={ward}
          wardsAlias={wards}
        />
      )}
    </div>
  );
}
