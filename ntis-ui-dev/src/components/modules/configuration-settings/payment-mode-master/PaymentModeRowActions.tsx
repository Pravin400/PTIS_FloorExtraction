"use client";

import { useTranslations } from "next-intl";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { Tooltip } from "@/components/common/Tooltip";
import type { PaymentMode } from "@/types/paymentMode.types";

interface PaymentModeRowActionsProps {
    mode: PaymentMode;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}

export function PaymentModeRowActions({ mode, onEdit, onDelete, isDeleting }: PaymentModeRowActionsProps) {
    const t = useTranslations("paymentModeMaster");

    return (
        <>
            <Tooltip content={t("actionsTooltip.edit")} placement="top">
                <EditButton aria-label={`${t("actionsTooltip.edit")} - ${mode.paymentModeName}`} onClick={onEdit} disabled={isDeleting} />
            </Tooltip>
            <Tooltip content={t("actionsTooltip.delete")} placement="top">
                <DeleteButton aria-label={`${t("actionsTooltip.delete")} - ${mode.paymentModeName}`} onClick={onDelete} disabled={isDeleting} />
            </Tooltip>
        </>
    );
}
