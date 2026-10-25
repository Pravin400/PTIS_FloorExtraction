import PropertyTypeForm from "@/components/modules/property-tax/property-type-master/PropertyTypeForm";
import { getPropertyTypeByIdAction, getPropertyTypeCategoriesAction, getTypeOfUseListAction, getValidationsByPropertyTypeIdsAction } from "../../action";
import { notFound } from "next/navigation";
import React from "react";
import type { PropertyType } from "@/types/property-type.types";
import { ApiError } from "@/lib/utils/api";

// Force dynamic rendering since this page fetches data from external API
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    propertyTypeId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { propertyTypeId: propertyTypeIdParam } = await params;

  // Parse and validate the ID (Next.js route params are always strings)
  const propertyTypeId = Number(propertyTypeIdParam);
  if (!Number.isFinite(propertyTypeId) || propertyTypeId <= 0) {
    notFound();
  }

  // Fetch data, categories, typeOfUseList, and validations in parallel (optimized: only this property type's validations)
  let propertyTypeData: PropertyType;
  let categories;
  let typeOfUseList;
  let typeOfUseValidation;
  try {
    [propertyTypeData, categories, typeOfUseList, typeOfUseValidation] = await Promise.all([
      getPropertyTypeByIdAction(propertyTypeId),
      getPropertyTypeCategoriesAction(),
      getTypeOfUseListAction(),
      getValidationsByPropertyTypeIdsAction([propertyTypeId]),
    ]);
  } catch (error) {
    // Only map a genuine 404 to Next.js's notFound().
    // Other failures (auth, timeout, server error) rethrow so error.tsx
    // can display a meaningful message instead of a misleading 404 page.
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    console.error("Failed to fetch property type:", error);
    // Rethrow — Next.js will catch this and render the nearest error.tsx
    throw error;
  }

  // Get the typeOfUseIds assigned to this property type (already filtered by the action)
  const initialTypeOfUseIds = typeOfUseValidation.map((v) => v.typeOfUseId);

  return (
    <>
      <PropertyTypeForm 
        id={propertyTypeId} 
        initialData={propertyTypeData}
        categories={categories}
        typeOfUseList={typeOfUseList}
        initialTypeOfUseIds={initialTypeOfUseIds}
      />
    </>
  );
}
