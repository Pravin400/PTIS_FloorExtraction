import BulkUpdateDrawerWrapper from "@/components/modules/property-tax/taxZoningmasterNew/BulkUpdateDrawerWrapper";
import { fetchWardPagedAction, fetchTaxZonePagedAction } from "../actions";

export default async function Page() {
  const [wardsData, taxZonesData] = await Promise.all([
    fetchWardPagedAction(1, -1),
    fetchTaxZonePagedAction(1, -1),
  ]);

  return (
    <BulkUpdateDrawerWrapper
      wardsData={wardsData.items}
      taxZones={taxZonesData.items}
    />
  );
}
