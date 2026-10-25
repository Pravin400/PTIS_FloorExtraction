
import { PropertyTypeForm } from "@/components/modules/property-tax/property-type-master";
import { getPropertyTypeCategoriesAction, getTypeOfUseListAction, fetchPropertyTypePagedServerAction } from "../action";
import React from "react";
import type { PropertyType } from "@/types/property-type.types";

// Force dynamic rendering since this page fetches data from external API
export const dynamic = "force-dynamic";

export default async function AddPage(): Promise<React.ReactElement> {
  const [categories, typeOfUseList, propertyTypesResponse] = await Promise.all([
    getPropertyTypeCategoriesAction(),
    getTypeOfUseListAction(),
    // The backend API does not support sorting by searchSequence. 
    // Fetch all records (pageSize = -1) to calculate max sequence on the client/server side.
    fetchPropertyTypePagedServerAction(1, -1, undefined, undefined, undefined),
  ]);

  let maxSearchSequence = 0;
  if (propertyTypesResponse?.items?.length) {
    maxSearchSequence = propertyTypesResponse.items.reduce((max, item) => {
      const seq = item.searchSequence || 0;
      return seq > max ? seq : max;
    }, 0);
  }

  const initialData = {
    id: 0,
    propertyDescription: "",
    type: "",
    propertyTypeGroup: null,
    propertyTypeCategoryId: 0,
    searchSequence: maxSearchSequence > 0 ? maxSearchSequence + 1 : 1,
    isActive: true,
  } as PropertyType;

  return <PropertyTypeForm id={null} initialData={initialData} categories={categories} typeOfUseList={typeOfUseList} initialTypeOfUseIds={[]} />;
}
