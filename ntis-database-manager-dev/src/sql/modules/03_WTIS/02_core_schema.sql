/* ==========================================================================
   [WTIS].[TariffSlabDetail] - NON-OVERLAPPING SLAB RANGES
   Active slabs of the same Tariff + GeographyUnit must not overlap.
   Ranges are half-open [FromUnit, ToUnit): a slab may start at the ToUnit of the previous one.
   FromUnit is required; NULL ToUnit = open-ended. NULL GeographyUnitId slabs are compared with each other.
   ========================================================================== */
CREATE OR ALTER TRIGGER [WTIS].[TR_TariffSlabDetail_NoOverlap]
ON [WTIS].[TariffSlabDetail]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT (UPDATE([TariffId]) OR UPDATE([GeographyUnitId]) OR UPDATE([FromUnit]) OR UPDATE([ToUnit]) OR UPDATE([IsActive]))
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN [WTIS].[TariffSlabDetail] t WITH (UPDLOCK, HOLDLOCK)
          ON  t.[TariffId] = i.[TariffId]
          AND ISNULL(t.[GeographyUnitId], -1) = ISNULL(i.[GeographyUnitId], -1)
          AND t.[Id] <> i.[Id]
          AND t.[IsActive] = 1
          AND t.[FromUnit] < COALESCE(i.[ToUnit], 999999999999999.9999)
          AND i.[FromUnit] < COALESCE(t.[ToUnit], 999999999999999.9999)
        WHERE i.[IsActive] = 1
    )
    BEGIN
        ;THROW 50001, 'Overlapping active slab ranges are not allowed for the same Tariff and GeographyUnit.', 1;
    END
END
GO
