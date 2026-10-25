import React from "react";
import { TargetFloor } from "./confirm-modal.types";
import { formatDateToDDMMYYYY } from "./date.utils";

interface SaveDetailsFloorsTableProps {
    certificateName?: string;
    certificateNumber?: string;
    certificateDate?: string;
    targetFloors?: TargetFloor[];
    isPropertyWideGlobal?: boolean;
    deselectedFloorIds: Set<number>;
    handleSelectAll: () => void;
    handleSelectRow: (id: number) => void;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    t: (key: string) => string;
}

export const SaveDetailsFloorsTable: React.FC<SaveDetailsFloorsTableProps> = ({
    certificateName,
    certificateNumber,
    certificateDate,
    targetFloors = [],
    isPropertyWideGlobal = false,
    deselectedFloorIds,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    isSomeSelected,
    t,
}) => {
    return (
        <div className="mt-6 w-full bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-inner space-y-3.5 text-sm text-slate-700">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
                    {t("building.confirmCertificateLabel")}:
                </span>
                <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                    {certificateName}
                </span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
                    {t("building.confirmCertNumberLabel")}:
                </span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 border border-slate-100 rounded shadow-sm text-xs">
                    {certificateNumber || "—"}
                </span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">
                    {t("building.confirmCertDateLabel")}:
                </span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 border border-slate-100 rounded shadow-sm text-xs">
                    {formatDateToDDMMYYYY(certificateDate)}
                </span>
            </div>
            <div className="pt-1">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs block mb-2">
                    {t("building.confirmApplyingToFloorsLabel")}:
                </span>
                {isPropertyWideGlobal ? (
                    <div className="space-y-2">
                        <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 border border-amber-100 rounded block text-xs w-fit">
                            {t("building.confirmPropertyWideGlobalLabel")}
                        </span>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-800 leading-relaxed">
                            {t("building.confirmPropertyWideGlobalWarning") ||
                                "Warning: All floors already have floor-wise certificates attached. Applying this certificate property-wide will override the floor-wise certificates on all floors. Do you want to apply it property-wide?"}
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl bg-white scrollbar-thin">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100/85 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 bg-slate-100 z-10 select-none">
                                    <th className="p-2.5 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={(el) => {
                                                if (el) {
                                                    el.indeterminate = isSomeSelected;
                                                }
                                            }}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-2.5">{t("floor.floor")}</th>
                                    <th className="p-2.5">{t("floor.conType")}</th>
                                    <th className="p-2.5">{t("floor.use")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                {targetFloors.map((f) => {
                                    const isChecked = !deselectedFloorIds.has(f.propertyDetailsId);
                                    return (
                                        <tr
                                            key={f.propertyDetailsId}
                                            onClick={() => handleSelectRow(f.propertyDetailsId)}
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                                                isChecked ? "bg-blue-50/20" : ""
                                            }`}
                                        >
                                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleSelectRow(f.propertyDetailsId)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-2.5 font-bold text-slate-800">
                                                {f.floorDescription}
                                                {f.subFloorDescription ? ` - ${f.subFloorDescription}` : ""}
                                            </td>
                                            <td className="p-2.5 text-slate-600">
                                                {f.constructionTypeDescription || "—"}
                                            </td>
                                            <td className="p-2.5 text-slate-600">
                                                {f.typeOfUseDescription || "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
