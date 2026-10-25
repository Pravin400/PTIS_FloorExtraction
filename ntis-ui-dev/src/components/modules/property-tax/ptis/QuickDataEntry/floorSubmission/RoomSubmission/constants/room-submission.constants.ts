import { ShapeParameters, RoomFormData } from "@/types/common-details.types";
import { OffsetData } from "@/types/offset-details.types";

export const INITIAL_SHAPE_PARAMETERS: ShapeParameters = {
  length: "",
  width: "",
  radius: "",
  base: "",
  height: "",
  side: "",
  base1: "",
  base2: ""
};

export const INITIAL_ROOM_FORM_STATE: RoomFormData = {
  roomNo: "",
  length: "0",
  width: "0",
  roomCount: "1",
  offsetMinus: "No",
  outer: "No",
  remark: "-Select-",
  utilities: "-Select-",
  shape: "-Select-",
  roomTypeId: "",
};

export const INITIAL_OFFSET_DATA: OffsetData = {
  length: "",
  width: "",
  radius: "",
  base: "",
  height: "",
  side: "",
  base1: "",
  base2: "",
  area: 0,
  shape: "Rectangle",
  operation: "subtract",
  shapeType: "Rectangle"
};

export const OFFSET_OPERATIONS = {
  ADD: "add",
  SUBTRACT: "subtract",
} as const;

export const SHAPE_TYPES = {
  RECTANGLE: "Rectangle",
  SQUARE: "Square",
  TRIANGLE: "Triangle",
  TRAPEZOID: "Trapezoid",
  CIRCLE: "Circle",
  SEMI_CIRCLE: "Semi Circle",
  QUARTER_CIRCLE: "Quarter Circle",
} as const;
export const SHAPE_OPTIONS = [
  { label: "rectangle", value: "Rectangle" },
  { label: "square", value: "Square" },
  { label: "triangle", value: "Triangle" },
  { label: "trapezoid", value: "Trapezoid" },
  { label: "circle", value: "Circle" },
  { label: "semiCircle", value: "Semi Circle" },
  { label: "quarterCircle", value: "Quarter Circle" },
];
