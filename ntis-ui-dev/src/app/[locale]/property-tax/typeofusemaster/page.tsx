
import {
  getSubTypesPaged,
  getAllUseGroups,
  getTypesByGroupPaged,
  resolveTypeId,
} from "./actions";

import TypeOfUseMaster from
  "@/components/modules/property-tax/typeofusemaster/TypeOfUseMaster";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    groupId?: string;    // Group ID
    typeId?: string;
    pn?: string;         // SubType page number
    ps?: string;         // SubType page size
    typePn?: string;     // Type page number
    typePs?: string;     // Type page size
    q?: string;          // SubType search
    typeSearch?: string; // Type search (BACKEND)
  }>;
}) {
  // unwrap params (Next.js requirement)
  const params = await searchParams;

  /* ---------------------------------------------------
   * 1. Resolve paging + searches
   * --------------------------------------------------- */
  const pageNumber = Number(params.pn ?? 1);
  const pageSize = Number(params.ps ?? 5);

  const typePageNumber = Number(params.typePn ?? 1);
  const typePageSize = Number(params.typePs ?? 10);

  const subTypeSearch = params.q ?? "";
  const typeSearch = params.typeSearch ?? "";
  const groupId = params.groupId ?? "ALL";

  /* ---------------------------------------------------
   * 2. Load GROUPS (always full)
   * --------------------------------------------------- */
  const groupsResp = await getAllUseGroups();

  /* ---------------------------------------------------
   * 3. Load TYPES (PAGINATED BY GROUP for display)
   * --------------------------------------------------- */
  const effectiveGroupId = groupId || "ALL";
  
  const typesResp = await getTypesByGroupPaged({
    pageNumber: typePageNumber,
    pageSize: typePageSize,
    typeOfUseGroupId: effectiveGroupId === "ALL" ? undefined : (Number(effectiveGroupId) || undefined),
    searchTerm: typeSearch || undefined,
  });

  /* ---------------------------------------------------
   * 4. Resolve SELECTED TYPE ID
   * --------------------------------------------------- */
  const selectedTypeId = await (async () => {
    const typeParam = params.typeId;

    // EXPLICIT "no type selected"
    if (typeParam === "__NONE__") {
      return "";
    }

    // If we have explicit typeId in URL, use it
    if (typeParam) {
      const match = typesResp.items.find(
        (t) => String(t.typeOfUseId) === typeParam || t.typeOfUseCode === typeParam
      );
      if (match) return String(match.typeOfUseId);
      
      const resolvedId = await resolveTypeId(typeParam);
      if (resolvedId) return resolvedId;
    }

    // Default to first type from typesResp
    return String(typesResp.items?.[0]?.typeOfUseId ?? "");
  })();

  /* ---------------------------------------------------
   * 5. Build master data
   * --------------------------------------------------- */
  const masterData = {
    groups: groupsResp.items,
    types: typesResp.items,
    subTypes: [],
  };

  /* ---------------------------------------------------
   * 6. Load SUBTYPES (SERVER PAGED + SEARCH)
   * --------------------------------------------------- */
  const subTypeResp = selectedTypeId
    ? await getSubTypesPaged({
        pageNumber,
        pageSize,
        typeOfUseId: Number(selectedTypeId),
        searchTerm: subTypeSearch || undefined,
      })
    : {
        items: [],
        totalCount: 0,
        totalPages: 1,
      };

  /* ---------------------------------------------------
   * 7. Render UI
   * --------------------------------------------------- */
  return (
    <TypeOfUseMaster
      initialData={masterData}
      typesPagination={{
        paginatedTypes: typesResp.items,
        totalCount: typesResp.totalCount,
        totalPages: typesResp.totalPages,
        pageNumber: typePageNumber,
        pageSize: typePageSize,
        searchFromServer: typeSearch,
      }}
      subTypesPagination={{
        subTypes: subTypeResp.items,
        totalCount: subTypeResp.totalCount,
        totalPages: subTypeResp.totalPages,
        pageNumber: pageNumber,
        pageSize: pageSize,
      }}
      selectedTypeId={selectedTypeId}
    />
  );
}

