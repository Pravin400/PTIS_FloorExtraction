import { notFound } from "next/navigation";
import { WaterConnectionPage } from "@/components/modules/property-tax/waterconnection";
import { getWaterConnectionPageData, saveWaterConnectionAction } from "./action";

interface PageProps {
  searchParams: Promise<{ propertyId?: string; page?: string; pageSize?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { propertyId, page, pageSize } = await searchParams;
  const resolvedPropertyId = propertyId ? parseInt(propertyId, 10) : NaN;
  if (!Number.isFinite(resolvedPropertyId) || resolvedPropertyId <= 0) {
    notFound();
  }
  const resolvedPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const rawPageSize = parseInt(pageSize ?? "10", 10);
  const resolvedPageSize = [10, 20, 30, 50].includes(rawPageSize) ? rawPageSize : 10;

  const data = await getWaterConnectionPageData(resolvedPropertyId, resolvedPage, resolvedPageSize);
  return (
    <WaterConnectionPage
      initialData={data}
      propertyId={resolvedPropertyId}
      initialPage={resolvedPage}
      initialPageSize={resolvedPageSize}
      saveWaterConnectionAction={saveWaterConnectionAction}
    />
  );
}
