import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useTaxRecalculationListener(societyDetailId?: number | null) {
    const router = useRouter();

    useEffect(() => {
        const handleCompleted = (e: Event) => {
            const customEvent = e as CustomEvent<{ societyDetailId?: number | null }>;
            if (
                !customEvent.detail?.societyDetailId ||
                !societyDetailId ||
                customEvent.detail.societyDetailId === societyDetailId
            ) {
                router.refresh();
            }
        };

        window.addEventListener("tax-recalculation-completed", handleCompleted);
        return () => {
            window.removeEventListener("tax-recalculation-completed", handleCompleted);
        };
    }, [router, societyDetailId]);
}
