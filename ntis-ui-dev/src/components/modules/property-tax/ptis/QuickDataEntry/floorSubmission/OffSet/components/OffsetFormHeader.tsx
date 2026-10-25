import React from 'react';
import { Layers, X } from "lucide-react";
import { Button } from "@/components/common/ActionButton";
import { useTranslations } from "next-intl";

interface OffsetFormHeaderProps {
    roomNo: string | undefined;
    onClose: () => void;
}

export const OffsetFormHeader: React.FC<OffsetFormHeaderProps> = ({
    roomNo,
    onClose,
}) => {
    const t = useTranslations("quickDataEntry");

    return (
        <div className="bg-gradient-to-r from-[#0078D4] via-[#0096D9] to-[#00BFFF] text-white p-3 flex-shrink-0 shadow-lg">
            <h2 className="sr-only">{t("offset.title")}</h2>
            <p className="sr-only">
                {t("roomSubmission.table.offsetDetails")}
            </p>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                    <span className="text-xs font-semibold text-white">{t("offset.roomNo")}</span>
                    <span className="text-sm font-bold text-white bg-white/30 px-2.5 py-0.5 rounded-md">
                        {roomNo || "-"}
                    </span>
                </div>

                <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                    <Layers className="w-4 h-4 animate-pulse" />
                    <h2 className="text-white text-sm font-bold tracking-wide">
                        {t("offset.title")}
                    </h2>
                </div>

                <div className="flex justify-end pr-1 min-w-[120px]">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        icon={X}
                        className="h-8 w-8 p-0 hover:bg-white/20 rounded-full transition-colors text-white border border-white/30 bg-white/10"
                    />
                </div>
            </div>
        </div>
    );
};
