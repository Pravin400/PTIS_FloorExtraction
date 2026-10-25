import React from 'react';
import { useTranslations } from "next-intl";
import { Button } from "@/components/common/ActionButton";

interface OffsetFormFooterProps {
    onOk: () => void;
    onClose: () => void;
    disableOk: boolean;
}

export const OffsetFormFooter: React.FC<OffsetFormFooterProps> = ({
    onOk,
    onClose,
    disableOk,
}) => {
    const t = useTranslations("quickDataEntry");

    return (
        <div className="flex gap-3 justify-center items-center py-3 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 border-t border-blue-200">
            <Button
                id="offset-ok-button"
                data-offset-button="ok"
                onClick={onOk}
                disabled={disableOk}
                className="bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] text-white px-6 py-2 text-xs font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {t("offset.actions.ok")}
            </Button>
            <Button
                id="offset-cancel-button"
                data-offset-button="close"
                onClick={onClose}
                variant="secondary"
                className="border border-gray-400 text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 px-6 py-2 text-xs font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 min-w-[100px]"
                onKeyDown={(e) => {
                    if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault();
                        const selectBtn = document.querySelector('#offset-shape-select-container button[role="combobox"]') as HTMLButtonElement | null;
                        if (selectBtn) {
                            selectBtn.focus();
                        }
                    }
                }}
            >
                {t("offset.actions.close")}
            </Button>
        </div>
    );
};
