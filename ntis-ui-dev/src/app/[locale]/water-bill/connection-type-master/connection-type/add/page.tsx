import { ConnectionTypeMaster } from "@/components/modules/water-bill/connection-type-master";
import { ConnectionTypeForm } from "@/components/modules/water-bill/connection-type-master/ConnectionTypeForm";
import { getConnectionTypePagedAction } from "@/app/[locale]/water-bill/connection-type-master/actions";

export const dynamic = "force-dynamic";

export default async function AddConnectionTypePage() {
  const result = await getConnectionTypePagedAction(1, 10);

  return (
    <>
      <ConnectionTypeMaster data={result} />
      <ConnectionTypeForm id={null} initialData={undefined} />
    </>
  );
}
