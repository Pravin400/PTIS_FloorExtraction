import { notFound } from "next/navigation";
import {
  getConnectionCategoryByIdAction,
  getConnectionCategoryPagedAction,
  getBillingFrequencyOptionsAction,
} from "@/app/[locale]/water-bill/connection-category-master/actions";
import { ConnectionCategoryMaster } from "@/components/modules/water-bill/connection-category-master";
import { ConnectionCategoryForm } from "@/components/modules/water-bill/connection-category-master/ConnectionCategoryForm";

export const dynamic = "force-dynamic";

export default async function EditConnectionCategoryPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const connectionCategoryId = Number(id);
  if (!Number.isFinite(connectionCategoryId) || connectionCategoryId <= 0) notFound();

  const [result, initialData, billingFrequencies] = await Promise.all([
    getConnectionCategoryPagedAction(1, 10),
    getConnectionCategoryByIdAction(connectionCategoryId).catch(() => null),
    getBillingFrequencyOptionsAction(),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <>
      <ConnectionCategoryMaster data={result} />
      <ConnectionCategoryForm
        id={connectionCategoryId}
        initialData={initialData}
        billingFrequencies={billingFrequencies}
      />
    </>
  );
}
