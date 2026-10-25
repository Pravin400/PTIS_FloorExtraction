import React from "react";
import { PropertyTypeMaster } from "@/components/modules/property-tax/property-type-master";
import { fetchPropertyTypePagedServerAction, getPropertyTypeCategoriesAction, getTypeOfUseListAction, getValidationsByPropertyTypeIdsAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";

// Force dynamic rendering since this page fetches data from external API
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

/** Allowed column names accepted by the server action / API */
const ALLOWED_SORT_COLUMNS = [
  "propertyDescription",
  "descriptionEnglish",
  "propertyDescriptionEnglish",
  "type",
  "propertyTypeGroup",
] as const;

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(params, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });
  
  // Fetch paginated data and categories first
  const [result, categories, typeOfUseList] = await Promise.all([
    fetchPropertyTypePagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder),
    getPropertyTypeCategoriesAction(),
    getTypeOfUseListAction(),
  ]);
  
  // Only fetch validations for the property types on the current page (performance optimization)
  const propertyTypeIds = result.items.map((item) => item.id);
  const typeOfUseValidation = propertyTypeIds.length > 0
    ? await getValidationsByPropertyTypeIdsAction(propertyTypeIds)
    : [];
  
  return (
    <PropertyTypeMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={sortBy}
      sortOrder={sortOrder}
      categories={categories}
      typeOfUseList={typeOfUseList}
      typeOfUseValidation={typeOfUseValidation}
    />
  );
}
