
import PropertyMapping from "@/components/modules/property-tax/property-mapping/PropertyMapping";
import { getMappedPropertiesAction } from "./action";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PropertyMappingPageRoute({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const propertyId = resolvedSearchParams?.propertyId
    ? Number(resolvedSearchParams.propertyId)
    : undefined;

  let initialMappingData = null;
  if (propertyId && !isNaN(propertyId)) {
    initialMappingData = await getMappedPropertiesAction(propertyId);
  }

  const uniqueKey = `${resolvedSearchParams?.propertyId || ""}-${resolvedSearchParams?.propNo || ""}`;

  return (    
      <PropertyMapping
        key={uniqueKey}
        initialMappingData={initialMappingData}
        initialSearchParams={resolvedSearchParams}
      />
  );
}
