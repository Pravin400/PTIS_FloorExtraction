import { NewProperty, OldPropertyCandidate, FloorTab, FloorDetail } from "@/types/property-mapping";
import { money, percentText, getDifferenceColorClass, getBadgeForPercent } from "./mappingUtils";
import { BasePropertySidebar } from "./NewPropertyDetailsSidebar";
import { MappingSearchBar } from "./MappingSearchBar";
import { CandidatesTable } from "./OldPropertyCandidatesTable";
import { ComparisonCards } from "./AreaTaxComparisonCards";
import { FloorVisualizer } from "./FloorBreakdownVisualizer";
import { ActionFooter } from "./MappingConfirmFooter";

interface PropertyMappingWorkspaceProps {
  currentNewProperty: NewProperty | undefined;
  inferredMappingType: string;
  selectedNewIndex: number;
  newPropertiesCount: number;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  rvLabel: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchingServer: boolean;
  onPerformSearch: (term: string) => void;
  onResetFilters: () => void;
  mappingStateFilter: string;
  setMappingStateFilter: (val: string) => void;
  filteredAutoCandidates: OldPropertyCandidate[];
  filteredManualCandidates: OldPropertyCandidate[];
  activeCheckedIds: string[];
  mappedOldPropNos: string[];
  onToggleCandidate: (id: string) => void;
  onCompareClick: (cand: OldPropertyCandidate) => void;
  hasSearchActive: boolean;
  selectedCandidates: OldPropertyCandidate[];
  metrics: {
    totalOldArea: number;
    areaDiff: number;
    areaPercentDiff: number;
    totalOldCarpetArea: number;
    carpetAreaDiff: number;
    carpetAreaPercentDiff: number;
    totalOldTax: number;
    taxDiff: number;
    taxPercentDiff: number;
    floorStatus: string;
    floorStatusLevel: string;
  };
  floorPropertyTabs: FloorTab[];
  selectedFloorProperty: string;
  setSelectedFloorProperty: (key: string) => void;
  activeFloorDataMap: Record<string, FloorDetail[]>;
  hoveredFloorIndex: number | null;
  setHoveredFloorIndex: (idx: number | null) => void;
  validationStatus: {
    isValid: boolean;
    errorMsg: string | null;
    warnings: string[];
  };
  isSubmitting?: boolean;
  onConfirmClick: () => void;
  onDisconnectCandidate?: (candidate: OldPropertyCandidate) => void;
  stepNumbers: { comparisonStep: number; floorStep: number };
  page12?: number;
  pageSize12?: number;
  totalCount12?: number;
  onPageChange12?: (page: number) => void;
  onPageSizeChange12?: (size: number) => void;
  page13?: number;
  pageSize13?: number;
  totalCount13?: number;
  onPageChange13?: (page: number) => void;
  onPageSizeChange13?: (size: number) => void;
}

export function PropertyMappingWorkspace({
  currentNewProperty,
  inferredMappingType,
  selectedNewIndex,
  newPropertiesCount,
  onPrevRecord,
  onNextRecord,
  rvLabel,
  searchQuery,
  setSearchQuery,
  isSearchingServer,
  onPerformSearch,
  onResetFilters,
  mappingStateFilter,
  setMappingStateFilter,
  filteredAutoCandidates,
  filteredManualCandidates,
  activeCheckedIds,
  mappedOldPropNos,
  onToggleCandidate,
  onCompareClick,
  hasSearchActive,
  selectedCandidates,
  metrics,
  floorPropertyTabs,
  selectedFloorProperty,
  setSelectedFloorProperty,
  activeFloorDataMap,
  hoveredFloorIndex,
  setHoveredFloorIndex,
  validationStatus,
  isSubmitting,
  onConfirmClick,
  onDisconnectCandidate,
  stepNumbers,
  page12,
  pageSize12,
  totalCount12,
  onPageChange12,
  onPageSizeChange12,
  page13,
  pageSize13,
  totalCount13,
  onPageChange13,
  onPageSizeChange13,
}: PropertyMappingWorkspaceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-4 items-start w-full">
      <BasePropertySidebar
        currentProperty={currentNewProperty}
        inferredMappingType={inferredMappingType}
        selectedNewIndex={selectedNewIndex}
        totalCount={newPropertiesCount}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
        rvLabel={rvLabel}
      />

      <main className="flex flex-col gap-4 min-w-0">
        <MappingSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchingServer={isSearchingServer}
          onPerformSearch={onPerformSearch}
          onResetFilters={onResetFilters}
          mappingStateFilter={mappingStateFilter}
          setMappingStateFilter={setMappingStateFilter}
        />

        <CandidatesTable
          autoCandidates={filteredAutoCandidates}
          manualCandidates={filteredManualCandidates}
          activeCheckedIds={activeCheckedIds}
          mappedOldPropNos={mappedOldPropNos}
          onToggleCandidate={onToggleCandidate}
          onCompareClick={onCompareClick}
          onDisconnectCandidate={onDisconnectCandidate}
          money={money}
          hasSearchActive={hasSearchActive}
          currentWard={currentNewProperty?.ward}
          currentPartition={currentNewProperty?.partitionNo}
          currentPropNo={currentNewProperty?.propNo}
          page12={page12}
          pageSize12={pageSize12}
          totalCount12={totalCount12}
          onPageChange12={onPageChange12}
          onPageSizeChange12={onPageSizeChange12}
          page13={page13}
          pageSize13={pageSize13}
          totalCount13={totalCount13}
          onPageChange13={onPageChange13}
          onPageSizeChange13={onPageSizeChange13}
        />

        <ComparisonCards
          currentNewProperty={currentNewProperty}
          selectedCandidates={selectedCandidates}
          metrics={metrics}
          money={money}
          percentText={percentText}
          getDifferenceColorClass={getDifferenceColorClass}
          getBadgeForPercent={getBadgeForPercent}
          stepNumber={stepNumbers.comparisonStep}
        />

        <FloorVisualizer
          floorPropertyTabs={floorPropertyTabs}
          selectedFloorProperty={selectedFloorProperty}
          setSelectedFloorProperty={setSelectedFloorProperty}
          floorDataMap={activeFloorDataMap}
          hoveredFloorIndex={hoveredFloorIndex}
          setHoveredFloorIndex={setHoveredFloorIndex}
          money={money}
          stepNumber={stepNumbers.floorStep}
        />

        <ActionFooter
          selectedCandidates={selectedCandidates}
          validationStatus={validationStatus}
          isSubmitting={isSubmitting}
          onConfirmClick={onConfirmClick}
        />
      </main>
    </div>
  );
}
