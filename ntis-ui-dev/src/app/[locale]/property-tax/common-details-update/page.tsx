import CommonDetailsUpdatePage from "@/components/modules/property-tax/common-details-update/CommonDetailsUpdatePage";
import {
  getMenuItemsAction,
  getAllWardsAction,
  getAllWingsAction,
  setFieldRegistryStatusAction,
  getFieldConfigsAction,
  getFilteredPropertiesAction,
  getPreviewListByCategoryAction,
  getWingsAction,
  executeBulkUpdateAction,
  getPropertiesByWardAction,
  getPropertiesByCategoryAction,
  getScopeOptionsAction,
  getScopeCategoryOptionsAction,
  getAllZonesAction,
  getFieldRegistriesAction,
  addFieldRegistryAction,
  getFieldRegistryTablesAction,
  getFieldRegistryColumnsAction,
  updateFieldRegistryAction,
  exportExcelAction,
  getSourceTablesAction,
  getSourceTableFieldsAction,
  addBulkUpdateDefinitionAction,
  getUpdateHistoryAction,
  exportUpdateHistoryAction,
  getUpdateHistoryDetailAction,
  getExcelTemplateFieldsAction
} from "./actions";
import {
  getFieldRegistriesServer,
  getFieldRegistrySchemasServer,
  getScopeOptionsServer,
  getBulkUpdateFieldConfigServer,
  getSourceTablesServer,
  getSourceTableFieldsServer,
  getUpdateHistoryServer,
  getUpdateHistoryDetailServer,
} from "@/lib/api/common-details-update/common-details-update.service";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    field?: string;
    wardId?: string;
    wardNo?: string;
    fromProperty?: string;
    toProperty?: string;
    wing?: string;
    page?: string;
    pageNumber?: string;
    pageSize?: string;
    q?: string;
    propertyNo?: string;
    partitionNo?: string;
    scopeId?: string;
    zoneId?: string;
    sourceid?: string;
    sourceTable?: string;
    auditPage?: string;
    auditPageSize?: string;
    auditUser?: string;
    auditSearch?: string;
    activityId?: string;
  }>;
}

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function sanitizeParams(raw: Awaited<PageProps["searchParams"]>) {
  const rawPage = parseInt(raw.pageNumber ?? raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const searchTerm = raw.q?.trim() || "";
  const selectedField = raw.field?.trim() || "";
  const wardId = raw.wardId?.trim() || "";
  const wardNo = raw.wardNo?.trim() || "";

  const rawPropertyNo = raw.propertyNo?.trim() || "";
  const rawPartitionNo = raw.partitionNo?.trim() || "";
  const hasPartition = rawPartitionNo !== "" && rawPartitionNo !== "0";
  const propertyNoCombined = (rawPropertyNo && hasPartition) ? `${rawPropertyNo}-${rawPartitionNo}` : rawPropertyNo;

  const fromProperty = raw.fromProperty?.trim() || propertyNoCombined;
  const toProperty = raw.toProperty?.trim() || propertyNoCombined;
  const wing = raw.wing?.trim() || "";
  const tab = raw.tab?.trim() || "updateFields";
  const scopeId = raw.scopeId?.trim() || "";
  const zoneId = raw.zoneId?.trim() || "";
  const sourceid = raw.sourceid?.trim() || "";
  const sourceTable = raw.sourceTable?.trim() || "";
  const auditPage = Math.max(MIN_PAGE, Math.min(MAX_PAGE, Number(raw.auditPage ?? raw.pageNumber ?? raw.page) || 1));
  const auditPageSize = Math.max(MIN_PAGE, Math.min(MAX_PAGE_SIZE, Number(raw.auditPageSize ?? raw.pageSize) || 10));
  const auditUser = raw.auditUser?.trim() || "";
  const auditSearch = raw.auditSearch?.trim() || "";
  const activityId = raw.activityId?.trim() || "";

  return { pageNumber, pageSize, searchTerm, selectedField, wardId, wardNo, fromProperty, toProperty, wing, tab, scopeId, zoneId, sourceid, sourceTable, auditPage, auditPageSize, auditUser, auditSearch, activityId };
}

export default async function Page({ searchParams }: PageProps) {
  const { pageNumber, pageSize, searchTerm, selectedField, wardId, wardNo, fromProperty, toProperty, wing, tab, scopeId, zoneId, sourceid, sourceTable, auditPage, auditPageSize, auditUser, auditSearch, activityId } = sanitizeParams(await searchParams);

  const menuItems = await getMenuItemsAction();
  const isExcelUpload = tab.toLowerCase() === "excelupload";
  const defaultCode = isExcelUpload ? (selectedField || "") : (selectedField || (menuItems[0]?.updateCode || ""));

  const [wardsResult, wingsResult, initialFieldRegistries, initialSchemas, initialScopeOptions, initialFieldConfigs, initialSourceTables, initialExcelTemplateFieldsResult, initialUpdateHistory, initialAllUpdateHistory, initialUpdateHistoryDetail] = await Promise.all([
    getAllWardsAction(),
    getAllWingsAction(),
    getFieldRegistriesServer(1, -1).catch(() => ({
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: -1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false
    })),
    getFieldRegistrySchemasServer().catch(() => []),
    getScopeOptionsServer().catch(() => []),
    defaultCode ? Promise.all(
      defaultCode.split(',').map(code =>
        getBulkUpdateFieldConfigServer(code.trim()).catch(() => [])
      )
    ).then(results => {
      const flat = results.flat();
      const unique = [];
      const seen = new Set<string>();
      for (const item of flat) {
        if (!seen.has(item.fieldName)) {
          seen.add(item.fieldName);
          unique.push(item);
        }
      }
      return unique;
    }) : Promise.resolve([]),
    getSourceTablesServer().catch(() => []),
    getExcelTemplateFieldsAction().catch(() => ({ success: false, data: [] })),
    getUpdateHistoryServer({
      PageNumber: auditPage,
      PageSize: auditPageSize,
      DoneBy: auditUser,
      SearchTerm: auditSearch,
    }).catch(() => null),
    getUpdateHistoryServer({
      PageNumber: 1,
      PageSize: 1000,
      DoneBy: auditUser,
      SearchTerm: auditSearch,
    }).catch(() => null),
    activityId ? getUpdateHistoryDetailServer(activityId).catch(() => null) : Promise.resolve(null),
  ]);

  const actualSourceId = sourceid || sourceTable;
  const initialSourceTableFields = actualSourceId ? await getSourceTableFieldsServer(Number(actualSourceId)).catch(() => []) : [];

  const wardsData = wardsResult.success && wardsResult.data ? wardsResult.data : {
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: -1,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  const wingsData = wingsResult.success && wingsResult.data ? wingsResult.data : {
    items: [],
    totalCount: 0,
    pageNumber: 1,
    pageSize: -1,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };

  const actions = {
    getMenuItemsAction,
    getExcelTemplateFieldsAction,
    getFieldConfigsAction,
    getFilteredPropertiesAction,
    getPreviewListByCategoryAction,
    getWingsAction,
    executeBulkUpdateAction,
    getAllWardsAction,
    getPropertiesByWardAction,
    getPropertiesByCategoryAction,
    getAllWingsAction,
    getScopeOptionsAction,
    getScopeCategoryOptionsAction,
    getAllZonesAction,
    getFieldRegistriesAction,
    addFieldRegistryAction,
    updateFieldRegistryAction,
    getFieldRegistryTablesAction,
    getFieldRegistryColumnsAction,
    setFieldRegistryStatusAction,
    exportExcelAction,
    getSourceTablesAction,
    getSourceTableFieldsAction,
    addBulkUpdateDefinitionAction,
    getUpdateHistoryAction,
    exportUpdateHistoryAction,
    getUpdateHistoryDetailAction,
  };

  return (
    <CommonDetailsUpdatePage
      menuItems={menuItems}
      wardsData={wardsData}
      wingsData={wingsData}
      initialFieldRegistries={initialFieldRegistries}
      initialSchemas={initialSchemas}
      initialScopeOptions={initialScopeOptions}
      initialFieldConfigs={initialFieldConfigs}
      initialSourceTables={initialSourceTables}
      initialSourceTableFields={initialSourceTableFields}
      initialExcelTemplateFields={('data' in initialExcelTemplateFieldsResult ? initialExcelTemplateFieldsResult.data : []) || []}
      initialField={defaultCode}
      initialWardId={wardId}
      initialWardNo={wardNo}
      initialFromProperty={fromProperty}
      initialToProperty={toProperty}
      initialWing={wing}
      initialPage={pageNumber}
      initialPageSize={pageSize}
      initialSearchTerm={searchTerm}
      initialTab={tab}
      initialScopeId={scopeId}
      initialZoneId={zoneId}
      setFieldRegistryStatusAction={setFieldRegistryStatusAction}
      initialEditData={null}
      initialUpdateHistory={initialUpdateHistory}
      initialAllUpdateHistory={initialAllUpdateHistory}
      initialUpdateHistoryDetail={initialUpdateHistoryDetail}
      actions={actions}
    />
  );
}
