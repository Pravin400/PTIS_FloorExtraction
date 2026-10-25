export type RawMasterSearchParams = {
  [key: string]: string | string[] | undefined;
};

export type NormalizedMasterSearchParams = {
  pageSize?: string;
  page?: string;
  search?: string;
  department?: string;
  status?: string;
  drawer?: string;
  id?: string;
};

function getFirstStringValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === 'string' ? value : undefined;
}

export function normalizeMasterSearchParams(
  searchParams: RawMasterSearchParams
): NormalizedMasterSearchParams {
  return {
    pageSize: getFirstStringValue(searchParams.pageSize),
    page: getFirstStringValue(searchParams.page),
    search: getFirstStringValue(searchParams.search),
    department: getFirstStringValue(searchParams.department),
    status: getFirstStringValue(searchParams.status),
    drawer: getFirstStringValue(searchParams.drawer),
    id: getFirstStringValue(searchParams.id),
  };
}

export function buildMasterUrl(
  locale: string,
  searchParams: NormalizedMasterSearchParams
): string {
  const params = new URLSearchParams();

  // Always include page and pageSize
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.pageSize) params.set('pageSize', searchParams.pageSize);
  
  // Optional filters
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.department && searchParams.department !== 'all') {
    params.set('department', searchParams.department);
  }
  if (searchParams.status && searchParams.status !== 'all') {
    params.set('status', searchParams.status);
  }

  // Optional drawer state
  if (searchParams.drawer) params.set('drawer', searchParams.drawer);
  if (searchParams.id) params.set('id', searchParams.id);

  const basePath = `/${locale}/configuration-settings/grievance-category-master`;
  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function buildMasterPathWithSearchParams(
  locale: string,
  searchParams: URLSearchParams
): string {
  const basePath = `/${locale}/configuration-settings/grievance-category-master`;
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}