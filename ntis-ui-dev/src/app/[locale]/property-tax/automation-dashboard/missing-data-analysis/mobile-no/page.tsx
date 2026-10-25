import MobileNoDetails from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Mobile-No/MobileNoDetails";
import { getMissingMobileNoAction } from "./action";

export default async function MissingMobileNoPage() {
    const response = await getMissingMobileNoAction();

    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <MobileNoDetails serverData={response?.data ?? null} />
    );
}