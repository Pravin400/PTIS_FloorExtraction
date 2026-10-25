/* ==========================================================================
   1. [WTIS].[BillingFrequencyMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[BillingFrequencyMaster] ON;
GO

INSERT INTO [WTIS].[BillingFrequencyMaster]
(Id, BillingFrequencyCode, BillingFrequency, PeriodsPerYear, Description, IsActive, CreatedBy, CreatedDate)
VALUES
(1, 'MONTHLY',    N'Monthly',     12, NULL, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(2, 'QUARTERLY',  N'Quarterly',    4, NULL, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(3, 'HALFYEARLY', N'Half-Yearly',  2, NULL, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(4, 'ANNUAL',     N'Annual',       1, NULL, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(5, 'CUSTOM',     N'Custom',       1, NULL, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime));
GO

SET IDENTITY_INSERT [WTIS].[BillingFrequencyMaster] OFF;
GO


/* ==========================================================================
   2. [WTIS].[BillingPeriod] - SEED DATA (34 Records)
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[BillingPeriod] ON;
GO

-- FinancialYearId is resolved against [CORE].[YearMaster] by year (see Section 1
-- above) rather than hardcoded, since that table's identity values are shared
-- across modules and not guaranteed to match any fixed numbering here.
INSERT INTO [WTIS].[BillingPeriod]
(
    Id,
    BillingPeriodCode,
    FinancialYearId,
    BillingFrequencyId,
    PeriodFromDate,
    PeriodToDate,
    BillGenerationDate,
    DueDate,
    GraceDays,
    CurrentPenaltyStartDate,
    CurrentPenaltyEndDate,
    PendingPenaltyStartDate,
    PendingPenaltyEndDate,
    IsReadingApprovalRequired,
    SequenceNo,
    IsActive,
    CreatedBy,
    CreatedDate,
    UpdatedBy,
    UpdatedDate
)
SELECT
    v.Id, v.BillingPeriodCode, ym.Id, v.BillingFrequencyId,
    v.PeriodFromDate, v.PeriodToDate, v.BillGenerationDate, v.DueDate, v.GraceDays,
    v.CurrentPenaltyStartDate, v.CurrentPenaltyEndDate, v.PendingPenaltyStartDate, v.PendingPenaltyEndDate,
    v.IsReadingApprovalRequired, v.SequenceNo, v.IsActive, v.CreatedBy, v.CreatedDate, v.UpdatedBy, v.UpdatedDate
FROM (VALUES
-- 2021
(1,  '2021-Q1',     2021, 2, CAST(N'2021-04-01' AS Date), CAST(N'2021-06-30' AS Date), CAST(N'2021-07-01' AS Date), CAST(N'2021-07-31' AS Date), 10, CAST(N'2021-08-01' AS Date), CAST(N'2021-08-31' AS Date), CAST(N'2021-04-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(2,  '2021-Q2',     2021, 2, CAST(N'2021-07-01' AS Date), CAST(N'2021-09-30' AS Date), CAST(N'2021-10-01' AS Date), CAST(N'2021-10-31' AS Date), 10, CAST(N'2021-11-01' AS Date), CAST(N'2021-11-30' AS Date), CAST(N'2021-07-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(3,  '2021-Q3',     2021, 2, CAST(N'2021-10-01' AS Date), CAST(N'2021-12-31' AS Date), CAST(N'2022-01-01' AS Date), CAST(N'2022-01-31' AS Date), 10, CAST(N'2022-02-01' AS Date), CAST(N'2022-02-28' AS Date), CAST(N'2021-10-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 3, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(4,  '2021-Q4',     2021, 2, CAST(N'2022-01-01' AS Date), CAST(N'2022-03-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2022-04-30' AS Date), 10, CAST(N'2022-05-01' AS Date), CAST(N'2022-05-31' AS Date), CAST(N'2021-04-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 4, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(5,  '2021-H1',     2021, 3, CAST(N'2021-04-01' AS Date), CAST(N'2021-09-30' AS Date), CAST(N'2021-10-01' AS Date), CAST(N'2021-10-31' AS Date), 10, CAST(N'2021-11-01' AS Date), CAST(N'2021-11-30' AS Date), CAST(N'2021-04-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(6,  '2021-H2',     2021, 3, CAST(N'2021-10-01' AS Date), CAST(N'2022-03-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2022-04-30' AS Date), 10, CAST(N'2022-05-01' AS Date), CAST(N'2022-05-31' AS Date), CAST(N'2021-10-01' AS Date), CAST(N'2022-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(7,  '2021-ANNUAL', 2021, 4, CAST(N'2021-04-01' AS Date), CAST(N'2022-03-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2022-04-30' AS Date), 10, CAST(N'2022-05-01' AS Date), CAST(N'2022-05-31' AS Date), CAST(N'2021-04-01' AS Date), CAST(N'2022-03-31' AS Date), 0, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),

-- 2022
(8,  '2022-Q1',     2022, 2, CAST(N'2022-04-01' AS Date), CAST(N'2022-06-30' AS Date), CAST(N'2022-07-01' AS Date), CAST(N'2022-07-31' AS Date), 10, CAST(N'2022-08-01' AS Date), CAST(N'2022-08-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(9,  '2022-Q2',     2022, 2, CAST(N'2022-07-01' AS Date), CAST(N'2022-09-30' AS Date), CAST(N'2022-10-01' AS Date), CAST(N'2022-10-31' AS Date), 10, CAST(N'2022-11-01' AS Date), CAST(N'2022-11-30' AS Date), CAST(N'2022-07-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(10, '2022-Q3',     2022, 2, CAST(N'2022-10-01' AS Date), CAST(N'2022-12-31' AS Date), CAST(N'2023-01-01' AS Date), CAST(N'2023-01-31' AS Date), 10, CAST(N'2023-02-01' AS Date), CAST(N'2023-02-28' AS Date), CAST(N'2022-10-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 3, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(11, '2022-Q4',     2022, 2, CAST(N'2023-01-01' AS Date), CAST(N'2023-03-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2023-04-30' AS Date), 10, CAST(N'2023-05-01' AS Date), CAST(N'2023-05-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 4, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(12, '2022-H1',     2022, 3, CAST(N'2022-04-01' AS Date), CAST(N'2022-09-30' AS Date), CAST(N'2022-10-01' AS Date), CAST(N'2022-10-31' AS Date), 10, CAST(N'2022-11-01' AS Date), CAST(N'2022-11-30' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(13, '2022-H2',     2022, 3, CAST(N'2022-10-01' AS Date), CAST(N'2023-03-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2023-04-30' AS Date), 10, CAST(N'2023-05-01' AS Date), CAST(N'2023-05-31' AS Date), CAST(N'2022-10-01' AS Date), CAST(N'2023-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(14, '2022-ANNUAL', 2022, 4, CAST(N'2022-04-01' AS Date), CAST(N'2023-03-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2023-04-30' AS Date), 10, CAST(N'2023-05-01' AS Date), CAST(N'2023-05-31' AS Date), CAST(N'2022-04-01' AS Date), CAST(N'2023-03-31' AS Date), 0, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),

-- 2023
(15, '2023-Q1',     2023, 2, CAST(N'2023-04-01' AS Date), CAST(N'2023-06-30' AS Date), CAST(N'2023-07-01' AS Date), CAST(N'2023-07-31' AS Date), 10, CAST(N'2023-08-01' AS Date), CAST(N'2023-08-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(16, '2023-Q2',     2023, 2, CAST(N'2023-07-01' AS Date), CAST(N'2023-09-30' AS Date), CAST(N'2023-10-01' AS Date), CAST(N'2023-10-31' AS Date), 10, CAST(N'2023-11-01' AS Date), CAST(N'2023-11-30' AS Date), CAST(N'2023-07-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(17, '2023-Q3',     2023, 2, CAST(N'2023-10-01' AS Date), CAST(N'2023-12-31' AS Date), CAST(N'2024-01-01' AS Date), CAST(N'2024-01-31' AS Date), 10, CAST(N'2024-02-01' AS Date), CAST(N'2024-02-29' AS Date), CAST(N'2023-10-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 3, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(18, '2023-Q4',     2023, 2, CAST(N'2024-01-01' AS Date), CAST(N'2024-03-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2024-04-30' AS Date), 10, CAST(N'2024-05-01' AS Date), CAST(N'2024-05-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 4, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(19, '2023-H1',     2023, 3, CAST(N'2023-04-01' AS Date), CAST(N'2023-09-30' AS Date), CAST(N'2023-10-01' AS Date), CAST(N'2023-10-31' AS Date), 10, CAST(N'2023-11-01' AS Date), CAST(N'2023-11-30' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(20, '2023-H2',     2023, 3, CAST(N'2023-10-01' AS Date), CAST(N'2024-03-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2024-04-30' AS Date), 10, CAST(N'2024-05-01' AS Date), CAST(N'2024-05-31' AS Date), CAST(N'2023-10-01' AS Date), CAST(N'2024-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(21, '2023-ANNUAL', 2023, 4, CAST(N'2023-04-01' AS Date), CAST(N'2024-03-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2024-04-30' AS Date), 10, CAST(N'2024-05-01' AS Date), CAST(N'2024-05-31' AS Date), CAST(N'2023-04-01' AS Date), CAST(N'2024-03-31' AS Date), 0, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),

-- 2024
(22, '2024-Q1',     2024, 2, CAST(N'2024-04-01' AS Date), CAST(N'2024-06-30' AS Date), CAST(N'2024-07-01' AS Date), CAST(N'2024-07-31' AS Date), 10, CAST(N'2024-08-01' AS Date), CAST(N'2024-08-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(23, '2024-Q2',     2024, 2, CAST(N'2024-07-01' AS Date), CAST(N'2024-09-30' AS Date), CAST(N'2024-10-01' AS Date), CAST(N'2024-10-31' AS Date), 10, CAST(N'2024-11-01' AS Date), CAST(N'2024-11-30' AS Date), CAST(N'2024-07-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(24, '2024-Q3',     2024, 2, CAST(N'2024-10-01' AS Date), CAST(N'2024-12-31' AS Date), CAST(N'2025-01-01' AS Date), CAST(N'2025-01-31' AS Date), 10, CAST(N'2025-02-01' AS Date), CAST(N'2025-02-28' AS Date), CAST(N'2024-10-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 3, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(25, '2024-Q4',     2024, 2, CAST(N'2025-01-01' AS Date), CAST(N'2025-03-31' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2025-04-30' AS Date), 10, CAST(N'2025-05-01' AS Date), CAST(N'2025-05-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 4, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(26, '2024-H1',     2024, 3, CAST(N'2024-04-01' AS Date), CAST(N'2024-09-30' AS Date), CAST(N'2024-10-01' AS Date), CAST(N'2024-10-31' AS Date), 10, CAST(N'2024-11-01' AS Date), CAST(N'2024-11-30' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(27, '2024-H2',     2024, 3, CAST(N'2024-10-01' AS Date), CAST(N'2025-03-31' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2025-04-30' AS Date), 10, CAST(N'2025-05-01' AS Date), CAST(N'2025-05-31' AS Date), CAST(N'2024-10-01' AS Date), CAST(N'2025-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(28, '2024-ANNUAL', 2024, 4, CAST(N'2024-04-01' AS Date), CAST(N'2025-03-31' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2025-04-30' AS Date), 10, CAST(N'2025-05-01' AS Date), CAST(N'2025-05-31' AS Date), CAST(N'2024-04-01' AS Date), CAST(N'2025-03-31' AS Date), 0, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),

-- 2025
(29, '2025-Q1',     2025, 2, CAST(N'2025-04-01' AS Date), CAST(N'2025-06-30' AS Date), CAST(N'2025-07-01' AS Date), CAST(N'2025-07-31' AS Date), 10, CAST(N'2025-08-01' AS Date), CAST(N'2025-08-31' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(30, '2025-Q2',     2025, 2, CAST(N'2025-07-01' AS Date), CAST(N'2025-09-30' AS Date), CAST(N'2025-10-01' AS Date), CAST(N'2025-10-31' AS Date), 10, CAST(N'2025-11-01' AS Date), CAST(N'2025-11-30' AS Date), CAST(N'2025-07-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(31, '2025-Q3',     2025, 2, CAST(N'2025-10-01' AS Date), CAST(N'2025-12-31' AS Date), CAST(N'2026-01-01' AS Date), CAST(N'2026-01-31' AS Date), 10, CAST(N'2026-02-01' AS Date), CAST(N'2026-02-28' AS Date), CAST(N'2025-10-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 3, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(32, '2025-Q4',     2025, 2, CAST(N'2026-01-01' AS Date), CAST(N'2026-03-31' AS Date), CAST(N'2026-04-01' AS Date), CAST(N'2026-04-30' AS Date), 10, CAST(N'2026-05-01' AS Date), CAST(N'2026-05-31' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 4, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(33, '2025-H1',     2025, 3, CAST(N'2025-04-01' AS Date), CAST(N'2025-09-30' AS Date), CAST(N'2025-10-01' AS Date), CAST(N'2025-10-31' AS Date), 10, CAST(N'2025-11-01' AS Date), CAST(N'2025-11-30' AS Date), CAST(N'2025-04-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 1, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL),
(34, '2025-H2',     2025, 3, CAST(N'2025-10-01' AS Date), CAST(N'2026-03-31' AS Date), CAST(N'2026-04-01' AS Date), CAST(N'2026-04-30' AS Date), 10, CAST(N'2026-05-01' AS Date), CAST(N'2026-05-31' AS Date), CAST(N'2025-10-01' AS Date), CAST(N'2026-03-31' AS Date), 1, 2, 1, 1, CAST(N'2026-09-16T11:18:15.000' AS DateTime), NULL, NULL)
) AS v(Id, BillingPeriodCode, [Year], BillingFrequencyId, PeriodFromDate, PeriodToDate, BillGenerationDate, DueDate, GraceDays, CurrentPenaltyStartDate, CurrentPenaltyEndDate, PendingPenaltyStartDate, PendingPenaltyEndDate, IsReadingApprovalRequired, SequenceNo, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
INNER JOIN [CORE].[YearMaster] ym ON ym.[Year] = v.[Year];
GO

SET IDENTITY_INSERT [WTIS].[BillingPeriod] OFF;
GO


/* ==========================================================================
   3. [WTIS].[GeographyTypeMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[GeographyTypeMaster] ON;
GO

INSERT INTO [WTIS].[GeographyTypeMaster]
(Id, GeographyTypeCode, GeographyType, LevelNo, IsActive, CreatedBy, CreatedDate)
VALUES
(1, 'ZONE',     N'Zone',     1, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(2, 'WARD',     N'Ward',     2, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(3, 'LOCALITY', N'Locality', 3, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime));
GO

SET IDENTITY_INSERT [WTIS].[GeographyTypeMaster] OFF;
GO


/* ==========================================================================
   4. [WTIS].[GeographyUnit] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[GeographyUnit] ON;
GO

INSERT INTO [WTIS].[GeographyUnit]
(Id, GeographyTypeId, ParentGeographyUnitId, GeographyUnitCode, GeographyUnitName, SearchSequence, MarkedForDeletion, IsActive, CreatedBy, CreatedDate)
VALUES
(1, 1, NULL, 'ZONE-1', N'Zone 1',      1, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(2, 1, NULL, 'ZONE-2', N'Zone 2',      2, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(3, 2, 1,    'WARD-1', N'Ward 1',      1, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(4, 2, 1,    'WARD-2', N'Ward 2',      2, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(5, 2, 2,    'WARD-3', N'Ward 3',      1, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(6, 3, 3,    'LOC-1',  N'Locality 1',  1, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(7, 3, 3,    'LOC-2',  N'Locality 2',  2, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(8, 3, 4,    'LOC-3',  N'Locality 3',  1, 0, 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime));
GO

SET IDENTITY_INSERT [WTIS].[GeographyUnit] OFF;
GO

/* ==========================================================================
   5. [WTIS].[ConnectionTypeMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[ConnectionTypeMaster] ON;
GO

INSERT INTO [WTIS].[ConnectionTypeMaster]
(Id, ConnectionTypeCode, ConnectionType, Description, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'RES',  N'Residential',   N'Residential domestic water connection',            1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, 'COM',  N'Commercial',    N'Commercial enterprise water connection',          1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, 'IND',  N'Industrial',    N'Industrial manufacturing water connection',        1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, 'GOV',  N'Government',    N'Government and public office water connection',    1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(5, 'INST', N'Institutional', N'Institutional educational/health water connection', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[ConnectionTypeMaster] OFF;
GO


/* ==========================================================================
   6. [WTIS].[ConnectionCategoryMaster] - SEED DATA
   ========================================================================= */
SET IDENTITY_INSERT [WTIS].[ConnectionCategoryMaster] ON;
GO

INSERT INTO [WTIS].[ConnectionCategoryMaster]
(Id, ConnectionCategoryCode, ConnectionCategory, BillingFrequencyId, IsMetered, BillingMethod, Description, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'REGULAR', N'Regular',      2, 1, N'Metered', N'Regular quarterly metered billing category',   1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, 'ANNUAL',  N'Annual',       4, 0, N'Annual',  N'Annual non-metered fixed billing category',     1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, 'FLAT',    N'Flat Rate',    2, 0, N'Flat',    N'Quarterly flat rate non-metered category',      1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, 'SLAB',    N'Slab Metered', 2, 1, N'Slab',    N'Quarterly slab-based tiered metered category',  1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[ConnectionCategoryMaster] OFF;
GO


/* ==========================================================================
   7. [WTIS].[TapSizeMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[TapSizeMaster] ON;
GO

INSERT INTO [WTIS].[TapSizeMaster]
(Id, TapSizeCode, TapSize, NominalSizeValue, SizeUnit, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, '0.5IN',  N'1/2"',   CAST(0.500 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, '0.75IN', N'3/4"',   CAST(0.750 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, '1IN',    N'1"',     CAST(1.000 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, '1.5IN',  N'1 1/2"', CAST(1.500 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(5, '2IN',    N'2"',     CAST(2.000 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(6, '3IN',    N'3"',     CAST(3.000 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(7, '4IN',    N'4"',     CAST(4.000 AS Decimal(10, 3)), N'inch', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[TapSizeMaster] OFF;
GO


/* ==========================================================================
   8. [WTIS].[ReadingSourceMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[ReadingSourceMaster] ON;
GO

INSERT INTO [WTIS].[ReadingSourceMaster]
(Id, ReadingSourceCode, ReadingSource, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'MANUAL',    N'Manual Reading',           1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, 'AMR',       N'Automated Meter Reading',  1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, 'MOBILE',    N'Mobile App Reading',       1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, 'SELF',      N'Self-Declared Reading',    1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(5, 'ESTIMATED', N'Estimated Reading',        1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[ReadingSourceMaster] OFF;
GO


/* ==========================================================================
   9. [WTIS].[MeterTestStatusMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[MeterTestStatusMaster] ON;
GO

INSERT INTO [WTIS].[MeterTestStatusMaster]
(Id, MeterTestStatusCode, MeterTestStatus, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'PENDING',   N'Pending',   1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, 'SCHEDULED', N'Scheduled', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, 'PASSED',    N'Passed',    1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, 'FAILED',    N'Failed',    1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(5, 'EXPIRED',   N'Expired',   1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[MeterTestStatusMaster] OFF;
GO


/* ==========================================================================
   10. [WTIS].[MeterTypeMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[MeterTypeMaster] ON;
GO

INSERT INTO [WTIS].[MeterTypeMaster]
(Id, MeterTypeCode, MeterType, Description, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'MECH',            N'Mechanical',    N'Mechanical velocity-based water meter',       1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(2, 'ELEC',            N'Electronic',    N'Electronic/digital display water meter',      1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(3, 'SMART',           N'Smart Meter',   N'IoT-enabled smart meter with remote telemetry', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(4, 'ULTRASONIC',      N'Ultrasonic',    N'Ultrasonic flow measurement water meter',     1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL),
(5, 'ELECTROMAGNETIC', N'Electromagnetic', N'Electromagnetic flow measurement water meter', 1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[MeterTypeMaster] OFF;
GO


/* ==========================================================================
   11. [WTIS].[MeterStatusMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[MeterStatusMaster] ON;
GO

INSERT INTO [WTIS].[MeterStatusMaster]
(Id, MeterStatusCode, MeterStatus, Description, IsActive, CreatedBy, CreatedDate)
VALUES
(1, 'RECEIVED',  N'Received',  N'Meter received by the department but not yet tested.',     1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(2, 'TESTING',   N'Testing',   N'Meter is currently under testing.',                          1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(3, 'INSTALLED', N'Installed', N'Meter is installed against a water connection.',             1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(4, 'STOPPED',   N'Stopped',   N'Meter is installed but currently not operational.',          1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(5, 'REMOVED',   N'Removed',   N'Meter has been removed from the water connection.',          1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime)),
(6, 'DAMAGED',   N'Damaged',   N'Meter is damaged and cannot be used normally.',               1, NULL, CAST(N'2026-09-16T10:20:18.000' AS DateTime));
GO

SET IDENTITY_INSERT [WTIS].[MeterStatusMaster] OFF;
GO


/* ==========================================================================
   12. [WTIS].[ChargeHeadMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[ChargeHeadMaster] ON;
GO

INSERT INTO [WTIS].[ChargeHeadMaster]
(Id, ChargeHeadCode, ChargeHeadName, ChargeHeadNameLocal, Description, ChargeType, IsRefundable, IsRegularPay, SequenceNo, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 'DEPOSIT_AMOUNT',       N'Deposit Amount',       N'नळ कनेक्शन अनामत',      NULL, 'Deposit', 1, 0, 1,  1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(2, 'NEW_INSTALLMENT_FEE',  N'New Installation Fee', N'नवीन स्त्रोत निर्मिती फि', NULL, 'Fee',     0, 0, 3,  1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(3, 'ROAD_MAINTENANCE_TAX', N'Road Maintenance Tax', N'रस्ता दुरुस्तीचे शुल्क',    NULL, 'Tax',     0, 0, 5,  1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(4, 'MAINTENANCE_FEE',      N'Maintenance Fee',      N'फिटर मंजुरी',            NULL, 'Fee',     0, 0, 6,  1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(5, 'BORING_FEE',           N'Boring Fee',           N'बोरिंग फी',              NULL, 'Fee',     0, 0, 45, 1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(6, 'EMPLOYEE_FEE',         N'Employee Fee',         N'कामगार मजुरी',           NULL, 'Fee',     0, 0, 55, 1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(7, 'WATER_CHARGE',         N'Water Charge',         N'पाणी शुल्क',             NULL, 'Charge',  0, 0, 60, 1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL),
(8, 'LATE_PAYMENT_PENALTY', N'Late Payment Penalty', N'विलंब शुल्क',            NULL, 'Penalty', 0, 0, 70, 1, 1, CAST(N'2026-09-24T12:16:53.997' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[ChargeHeadMaster] OFF;
GO


/* ==========================================================================
   13. [WTIS].[TariffMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[TariffMaster] ON;
GO

INSERT INTO [WTIS].[TariffMaster]
(Id, YearId, ConnectionTypeId, ConnectionCategoryId, TapSizeId, TariffCode, TariffName, EffectiveFrom, EffectiveTo, Description, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 4, 1, 1, 1, 'RES_REGULAR_05',  N'Residential Regular Water Tariff - 1/2 Inch', CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 1/2 inch water connection.', 1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(2, 4, 1, 1, 2, 'RES_REGULAR_075', N'Residential Regular Water Tariff - 3/4 Inch', CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 3/4 inch water connection.', 1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(3, 4, 1, 1, 3, 'RES_REGULAR_1',   N'Residential Regular Water Tariff - 1 Inch',    CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 1 inch water connection.',   1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(4, 4, 1, 1, 4, 'RES_REGULAR_15',  N'Residential Regular Water Tariff - 1.5 Inch',  CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 1.5 inch water connection.', 1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(5, 4, 1, 1, 5, 'RES_REGULAR_2',   N'Residential Regular Water Tariff - 2 Inch',    CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 2 inch water connection.',   1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(6, 4, 1, 1, 6, 'RES_REGULAR_3',   N'Residential Regular Water Tariff - 3 Inch',    CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 3 inch water connection.',   1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL),
(7, 4, 1, 1, 7, 'RES_REGULAR_4',   N'Residential Regular Water Tariff - 4 Inch',    CAST(N'2026-04-01' AS Date), CAST(N'2027-03-31' AS Date), N'Residential regular tariff for 4 inch water connection.',   1, 1, CAST(N'2026-10-02T16:06:37.453' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[TariffMaster] OFF;
GO


/* ==========================================================================
   14. [WTIS].[TariffChargeDetail] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[TariffChargeDetail] ON;
GO

INSERT INTO [WTIS].[TariffChargeDetail]
(Id, TariffId, ChargeHeadId, GeographyUnitId, Amount, IsDynamic, IsMandatory, SequenceNo, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 1, 1, 1, CAST(5000.0000 AS Decimal(19, 4)),  0, 1, 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(2, 1, 2, 1, CAST(2100.0000 AS Decimal(19, 4)),  0, 1, 3, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(3, 1, 4, 1, CAST(10000.0000 AS Decimal(19, 4)), 0, 1, 6, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(4, 2, 1, 1, CAST(10000.0000 AS Decimal(19, 4)), 0, 1, 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(5, 2, 2, 1, CAST(5900.0000 AS Decimal(19, 4)),  0, 1, 3, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(6, 2, 4, 1, CAST(20000.0000 AS Decimal(19, 4)), 0, 1, 6, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[TariffChargeDetail] OFF;
GO


/* ==========================================================================
   15. [WTIS].[TariffFormulaMaster] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[TariffFormulaMaster] ON;
GO

INSERT INTO [WTIS].[TariffFormulaMaster]
(Id, FormulaCode, FormulaName, Description, IsActive, CreatedBy, CreatedDate)
VALUES
(1, 'UNIT_RATE',       'Unit Rate',                   N'Calculates charge as Consumption Unit multiplied by Unit Rate.',                                                                  1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime)),
(2, 'FIXED',           'Fixed Charge',                N'Applies the configured Fixed Charge directly without consumption-based calculation.',                                              1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime)),
(3, 'UNIT_RATE_FIXED', 'Unit Rate Plus Fixed Charge', N'Calculates charge as Consumption Unit multiplied by Unit Rate plus Fixed Charge.',                                                1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime)),
(4, 'PER_CONNECTION',  'Per Connection Amount',       N'Applies a fixed amount configured per water connection.',                                                                          1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime)),
(5, 'MINIMUM_CHARGE',  'Minimum Charge',              N'Applies the calculated charge but ensures that the final amount is not less than the configured Minimum Charge.',                  1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime)),
(6, 'SLAB_RATE',       'Slab Rate',                   N'Calculates the amount based on the applicable consumption slab and configured Unit Rate.',                                         1, 1, CAST(N'2026-10-05T10:00:00.000' AS DateTime));
GO

SET IDENTITY_INSERT [WTIS].[TariffFormulaMaster] OFF;
GO


/* ==========================================================================
   16. [WTIS].[TariffSlabDetail] - SEED DATA
   ========================================================================== */
SET IDENTITY_INSERT [WTIS].[TariffSlabDetail] ON;
GO

INSERT INTO [WTIS].[TariffSlabDetail]
(Id, TariffId, GeographyUnitId, FromUnit, ToUnit, UnitRate, FixedCharge, MinimumCharge, MaximumCharge, PerConnectionAmount, FormulaCode, SortOrder, IsActive, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate)
VALUES
(1, 1, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(2, 2, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(3, 3, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(4, 4, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(5, 5, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(6, 6, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL),
(7, 7, 1, CAST(0.0000 AS Decimal(19, 4)), CAST(99999.0000 AS Decimal(19, 4)), CAST(9.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), CAST(0.0000 AS Decimal(19, 4)), NULL, NULL, 'UNIT_RATE', 1, 1, 1, CAST(N'2026-10-02T16:09:29.120' AS DateTime), NULL, NULL);
GO

SET IDENTITY_INSERT [WTIS].[TariffSlabDetail] OFF;
GO

