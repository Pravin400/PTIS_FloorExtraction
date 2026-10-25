import { TapSizeMaster } from "@/components/modules/water-bill/tap-size-master";
import { TapSizeForm } from "@/components/modules/water-bill/tap-size-master/TapSizeForm";
import { getTapSizePagedAction } from "@/app/[locale]/water-bill/tap-size-master/actions";

export const dynamic = "force-dynamic";

export default async function AddTapSizePage() {
  const result = await getTapSizePagedAction(1, 10);

  return (
    <>
      <TapSizeMaster data={result} />
      <TapSizeForm id={null} initialData={undefined} />
    </>
  );
}
