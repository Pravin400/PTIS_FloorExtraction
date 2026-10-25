import { TaxZoneForm } from "@/components/modules/property-tax/taxzonemaster";
import { PageContainer } from "@/components/common/PageContainer";

export default async function AddPage() {
  return (
    <PageContainer className="p-4 sm:p-6">
      <TaxZoneForm initialData={null} />
    </PageContainer>
  );
}
