import type {
  Floor,
  SubFloor,
  ConstructionType,
  TypeOfUse,
  SubTypeOfUse
} from "@/types/OldDetails/property-old-details.types";
import { SearchSelectOption } from "@/types/OldDetails/property-old-floor-info.types";

export const transformFloorOptions = (options: Floor[]): SearchSelectOption[] => {
  return options.map(opt => ({
    label: `${opt.floorCode} - ${opt.description}`,
    value: String(opt.id)
  }));
};

export const transformSubFloorOptions = (options: SubFloor[]): SearchSelectOption[] => {
  return options.map(opt => ({
    label: `${opt.subFloorCode} - ${opt.description}`,
    value: String(opt.id)
  }));
};

export const transformConstructionTypeOptions = (options: ConstructionType[]): SearchSelectOption[] => {
  return options.map(opt => ({
    label: `${opt.constructionCode} - ${opt.description}`,
    value: String(opt.id)
  }));
};

export const transformUseOptions = (options: TypeOfUse[]): SearchSelectOption[] => {
  return options.map(opt => ({
    label: `${opt.typeOfUseCode} - ${opt.description}`,
    value: String(opt.id)
  }));
};

export const transformSubUseOptions = (options: SubTypeOfUse[]): SearchSelectOption[] => {
  return options.map(opt => ({
    label: opt.description,
    value: String(opt.id)
  }));
};
