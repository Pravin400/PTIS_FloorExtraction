import React from 'react';
import { MapPin, Hash, Layers, Tag } from 'lucide-react';
import { Drawer, Tabs } from '@/components/common';
import { FloorData } from '@/types/room-details.types';
import { LookupData } from '@/lib/utils/floorSubmission/floor-mappers';
import { useDataEntrySameAs } from '../hooks/useDataEntrySameAs';
import { TypeWiseTab } from './TypeWiseTab';
import { PropertyWiseTab } from './PropertyWiseTab';
import { ParkingTab } from './ParkingTab';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';


interface DataEntrySameAsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  wardId?: string | number;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  initialPropertyID?: string | number;
  hasFloorSubmission?: boolean;
  /**
   * categoryName from PropertyCategoryMaster (e.g. "Individual", "Apartment", "Industry", "Plot").
   * Passed as a string from the parent so the drawer is not tied to hardcoded numeric IDs.
   */
  categoryName?: string;

  // FloorTable related props
  filteredFloors: FloorData[];
  floorSearch: string;
  setFloorSearch: (val: string) => void;
  selectedFloor: FloorData | null;
  setSelectedFloor: (val: FloorData | null) => void;
  isAddingNewFloor: boolean;
  setIsAddingNewFloor: (val: boolean) => void;
  handleAddFloor: () => void;
  updateUrlParams: (params: Record<string, string | null>) => void;
  handleDeleteFloor: (floor: FloorData) => void;
  startTransition: (fn: () => void) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  floorLookup: LookupData[];
  subFloorLookup: LookupData[];
  constructionLookup: LookupData[];
  useLookup: LookupData[];
  subTypeData: LookupData[];
  setEditingFloorForm: (val: FloorData) => void;
}

/**
 * Compute tab enabled/disabled config based on property category name.
 *
 * Rules (from business requirement):
 *   Individual  → Property Wise ONLY enabled  (Type Wise + Parking disabled)
 *   Apartment   → Type Wise + Parking enabled  (Property Wise disabled)
 *   Others      → All tabs enabled
 */
function getTabConfig(categoryName: string | undefined) {
  const name = (categoryName ?? '').trim().toLowerCase();

  if (name === 'individual') {
    return {
      propertyWiseDisabled: false,
      typeWiseDisabled: true,
      parkingDisabled: true,
      initialTab: 'property-wise',
    };
  }

  if (name === 'apartment') {
    return {
      propertyWiseDisabled: true,
      typeWiseDisabled: false,
      parkingDisabled: false,
      initialTab: 'type-wise',
    };
  }

  // Industry, Plot, or unknown → all enabled
  return {
    propertyWiseDisabled: false,
    typeWiseDisabled: false,
    parkingDisabled: false,
    initialTab: 'type-wise',
  };
}

function tabClassName(disabled: boolean) {
  const base =
    'justify-center py-1.5 text-xs font-bold text-white hover:bg-white/15 hover:text-white data-[state=active]:text-blue-700 data-[state=active]:hover:text-white';
  return disabled ? `${base} opacity-40 cursor-not-allowed pointer-events-none` : base;
}

export const DataEntrySameAsDrawer: React.FC<DataEntrySameAsDrawerProps> = (props) => {
  const { isOpen, onClose, t, wardId, wardNo, propertyNo, partitionNo, initialPropertyID, categoryName } = props;

  const wardLabel = useAliasLabel('Ward', t('aliasFallback.ward'));
  const propertyLabel = useAliasLabel('Property_No', t('aliasFallback.propertyNo'));
  const partitionLabel = useAliasLabel('Partition', t('aliasFallback.partition'));
  const typeLabel = useAliasLabel('Type_Of_Use', t('aliasFallback.typeOfUse'));

  const tabConfig = React.useMemo(() => getTabConfig(categoryName), [categoryName]);

  const hook = useDataEntrySameAs({
    isOpen,
    wardId,
    propertyNo,
    partitionNo,
    initialPropertyID,
    t,
    initialTab: tabConfig.initialTab,
    categoryName,
  });

  // Filter properties to display in tables
  // useMemo is CRITICAL here — without it a new array is created every render,
  // which would trigger TypeWiseTab's useEffect([properties]) and reset the type filter.
  const displayedProperties = React.useMemo(
    () => hook.filterPropertiesForTable(hook.selectableProperties, true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hook.selectableProperties, hook.filterPropertiesForTable]
  );

  return (
    <>
      <Tabs
        value={hook.dataEntrySameAsTab}
        onChange={(val) => {
          hook.setDataEntrySameAsTab(String(val));
          hook.handleClearPropertySelection();
        }}
        variant="pills"
        size="sm"
        className="h-full"
        activeTabClassName="bg-white text-blue-700 shadow-sm"
      >
        <Drawer
          open={isOpen}
          onClose={onClose}
          title={(
            <div className="flex w-full flex-wrap items-center gap-4 data-entry-same-as-header">
              <style>{`
                div[role="dialog"] > div:has(.data-entry-same-as-header) > div:first-child {
                  flex: 1;
                }
              `}</style>
              <h2 className="text-[15px] font-bold leading-tight text-white">{t('floor.dataEntry')}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                  <MapPin className="h-3 w-3 text-white/80" />
                  <span>{wardLabel}: {wardNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                  <Hash className="h-3 w-3 text-white/80" />
                  <span>{propertyLabel}: {propertyNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                  <Layers className="h-3 w-3 text-white/80" />
                  <span>{partitionLabel}: {partitionNo || '—'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white border border-white/10 backdrop-blur-xs transition-colors hover:bg-white/15">
                  <Tag className="h-3 w-3 text-white/80" />
                  <span>{typeLabel}: {hook.currentPropertyType || '—'}</span>
                </div>
              </div>
              <Tabs.TabList className="ml-auto border-0 bg-white/10 p-1 rounded-lg">
                {/* Property Wise — disabled for Apartment, enabled for Individual */}
                {!tabConfig.propertyWiseDisabled && (
                  <Tabs.Tab
                    value="property-wise"
                    className={tabClassName(tabConfig.propertyWiseDisabled)}
                    disabled={tabConfig.propertyWiseDisabled}
                  >
                    {t('floor.dataEntryTabs.propertyWise')}
                  </Tabs.Tab>
                )}

                {/* Type Wise — disabled for Individual, enabled for Apartment/others */}
                {!tabConfig.typeWiseDisabled && (
                  <Tabs.Tab
                    value="type-wise"
                    className={tabClassName(tabConfig.typeWiseDisabled)}
                    disabled={tabConfig.typeWiseDisabled}
                  >
                    {t('floor.dataEntryTabs.typeWise')}
                  </Tabs.Tab>
                )}

                {/* Parking — disabled for Individual, enabled for Apartment/others */}
                {!tabConfig.parkingDisabled && (
                  <Tabs.Tab
                    value="parking"
                    className={tabClassName(tabConfig.parkingDisabled)}
                    disabled={tabConfig.parkingDisabled}
                  >
                    {t('floor.dataEntryTabs.parking')}
                  </Tabs.Tab>
                )}
              </Tabs.TabList>
            </div>
          )}
          width="xl"
        >
          <div className="flex h-full flex-col overflow-hidden bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4">
              <Tabs.TabPanel value="type-wise" className="mt-0">
                <TypeWiseTab
                  {...props}
                  currentPropertyType={hook.currentPropertyType}
                  properties={displayedProperties}
                  selectedIds={hook.selectedPropertyIds}
                  onToggle={hook.handleTogglePropertySelection}
                  onClearSelection={hook.handleClearPropertySelection}
                  onToggleMultiple={hook.handleToggleMultipleProperties}
                  isLoading={hook.isLoadingProperties}
                  disabledIds={new Set()}
                  sourcePropertyIds={hook.sourcePropertyIds}
                  isApplying={hook.isApplyingSameAs}
                  onApply={hook.handleApplySameAsDetails}
                  changeTypeInput={hook.changeTypeInput}
                  setChangeTypeInput={hook.setChangeTypeInput}
                  isApplyingTypeSubmission={hook.isApplyingTypeSubmission}
                  onApplyTypeSubmission={hook.handleApplyTypeSubmission}
                />
              </Tabs.TabPanel>
              <Tabs.TabPanel value="property-wise" className="mt-0">
                <PropertyWiseTab
                  {...props}
                  properties={displayedProperties}
                  selectedIds={hook.selectedPropertyIds}
                  onToggle={hook.handleTogglePropertySelection}
                  onClearSelection={hook.handleClearPropertySelection}
                  onToggleMultiple={hook.handleToggleMultipleProperties}
                  isLoading={hook.isLoadingProperties}
                  disabledIds={new Set()}
                  sourcePropertyIds={hook.sourcePropertyIds}
                  isApplying={hook.isApplyingSameAs}
                  onApply={hook.handleApplySameAsDetails}
                  wardOptions={hook.wardOptions}
                  searchWardId={hook.searchWardId}
                  handleWardChange={hook.handleWardChange}
                  isFetchingWards={hook.isFetchingWards}
                  searchPropertyNo={hook.searchPropertyNo}
                  setSearchPropertyNo={hook.setSearchPropertyNo}
                  sanitizeWardNo={hook.sanitizeWardNo}
                  sanitizePropertyNo={hook.sanitizePropertyNo}
                  handleSearchProperties={hook.handleSearchProperties}
                />
              </Tabs.TabPanel>
              <Tabs.TabPanel value="parking" className="mt-0">
                <ParkingTab
                  {...props}
                  properties={displayedProperties}
                  selectedIds={hook.selectedPropertyIds}
                  onToggle={hook.handleTogglePropertySelection}
                  onClearSelection={hook.handleClearPropertySelection}
                  onToggleMultiple={hook.handleToggleMultipleProperties}
                  isLoading={hook.isLoadingProperties}
                  disabledIds={new Set()}
                  sourcePropertyIds={hook.sourcePropertyIds}
                  isApplying={hook.isApplyingSameAs}
                  onApply={hook.handleApplySameAsDetails}
                />
              </Tabs.TabPanel>
            </div>
          </div>
        </Drawer>
      </Tabs>
    </>
  );
};
