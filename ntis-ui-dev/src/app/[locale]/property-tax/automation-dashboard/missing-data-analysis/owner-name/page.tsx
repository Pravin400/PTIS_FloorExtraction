import OwnerNameDetails from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/owner-name/OwnerNameDetails";
import { getMissingOwnerNameAction } from "./action";

export default async function MissingOwnerNamePage() {
    const response = await getMissingOwnerNameAction();

    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <OwnerNameDetails serverData={response?.data ?? null} />
    );
}