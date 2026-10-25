import { PolicyConfigurationForm } from "@/components/modules/property-tax/policy-configuration";
import { getPolicyConfigurationByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/policy-configuration.services";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { id } = await params;

  let policyData = null;
  try {
    policyData = await getPolicyConfigurationByIdAction(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <PolicyConfigurationForm initialData={policyData} />
    </>
  );
}
