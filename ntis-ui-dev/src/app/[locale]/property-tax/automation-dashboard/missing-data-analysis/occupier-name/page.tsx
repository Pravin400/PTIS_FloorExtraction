import MissingOccupierName from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Occupier-Name/MissingOccupierName";
import { getMissingOccupierNameAction } from "./action";

export default async function MissingOccupierNamePage() {
    const response = await getMissingOccupierNameAction();

    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <MissingOccupierName serverData={response?.data ?? null} />
    );
}