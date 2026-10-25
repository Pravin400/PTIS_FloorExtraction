-- ============================================================================
-- Module: 11_GIS (Geographic Information System Engine)
-- Script: 02_seed_data.sql
-- Description: Inserts default seed data for GIS Filter and KPI Catalogs
-- ============================================================================

-- Seed Default Filter Catalog
IF NOT EXISTS (SELECT 1 FROM [GIS].[GisFilterMaster] WHERE FilterKey = 'zoneId')
BEGIN
    INSERT INTO [GIS].[GisFilterMaster] ([FilterKey], [FilterLabel], [ControlType], [ApiSourceUrl], [IsActive])
    VALUES ('zoneId', 'Select Zone', 'DROPDOWN', '/api/Zone', 1);
END

IF NOT EXISTS (SELECT 1 FROM [GIS].[GisFilterMaster] WHERE FilterKey = 'wardId')
BEGIN
    INSERT INTO [GIS].[GisFilterMaster] ([FilterKey], [FilterLabel], [ControlType], [ApiSourceUrl], [IsActive])
    VALUES ('wardId', 'Select Ward', 'DROPDOWN', '/api/Ward', 1);
END
GO

-- Seed Default KPI Scorecard Catalog
IF NOT EXISTS (SELECT 1 FROM [GIS].[GisKpiMaster] WHERE KpiCode = 'TOTAL_PROPERTIES')
BEGIN
    INSERT INTO [GIS].[GisKpiMaster] ([KpiCode], [DefaultTitle], [DefaultIcon], [DefaultColor], [IsActive])
    VALUES ('TOTAL_PROPERTIES', 'Total Assessed Properties', 'fa-building', '#0078FF', 1);
END

IF NOT EXISTS (SELECT 1 FROM [GIS].[GisKpiMaster] WHERE KpiCode = 'TOTAL_TAX_DEMAND')
BEGIN
    INSERT INTO [GIS].[GisKpiMaster] ([KpiCode], [DefaultTitle], [DefaultIcon], [DefaultColor], [IsActive])
    VALUES ('TOTAL_TAX_DEMAND', 'Annual Tax Demand (₹)', 'fa-indian-rupee-sign', '#28A745', 1);
END
GO
