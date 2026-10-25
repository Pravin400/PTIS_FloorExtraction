import { fetchCombinePropertiesHistoryAction } from "../action";
import { CombinePropertyHistory } from "@/components/modules/property-tax/ptis/combineproperty/combinePropetryHistory";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  // Fetch details using the sourcePropertyId
  const historyDetails = await fetchCombinePropertiesHistoryAction({
    sourcePropertyId: Number(id)
  });

  return (
    <CombinePropertyHistory historyDetails={historyDetails} />
  );
}
