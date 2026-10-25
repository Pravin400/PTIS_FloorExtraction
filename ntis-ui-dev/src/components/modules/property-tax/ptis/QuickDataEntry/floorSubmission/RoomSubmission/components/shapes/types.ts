import { ShapeParameters } from "@/types/common-details.types";
import { RoomData } from "@/types/room-details.types";

export interface ShapeProps {
    centerX: number;
    centerY: number;
    shapeParameters: ShapeParameters;
    isParamFilled: (param: string) => boolean;
    onParameterChange: (param: string, value: string) => void;
    onNextField: () => void;
    areaUnit: "sq.m" | "sq.ft";
    selectedRoomForPlan: RoomData;
}
