import { notFound } from "next/navigation";
import { getTapSizeByIdAction } from "@/app/[locale]/property-tax/water-connection-master/actions";
import { TapSizeForm } from "@/components/modules/property-tax/WaterConnectionMaster";

export const dynamic = "force-dynamic";

export default async function EditTapSizePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tapSizeId = Number(id);
  if (!Number.isFinite(tapSizeId) || tapSizeId <= 0) notFound();

  let initialData;
  try {
    initialData = await getTapSizeByIdAction(tapSizeId);
  } catch {
    notFound();
  }

  return <TapSizeForm id={tapSizeId} initialData={initialData} />;
}
