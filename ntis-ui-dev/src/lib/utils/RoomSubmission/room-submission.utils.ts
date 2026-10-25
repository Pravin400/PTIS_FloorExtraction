import {
  ShapeParameters,
  RoomFormData
} from "@/types/common-details.types";
import { OffsetData } from "@/types/offset-details.types";
import { RoomData } from "@/types/room-details.types";
import {
  calculateSingleShapeArea,
  calculateNetOffsetArea
} from "@/lib/utils/RoomSubmission/room-calculation.util";
import { validateRoomDetails } from "@/lib/utils/RoomSubmission/room-validation.utils";

export interface ParameterField {
  key: keyof ShapeParameters;
  label: string;
}

export const getParameterFields = (shape: string): ParameterField[] => {
  switch (shape) {
    case "Rectangle":
      return [
        { key: "length", label: "Length" },
        { key: "width", label: "Width" },
      ];
    case "Square":
      return [{ key: "side", label: "Side" }];
    case "Triangle":
      return [
        { key: "base", label: "Base" },
        { key: "height", label: "Height" },
      ];
    case "Trapezoid":
      return [
        { key: "base1", label: "Base 1" },
        { key: "base2", label: "Base 2" },
        { key: "height", label: "Height" },
      ];
    case "Circle":
    case "Semi Circle":
    case "Quarter Circle":
      return [{ key: "radius", label: "Radius" }];
    default:
      return [];
  }
};

export const getDimensionsString = (offset: OffsetData, areaUnit: string = "sq.m"): string => {
  const unitSuffix = areaUnit === "sq.ft" ? "ft" : "m";
  const rawType = offset.shapeType || offset.shape || offset.type || "Rectangle";
  const type = rawType.toLowerCase();

  const getParam = (key: string) => {
    const p = (offset.shapeParams || (offset as unknown as Record<string, unknown>).shapeParameters || offset.parameters || {}) as Record<string, unknown>;
    const val = p[key] || (offset as unknown as Record<string, unknown>)[key];
    return val || 0;
  };

  if (type === "rectangle" || type === "rectangular") return `${getParam('length')}${unitSuffix} x ${getParam('width')}${unitSuffix}`;
  if (type === "square") return `${getParam('side')}${unitSuffix} x ${getParam('side')}${unitSuffix}`;
  if (type === "triangle") return `b=${getParam('base')}${unitSuffix}, h=${getParam('height')}${unitSuffix}`;
  if (type === "trapezoid") return `b1=${getParam('base1')}${unitSuffix}, b2=${getParam('base2')}${unitSuffix}, h=${getParam('height')}${unitSuffix}`;
  return `${getParam('length')}${unitSuffix} x ${getParam('width')}${unitSuffix}`;
};

export const calculateRoomArea = (formData: RoomFormData, shapeParameters: ShapeParameters) => {
  return calculateSingleShapeArea(formData.shape, shapeParameters, formData.length, formData.width);
};

export const calculateRoomTotal = (
  area: number,
  roomCountVal: string | number,
  offsets: OffsetData[],
  outer?: string | boolean
) => {
  const roomCount = typeof roomCountVal === "string" ? parseInt(roomCountVal) || 1 : roomCountVal;
  const netOffset = calculateNetOffsetArea(offsets);
  const isOuter = outer === "Yes" || outer === true;
  
  let remainingArea = area - netOffset;
  if (isOuter) {
    remainingArea = remainingArea * 0.8;
  }
  return remainingArea * roomCount;
};

export const isOffsetValid = (offsetData: OffsetData, selectedShape: string): boolean => {
  if (selectedShape === "Rectangle") return !!(offsetData.length && offsetData.width && offsetData.area > 0);
  if (selectedShape === "Square") return !!(offsetData.side && offsetData.area > 0);
  if (selectedShape === "Triangle") return !!(offsetData.base && offsetData.height && offsetData.area > 0);
  if (selectedShape === "Trapezoid") return !!(offsetData.base1 && offsetData.base2 && offsetData.height && offsetData.area > 0);
  if (["Circle", "Semi Circle", "Quarter Circle"].includes(selectedShape)) return !!(offsetData.radius && offsetData.area > 0);
  return false;
};

export const validateRoomInput = (field: string, value: string, formData: RoomFormData, availableRooms: number | null) => {
  if (field === "shape") return null; // Shape parameter validation happens on submit/save
  const tempFormData = { ...formData, [field]: value };
  const { errors } = validateRoomDetails(
    tempFormData as unknown as Partial<RoomData>,
    availableRooms,
    0 // Default baseArea for per-field validation
  );
  return errors[field] || null;
};
