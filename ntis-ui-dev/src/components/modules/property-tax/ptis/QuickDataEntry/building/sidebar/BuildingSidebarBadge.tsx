import React from "react";
import { AlertCircle, EyeOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/common";
import { CertificateData } from "@/types/building-permission.types";
import { isCertificateApplied } from "./sidebar.helpers";

interface BuildingSidebarBadgeProps {
    cert: CertificateData;
    validationErrors?: Record<number, string>;
    t: (key: string) => string;
}

export const BuildingSidebarBadge: React.FC<BuildingSidebarBadgeProps> = ({
    cert,
    validationErrors,
    t,
}) => {
    const errorMsg = validationErrors?.[cert.certificateTypeId];
    if (errorMsg) {
        return (
            <Badge
                variant="destructive"
                size="sm"
                icon={AlertCircle}
                className="bg-red-50 text-red-700 border-red-200 animate-pulse font-bold"
            >
                {errorMsg}
            </Badge>
        );
    }

    if (cert.customStatusBadge) {
        const { label, variant } = cert.customStatusBadge;
        const badgeClass =
            variant === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : variant === "purple"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : variant === "info"
                ? "bg-sky-50 text-sky-700 border-sky-200"
                : variant === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-600 border-slate-200 font-medium";

        return (
            <Badge
                variant={variant === "purple" ? "info" : variant}
                size="sm"
                className={badgeClass}
            >
                {label}
            </Badge>
        );
    }

    const isApplied = isCertificateApplied(cert);
    if (!cert.enabled && !isApplied) {
        return (
            <Badge variant="secondary" size="sm" icon={EyeOff}>
                {t("building.statusDisabled")}
            </Badge>
        );
    }

    const hasNumber = cert.number && cert.number.trim() !== "";
    const hasDate = cert.date && cert.date.trim() !== "";
    const hasDoc = !!cert.documentGuid;

    if (hasNumber && hasDate && hasDoc) {
        return (
            <Badge
                variant="success"
                size="sm"
                icon={ShieldCheck}
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
                {t("building.statusActiveUploaded")}
            </Badge>
        );
    }

    const hasAnyData = !!(hasNumber || hasDate || hasDoc || cert.pendingFile);
    if (hasAnyData) {
        return (
            <Badge
                variant="warning"
                size="sm"
                icon={AlertCircle}
                className="bg-amber-50 text-amber-700 border-amber-200"
            >
                {t("building.statusIncomplete") || "Incomplete"}
            </Badge>
        );
    }

    return (
        <Badge
            variant="secondary"
            size="sm"
            className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
        >
            {t("building.statusNotConfigured") || "Not Configured"}
        </Badge>
    );
};
