import ShopNameDetails from "@/components/modules/property-tax/automation-dashboard/missing-data-analysis/Shop-name/ShopNameDetails";
import { getMissingShopNameAction } from "./action";

export default async function MissingShopNamePage() {
    const response = await getMissingShopNameAction();

    if (!response?.success) {
        throw new Error(response?.error);
    }

    return (
        <ShopNameDetails serverData={response?.data ?? null} />
    );
}