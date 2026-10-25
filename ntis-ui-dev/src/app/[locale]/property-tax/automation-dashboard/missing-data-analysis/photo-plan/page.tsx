import MissingPhotoPlanDetails from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Photo-Plan/MissingPhotoPlanDetails";
import { getMissingPhotoPlanAction } from "./action";

export default async function PhotoPlanPage() {
  const response = await getMissingPhotoPlanAction();

  if (!response?.success) {
    throw new Error(response?.error);
  }

  return (
    <MissingPhotoPlanDetails serverData={response?.data ?? null} />
  );
}