"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddButton } from "@/components/common/ActionButtons";
import { useTranslations } from "next-intl";
import PaymentModeForm from "./PaymentModeForm";

export function PaymentModeAddButton() {
    const router = useRouter();
    const t = useTranslations("paymentModeMaster");
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <>
            <AddButton onClick={() => setIsFormOpen(true)} label={t("addLabel")} />

            <PaymentModeForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                editingMode={null}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </>
    );
}
