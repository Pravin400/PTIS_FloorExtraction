import TaxZoneForm from "@/components/modules/property-tax/taxzonemaster/TaxZoneForm";
import { getTaxZoneByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";
import { PageContainer } from "@/components/common/PageContainer";

interface PageProps {
  params: Promise<{
    taxZoneId: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { taxZoneId } = await params;

  // ✅ Fetch data server-side by tax zone ID
  let taxZoneData: Awaited<ReturnType<typeof getTaxZoneByIdAction>> | null = null;
  try {
    taxZoneData = await getTaxZoneByIdAction(taxZoneId);
  } catch (error) {
    // Only call notFound() for real 404s; let other failures hit error.tsx
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound(); 
    }
    // Re-throw other errors (500s, timeouts, auth failures) so they reach error.tsx
    throw error;
  }

  return (
    <PageContainer className="p-4 sm:p-6">
      <TaxZoneForm initialData={taxZoneData} />
    </PageContainer>
  );
}
