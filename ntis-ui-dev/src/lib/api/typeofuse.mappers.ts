import type {
  UseGroup,
  UseGroupIconKey,
  UseType,
  UseSubType,
} from "@/types/typeOfUse.types";

/** -------------------- ICON MAPPING (GROUP) -------------------- */
export function iconKeyToApi(iconKey: UseGroupIconKey): string {
  switch (iconKey) {
    case "grid":
      return "layout-grid-icon";
    case "home":
      return "home-icon";
    case "building":
      return "building-icon";
    case "factory":
      return "factory-icon";
    case "school":
      return "school-icon";
    case "leaf":
      return "wheat-icon";
    case "map":
      return "map-pin-icon";
    case "plots":
      return "land-plot-icon";
    case "parking":
      return "parking-icon";
    case "other":
      return "layers-icon";
    default:
      return "home-icon";
  }
}

/** -------------------- MAP API -> UI (GROUP) -------------------- */
export function mapApiGroupToUi(g: Record<string, unknown>): UseGroup {
  const countOfTypes = Number(g.countOfTypes ?? g.CountOfTypes ?? 0);

  return {
    typeOfUseGroupId: Number(g.id ?? g.typeOfUseGroupId ?? g.typeOfUseGroupID ?? 0),
    typeOfUseGroupCode: String(g.typeOfUseGroupCode ?? ""),
    groupName: String(g.groupName ?? ""),
    groupIcon: String(g.groupIcon ?? "home-icon"),
    isActive: typeof g.isActive === "boolean" ? g.isActive : (typeof g.IsActive === "boolean" ? g.IsActive : true),
    isOpenPlot: typeof g.isOpenPlot === "boolean" ? g.isOpenPlot : (typeof g.IsOpenPlot === "boolean" ? g.IsOpenPlot : false),
    createdDate: typeof g.createdDate === "string" ? g.createdDate : (typeof g.CreatedDate === "string" ? g.CreatedDate : undefined),
    updatedDate: typeof g.updatedDate === "string" ? g.updatedDate : (typeof g.UpdatedDate === "string" ? g.UpdatedDate : null),
    countOfTypes,
    // UI computed field
    status: (g.isActive === false || g.IsActive === false) ? "Inactive" : "Active",
  };
}

/** -------------------- MAP API -> UI (TYPE) -------------------- */
export function mapApiTypeToUi(t: Record<string, unknown>): UseType {
  const categoryId = t.typeOfUseCategoryId ?? t.TypeOfUseCategoryId;
  return {
    typeOfUseId: Number(t.id ?? t.typeOfUseId ?? t.typeOfUseID ?? 0),
    typeOfUseCode: String(t.typeOfUseCode ?? ""),
    description: String(t.description ?? ""),
    type: String(t.type ?? ""),
    typeOfUseGroupId: Number(t.typeOfUseGroupId ?? t.typeOfUseGroupID ?? t.groupId ?? 0),
    searchSequence: Number(t.searchSequence ?? t.SearchSequence ?? 0),
    typeOfUseCategoryId: categoryId !== undefined && categoryId !== null ? Number(categoryId) : null,
    isActive: typeof t.isActive === "boolean" ? t.isActive : (typeof t.IsActive === "boolean" ? t.IsActive : true),
    createdDate: typeof t.createdDate === "string" ? t.createdDate : (typeof t.CreatedDate === "string" ? t.CreatedDate : undefined),
    updatedDate: typeof t.updatedDate === "string" ? t.updatedDate : (typeof t.UpdatedDate === "string" ? t.UpdatedDate : null),
    // UI computed field
    status: (t.isActive === false || t.IsActive === false) ? "Inactive" : "Active",
  };
}

/** -------------------- MAP API -> UI (SUBTYPE) -------------------- */
export function mapApiSubTypeToUi(s: Record<string, unknown>): UseSubType {
  const categoryId = s.typeOfUseCategoryId ?? s.TypeOfUseCategoryId;
  return {
    subTypeOfUseId: Number(s.id ?? s.subTypeOfUseId ?? s.subTypeOfUseID ?? 0),
    description: String(s.description ?? ""),
    typeOfUseId: Number(s.typeOfUseId ?? s.typeOfUseID ?? s.typeId ?? 0),
    searchSequence: Number(s.searchSequence ?? s.SearchSequence ?? 0),
    typeOfUseCategoryId: categoryId !== undefined && categoryId !== null ? Number(categoryId) : null,
    isActive: typeof s.isActive === "boolean" ? s.isActive : (typeof s.IsActive === "boolean" ? s.IsActive : true),
    createdDate: typeof s.createdDate === "string" ? s.createdDate : (typeof s.CreatedDate === "string" ? s.CreatedDate : undefined),
    updatedDate: typeof s.updatedDate === "string" ? s.updatedDate : (typeof s.UpdatedDate === "string" ? s.UpdatedDate : null),
    // UI computed field
    status: (s.isActive === false || s.IsActive === false) ? "Inactive" : "Active",
  };
}
