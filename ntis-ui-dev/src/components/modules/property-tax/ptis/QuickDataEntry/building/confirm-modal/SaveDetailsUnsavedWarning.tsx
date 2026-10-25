import React from "react";
import { AlertTriangle } from "lucide-react";
import { IncompleteFloor } from "./confirm-modal.types";

interface SaveDetailsUnsavedWarningProps {
    incompleteFloors?: IncompleteFloor[];
    t: (key: string) => string;
}

export const SaveDetailsUnsavedWarning: React.FC<SaveDetailsUnsavedWarningProps> = ({
    incompleteFloors,
    t,
}) => {
    return (
        <>
            <p className="mt-3 text-sm text-slate-600 text-center max-w-[420px] leading-relaxed font-semibold">
                {t("building.unsavedChangesDesc") ||
                    "You have unsaved changes in the Building Permission tab. Do you want to discard them, or continue editing?"}
            </p>

            {incompleteFloors && incompleteFloors.length > 0 && (
                <div className="mt-5 w-full bg-amber-50/40 border border-amber-200 rounded-xl p-4 shadow-sm space-y-2.5 text-left max-h-[200px] overflow-y-auto scrollbar-thin">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>{t("building.incompleteFloorsWarning")}</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-700 text-xs pl-2 font-semibold">
                        {incompleteFloors.map((inf, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>
                                    <strong className="text-slate-800">{inf.floorName}</strong>: {inf.certificateNames.join(", ")}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
};
