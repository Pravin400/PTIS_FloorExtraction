import { notFound } from "next/navigation";
import {
  getConnectionTypeByIdAction,
  getConnectionTypePagedAction,
} from "@/app/[locale]/water-bill/connection-type-master/actions";
import { ConnectionTypeMaster } from "@/components/modules/water-bill/connection-type-master";
import { ConnectionTypeForm } from "@/components/modules/water-bill/connection-type-master/ConnectionTypeForm";

export const dynamic = "force-dynamic";

export default async function EditConnectionTypePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const connectionTypeId = Number(id);
  if (!Number.isFinite(connectionTypeId) || connectionTypeId <= 0) notFound();

  const [result, initialData] = await Promise.all([
    getConnectionTypePagedAction(1, 10),
    getConnectionTypeByIdAction(connectionTypeId).catch(() => null),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <>
      <ConnectionTypeMaster data={result} />
      <ConnectionTypeForm id={connectionTypeId} initialData={initialData} />
    </>
  );
}
