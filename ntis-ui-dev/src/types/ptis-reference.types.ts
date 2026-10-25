export interface CreatePropertyResponse {
  id: string;
  propertyNo: string;
  message: string;
}

export interface WardResponse {
  wardID: string;
  wardNo: string;
  description?: string | null;
  zoneId?: number | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface CategoryResponse {
  category: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface SubCategoryResponse {
  subCategory: string;
  subCategoryType: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface OwnerTypeResponse {
  ownerType: string;
  ownerTypeEnglish: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface OwnerTitleResponse {
  ownerTitle: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface ConstructionTypeResponse {
  constructionId: string;
  description: string;
  descriptionEnglish?: string | null;
  groupID?: string | null;
  keyboardShortCutKey?: string | null;
  keyWiseSequence?: number | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface TypeOfUseResponse {
  typeOfUseID: string;
  description: string;
  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface FloorResponse {
  floorID: string;
  description?: string | null;
  sequenceNo?: number | null;
  descriptionEnglish?: string | null;
  maxFloorNo?: number | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}

