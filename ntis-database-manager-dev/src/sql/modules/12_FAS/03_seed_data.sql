-- ============================================================================
-- Module: 12_FAS (Fire Audit)
-- Script: 03_seed_data.sql
-- Stage 1: national master seeds + optional demo ULB overlay/station.
-- Order: Status → ApplicationType → Occupancy → Band → ChecklistItem
--        → Matrix → MatrixItem → DocumentType → Overlay → FireStation
--        → FeeHead → FeeRule
-- Re-run safe: every insert is guarded with IF NOT EXISTS.
-- Do not hardcode a state Act as universal law. NBC-style numbers are
-- national DEFAULT rows only — ULBs override via matrix/overlay masters.
-- ============================================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ===========================================================================
   1. StatusMaster — twelve workflow statuses
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'Draft')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('Draft', N'Draft', 0, 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'Submitted')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('Submitted', N'Submitted', 0, 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'UnderScrutiny')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('UnderScrutiny', N'Under scrutiny', 0, 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'ReturnedToApplicant')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('ReturnedToApplicant', N'Returned to applicant', 0, 40, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'InspectionScheduled')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('InspectionScheduled', N'Inspection scheduled', 0, 50, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'InspectionInProgress')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('InspectionInProgress', N'Inspection in progress', 0, 60, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'InspectionSubmitted')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('InspectionSubmitted', N'Inspection submitted', 0, 70, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'Recommended')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('Recommended', N'Recommended', 0, 80, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'CertificateIssued')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('CertificateIssued', N'Certificate issued', 1, 90, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'Rejected')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('Rejected', N'Rejected', 1, 100, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'RenewalDue')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('RenewalDue', N'Renewal due', 0, 110, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[StatusMaster] WHERE [StatusCode] = 'Expired')
    INSERT INTO [FAS].[StatusMaster] ([StatusCode], [StatusName], [IsTerminal], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('Expired', N'Expired', 1, 120, 1, 1, GETDATE());
GO

/* ===========================================================================
   2. ApplicationTypeMaster — v1 enables SelfCertification / DepartmentalAudit / Renewal
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'SelfCertification')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('SelfCertification', N'Self certification', N'Owner or licensed agency files a compliance self-certification.', 1, 1, 1, 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'DepartmentalAudit')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('DepartmentalAudit', N'Departmental audit', N'Department-led periodic fire compliance audit.', 1, 1, 0, 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'Renewal')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('Renewal', N'Renewal', N'Renewal of an existing fire compliance certificate.', 1, 1, 0, 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'ProvisionalNoc')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('ProvisionalNoc', N'Provisional NOC', N'Design-stage provisional NOC. Disabled in v1 screens.', 0, 1, 0, 40, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'FinalNoc')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('FinalNoc', N'Final NOC', N'Pre-occupancy final NOC. Disabled in v1 screens.', 0, 1, 0, 50, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ApplicationTypeMaster] WHERE [ApplicationTypeCode] = 'Alteration')
    INSERT INTO [FAS].[ApplicationTypeMaster]
        ([ApplicationTypeCode], [ApplicationTypeName], [Description], [IsEnabled], [RequiresInspection], [RequiresLicensedAgency], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('Alteration', N'Alteration', N'Material alteration of an existing certified premises. Disabled in v1 screens.', 0, 1, 0, 60, 1, 1, GETDATE());
GO

/* ===========================================================================
   3. OccupancyTypeMaster — national NBC-style catalog (StateCode NULL)
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'RES' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('RES', N'Residential', NULL, NULL, N'Dwellings, apartments, hostels and similar residential use.', N'Medium', NULL, 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'EDU' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('EDU', N'Educational', NULL, NULL, N'Schools, colleges and training institutions.', N'Medium', NULL, 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'INS' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('INS', N'Institutional', NULL, NULL, N'Hospitals, nursing homes and custodial institutions.', N'High', NULL, 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'ASM' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('ASM', N'Assembly', NULL, NULL, N'Theatres, halls, places of worship and other assembly buildings.', N'High', NULL, 40, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'BUS' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('BUS', N'Business', NULL, NULL, N'Offices, banks and professional establishments.', N'Medium', NULL, 50, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'MER' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('MER', N'Mercantile', NULL, NULL, N'Shops, markets and malls.', N'Medium', NULL, 60, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'IND' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('IND', N'Industrial', NULL, NULL, N'Factories and industrial plants.', N'High', NULL, 70, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'STO' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('STO', N'Storage', NULL, NULL, N'Warehouses and storage buildings.', N'High', NULL, 80, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'HAZ' AND [StateCode] IS NULL)
    INSERT INTO [FAS].[OccupancyTypeMaster]
        ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('HAZ', N'Hazardous', NULL, NULL, N'Buildings storing or processing hazardous materials.', N'Critical', NULL, 90, 1, 1, GETDATE());
GO

-- Sub-category under Assembly (parent must exist)
IF NOT EXISTS (SELECT 1 FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'ASM-CIN' AND [StateCode] IS NULL)
BEGIN
    DECLARE @AsmParentId INT =
    (
        SELECT TOP (1) [Id]
        FROM [FAS].[OccupancyTypeMaster]
        WHERE [OccupancyCode] = 'ASM' AND [StateCode] IS NULL AND [IsActive] = 1
    );

    IF @AsmParentId IS NOT NULL
    BEGIN
        INSERT INTO [FAS].[OccupancyTypeMaster]
            ([OccupancyCode], [OccupancyName], [OccupancyNameLocal], [ParentOccupancyId], [Description], [RiskBand], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
        VALUES
            ('ASM-CIN', N'Cinema / multiplex', NULL, @AsmParentId, N'Cinema halls and multiplexes under Assembly.', N'High', NULL, 41, 1, 1, GETDATE());
    END
END
GO

/* ===========================================================================
   4. RequirementBandMaster — national default slabs (thresholds as DATA)
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[RequirementBandMaster] WHERE [BandCode] = 'H_LT_15' AND [UlbId] IS NULL AND [StateCode] IS NULL)
    INSERT INTO [FAS].[RequirementBandMaster]
        ([BandCode], [BandName], [MinHeightMeters], [MaxHeightMeters], [MinAreaSqm], [MaxAreaSqm], [MinOccupantLoad], [MaxOccupantLoad],
         [UlbId], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('H_LT_15', N'National default: height under 15 m', NULL, 14.99, NULL, NULL, NULL, NULL, NULL, NULL, 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[RequirementBandMaster] WHERE [BandCode] = 'H_15_24' AND [UlbId] IS NULL AND [StateCode] IS NULL)
    INSERT INTO [FAS].[RequirementBandMaster]
        ([BandCode], [BandName], [MinHeightMeters], [MaxHeightMeters], [MinAreaSqm], [MaxAreaSqm], [MinOccupantLoad], [MaxOccupantLoad],
         [UlbId], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('H_15_24', N'National default: height 15 m to under 24 m', 15.00, 23.99, NULL, NULL, NULL, NULL, NULL, NULL, 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[RequirementBandMaster] WHERE [BandCode] = 'H_24_45' AND [UlbId] IS NULL AND [StateCode] IS NULL)
    INSERT INTO [FAS].[RequirementBandMaster]
        ([BandCode], [BandName], [MinHeightMeters], [MaxHeightMeters], [MinAreaSqm], [MaxAreaSqm], [MinOccupantLoad], [MaxOccupantLoad],
         [UlbId], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('H_24_45', N'National default: height 24 m to under 45 m', 24.00, 44.99, NULL, NULL, NULL, NULL, NULL, NULL, 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[RequirementBandMaster] WHERE [BandCode] = 'H_GE_45' AND [UlbId] IS NULL AND [StateCode] IS NULL)
    INSERT INTO [FAS].[RequirementBandMaster]
        ([BandCode], [BandName], [MinHeightMeters], [MaxHeightMeters], [MinAreaSqm], [MaxAreaSqm], [MinOccupantLoad], [MaxOccupantLoad],
         [UlbId], [StateCode], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('H_GE_45', N'National default: height 45 m and above', 45.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 40, 1, 1, GETDATE());
GO

/* ===========================================================================
   5. ChecklistItemMaster — national provision catalog
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'ESC-EXIT')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('ESC-EXIT', 'LifeSafety', 'Escape', N'Means of escape / exits are clear, adequate and usable.', NULL, 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'ESC-SIGN')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('ESC-SIGN', 'LifeSafety', 'Signage', N'Exit and fire-safety signage is installed and legible.', NULL, 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'DET-ALARM')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('DET-ALARM', 'FireSystems', 'Detection', N'Fire detection and alarm system is installed and functional.', NULL, 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'FE-EXT')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('FE-EXT', 'FireSystems', 'Extinguisher', N'Portable fire extinguishers are present, charged and within validity.', N'per floor', 40, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'HYD')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('HYD', 'FireSystems', 'Hydrant', N'Hydrant / hose-reel system is installed and serviceable.', NULL, 50, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'SPR')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('SPR', 'FireSystems', 'Sprinkler', N'Automatic sprinkler system is installed where required and functional.', NULL, 60, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'LIFT')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('LIFT', 'LifeSafety', 'Lift', N'Fire lift / fireman switch provisions are available where required.', NULL, 70, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'ELEC')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('ELEC', 'FireSystems', 'Electrical', N'Electrical shafts, panels and wiring are safeguarded against fire risk.', NULL, 80, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'SMOKE')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('SMOKE', 'LifeSafety', 'Escape', N'Smoke management / pressurisation provisions are functional where required.', NULL, 90, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[ChecklistItemMaster] WHERE [ItemCode] = 'PEOPLE')
    INSERT INTO [FAS].[ChecklistItemMaster] ([ItemCode], [InspectionDomain], [Category], [Description], [UnitOfMeasure], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES ('PEOPLE', 'LifeSafety', 'People', N'Trained staff / fire drills and emergency plan records are available.', NULL, 100, 1, 1, GETDATE());
GO

/* ===========================================================================
   6. RequirementMatrixMaster + RequirementMatrixItemMaster
   Representative national defaults for RES / ASM / EDU / BUS / IND
   across low-rise and mid/high bands. ULBs override with their own rows.
   =========================================================================== */

-- Helper pattern: insert matrix if missing, then attach items by code.
-- RES + H_LT_15
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — low-rise residential.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'RES' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_LT_15' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- RES + H_15_24
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_15_24'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — mid-rise residential.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'RES' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_15_24' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- RES + H_24_45
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_24_45'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — high-rise residential.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'RES' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_24_45' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- ASM + H_LT_15
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'ASM' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — assembly low-rise.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'ASM' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_LT_15' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- EDU + H_LT_15
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'EDU' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — educational.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'EDU' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_LT_15' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- BUS + H_15_24
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'BUS' AND B.[BandCode] = 'H_15_24'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — business mid-rise.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'BUS' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_15_24' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

-- IND + H_LT_15
IF NOT EXISTS (
    SELECT 1
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'IND' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
BEGIN
    INSERT INTO [FAS].[RequirementMatrixMaster]
        ([OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode], [EffectiveFrom], [EffectiveTo], [Remarks], [IsActive], [CreatedBy], [CreatedDate])
    SELECT O.[Id], B.[Id], NULL, NULL, CAST(N'2020-01-01' AS DATE), NULL,
           N'National default — industrial.', 1, 1, GETDATE()
    FROM [FAS].[OccupancyTypeMaster] O
    CROSS JOIN [FAS].[RequirementBandMaster] B
    WHERE O.[OccupancyCode] = 'IND' AND O.[StateCode] IS NULL
      AND B.[BandCode] = 'H_LT_15' AND B.[UlbId] IS NULL AND B.[StateCode] IS NULL;
END
GO

/* ---- Matrix items: attach checklist lines by occupancy/band ---- */

-- RES + H_LT_15 → ESC-EXIT, ESC-SIGN, FE-EXT, PEOPLE
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(2 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL,
       CASE C.[ItemCode]
           WHEN 'ESC-EXIT' THEN 10 WHEN 'ESC-SIGN' THEN 20 WHEN 'FE-EXT' THEN 30 WHEN 'PEOPLE' THEN 40 ELSE 99 END,
       1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- RES + H_15_24 → previous + DET-ALARM, HYD
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_15_24'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(2 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL,
       CASE C.[ItemCode]
           WHEN 'ESC-EXIT' THEN 10 WHEN 'ESC-SIGN' THEN 20 WHEN 'FE-EXT' THEN 30
           WHEN 'DET-ALARM' THEN 40 WHEN 'HYD' THEN 50 WHEN 'PEOPLE' THEN 60 ELSE 99 END,
       1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'HYD', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- RES + H_24_45 → mid-rise set + SPR, LIFT, SMOKE, ELEC
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'RES' AND B.[BandCode] = 'H_24_45'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(2 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL, C.[DisplayOrder], 1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'HYD', 'SPR', 'LIFT', 'SMOKE', 'ELEC', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- ASM + H_LT_15
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'ASM' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(4 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL, C.[DisplayOrder], 1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'HYD', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- EDU + H_LT_15
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'EDU' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(2 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL, C.[DisplayOrder], 1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- BUS + H_15_24
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'BUS' AND B.[BandCode] = 'H_15_24'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(2 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL, C.[DisplayOrder], 1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'HYD', 'ELEC', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

-- IND + H_LT_15
;WITH TargetMatrix AS
(
    SELECT M.[Id] AS MatrixId
    FROM [FAS].[RequirementMatrixMaster] M
    INNER JOIN [FAS].[OccupancyTypeMaster] O ON O.[Id] = M.[OccupancyTypeId]
    INNER JOIN [FAS].[RequirementBandMaster] B ON B.[Id] = M.[RequirementBandId]
    WHERE O.[OccupancyCode] = 'IND' AND B.[BandCode] = 'H_LT_15'
      AND M.[UlbId] IS NULL AND M.[StateCode] IS NULL AND M.[IsActive] = 1
)
INSERT INTO [FAS].[RequirementMatrixItemMaster]
    ([RequirementMatrixId], [ChecklistItemId], [MinQuantity], [IsMandatory], [Remarks], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
SELECT TM.MatrixId, C.[Id],
       CASE C.[ItemCode] WHEN 'FE-EXT' THEN CAST(4 AS DECIMAL(10,2)) ELSE NULL END,
       1, NULL, C.[DisplayOrder], 1, 1, GETDATE()
FROM TargetMatrix TM
CROSS JOIN [FAS].[ChecklistItemMaster] C
WHERE C.[ItemCode] IN ('ESC-EXIT', 'ESC-SIGN', 'FE-EXT', 'DET-ALARM', 'HYD', 'ELEC', 'PEOPLE')
  AND NOT EXISTS
  (
      SELECT 1 FROM [FAS].[RequirementMatrixItemMaster] X
      WHERE X.[RequirementMatrixId] = TM.MatrixId AND X.[ChecklistItemId] = C.[Id]
  );
GO

/* ===========================================================================
   7. DocumentTypeMaster — national defaults (NULL scope = all types/occupancies)
   =========================================================================== */
IF NOT EXISTS (
    SELECT 1 FROM [FAS].[DocumentTypeMaster]
    WHERE [DocumentCode] = 'ID_PROOF'
      AND [ApplicationTypeId] IS NULL AND [OccupancyTypeId] IS NULL AND [UlbId] IS NULL
)
    INSERT INTO [FAS].[DocumentTypeMaster]
        ([DocumentCode], [DocumentName], [ApplicationTypeId], [OccupancyTypeId], [UlbId], [IsMandatory], [AcceptedFormats], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('ID_PROOF', N'Applicant identity proof', NULL, NULL, NULL, 1, 'pdf,jpg,png', 10, 1, 1, GETDATE());
GO

IF NOT EXISTS (
    SELECT 1 FROM [FAS].[DocumentTypeMaster]
    WHERE [DocumentCode] = 'OWNERSHIP'
      AND [ApplicationTypeId] IS NULL AND [OccupancyTypeId] IS NULL AND [UlbId] IS NULL
)
    INSERT INTO [FAS].[DocumentTypeMaster]
        ([DocumentCode], [DocumentName], [ApplicationTypeId], [OccupancyTypeId], [UlbId], [IsMandatory], [AcceptedFormats], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('OWNERSHIP', N'Ownership / occupancy proof', NULL, NULL, NULL, 1, 'pdf,jpg,png', 20, 1, 1, GETDATE());
GO

IF NOT EXISTS (
    SELECT 1 FROM [FAS].[DocumentTypeMaster]
    WHERE [DocumentCode] = 'SITE_PLAN'
      AND [ApplicationTypeId] IS NULL AND [OccupancyTypeId] IS NULL AND [UlbId] IS NULL
)
    INSERT INTO [FAS].[DocumentTypeMaster]
        ([DocumentCode], [DocumentName], [ApplicationTypeId], [OccupancyTypeId], [UlbId], [IsMandatory], [AcceptedFormats], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('SITE_PLAN', N'Site / building plan', NULL, NULL, NULL, 1, 'pdf', 30, 1, 1, GETDATE());
GO

IF NOT EXISTS (SELECT 1 FROM [FAS].[DocumentTypeMaster] WHERE [DocumentCode] = 'PREV_CERT')
BEGIN
    DECLARE @RenewalTypeId INT =
    (
        SELECT TOP (1) [Id] FROM [FAS].[ApplicationTypeMaster]
        WHERE [ApplicationTypeCode] = 'Renewal' AND [IsActive] = 1
    );

    INSERT INTO [FAS].[DocumentTypeMaster]
        ([DocumentCode], [DocumentName], [ApplicationTypeId], [OccupancyTypeId], [UlbId], [IsMandatory], [AcceptedFormats], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('PREV_CERT', N'Previous fire compliance certificate', @RenewalTypeId, NULL, NULL, 1, 'pdf,jpg,png', 40, 1, 1, GETDATE());
END
GO

IF NOT EXISTS (SELECT 1 FROM [FAS].[DocumentTypeMaster] WHERE [DocumentCode] = 'AGENCY_LICENCE')
BEGIN
    DECLARE @SelfCertTypeId INT =
    (
        SELECT TOP (1) [Id] FROM [FAS].[ApplicationTypeMaster]
        WHERE [ApplicationTypeCode] = 'SelfCertification' AND [IsActive] = 1
    );

    INSERT INTO [FAS].[DocumentTypeMaster]
        ([DocumentCode], [DocumentName], [ApplicationTypeId], [OccupancyTypeId], [UlbId], [IsMandatory], [AcceptedFormats], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('AGENCY_LICENCE', N'Licensed agency certificate', @SelfCertTypeId, NULL, NULL, 1, 'pdf,jpg,png', 50, 1, 1, GETDATE());
END
GO

/* ===========================================================================
   8. JurisdictionOverlayMaster — national default (no state name hardcoded as law)
   =========================================================================== */
IF NOT EXISTS (
    SELECT 1 FROM [FAS].[JurisdictionOverlayMaster]
    WHERE [UlbId] IS NULL AND [StateName] IS NULL AND [StateCode] IS NULL AND [IsActive] = 1
)
    INSERT INTO [FAS].[JurisdictionOverlayMaster]
        ([UlbId], [StateCode], [StateName], [ActTitle], [RulesTitle], [MunicipalActTitle], [ByeLawTitle], [SectionRefs],
         [IssuingAuthorityLabel], [CertificateFormCode], [AuditReportFormCode], [HasOwnFireBrigade], [ValidityMonths], [ReminderOffsetsCsv],
         [EffectiveFrom], [EffectiveTo], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        (NULL, NULL, NULL,
         N'Applicable State Fire Services Act (configure per jurisdiction)',
         N'Applicable State Fire Services Rules (configure per jurisdiction)',
         NULL, NULL, NULL,
         N'Fire Department',
         NULL, NULL, 1, 12, '60,30,7',
         CAST(N'2020-01-01' AS DATE), NULL, 1, 1, GETDATE());
GO

/* Optional demo ULB overlay — only when CORE.UlbMaster has at least one active row.
   Uses that ULB's own name; does not invent a corporation or Act title. */
IF EXISTS (SELECT 1 FROM [CORE].[UlbMaster] WHERE [IsActive] = 1)
AND NOT EXISTS (
    SELECT 1 FROM [FAS].[JurisdictionOverlayMaster] O
    INNER JOIN [CORE].[UlbMaster] U ON U.[Id] = O.[UlbId]
    WHERE O.[IsActive] = 1
)
BEGIN
    DECLARE @DemoUlbId INT =
    (
        SELECT TOP (1) [Id]
        FROM [CORE].[UlbMaster]
        WHERE [IsActive] = 1
        ORDER BY [Id]
    );

    DECLARE @DemoUlbName NVARCHAR(200) =
    (
        SELECT TOP (1) [UlbName]
        FROM [CORE].[UlbMaster]
        WHERE [Id] = @DemoUlbId
    );

    DECLARE @DemoState VARCHAR(50) =
    (
        SELECT TOP (1) [State]
        FROM [CORE].[UlbMaster]
        WHERE [Id] = @DemoUlbId
    );

    INSERT INTO [FAS].[JurisdictionOverlayMaster]
        ([UlbId], [StateCode], [StateName], [ActTitle], [RulesTitle], [MunicipalActTitle], [ByeLawTitle], [SectionRefs],
         [IssuingAuthorityLabel], [CertificateFormCode], [AuditReportFormCode], [HasOwnFireBrigade], [ValidityMonths], [ReminderOffsetsCsv],
         [EffectiveFrom], [EffectiveTo], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        (@DemoUlbId, NULL, @DemoState,
         N'Configure State Fire Act citation for this ULB',
         N'Configure State Fire Rules citation for this ULB',
         N'Configure municipal Act citation for this ULB',
         NULL, NULL,
         CONCAT(N'Fire Department — ', @DemoUlbName),
         NULL, NULL, 1, 12, '60,30,7',
         CAST(N'2020-01-01' AS DATE), NULL, 1, 1, GETDATE());
END
GO

/* ===========================================================================
   9. FireStationMaster — demo station only when a ULB exists
   =========================================================================== */
IF EXISTS (SELECT 1 FROM [CORE].[UlbMaster] WHERE [IsActive] = 1)
BEGIN
    DECLARE @StationUlbId INT =
    (
        SELECT TOP (1) [Id]
        FROM [CORE].[UlbMaster]
        WHERE [IsActive] = 1
        ORDER BY [Id]
    );

    IF NOT EXISTS (
        SELECT 1 FROM [FAS].[FireStationMaster]
        WHERE [UlbId] = @StationUlbId AND [StationCode] = 'STN-01'
    )
    BEGIN
        INSERT INTO [FAS].[FireStationMaster]
            ([UlbId], [StationCode], [StationName], [Address], [WardCode], [WardName], [PtisWardId],
             [Latitude], [Longitude], [IsActive], [CreatedBy], [CreatedDate])
        VALUES
            (@StationUlbId, 'STN-01', N'Central Fire Station', NULL, NULL, NULL, NULL,
             NULL, NULL, 1, 1, GETDATE());
    END
END
GO

/* ===========================================================================
   11. FeeHeadMaster — catalog. Names and interest are data.
   =========================================================================== */
IF NOT EXISTS (SELECT 1 FROM [FAS].[FeeHeadMaster] WHERE [HeadCode] = 'SERVICE')
    INSERT INTO [FAS].[FeeHeadMaster]
        ([HeadCode], [HeadName], [Obligation], [IsStatutory], [IsAuthorized], [InterestRatePercent], [GracePeriodDays], [LegalCitation], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('SERVICE', N'Service fee', 'Application', 1, 1, 0, 0, N'Configure the citation per jurisdiction.', 10, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[FeeHeadMaster] WHERE [HeadCode] = 'SCRUTINY')
    INSERT INTO [FAS].[FeeHeadMaster]
        ([HeadCode], [HeadName], [Obligation], [IsStatutory], [IsAuthorized], [InterestRatePercent], [GracePeriodDays], [LegalCitation], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('SCRUTINY', N'Scrutiny fee', 'Application', 1, 1, 0, 0, N'Configure the citation per jurisdiction.', 20, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[FeeHeadMaster] WHERE [HeadCode] = 'INSPECTION')
    INSERT INTO [FAS].[FeeHeadMaster]
        ([HeadCode], [HeadName], [Obligation], [IsStatutory], [IsAuthorized], [InterestRatePercent], [GracePeriodDays], [LegalCitation], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('INSPECTION', N'Inspection fee', 'Application', 1, 1, 0, 0, N'Configure the citation per jurisdiction.', 30, 1, 1, GETDATE());
GO
IF NOT EXISTS (SELECT 1 FROM [FAS].[FeeHeadMaster] WHERE [HeadCode] = 'ANNUAL')
    INSERT INTO [FAS].[FeeHeadMaster]
        ([HeadCode], [HeadName], [Obligation], [IsStatutory], [IsAuthorized], [InterestRatePercent], [GracePeriodDays], [LegalCitation], [DisplayOrder], [IsActive], [CreatedBy], [CreatedDate])
    VALUES
        ('ANNUAL', N'Annual fee', 'Annual', 1, 1, 0, 0, N'Post-certificate annual obligation. Configure the period per jurisdiction.', 40, 1, 1, GETDATE());
GO

/* ===========================================================================
   12. FeeRuleMaster — national default is exempt. Demo ULB overlay is labelled sample data.
   =========================================================================== */
IF NOT EXISTS (
    SELECT 1 FROM [FAS].[FeeRuleMaster] R
    INNER JOIN [FAS].[FeeHeadMaster] H ON H.[Id] = R.[FeeHeadId]
    WHERE H.[HeadCode] = 'SERVICE' AND R.[UlbId] IS NULL AND R.[OccupancyTypeId] IS NULL AND R.[RequirementBandId] IS NULL
)
BEGIN
    INSERT INTO [FAS].[FeeRuleMaster]
        ([FeeHeadId], [ApplicationTypeId], [OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode],
         [FormulaKind], [RateValue], [ExemptionPercent], [UsesValuationAdapter], [LegalCitation],
         [EffectiveFrom], [IsActive], [CreatedBy], [CreatedDate])
    SELECT H.[Id], NULL, NULL, NULL, NULL, NULL, 'None', NULL, 100, 0,
           N'National default: no fee unless a jurisdiction row authorizes a charge.',
           '20200101', 1, 1, GETDATE()
    FROM [FAS].[FeeHeadMaster] H
    WHERE H.[HeadCode] IN ('SERVICE', 'SCRUTINY', 'INSPECTION', 'ANNUAL')
      AND H.[IsActive] = 1
      AND NOT EXISTS (
          SELECT 1 FROM [FAS].[FeeRuleMaster] R
          WHERE R.[FeeHeadId] = H.[Id] AND R.[UlbId] IS NULL
            AND R.[OccupancyTypeId] IS NULL AND R.[RequirementBandId] IS NULL
      );
END
GO

IF EXISTS (SELECT 1 FROM [CORE].[UlbMaster] WHERE [IsActive] = 1)
BEGIN
    DECLARE @FeeUlbId INT =
    (
        SELECT TOP (1) [Id]
        FROM [CORE].[UlbMaster]
        WHERE [IsActive] = 1
        ORDER BY [Id]
    );
    DECLARE @ResOccId INT = (SELECT TOP (1) [Id] FROM [FAS].[OccupancyTypeMaster] WHERE [OccupancyCode] = 'RES' AND [StateCode] IS NULL AND [IsActive] = 1);
    DECLARE @LowBandId INT = (SELECT TOP (1) [Id] FROM [FAS].[RequirementBandMaster] WHERE [BandCode] = 'H_LT_15' AND [UlbId] IS NULL AND [StateCode] IS NULL AND [IsActive] = 1);

    INSERT INTO [FAS].[FeeRuleMaster]
        ([FeeHeadId], [ApplicationTypeId], [OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode],
         [FormulaKind], [RateValue], [ExemptionPercent], [UsesValuationAdapter], [LegalCitation],
         [EffectiveFrom], [IsActive], [CreatedBy], [CreatedDate])
    SELECT H.[Id], NULL, NULL, NULL, @FeeUlbId, NULL, 'Flat',
           CASE H.[HeadCode] WHEN 'SERVICE' THEN 2500 WHEN 'SCRUTINY' THEN 500 WHEN 'INSPECTION' THEN 750 WHEN 'ANNUAL' THEN 1000 END,
           0, 0,
           CASE H.[HeadCode]
               WHEN 'ANNUAL' THEN N'Demonstration annual obligation after certificate issue. Not the filing fee.'
               ELSE N'Sample Municipal Council demonstration schedule. Not a national rate.'
           END,
           '20200101', 1, 1, GETDATE()
    FROM [FAS].[FeeHeadMaster] H
    WHERE H.[HeadCode] IN ('SERVICE', 'SCRUTINY', 'INSPECTION', 'ANNUAL')
      AND H.[IsActive] = 1
      AND NOT EXISTS (
          SELECT 1 FROM [FAS].[FeeRuleMaster] R
          WHERE R.[FeeHeadId] = H.[Id] AND R.[UlbId] = @FeeUlbId
            AND R.[OccupancyTypeId] IS NULL AND R.[RequirementBandId] IS NULL
      );

    IF @ResOccId IS NOT NULL AND @LowBandId IS NOT NULL
    BEGIN
        INSERT INTO [FAS].[FeeRuleMaster]
            ([FeeHeadId], [ApplicationTypeId], [OccupancyTypeId], [RequirementBandId], [UlbId], [StateCode],
             [FormulaKind], [RateValue], [ExemptionPercent], [UsesValuationAdapter], [LegalCitation],
             [EffectiveFrom], [IsActive], [CreatedBy], [CreatedDate])
        SELECT H.[Id], NULL, @ResOccId, @LowBandId, @FeeUlbId, NULL, 'None', NULL, 100, 0,
               N'Demonstration exemption for the lower-height residential band. The band is data, not a code constant.',
               '20200101', 1, 1, GETDATE()
        FROM [FAS].[FeeHeadMaster] H
        WHERE H.[HeadCode] IN ('SERVICE', 'SCRUTINY', 'INSPECTION')
          AND H.[IsActive] = 1
          AND NOT EXISTS (
              SELECT 1 FROM [FAS].[FeeRuleMaster] R
              WHERE R.[FeeHeadId] = H.[Id] AND R.[UlbId] = @FeeUlbId
                AND R.[OccupancyTypeId] = @ResOccId AND R.[RequirementBandId] = @LowBandId
          );
    END
END
GO

PRINT 'FAS 03_seed_data: Stage 1 master seeds applied.';
GO
