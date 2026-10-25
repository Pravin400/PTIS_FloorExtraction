
import AddressDetails from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Address/AddressDetails";
import { getMissingAddressAction } from "./action";

export default async function MissingAddressPage() {
    const response = await getMissingAddressAction();
    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <AddressDetails serverData={response?.data ?? null} />
    );
}