import React from "react";
import { useTranslations } from "next-intl";
import { Tooltip } from "@/components/common";
import { AlertCircle } from "lucide-react";

interface RoomSubmissionHeaderProps {
  floorNumber?: string;
  areaUnit: "sq.m" | "sq.ft";
  handleToggleUnit: () => void;
  maxRooms?: number | null;
  availableRooms?: number | null;
  displayMode?: 'modal' | 'dialog' | 'inline';
}

export const RoomSubmissionHeader: React.FC<RoomSubmissionHeaderProps> = (props) => {
  const { floorNumber, maxRooms, availableRooms, displayMode = 'modal' } = props;
  const t = useTranslations("quickDataEntry");

  if (displayMode !== 'modal') return null;

  return (
    <div className="bg-[rgba(0,102,212,0.88)] text-white p-2 flex items-center justify-between gap-2 flex-shrink-0 shadow-md rounded-t-2xl">
      <div className="flex items-center gap-2">
        {floorNumber && (
          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30 font-bold text-sm">
            {t("floor.floorLabel")} {floorNumber}
          </div>
        )}
        {/* Unit Toggle Pill */}
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 ml-2">
          {/* <button
            type="button"
            onClick={() => areaUnit !== "sq.m" && handleToggleUnit()}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${areaUnit === "sq.m" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
          >
            {t("roomSubmission.input.buttons.sqm")}
          </button>
          <button
            type="button"
            onClick={() => areaUnit !== "sq.ft" && handleToggleUnit()}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${areaUnit === "sq.ft" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
          >
            {t("roomSubmission.input.buttons.sqft")}
          </button> */}
        </div>
      </div>
      <h2 className="text-white text-lg font-bold flex-1 text-center">{t("roomSubmission.title")}</h2>
      {maxRooms && (
        <Tooltip content={<div className="p-1 text-xs">{t("floor.availableRooms")}: {availableRooms} / {maxRooms}</div>}>
          <AlertCircle className="w-5 h-5 cursor-help" />
        </Tooltip>
      )}
    </div>
  );
};
