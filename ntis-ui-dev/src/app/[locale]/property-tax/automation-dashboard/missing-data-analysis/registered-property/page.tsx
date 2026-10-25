import MissingRegisteredProperty from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Registered-Property/MissingRegisteredProperty";
import { getMissingRegisteredPropertyAction } from "./action";

export default async function RegisteredPropertyPage() {
    const response = await getMissingRegisteredPropertyAction();

    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <MissingRegisteredProperty serverData={response?.data ?? null} />
    );
}
