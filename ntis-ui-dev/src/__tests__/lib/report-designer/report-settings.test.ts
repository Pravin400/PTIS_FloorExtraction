import { describe, expect, it } from 'vitest';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  applyDesignerReportSettings,
  buildDesignerReportSettings,
} from '@/lib/utils/reports/designer/report-settings';

describe('native report settings model', () => {
  it('builds editable settings from a classic report definition', () => {
    const definition = createBlankClassicReportDefinition('TaxReport', 'Tax Report');
    definition.ntis = {
      dataSourceCode: 'PROPERTY_TAX',
      dataProviderCode: 'PropertyTaxDataProvider',
      moduleId: 7,
      moduleName: 'Property Tax',
      tenantScope: 'CurrentTenant',
      parameters: [
        {
          key: 'zoneId',
          label: 'Zone',
          type: 'select',
          isRequired: true,
          sortOrder: 0,
        },
      ],
    };

    const settings = buildDesignerReportSettings(definition, {
      currentTenantId: 42,
      modules: [{ id: 7, name: 'Property Tax' }],
      dataProviderCodes: ['PropertyTaxDataProvider'],
    });

    expect(settings).toMatchObject({
      reportCode: 'TaxReport',
      reportName: 'Tax Report',
      moduleId: 7,
      currentTenantId: 42,
      dataSourceCode: 'PROPERTY_TAX',
      dataProviderCode: 'PropertyTaxDataProvider',
    });
    expect(settings.parameters[0]).toMatchObject({
      key: 'zoneId',
      isRequired: true,
      isActive: true,
    });
  });

  it('applies global tenant settings and parameters without mutating the source definition', () => {
    const definition = createBlankClassicReportDefinition('TaxReport', 'Old Name');
    const updated = applyDesignerReportSettings(definition, {
      templateId: 10,
      reportDefinitionId: 11,
      reportCode: 'TaxReport',
      reportName: 'New Name',
      moduleId: 7,
      moduleName: 'Property Tax',
      tenantId: 42,
      tenantScope: 'Global',
      currentTenantId: 42,
      isActive: true,
      dataSourceCode: 'PROPERTY_TAX',
      dataProviderCode: 'PropertyTaxDataProvider',
      parameters: [
        {
          key: 'wardId',
          label: 'Ward',
          type: 'select',
          isRequired: false,
          sortOrder: 0,
        },
      ],
    });

    expect(updated).not.toBe(definition);
    expect(definition.reportName).toBe('Old Name');
    expect(updated.reportName).toBe('New Name');
    expect(updated.ntis).toMatchObject({
      templateId: 10,
      reportDefinitionId: 11,
      tenantId: null,
      tenantScope: 'Global',
      dataSourceCode: 'PROPERTY_TAX',
    });
    expect(updated.ntis?.parameters?.[0]).toMatchObject({ key: 'wardId', isActive: true });
  });
});
