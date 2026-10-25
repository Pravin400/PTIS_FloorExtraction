import TaxZoningUpdateFormWrapper from "@/components/modules/property-tax/taxZoningmasterNew/TaxZoningUpdateFormWrapper";
import {
  fetchWardPagedAction,
  fetchTaxZonePagedAction,
  fetchTaxZoningRangeByIdAction,
  fetchPropertiesByWardAction,
} from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wardId?: string }>;
}

export default async function Page({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const id = resolvedParams.id;
  const isEditMode = id !== "0";

  const [wardsData, taxZonesData, rangeResult] = await Promise.all([
    fetchWardPagedAction(1, -1),
    fetchTaxZonePagedAction(1, -1),
    isEditMode
      ? fetchTaxZoningRangeByIdAction(Number(id))
      : Promise.resolve({ success: true as const, data: null }),
  ]);

  const initialRange = rangeResult.success ? rangeResult.data : null;

  // In edit mode use the ward from the existing record; in add mode use the URL param
  const wardIdForFetch = isEditMode
    ? initialRange?.wardId
    : resolvedSearch.wardId
    ? Number(resolvedSearch.wardId)
    : undefined;

  let propertyOptions: { label: string; value: string }[] = [];
  if (wardIdForFetch) {
    const result = await fetchPropertiesByWardAction(wardIdForFetch);
    if (result.success && result.data?.items) {
      propertyOptions = result.data.items
        .filter((p) => p.propertyNo != null)
        .map((p) => ({ label: p.propertyNo!, value: p.propertyNo! }));
    }
  }

  return (
    <TaxZoningUpdateFormWrapper
      id={id}
      wardsData={wardsData}
      taxZones={taxZonesData}
      initialRange={initialRange}
      propertyOptions={propertyOptions}
    />
  );
}
