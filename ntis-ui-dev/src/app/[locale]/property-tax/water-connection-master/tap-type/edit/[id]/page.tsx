import { notFound } from "next/navigation";
import { getTapTypeByIdAction } from "@/app/[locale]/property-tax/water-connection-master/actions";
import { TapTypeForm } from "@/components/modules/property-tax/WaterConnectionMaster";

export const dynamic = "force-dynamic";

export default async function EditTapTypePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tapTypeId = Number(id);
  if (!Number.isFinite(tapTypeId) || tapTypeId <= 0) notFound();

  let initialData;
  try {
    initialData = await getTapTypeByIdAction(tapTypeId);
  } catch {
    notFound();
  }

  return <TapTypeForm id={tapTypeId} initialData={initialData} />;
}
