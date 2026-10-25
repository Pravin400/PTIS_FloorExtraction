import { notFound } from "next/navigation";
import { getTapStatusByIdAction } from "@/app/[locale]/property-tax/water-connection-master/actions";
import { TapStatusForm } from "@/components/modules/property-tax/WaterConnectionMaster";

export const dynamic = "force-dynamic";

export default async function EditTapStatusPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tapStatusId = Number(id);
  if (!Number.isFinite(tapStatusId) || tapStatusId <= 0) notFound();

  let initialData;
  try {
    initialData = await getTapStatusByIdAction(tapStatusId);
  } catch {
    notFound();
  }

  return <TapStatusForm id={tapStatusId} initialData={initialData} />;
}
