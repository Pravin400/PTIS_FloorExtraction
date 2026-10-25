'use client';
import { PropertySelectionDrawer } from './PropertySelectionDrawer';
import type { ZoneSummary, WardSummary, PropertySummary } from '@/types/report.types';

interface ReportPanelDrawerSectionProps {
  zones: ZoneSummary[];
  wards: WardSummary[];
  wardId: string[];
  zoneId: string;
  selectionMode: string;
  isPropertyDrawerOpen: boolean;
  setIsPropertyDrawerOpen: (open: boolean) => void;
  properties: PropertySummary[];
  propLoading: boolean;
  fromProperty: string;
  toProperty: string;
  selectedProperties: string[];
  setSelectedProperties: React.Dispatch<React.SetStateAction<string[]>>;
  propertyTypeMap: Map<number, string>;
  isPending: boolean;
  onGenerate: () => void;
  propSearchQuery: string;
  setPropSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export function ReportPanelDrawerSection({
  zones,
  wards,
  wardId,
  zoneId,
  selectionMode,
  isPropertyDrawerOpen,
  setIsPropertyDrawerOpen,
  properties,
  propLoading,
  fromProperty,
  toProperty,
  selectedProperties,
  setSelectedProperties,
  propertyTypeMap,
  isPending,
  onGenerate,
  propSearchQuery,
  setPropSearchQuery,
}: ReportPanelDrawerSectionProps) {
  if (selectionMode !== 'property' && selectionMode !== 'range') return null;

  const selectedZone = zones.find((z) => String(z.id) === zoneId);
  const selectedWards = wards.filter((w) => wardId.includes(String(w.id)));

  const zoneLabel = selectedZone
    ? selectedZone.description && selectedZone.description !== selectedZone.zoneNo
      ? `${selectedZone.zoneNo} - ${selectedZone.description}`
      : selectedZone.zoneNo
    : '—';

  const wardLabel =
    selectedWards.length > 0
      ? selectedWards
          .map((w) =>
            w.description && w.description !== w.wardNo
              ? `${w.wardNo} - ${w.description}`
              : w.wardNo
          )
          .join(', ')
      : '—';

  return (
    <PropertySelectionDrawer
      isOpen={isPropertyDrawerOpen}
      onClose={() => setIsPropertyDrawerOpen(false)}
      properties={properties}
      propLoading={propLoading}
      selectionMode={selectionMode}
      fromProperty={fromProperty}
      toProperty={toProperty}
      selectedProperties={selectedProperties}
      setSelectedProperties={setSelectedProperties}
      zoneLabel={zoneLabel}
      wardLabel={wardLabel}
      propertyTypeMap={propertyTypeMap}
      isPending={isPending}
      onGenerate={onGenerate}
      propSearchQuery={propSearchQuery}
      setPropSearchQuery={setPropSearchQuery}
    />
  );
}
