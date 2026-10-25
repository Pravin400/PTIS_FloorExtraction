import {
  getApartmentPropertyTaxDetailsByIdSafe,
  getApartmentPropertyTaxDetailsCvByIdSafe,
  getDualMethodTaxDetailsById,
  getPartTypeFromMainTab,
} from "@/lib/api/ptis/appartmentQC/appartmentQC.service";
import ApartmentTaxDetailsTable from "@/components/modules/property-tax/ptis/appartmentQC/ApartmentTaxDetailsTable";

interface PageProps {
  searchParams: Promise<{
    propertyId?: string;
    editPropertyId?: string;
    appartmentTab?: string;
    subTab?: string;
  }>;
}

export default async function AppartmentQCTaxDetailsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const propertyId = params.propertyId || params.editPropertyId || "";
  const appartmentTab = params.appartmentTab || "amenities";
  const subTab = params.subTab || "rateable";

  let taxDetails = null;
  let dualMethodDetails = null;

  if (propertyId) {
    const partType = getPartTypeFromMainTab(appartmentTab);
    if (subTab === "dual-method") {
      dualMethodDetails = await getDualMethodTaxDetailsById(propertyId, partType);
    } else if (subTab === "capital") {
      taxDetails = await getApartmentPropertyTaxDetailsCvByIdSafe({ propertyId, partType });
    } else {
      // rateable
      taxDetails = await getApartmentPropertyTaxDetailsByIdSafe({ propertyId, partType });
    }
  }

  return (
    <div className="p-4">
      <ApartmentTaxDetailsTable
        taxDetails={taxDetails}
        dualMethodDetails={dualMethodDetails}
        activeMainTab={appartmentTab}
        activeSubTab={subTab}
        loading={false}
      />
    </div>
  );
}