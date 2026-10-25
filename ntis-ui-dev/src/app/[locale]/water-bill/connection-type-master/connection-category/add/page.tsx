import { ConnectionCategoryMaster } from "@/components/modules/water-bill/connection-category-master";
import { ConnectionCategoryForm } from "@/components/modules/water-bill/connection-category-master/ConnectionCategoryForm";
import {
  getConnectionCategoryPagedAction,
  getBillingFrequencyOptionsAction,
} from "@/app/[locale]/water-bill/connection-category-master/actions";

export const dynamic = "force-dynamic";

export default async function AddConnectionCategoryPage() {
  const [result, billingFrequencies] = await Promise.all([
    getConnectionCategoryPagedAction(1, 10),
    getBillingFrequencyOptionsAction(),
  ]);

  return (
    <>
      <ConnectionCategoryMaster data={result} />
      <ConnectionCategoryForm
        id={null}
        initialData={undefined}
        billingFrequencies={billingFrequencies}
      />
    </>
  );
}
