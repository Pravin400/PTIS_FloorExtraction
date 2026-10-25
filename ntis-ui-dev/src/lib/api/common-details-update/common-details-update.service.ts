export {
  getBulkUpdateMenuServer,
  getBulkUpdateFieldConfigServer,
  getPropertiesForFilterServer,
  getPreviewListByCategoryServer,
  getWardsPagedServer,
  getWingsForWardServer,
  getDropdownOptionsServer,
  getPropertiesByWardServer,
  getPropertiesByCategoryServer,
  getAllWingsServer,
  getFieldRegistrySchemasServer,
  getFieldRegistryTablesServer,
  getFieldRegistryColumnsServer,
  getSourceTablesServer,
  getSourceTableFieldsServer,
  getScopeOptionsServer,
  getScopeCategoryOptionsServer,
  exportExcelServer,
  getFieldRegistriesServer,
  getUpdateHistoryServer,
  exportUpdateHistoryServer,
  getUpdateHistoryDetailServer,
} from './common-details-update-queries.service';

export type { PropertyItem, WingItem, ScopeOption } from './common-details-update-queries.service';

export { executeBulkUpdateServer, addFieldRegistryServer, importExcelServer, validateExcelServer, setFieldRegistryStatusServer, updateFieldRegistryServer, addBulkUpdateDefinitionServer } from './common-details-update-mutations.service';

