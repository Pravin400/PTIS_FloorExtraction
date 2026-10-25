using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using static NtisPlatform.Tests.Application.Services.Asset_Management.AssetMasterServiceSqliteHarness;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Covers <c>AssetMasterService.ParentAssets.cs</c> — <see cref="AssetMasterService.GetParentAssetDetailsAsync"/>:
/// the summary over the whole filtered set, per-row sub-unit/floor/lease/demand/file roll-ups,
/// rent annualisation per persisted PaymentFrequency, and stable paging. Runs on
/// <see cref="AssetMasterServiceSqliteHarness"/> because the roll-ups are cross-repository SQL.
/// </summary>
public class AssetMasterServiceParentAssetsTests
{
    private const int ShopPhotoTypeId = 1;
    private const int ShopTypeOfUseId = 100;
    private const int OfficeTypeOfUseId = 200;
    private const int GoodConditionId = 7;

    /// <summary>
    /// Three main assets (plus a deleted one) with sub-units, floor rows, leases and demand chosen so
    /// every inclusion rule has a row on each side of it.
    /// <list type="bullet">
    /// <item>Asset 1 (newest, active, encroached): sub-units 11 (active), 12 (inactive), 13 (deleted), 14 (inventory).</item>
    /// <item>Asset 2 (active, "No Issue"): sub-unit 21 (active).</item>
    /// <item>Asset 3 (oldest, inactive, never assessed): nothing under it.</item>
    /// </list>
    /// </summary>
    private static void SeedRegister(AssetMasterServiceSqliteHarness h)
    {
        var shopping = Asset(1, assetName: "Shopping Complex", createdDate: new DateTime(2026, 1, 3), encroachmentStatus: "Partially Encroached");
        shopping.AssetConditionId = GoodConditionId;

        h.Seed(
            shopping,
            Asset(2, assetName: "Office", createdDate: new DateTime(2026, 1, 2), encroachmentStatus: "No Issue"),
            Asset(3, assetName: "Old Hall", isActive: false, createdDate: new DateTime(2026, 1, 1)),
            Asset(4, assetName: "Deleted", markedForDeletion: true, createdDate: new DateTime(2026, 1, 4)),

            Asset(11, parentAssetId: 1),
            Asset(12, parentAssetId: 1, isActive: false),
            Asset(13, parentAssetId: 1, markedForDeletion: true),
            Asset(14, parentAssetId: 1),
            Asset(21, parentAssetId: 2),

            new AssetDetailsEntity { Id = 1, AssetId = 1, OrganizationId = 1, MpmsNo = "MP-1", LandAreaSqMeter = 500m, Address = "Market Road", CSN = "CSN-1" },
            new InventoryAssetDetailEntity { Id = 1, AssetId = 14, BatchId = 1, UnitNumber = 1 },

            // Asset 1's own row + active sub-unit 11's; the inactive unit's and the inactive row are excluded.
            new SubUnitsDetailsEntity { Id = 1, AssetId = 1, FloorId = GroundFloorId, ConstructionTypeId = RccConstructionTypeId, TypeOfUseId = ShopTypeOfUseId, ConstructionYear = "1995", CarpetAreaSqMeter = 100m, BuiltUpAreaSqMeter = 120m, CapitalValue = 1000m },
            new SubUnitsDetailsEntity { Id = 2, AssetId = 11, FloorId = FirstFloorId, ConstructionTypeId = RccConstructionTypeId, TypeOfUseId = ShopTypeOfUseId, ConstructionYear = "2001-02", CarpetAreaSqMeter = 50m, BuiltUpAreaSqMeter = 60m, CapitalValue = 500m },
            new SubUnitsDetailsEntity { Id = 3, AssetId = 12, FloorId = FirstFloorId, ConstructionTypeId = LoadBearingConstructionTypeId, TypeOfUseId = OfficeTypeOfUseId, CapitalValue = 9999m },
            new SubUnitsDetailsEntity { Id = 4, AssetId = 11, FloorId = FirstFloorId, ConstructionTypeId = LoadBearingConstructionTypeId, TypeOfUseId = OfficeTypeOfUseId, CapitalValue = 8888m, IsActive = false },
            new SubUnitsDetailsEntity { Id = 5, AssetId = 21, FloorId = GroundFloorId, ConstructionTypeId = LoadBearingConstructionTypeId, TypeOfUseId = OfficeTypeOfUseId, ConstructionYear = "2010", CapitalValue = 300m },

            // In force: 1000/month on unit 11 and 5000/year on asset 1 (17000/yr), 2000/quarter on unit 21 (8000/yr).
            Lease(1, 11, "Ramesh Traders", startOffsetDays: -30, endOffsetDays: 335, rentAmount: 1000m, paymentFrequency: "Monthly"),
            Lease(2, 1, "Hoarding Co", startOffsetDays: -100, endOffsetDays: null, rentAmount: 5000m, paymentFrequency: "Yearly"),
            Lease(3, 11, "Expired Tenant", startOffsetDays: -400, endOffsetDays: -35, rentAmount: 70000m),
            Lease(4, 11, "Future Tenant", startOffsetDays: 10, endOffsetDays: 375, rentAmount: 70000m),
            Lease(5, 11, "Deleted Lease", startOffsetDays: -30, endOffsetDays: 335, rentAmount: 70000m, markedForDeletion: true),
            Lease(6, 12, "Inactive Unit Tenant", startOffsetDays: -30, endOffsetDays: 335, rentAmount: 70000m),
            Lease(7, 21, "Office Tenant", startOffsetDays: -30, endOffsetDays: null, rentAmount: 2000m, paymentFrequency: "Quarterly"),

            Demand(1, 11, 300m),
            Demand(2, 1, 200m, demandStatus: "Partial"),
            Demand(3, 11, 999m, demandStatus: "Cancelled"),
            Demand(4, 11, 999m, isActive: false),
            Demand(5, 21, 50m));

        SetRows(h.TypeOfUseRepository,
            new AssetTypeOfUseMasterEntity { Id = ShopTypeOfUseId, TypeOfUseCode = "SHOP", Description = "Shop" },
            new AssetTypeOfUseMasterEntity { Id = OfficeTypeOfUseId, TypeOfUseCode = "OFF", Description = "Office" });
        SetRows(h.ConditionRepository,
            new AssetConditionMasterEntity { Id = GoodConditionId, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good" });
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_SummaryCoversWholeFilteredSet_NotJustTheCurrentPage()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        // A ParentAssetId would turn this into a child listing; the parent list must ignore it.
        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { PageNumber = 1, PageSize = 1, ParentAssetId = 1 });

        Assert.Equal(3, result.TotalCount);
        Assert.Equal(1, Assert.Single(result.Items).Id);

        var summary = result.Summary;
        Assert.Equal(3, summary.TotalParentAssets);
        Assert.Equal(2, summary.ActiveParentAssets);
        Assert.Equal(1, summary.EncroachedAssets);
        Assert.Equal(3, summary.TotalSubUnits);
        Assert.Equal(2, summary.ActiveSubUnits);
        Assert.Equal(1800m, summary.TotalCapitalValue);
        Assert.Equal(25000m, summary.TotalAnnualRevenue);
        Assert.Equal(550m, summary.TotalOutstanding);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_EncroachmentFilter_NarrowsSummaryToMatchingAssets()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { EncroachmentStatus = new List<string> { "Partially Encroached" } });

        Assert.Equal(1, Assert.Single(result.Items).Id);
        var summary = result.Summary;
        Assert.Equal(1, summary.TotalParentAssets);
        Assert.Equal(1, summary.EncroachedAssets);
        Assert.Equal(2, summary.TotalSubUnits);
        Assert.Equal(1, summary.ActiveSubUnits);
        Assert.Equal(1500m, summary.TotalCapitalValue);
        Assert.Equal(17000m, summary.TotalAnnualRevenue);
        Assert.Equal(500m, summary.TotalOutstanding);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_NoIssueFilter_AlsoMatchesAssetsNeverAssessed()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { EncroachmentStatus = new List<string> { "No Issue" } });

        Assert.Equal(new[] { 2, 3 }, result.Items.Select(i => i.Id).OrderBy(id => id));
        Assert.Equal(2, result.Summary.TotalParentAssets);
        Assert.Equal(0, result.Summary.EncroachedAssets);
        Assert.Equal(300m, result.Summary.TotalCapitalValue);
        Assert.Equal(8000m, result.Summary.TotalAnnualRevenue);
        Assert.Equal(50m, result.Summary.TotalOutstanding);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_IsActiveFilter_SummaryOnlyCountsMatchingAsset()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { IsActive = false });

        Assert.Equal(3, Assert.Single(result.Items).Id);
        var summary = result.Summary;
        Assert.Equal(1, summary.TotalParentAssets);
        Assert.Equal(0, summary.ActiveParentAssets);
        Assert.Equal(0, summary.TotalSubUnits);
        Assert.Equal(0m, summary.TotalCapitalValue);
        Assert.Equal(0m, summary.TotalAnnualRevenue);
        Assert.Equal(0m, summary.TotalOutstanding);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_RowRollsUpOwnAndActiveSubUnitData()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        var shopping = result.Items.Single(i => i.Id == 1);
        Assert.Equal("Shopping Complex", shopping.AssetName);
        Assert.Equal("Building", shopping.AssetCategoryName);
        Assert.Equal("Shopping Complex", shopping.AssetTypeName);
        Assert.Equal("MP-1", shopping.MpmsNo);
        Assert.Equal(500m, shopping.PlotAreaSqMeter);
        Assert.Equal("Market Road", shopping.Address);
        Assert.Equal("CSN-1", shopping.CSN);
        Assert.Equal("Good", shopping.AssetCondition);
        Assert.Equal("Partially Encroached", shopping.EncroachmentStatus);

        // Sub-units: 11 and 12 (deleted 13 and inventory 14 are not sub-units).
        Assert.Equal(2, shopping.TotalSubUnits);
        Assert.Equal(1, shopping.ActiveSubUnits);

        // Floors: asset 1's own row + active unit 11's active row.
        Assert.Equal(2, shopping.TotalFloors);
        Assert.Equal(1500m, shopping.CapitalValue);
        Assert.Equal(150m, shopping.CarpetAreaSqMeter);
        Assert.Equal(180m, shopping.BuiltUpAreaSqMeter);
        Assert.Equal(1995, shopping.ConstructionYear);
        Assert.Equal("RCC", shopping.ConstructionTypeName);
        Assert.Equal("Shop", shopping.TypeOfUseName);

        // Leases in force today only: unit 11 monthly + asset 1 yearly.
        Assert.Equal(2, shopping.ActiveLeaseCount);
        Assert.Equal(17000m, shopping.AnnualRevenue);
        Assert.Equal(500m, shopping.OutstandingAmount);

        var office = result.Items.Single(i => i.Id == 2);
        Assert.Equal(1, office.TotalSubUnits);
        Assert.Equal(1, office.TotalFloors);
        Assert.Equal(300m, office.CapitalValue);
        Assert.Equal("Load Bearing", office.ConstructionTypeName);
        Assert.Equal("Office", office.TypeOfUseName);
        Assert.Equal(1, office.ActiveLeaseCount);
        Assert.Equal(8000m, office.AnnualRevenue);
        Assert.Equal(50m, office.OutstandingAmount);

        var hall = result.Items.Single(i => i.Id == 3);
        Assert.Equal(0, hall.TotalSubUnits);
        Assert.Equal(0, hall.TotalFloors);
        Assert.Equal(0m, hall.CapitalValue);
        Assert.Null(hall.CarpetAreaSqMeter);
        Assert.Null(hall.ConstructionYear);
        Assert.Equal(0, hall.ActiveLeaseCount);
        Assert.Equal(0m, hall.AnnualRevenue);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_CountsAllLatestFileSlots_ButListsOnlyUploadedFiles()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var assetImage = UploadedFile(501, "front.jpg");
        SetRows(h.PhotoRepository,
            PhotoSlot(1, assetId: 1, photoTypeId: ShopPhotoTypeId, file: assetImage, remarks: "Asset Image"),
            PhotoSlot(2, assetId: 1, photoTypeId: 2),
            PhotoSlot(3, assetId: 1, photoTypeId: 3, file: UploadedFile(502, "removed.jpg", markedForDeletion: true)),
            PhotoSlot(4, assetId: 1, photoTypeId: 4, file: UploadedFile(503, "old.jpg"), isLatest: false),
            // Live files behind a detached binding are not uploaded files of this photo any more.
            PhotoSlot(5, assetId: 1, photoTypeId: 5, file: UploadedFile(504, "unbound.jpg"), bindingIsActive: false),
            PhotoSlot(6, assetId: 1, photoTypeId: 6, file: UploadedFile(505, "unlinked.jpg"), bindingMarkedForDeletion: true));
        var plan = UploadedFile(601, "plan.pdf");
        SetRows(h.DocumentRepository,
            DocumentSlot(1, assetId: 1, definitionId: 1, documentCode: "DOC-PLAN", file: plan),
            DocumentSlot(2, assetId: 1, definitionId: 2, documentCode: "DOC-TITLE"),
            DocumentSlot(3, assetId: 1, definitionId: 3, documentCode: "DOC-NOC", file: UploadedFile(602, "unbound.pdf"), bindingIsActive: false),
            DocumentSlot(4, assetId: 1, definitionId: 4, documentCode: "DOC-AGREEMENT", file: UploadedFile(603, "unlinked.pdf"), bindingMarkedForDeletion: true));

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        var shopping = result.Items.Single(i => i.Id == 1);
        Assert.Equal(5, shopping.PhotoCount);
        Assert.Equal(501, shopping.AssetDocumentId);
        var photo = Assert.Single(shopping.Photos);
        Assert.Equal(assetImage.DocumentGuid, photo.DocumentGuid);

        Assert.Equal(4, shopping.DocumentCount);
        Assert.True(shopping.HasPlanDocument);
        Assert.True(shopping.HasTitleDocument);
        Assert.False(shopping.HasSurveyDocument);
        var document = Assert.Single(shopping.Documents);
        Assert.Equal(plan.DocumentGuid, document.DocumentGuid);

        Assert.Empty(result.Items.Single(i => i.Id == 2).Photos);
    }

    [Theory]
    [InlineData(false, false, false)] // binding deactivated
    [InlineData(true, true, false)]   // binding soft-deleted
    [InlineData(true, false, true)]   // file soft-deleted
    public async Task GetParentAssetDetailsAsync_AssetImageWithoutLiveBindingAndFile_HasNoPhotoColumnImage(
        bool bindingIsActive, bool bindingMarkedForDeletion, bool fileMarkedForDeletion)
    {
        using var h = new AssetMasterServiceSqliteHarness();
        h.Seed(Asset(1));
        SetRows(h.PhotoRepository,
            PhotoSlot(1, assetId: 1, photoTypeId: ShopPhotoTypeId, remarks: "Asset Image",
                file: UploadedFile(501, "front.jpg", markedForDeletion: fileMarkedForDeletion),
                bindingIsActive: bindingIsActive, bindingMarkedForDeletion: bindingMarkedForDeletion));

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        var item = Assert.Single(result.Items);
        Assert.Null(item.AssetDocumentId);
        Assert.Empty(item.Photos);
        Assert.Equal(1, item.PhotoCount);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_InventoryUnitRows_AreLeftOutOfEveryRollUp()
    {
        // Inventory units are child AssetMaster rows but not sub-units, so nothing recorded against
        // one may reach the floor, capital value, lease or outstanding totals.
        using var h = new AssetMasterServiceSqliteHarness();
        h.Seed(
            Asset(1),
            Asset(11, parentAssetId: 1),
            Asset(14, parentAssetId: 1),
            new InventoryAssetDetailEntity { Id = 1, AssetId = 14, BatchId = 1, UnitNumber = 1 },
            new SubUnitsDetailsEntity { Id = 1, AssetId = 11, FloorId = GroundFloorId, ConstructionTypeId = RccConstructionTypeId, TypeOfUseId = ShopTypeOfUseId, CarpetAreaSqMeter = 40m, CapitalValue = 100m },
            new SubUnitsDetailsEntity { Id = 2, AssetId = 14, FloorId = FirstFloorId, ConstructionTypeId = LoadBearingConstructionTypeId, TypeOfUseId = OfficeTypeOfUseId, ConstructionYear = "1950", CarpetAreaSqMeter = 900m, CapitalValue = 9000m },
            Lease(1, 14, "Inventory Tenant", startOffsetDays: -30, endOffsetDays: null, rentAmount: 1000m),
            Demand(1, 14, 700m));

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        var item = Assert.Single(result.Items);
        Assert.Equal(1, item.TotalSubUnits);
        Assert.Equal(1, item.TotalFloors);
        Assert.Equal(100m, item.CapitalValue);
        Assert.Equal(40m, item.CarpetAreaSqMeter);
        Assert.Null(item.ConstructionYear);
        Assert.Equal("RCC", item.ConstructionTypeName);
        Assert.Equal(0, item.ActiveLeaseCount);
        Assert.Equal(0m, item.AnnualRevenue);
        Assert.Equal(0m, item.OutstandingAmount);

        var summary = result.Summary;
        Assert.Equal(1, summary.TotalSubUnits);
        Assert.Equal(100m, summary.TotalCapitalValue);
        Assert.Equal(0m, summary.TotalAnnualRevenue);
        Assert.Equal(0m, summary.TotalOutstanding);
    }

    [Theory]
    [InlineData("CapitalValue", "desc", new[] { 2, 1 })]
    [InlineData("CapitalValue", "asc", new[] { 1, 2 })]
    [InlineData("AssetLife", "desc", new[] { 2, 1 })] // oldest construction (longest life) first
    [InlineData("AssetLife", "asc", new[] { 1, 2 })]
    public async Task GetParentAssetDetailsAsync_ComputedSorts_FollowShownValues_IgnoringInventoryUnits(string sortBy, string sortOrder, int[] expectedIds)
    {
        // Asset 1's inventory unit carries the largest capital value and the oldest construction
        // year; counting it would put asset 1 on the wrong side of asset 2 in every case.
        using var h = new AssetMasterServiceSqliteHarness();
        h.Seed(
            Asset(1),
            Asset(2),
            Asset(11, parentAssetId: 1),
            Asset(14, parentAssetId: 1),
            Asset(21, parentAssetId: 2),
            new InventoryAssetDetailEntity { Id = 1, AssetId = 14, BatchId = 1, UnitNumber = 1 },
            new SubUnitsDetailsEntity { Id = 1, AssetId = 1, FloorId = GroundFloorId, ConstructionTypeId = RccConstructionTypeId, ConstructionYear = "1990", CapitalValue = 100m },
            new SubUnitsDetailsEntity { Id = 2, AssetId = 11, FloorId = FirstFloorId, ConstructionTypeId = RccConstructionTypeId, ConstructionYear = "2000", CapitalValue = 50m },
            new SubUnitsDetailsEntity { Id = 3, AssetId = 14, FloorId = FirstFloorId, ConstructionTypeId = RccConstructionTypeId, ConstructionYear = "1900", CapitalValue = 9000m },
            new SubUnitsDetailsEntity { Id = 4, AssetId = 21, FloorId = GroundFloorId, ConstructionTypeId = RccConstructionTypeId, ConstructionYear = "1980", CapitalValue = 500m });

        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { SortBy = sortBy, SortOrder = sortOrder });

        Assert.Equal(expectedIds, result.Items.Select(i => i.Id));
        // The values the order follows are the ones each row shows.
        var first = result.Items.Single(i => i.Id == 1);
        var second = result.Items.Single(i => i.Id == 2);
        Assert.Equal(150m, first.CapitalValue);
        Assert.Equal(500m, second.CapitalValue);
        Assert.Equal(1990, first.ConstructionYear);
        Assert.Equal(1980, second.ConstructionYear);
    }

    [Theory]
    [InlineData("Monthly", 14400)]
    [InlineData("Quarterly", 4800)]
    [InlineData("Yearly", 1200)]
    [InlineData("One-time", 1200)]
    public async Task GetParentAssetDetailsAsync_AnnualisesRentByPersistedPaymentFrequency(string paymentFrequency, int expectedAnnual)
    {
        using var h = new AssetMasterServiceSqliteHarness();
        h.Seed(
            Asset(1),
            Asset(11, parentAssetId: 1),
            Lease(1, 11, "Tenant", startOffsetDays: -1, endOffsetDays: null, rentAmount: 1200m, paymentFrequency: paymentFrequency));

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        Assert.Equal(expectedAnnual, Assert.Single(result.Items).AnnualRevenue);
        Assert.Equal(expectedAnnual, result.Summary.TotalAnnualRevenue);
    }

    [Theory]
    [InlineData(null, "asc", new[] { 5, 4, 3, 2, 1 })]
    [InlineData("AssetName", "asc", new[] { 1, 2, 3, 4, 5 })]
    [InlineData("AssetName", "desc", new[] { 5, 4, 3, 2, 1 })]
    public async Task GetParentAssetDetailsAsync_TiedSortKeys_PagesAreDisjointAndOrderedById(string? sortBy, string sortOrder, int[] expectedIds)
    {
        using var h = new AssetMasterServiceSqliteHarness();
        var sameDay = new DateTime(2026, 2, 1);
        h.Seed(Enumerable.Range(1, 5)
            .Select(id => (object)Asset(id, assetName: "Same Name", createdDate: sameDay))
            .ToArray());
        var service = h.CreateService();

        var pagedIds = new List<int>();
        for (var page = 1; page <= 3; page++)
        {
            var result = await service.GetParentAssetDetailsAsync(new AssetMasterQueryParameters
            {
                PageNumber = page,
                PageSize = 2,
                SortBy = sortBy,
                SortOrder = sortOrder
            });
            Assert.Equal(5, result.TotalCount);
            pagedIds.AddRange(result.Items.Select(i => i.Id));
        }

        Assert.Equal(expectedIds, pagedIds);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_PageSizeMinusOne_ReturnsEveryRowOnOnePage()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedRegister(h);

        var result = await h.CreateService().GetParentAssetDetailsAsync(
            new AssetMasterQueryParameters { PageNumber = 3, PageSize = -1 });

        Assert.Equal(3, result.Items.Count());
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(3, result.PageSize);
    }

    [Fact]
    public async Task GetParentAssetDetailsAsync_NoMainAssets_ReturnsEmptyPageAndZeroSummary()
    {
        using var h = new AssetMasterServiceSqliteHarness();

        var result = await h.CreateService().GetParentAssetDetailsAsync(new AssetMasterQueryParameters());

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.Summary.TotalParentAssets);
        Assert.Equal(0m, result.Summary.TotalAnnualRevenue);
        Assert.Equal(0m, result.Summary.TotalOutstanding);
    }
}
