import { notFound } from "next/navigation";
import {
  getTapSizeByIdAction,
  getTapSizePagedAction,
} from "@/app/[locale]/water-bill/tap-size-master/actions";
import { TapSizeMaster } from "@/components/modules/water-bill/tap-size-master";
import { TapSizeForm } from "@/components/modules/water-bill/tap-size-master/TapSizeForm";

export const dynamic = "force-dynamic";

export default async function EditTapSizePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tapSizeId = Number(id);
  if (!Number.isFinite(tapSizeId) || tapSizeId <= 0) notFound();

  const [result, initialData] = await Promise.all([
    getTapSizePagedAction(1, 10),
    getTapSizeByIdAction(tapSizeId).catch(() => null),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <>
      <TapSizeMaster data={result} />
      <TapSizeForm id={tapSizeId} initialData={initialData} />
    </>
  );
}
