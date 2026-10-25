import React from "react";
import { useTranslations } from "next-intl";
import { Button, Tooltip } from "@/components/common";
import { AlertCircle, Layers } from "lucide-react";

interface RoomSubmissionHeaderProps {
  floorNumber?: string;
  areaUnit: "sq.m" | "sq.ft";
  handleToggleUnit: () => void;
  maxRooms?: number | null;
  availableRooms?: number | null;
  displayMode?: 'modal' | 'dialog' | 'inline';
}

export const RoomSubmissionHeader: React.FC<RoomSubmissionHeaderProps> = ({
  floorNumber: _floorNumber, areaUnit, handleToggleUnit, maxRooms, availableRooms, displayMode = 'modal'
}) => {
  const t = useTranslations("quickDataEntry");
  const tAQC = useTranslations("appartmentQC");

  if (displayMode !== 'modal') return null;

  return (
    <div className="bg-[rgba(0,102,212,0.88)] text-white p-2 flex items-center justify-between gap-2 flex-shrink-0 shadow-md rounded-t-2xl">
      <div className="flex items-center gap-2">
        <h2 className="text-base text-white font-bold flex items-center gap-2 text-blue-900">
          <Layers className="w-4 h-4 text-white" />
          {tAQC('drawer.roomWiseSubmission')}
        </h2>
        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 ml-2">
          <Button
            variant="ghost" size="xs"
            onClick={() => areaUnit !== "sq.m" && handleToggleUnit()}
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${areaUnit === "sq.m" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
          >
            {t("roomSubmission.input.buttons.sqm")}
          </Button>
          <Button
            variant="ghost" size="xs"
            onClick={() => areaUnit !== "sq.ft" && handleToggleUnit()}
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${areaUnit === "sq.ft" ? "bg-white text-blue-600" : "text-white hover:bg-white/20"}`}
          >
            {t("roomSubmission.input.buttons.sqft")}
          </Button>
        </div>
      </div>
      {maxRooms && (
        <Tooltip content={<div className="p-1 text-xs">{t("floor.availableRooms")}: {availableRooms} / {maxRooms}</div>}>
          <AlertCircle className="w-5 h-5 cursor-help" />
        </Tooltip>
      )}
    </div>
  );
};
