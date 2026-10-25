using AutoMapper;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.DTOs.Asset_Management.AssetMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using static NtisPlatform.Tests.Application.Services.Asset_Management.AssetMasterServiceSqliteHarness;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Covers <c>AssetMasterService.SubAssets.cs</c> — <see cref="AssetMasterService.GetByParentAssetIdAsync"/>,
/// <see cref="AssetMasterService.GetAssetFloorAndOtherDetailsAsync"/> (including the private
/// <c>MapInventoryData</c> helper, exercised indirectly),
/// <see cref="AssetMasterService.GetSubAssetsGroupedByParentAsync"/> and
/// <see cref="AssetMasterService.GetSubUnitDetailsByParentAsync"/> (SQLite-backed, see its region). These methods internally call
/// into <c>AssetMasterService.Location.cs</c> (<c>EnrichLocationAsync</c>/<c>ApplyLocation</c>/
/// <c>GetLocationInfoByAssetIdsAsync</c>) and <c>AssetMasterService.Inventory.cs</c>
/// (<c>GetAllocatedAssetIdsAsync</c>/<c>BuildInventoryDataAsync</c>) — those have their own dedicated
/// test files, so here every location/inventory-adjacent repository is just defaulted to an empty
/// queryable unless a specific test needs rows to exercise the interaction points in this file.
/// </summary>
public class AssetMasterServiceSubAssetsTests
{
    private static AssetMasterService CreateService(
        out Mock<IRepository<AssetMasterEntity, int>> repository,
        out Mock<IRepository<SubUnitsDetailsEntity, int>> floorDetailsRepository,
        out Mock<IRepository<AssetRoomWiseSubmissionDetailsEntity, int>> roomWiseSubmissionRepository,
        out Mock<IRepository<AssetTypeOfUseMasterEntity, int>> amsTypeOfUseRepository,
        out Mock<IRepository<AssetSubTypeOfUseEntity, int>> amsSubTypeOfUseRepository,
        out Mock<IRepository<InventoryBatchEntity, int>> inventoryBatchRepository,
        out Mock<IRepository<InventoryAssetDetailEntity, int>> inventoryAssetDetailRepository,
        out Mock<IInventoryDocumentApplicationService> inventoryDocumentApplicationService,
        out Mock<IRepository<AssetLeaseRentDetailsEntity, int>> leaseRentDetailsRepository,
        out Mock<IRepository<AssetDetailsEntity, int>> detailsRepository)
    {
        repository = new Mock<IRepository<AssetMasterEntity, int>>();
        floorDetailsRepository = new Mock<IRepository<SubUnitsDetailsEntity, int>>();
        roomWiseSubmissionRepository = new Mock<IRepository<AssetRoomWiseSubmissionDetailsEntity, int>>();
        amsTypeOfUseRepository = new Mock<IRepository<AssetTypeOfUseMasterEntity, int>>();
        amsSubTypeOfUseRepository = new Mock<IRepository<AssetSubTypeOfUseEntity, int>>();
        inventoryBatchRepository = new Mock<IRepository<InventoryBatchEntity, int>>();
        inventoryAssetDetailRepository = new Mock<IRepository<InventoryAssetDetailEntity, int>>();
        inventoryDocumentApplicationService = new Mock<IInventoryDocumentApplicationService>();
        leaseRentDetailsRepository = new Mock<IRepository<AssetLeaseRentDetailsEntity, int>>();
        detailsRepository = new Mock<IRepository<AssetDetailsEntity, int>>();

        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var mapperConfig = new MapperConfiguration(
            cfg => cfg.AddProfile<AssetMasterMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var mapper = mapperConfig.CreateMapper();

        var referenceValidator = new Mock<IReferenceValidationService>();
        var fieldValueRepository = new Mock<IRepository<AssetFieldValueEntity, int>>();
        var assetCategoryRepository = new Mock<IRepository<AssetCategoryEntity, int>>();
        var assetTypeRepository = new Mock<IRepository<AssetTypeEntity, int>>();
        var ulbRepository = new Mock<IRepository<ULBMasterEntity, int>>();
        var assetDocumentRepository = new Mock<IRepository<AssetDocumentEntity, int>>();
        var assetPhotoRepository = new Mock<IRepository<AssetPhotoEntity, int>>();
        var assetPhotoApplicationService = new Mock<IAssetPhotoApplicationService>();
        var documentApplicationService = new Mock<IDocumentApplicationService>();
        var zoneRepository = new Mock<IRepository<ZoneEntity, int>>();
        var wardRepository = new Mock<IRepository<WardEntity, int>>();
        var moujaRepository = new Mock<IRepository<MoujaEntity, int>>();
        var subZoneRepository = new Mock<IRepository<SubZoneDetailsForCVEntity, int>>();
        var departmentRepository = new Mock<IRepository<OwningDepartmentEntity, int>>();
        var organizationRepository = new Mock<IRepository<AssetOrganizationMasterEntity, int>>();
        var conditionRepository = new Mock<IRepository<AssetConditionMasterEntity, int>>();
        var deptMasterRepository = new Mock<IRepository<DepartmentMasterEntity, int>>();
        var moduleMasterRepository = new Mock<IRepository<ModuleMasterEntity, int>>();
        var designationRepository = new Mock<IRepository<AssetDesignationEntity, int>>();
        var logger = new Mock<ILogger<AssetMasterService>>();
        var inventoryCategoryRepository = new Mock<IRepository<InventoryItemCategoryEntity, int>>();
        var inventoryNameRepository = new Mock<IRepository<InventoryItemNameEntity, int>>();
        var inventoryModelRepository = new Mock<IRepository<InventoryItemModelEntity, int>>();
        var inventoryDepartmentRepository = new Mock<IRepository<OwningDepartmentEntity, int>>();

        // Every repository the batched location/inventory queries touch must return SOME queryable
        // (even if empty) or the LINQ joins/subqueries in the methods under test throw. Default
        // everything to empty first; individual tests override specific repos with real rows.
        SetupRows(repository);
        SetupRows(floorDetailsRepository);
        SetupRows(roomWiseSubmissionRepository);
        SetupRows(amsTypeOfUseRepository);
        SetupRows(amsSubTypeOfUseRepository);
        SetupRows(inventoryBatchRepository);
        SetupRows(inventoryAssetDetailRepository);
        SetupRows(leaseRentDetailsRepository);
        SetupRows(fieldValueRepository);
        SetupRows(assetCategoryRepository);
        SetupRows(assetTypeRepository);
        SetupRows(ulbRepository);
        SetupRows(detailsRepository);
        SetupRows(assetDocumentRepository);
        SetupRows(assetPhotoRepository);
        SetupRows(zoneRepository);
        SetupRows(wardRepository);
        SetupRows(moujaRepository);
        SetupRows(subZoneRepository);
        SetupRows(departmentRepository);
        SetupRows(organizationRepository);
        SetupRows(conditionRepository);
        SetupRows(deptMasterRepository);
        SetupRows(moduleMasterRepository);
        SetupRows(designationRepository);
        SetupRows(inventoryCategoryRepository);
        SetupRows(inventoryNameRepository);
        SetupRows(inventoryModelRepository);
        SetupRows(inventoryDepartmentRepository);

        inventoryDocumentApplicationService
            .Setup(s => s.GetDocumentsByInventoryBatchesAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, List<InventoryDocumentDto>>());

        return new AssetMasterService(
            repository.Object,
            unitOfWork.Object,
            mapper,
            referenceValidator.Object,
            fieldValueRepository.Object,
            floorDetailsRepository.Object,
            roomWiseSubmissionRepository.Object,
            assetCategoryRepository.Object,
            assetTypeRepository.Object,
            ulbRepository.Object,
            detailsRepository.Object,
            assetDocumentRepository.Object,
            assetPhotoRepository.Object,
            assetPhotoApplicationService.Object,
            documentApplicationService.Object,
            zoneRepository.Object,
            wardRepository.Object,
            moujaRepository.Object,
            subZoneRepository.Object,
            departmentRepository.Object,
            organizationRepository.Object,
            conditionRepository.Object,
            deptMasterRepository.Object,
            moduleMasterRepository.Object,
            designationRepository.Object,
            amsTypeOfUseRepository.Object,
            amsSubTypeOfUseRepository.Object,
            logger.Object,
            inventoryBatchRepository.Object,
            inventoryAssetDetailRepository.Object,
            inventoryCategoryRepository.Object,
            inventoryNameRepository.Object,
            inventoryModelRepository.Object,
            inventoryDepartmentRepository.Object,
            inventoryDocumentApplicationService.Object,
            leaseRentDetailsRepository.Object,
            new Mock<IRepository<MonthWiseDemandEntity, int>>().Object);
    }

    private static void SetupRows<T>(Mock<IRepository<T, int>> repoMock, params T[] rows) where T : class
    {
        var mockQuery = rows.ToList().BuildMockDbSet();
        repoMock.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);
    }

    #region GetByParentAssetIdAsync

    [Fact]
    public async Task GetByParentAssetIdAsync_ReturnsChildAssets_ForGivenParent()
    {
        var service = CreateService(out var repository, out _, out _, out _, out _, out _, out _, out _, out _, out var detailsRepository);

        var parent = new AssetMasterEntity { Id = 1, AssetName = "Parent Building", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var child1 = new AssetMasterEntity { Id = 2, ParentAssetId = 1, AssetNo = "A-1", AssetName = "Shop 1", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var child2 = new AssetMasterEntity { Id = 3, ParentAssetId = 1, AssetNo = "A-2", AssetName = "Shop 2", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var unrelated = new AssetMasterEntity { Id = 4, ParentAssetId = 99, AssetNo = "A-3", AssetName = "Unrelated", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repository, parent, child1, child2, unrelated);

        // EnrichLocationAsync's batched join (Location.cs) dereferences the joined AssetDetails row
        // directly for fields like ZoneId in a couple of places without a null-check on the row
        // itself (only on the downstream zone/ward/... lookups) -- under MockQueryable's in-memory
        // LINQ execution (unlike a real translated SQL LEFT JOIN) that throws a NullReferenceException
        // if an asset has no matching AssetDetails row at all. Giving every enriched asset id a
        // (mostly empty) AssetDetails row sidesteps that without asserting anything about location
        // data itself -- that behavior is covered by AssetMasterServiceLocationTests.cs.
        SetupRows(detailsRepository, new AssetDetailsEntity { AssetId = child1.Id }, new AssetDetailsEntity { AssetId = child2.Id });

        var result = await service.GetByParentAssetIdAsync(1, floorDetailsId: 0, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.Id == 2 && r.AssetName == "Shop 1");
        Assert.Contains(result, r => r.Id == 3 && r.AssetName == "Shop 2");
        Assert.DoesNotContain(result, r => r.Id == 4);
    }

    // Section B item 3 of the test coverage roadmap: `floorDetailsId` is accepted by
    // GetByParentAssetIdAsync but is never referenced anywhere in the method body (confirmed by
    // reading AssetMasterService.SubAssets.cs — no field/property/query in the method touches it).
    // This test locks in that dead-parameter behavior: calling with wildly different floorDetailsId
    // values must produce identical results. If Section B item 3 is ever resolved (the parameter
    // either removed from the signature or wired up to actually filter), replace this test with one
    // that asserts the real filtering behavior instead of the current no-op.
    [Fact]
    public async Task GetByParentAssetIdAsync_BehaviorIsIdenticalRegardlessOfFloorDetailsIdValue()
    {
        var service = CreateService(out var repository, out _, out _, out _, out _, out _, out _, out _, out _, out var detailsRepository);

        var child = new AssetMasterEntity { Id = 2, ParentAssetId = 1, AssetNo = "A-1", AssetName = "Shop 1", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repository, child);
        // See comment in GetByParentAssetIdAsync_ReturnsChildAssets_ForGivenParent above: without a
        // matching AssetDetails row, EnrichLocationAsync's batched join throws under MockQueryable.
        SetupRows(detailsRepository, new AssetDetailsEntity { AssetId = child.Id });

        var resultWithFloorDetailsId1 = await service.GetByParentAssetIdAsync(1, floorDetailsId: 1, CancellationToken.None);
        var resultWithFloorDetailsId999 = await service.GetByParentAssetIdAsync(1, floorDetailsId: 999, CancellationToken.None);

        Assert.Single(resultWithFloorDetailsId1);
        Assert.Single(resultWithFloorDetailsId999);
        Assert.Equal(resultWithFloorDetailsId1[0].Id, resultWithFloorDetailsId999[0].Id);
        Assert.Equal(resultWithFloorDetailsId1[0].AssetNo, resultWithFloorDetailsId999[0].AssetNo);
        Assert.Equal(resultWithFloorDetailsId1[0].AssetName, resultWithFloorDetailsId999[0].AssetName);
    }

    #endregion

    #region GetAssetFloorAndOtherDetailsAsync

    [Fact]
    public async Task GetAssetFloorAndOtherDetailsAsync_WhenParentNotFound_ReturnsNull()
    {
        var service = CreateService(out var repository, out _, out _, out _, out _, out _, out _, out _, out _, out _);
        SetupRows(repository); // no asset with Id == 123 at all

        var result = await service.GetAssetFloorAndOtherDetailsAsync(123, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAssetFloorAndOtherDetailsAsync_GroupsFloorSummaryByFloorId()
    {
        var service = CreateService(out var repository, out var floorDetailsRepository, out _, out _, out _, out _, out _, out _, out _, out _);

        var parent = new AssetMasterEntity { Id = 1, AssetName = "Parent Building", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var child = new AssetMasterEntity { Id = 2, ParentAssetId = 1, AssetName = "Shop 1", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repository, parent, child);

        // Two SubUnitsDetails rows sharing the same FloorId (100) but with different
        // CarpetAreaSqMeter values -- the grouped floor summary must sum them into one entry.
        var groundFloor = new FloorEntity { Id = 100, Description = "Ground Floor", SequenceNo = 1 };
        var floorDetail1 = new SubUnitsDetailsEntity
        {
            Id = 10,
            AssetId = child.Id,
            FloorId = 100,
            IsActive = true,
            MarkedForDeletion = false,
            CarpetAreaSqMeter = 10m,
            Floor = groundFloor
        };
        var floorDetail2 = new SubUnitsDetailsEntity
        {
            Id = 11,
            AssetId = child.Id,
            FloorId = 100,
            IsActive = true,
            MarkedForDeletion = false,
            CarpetAreaSqMeter = 20m,
            Floor = groundFloor
        };
        SetupRows(floorDetailsRepository, floorDetail1, floorDetail2);

        var result = await service.GetAssetFloorAndOtherDetailsAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(result!.FloorSummary);
        var floorSummaryEntry = Assert.Single(result.FloorSummary!.FloorDetails);
        Assert.Equal("Ground Floor", floorSummaryEntry.FloorName);
        Assert.Equal(30m, floorSummaryEntry.CarpetAreaSqMeter);
        Assert.Equal(1, result.FloorSummary.TotalFloors);
    }

    // MapInventoryData is `private static`, so it's exercised indirectly through
    // GetAssetFloorAndOtherDetailsAsync, which always calls BuildInventoryDataAsync (Inventory.cs)
    // then feeds the result through MapInventoryData before returning.
    [Fact]
    public async Task MapInventoryData_FiltersDocumentsToInventoryImageAndInvoiceRemarksOnly()
    {
        var service = CreateService(
            out var repository, out _, out _, out _, out _,
            out var inventoryBatchRepository, out _, out var inventoryDocumentApplicationService, out _, out _);

        var parent = new AssetMasterEntity { Id = 1, AssetName = "Parent Building", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repository, parent);

        var batch = new InventoryBatchEntity
        {
            Id = 500,
            ParentAssetId = 1,
            IsActive = true,
            MarkedForDeletion = false,
            PurchaseDate = DateTime.Now,
            Quantity = 1,
            UnitValue = 100m,
            TotalBatchValue = 100m
        };
        SetupRows(inventoryBatchRepository, batch);

        inventoryDocumentApplicationService
            .Setup(s => s.GetDocumentsByInventoryBatchesAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, List<InventoryDocumentDto>>
            {
                [500] = new List<InventoryDocumentDto>
                {
                    new InventoryDocumentDto { InventoryDocumentId = 1, InventoryBatchId = 500, DocumentTypeCode = "IMG", DocumentTypeName = "Image", Remarks = "Inventory Image" },
                    new InventoryDocumentDto { InventoryDocumentId = 2, InventoryBatchId = 500, DocumentTypeCode = "INV", DocumentTypeName = "Invoice", Remarks = "Inventory Invoice" },
                    new InventoryDocumentDto { InventoryDocumentId = 3, InventoryBatchId = 500, DocumentTypeCode = "OTH", DocumentTypeName = "Other", Remarks = "Random Note" }
                }
            });

        var result = await service.GetAssetFloorAndOtherDetailsAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(result!.InventoryData);
        var mappedBatch = Assert.Single(result.InventoryData!.Batches);
        Assert.Equal(2, mappedBatch.Documents.Count);
        Assert.Contains(mappedBatch.Documents, d => d.Remarks == "Inventory Image");
        Assert.Contains(mappedBatch.Documents, d => d.Remarks == "Inventory Invoice");
        Assert.DoesNotContain(mappedBatch.Documents, d => d.Remarks == "Random Note");
    }

    #endregion

    #region GetSubAssetsGroupedByParentAsync

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GetSubAssetsGroupedByParentAsync_WithZeroOrNegativeParentAssetId_ThrowsArgumentOutOfRangeException(int parentAssetId)
    {
        var service = CreateService(out _, out _, out _, out _, out _, out _, out _, out _, out _, out _);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => service.GetSubAssetsGroupedByParentAsync(parentAssetId, CancellationToken.None));
    }

    // IMPORTANT: this is deliberately different from GetAssetFloorAndOtherDetailsAsync's
    // "not found" behavior tested above (which returns a null DTO). GetSubAssetsGroupedByParentAsync
    // instead returns a non-null SubAssetGroupedResponseDto with ParentAsset == null,
    // TotalSubAssets == 0, and an empty SubAssets list. These are sibling methods in the same file
    // covering the same "missing/inactive parent" scenario with two different result shapes -- easy
    // to conflate, so this test asserts the actual (non-null, empty) shape explicitly.
    [Fact]
    public async Task GetSubAssetsGroupedByParentAsync_WhenParentNotActiveOrNotFound_ReturnsEmptyResult_DoesNotThrowOrReturnNull()
    {
        // Case 1: no asset with this Id exists at all.
        var serviceForMissingParent = CreateService(out var repositoryForMissingParent, out _, out _, out _, out _, out _, out _, out _, out _, out _);
        SetupRows(repositoryForMissingParent);

        var resultForMissingParent = await serviceForMissingParent.GetSubAssetsGroupedByParentAsync(42, CancellationToken.None);

        Assert.NotNull(resultForMissingParent);
        Assert.Null(resultForMissingParent.ParentAsset);
        Assert.Equal(0, resultForMissingParent.TotalSubAssets);
        Assert.Empty(resultForMissingParent.SubAssets);

        // Case 2: the asset exists but IsActive == false -- the query's `a.IsActive` filter excludes
        // it just like a missing row would, producing the identical empty (never null) result shape.
        var serviceForInactiveParent = CreateService(out var repositoryForInactiveParent, out _, out _, out _, out _, out _, out _, out _, out _, out _);
        var inactiveParent = new AssetMasterEntity { Id = 42, AssetName = "Inactive Parent", IsActive = false, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repositoryForInactiveParent, inactiveParent);

        var resultForInactiveParent = await serviceForInactiveParent.GetSubAssetsGroupedByParentAsync(42, CancellationToken.None);

        Assert.NotNull(resultForInactiveParent);
        Assert.Null(resultForInactiveParent.ParentAsset);
        Assert.Equal(0, resultForInactiveParent.TotalSubAssets);
        Assert.Empty(resultForInactiveParent.SubAssets);
    }

    [Fact]
    public async Task GetSubAssetsGroupedByParentAsync_ExcludesAssetsAlreadyAllocatedToInventory()
    {
        var service = CreateService(
            out var repository, out _, out _, out _, out _,
            out _, out var inventoryAssetDetailRepository, out _, out _, out var detailsRepository);

        var parent = new AssetMasterEntity { Id = 1, AssetName = "Parent Building", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var child1 = new AssetMasterEntity { Id = 2, ParentAssetId = 1, AssetNo = "A-1", AssetName = "Shop 1", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        var child2 = new AssetMasterEntity { Id = 3, ParentAssetId = 1, AssetNo = "A-2", AssetName = "Shop 2 (Allocated)", IsActive = true, FieldValues = new List<AssetFieldValueEntity>() };
        SetupRows(repository, parent, child1, child2);

        // GetSubAssetsGroupedByParentAsync resolves location context for the parent AND for every
        // remaining (non-allocated) sub-asset via GetLocationInfoByAssetIdsAsync (Location.cs). Under
        // MockQueryable's in-memory join execution that throws if an asset has no matching
        // AssetDetails row at all (see comment in the GetByParentAssetIdAsync tests above) -- give the
        // parent and child1 one each. child2 is allocated and excluded before location resolution, so
        // it doesn't need one.
        SetupRows(detailsRepository, new AssetDetailsEntity { AssetId = parent.Id }, new AssetDetailsEntity { AssetId = child1.Id });

        // child2 (Id = 3) already has an inventory unit pointing at it -- GetAllocatedAssetIdsAsync
        // (Inventory.cs) should surface its id, and GetSubAssetsGroupedByParentAsync must exclude it.
        var allocatedUnit = new InventoryAssetDetailEntity { Id = 900, AssetId = child2.Id, BatchId = 500, UnitNumber = 1 };
        SetupRows(inventoryAssetDetailRepository, allocatedUnit);

        var result = await service.GetSubAssetsGroupedByParentAsync(1, CancellationToken.None);

        Assert.NotNull(result.ParentAsset);
        Assert.Equal(1, result.TotalSubAssets);
        var remainingSubAsset = Assert.Single(result.SubAssets);
        Assert.Equal(child1.Id, remainingSubAsset.Id);
        Assert.DoesNotContain(result.SubAssets, sa => sa.Id == child2.Id);
    }

    #endregion

    #region GetSubUnitDetailsByParentAsync

    // The sub-unit query composes the inventory-unit exclusion and the tenant-search lease subquery
    // into one SQL statement, so these tests run on AssetMasterServiceSqliteHarness rather than the
    // MockQueryable factory above.

    /// <summary>
    /// Parent 1 with sub-units 11 (active, tenant "Ramesh Traders" in force today), 12 (inactive,
    /// tenant "Mahesh Mart" starting in 5 days) and 13 (active, tenant "Suresh Stores" ended yesterday
    /// and a deleted in-force lease for "Ganesh Agencies"); 14 (deleted) and 15 (inventory unit) are
    /// not sub-units. Parent 2's unit 21 shares unit 11's name and must never appear.
    /// </summary>
    private static void SeedSubUnits(AssetMasterServiceSqliteHarness h)
    {
        var shopOne = Asset(11, parentAssetId: 1, assetNo: "AST-1/S01", assetName: "Shop One");
        shopOne.AssetRegionalName = "दुकान एक";

        h.Seed(
            Asset(1, assetNo: "AST-1", assetName: "Shopping Complex"),
            Asset(2, assetNo: "AST-2", assetName: "Market"),
            shopOne,
            Asset(12, parentAssetId: 1, assetNo: "AST-1/S02", assetName: "Shop Two", isActive: false),
            Asset(13, parentAssetId: 1, assetNo: "AST-1/S03", assetName: "Shop Three"),
            Asset(14, parentAssetId: 1, assetNo: "AST-1/S04", assetName: "Shop Four", markedForDeletion: true),
            Asset(15, parentAssetId: 1, assetNo: "AST-1/S05", assetName: "Chair"),
            Asset(21, parentAssetId: 2, assetNo: "AST-2/S01", assetName: "Shop One"),
            new InventoryAssetDetailEntity { Id = 1, AssetId = 15, BatchId = 1, UnitNumber = 1 },
            Lease(1, 11, "Ramesh Traders", startOffsetDays: -30, endOffsetDays: 335),
            Lease(2, 13, "Suresh Stores", startOffsetDays: -400, endOffsetDays: -1),
            Lease(3, 12, "Mahesh Mart", startOffsetDays: 5, endOffsetDays: 370),
            Lease(4, 13, "Ganesh Agencies", startOffsetDays: -30, endOffsetDays: null, markedForDeletion: true));
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_ParentMissingOrDeleted_ReturnsNull()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        h.Seed(Asset(1, markedForDeletion: true));
        var service = h.CreateService();

        Assert.Null(await service.GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters()));
        Assert.Null(await service.GetSubUnitDetailsByParentAsync(999, new SubUnitDetailsQueryParameters()));
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_ListsNonInventorySubUnits_IncludingInactiveOnes()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);

        var result = await h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters());

        Assert.NotNull(result);
        Assert.Equal("AST-1", result!.ParentAssetNo);
        Assert.Equal("Shopping Complex", result.ParentAssetName);
        Assert.True(result.ParentIsActive);
        Assert.Equal(3, result.TotalSubUnits);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(new[] { 11, 12, 13 }, result.Items.Select(i => i.AssetId));
        Assert.False(result.Items.Single(i => i.AssetId == 12).IsActive);
        Assert.Equal("Building", result.Items.First().AssetCategoryName);
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_ActiveOnly_LeavesOutUnconfiguredUnits()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);

        var result = await h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { ActiveOnly = true });

        Assert.Equal(new[] { 11, 13 }, result!.Items.Select(i => i.AssetId));
        Assert.Equal(2, result.TotalSubUnits);
        Assert.Equal(2, result.TotalCount);
    }

    [Theory]
    [InlineData("SHOP TWO", new[] { 12 })]
    [InlineData("s03", new[] { 13 })]
    [InlineData("दुकान", new[] { 11 })]
    [InlineData("  shop one ", new[] { 11 })]
    public async Task GetSubUnitDetailsByParentAsync_SearchMatchesUnitNoNameOrRegionalName_CaseInsensitive(string searchTerm, int[] expectedIds)
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);

        var result = await h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { SearchTerm = searchTerm });

        Assert.Equal(expectedIds, result!.Items.Select(i => i.AssetId));
        Assert.Equal(expectedIds.Length, result.TotalCount);
        Assert.Equal(3, result.TotalSubUnits);
    }

    [Theory]
    [InlineData("ramesh", new[] { 11 })]
    [InlineData("suresh", new int[0])]
    [InlineData("mahesh", new int[0])]
    [InlineData("ganesh", new int[0])]
    public async Task GetSubUnitDetailsByParentAsync_SearchMatchesTenantOnlyOfLeaseInForceToday(string searchTerm, int[] expectedIds)
    {
        // Expired (suresh), future (mahesh) and deleted (ganesh) leases keep IsActive = true, so the
        // tenant search must apply the same date window as the parent list's revenue roll-up.
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);

        var result = await h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { SearchTerm = searchTerm });

        Assert.Equal(expectedIds, result!.Items.Select(i => i.AssetId));
        Assert.Equal(expectedIds.Length, result.TotalCount);
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_PagesInSortOrder_AndPageSizeMinusOneReturnsAll()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);
        var service = h.CreateService();

        var secondPage = await service.GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { PageNumber = 2, PageSize = 2 });
        Assert.Equal(new[] { 13 }, secondPage!.Items.Select(i => i.AssetId));
        Assert.Equal(3, secondPage.TotalCount);
        Assert.Equal(2, secondPage.PageNumber);
        Assert.Equal(2, secondPage.PageSize);

        var byNameDescending = await service.GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { SortBy = "assetname", SortOrder = "DESC" });
        Assert.Equal(new[] { 12, 13, 11 }, byNameDescending!.Items.Select(i => i.AssetId));

        var all = await service.GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { PageNumber = 4, PageSize = -1 });
        Assert.Equal(3, all!.Items.Count());
        Assert.Equal(1, all.PageNumber);
        Assert.Equal(3, all.PageSize);
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_UnsupportedSortBy_ThrowsFilterValidationException()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);

        await Assert.ThrowsAsync<FilterValidationException>(() =>
            h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters { SortBy = "TenantName" }));
    }

    [Fact]
    public async Task GetSubUnitDetailsByParentAsync_ReturnsActiveFloorRowsAndOnlyUploadedFiles()
    {
        using var h = new AssetMasterServiceSqliteHarness();
        SeedSubUnits(h);
        h.Seed(
            new SubUnitsDetailsEntity { Id = 101, AssetId = 11, FloorId = FirstFloorId, ConstructionTypeId = RccConstructionTypeId, TypeOfUseId = 100, SubTypeOfUseId = 300, CarpetAreaSqMeter = 40m, CapitalValue = 400m },
            new SubUnitsDetailsEntity { Id = 102, AssetId = 11, FloorId = GroundFloorId, ConstructionTypeId = LoadBearingConstructionTypeId, TypeOfUseId = 100 },
            new SubUnitsDetailsEntity { Id = 103, AssetId = 11, FloorId = GroundFloorId, ConstructionTypeId = RccConstructionTypeId, TypeOfUseId = 100, IsActive = false });
        SetRows(h.TypeOfUseRepository, new AssetTypeOfUseMasterEntity { Id = 100, TypeOfUseCode = "SHOP", Description = "Shop" });
        SetRows(h.SubTypeOfUseRepository, new AssetSubTypeOfUseEntity { Id = 300, TypeOfUseId = 100, Description = "Retail" });

        var shopFront = UploadedFile(501, "shop-front.jpg");
        SetRows(h.PhotoRepository,
            PhotoSlot(1, assetId: 11, photoTypeId: 1, file: shopFront, subUnitsDetailsId: 101),
            PhotoSlot(2, assetId: 11, photoTypeId: 2),
            PhotoSlot(3, assetId: 11, photoTypeId: 3, file: UploadedFile(502, "inactive.jpg", isActive: false)),
            PhotoSlot(4, assetId: 11, photoTypeId: 4, file: UploadedFile(503, "old.jpg"), isLatest: false),
            // A live file behind a deactivated or soft-deleted binding is no longer this photo's file.
            PhotoSlot(5, assetId: 11, photoTypeId: 5, file: UploadedFile(504, "unbound.jpg"), bindingIsActive: false),
            PhotoSlot(6, assetId: 11, photoTypeId: 6, file: UploadedFile(505, "unlinked.jpg"), bindingMarkedForDeletion: true));
        var agreement = UploadedFile(601, "agreement.pdf");
        SetRows(h.DocumentRepository,
            DocumentSlot(1, assetId: 11, definitionId: 1, documentCode: "DOC-AGREEMENT", file: agreement),
            DocumentSlot(2, assetId: 11, definitionId: 2, documentCode: "DOC-NOC", file: UploadedFile(602, "deleted.pdf", markedForDeletion: true)),
            DocumentSlot(3, assetId: 12, definitionId: 1, documentCode: "DOC-AGREEMENT"),
            DocumentSlot(4, assetId: 11, definitionId: 3, documentCode: "DOC-PLAN", file: UploadedFile(603, "unbound.pdf"), bindingIsActive: false),
            DocumentSlot(5, assetId: 11, definitionId: 4, documentCode: "DOC-TITLE", file: UploadedFile(604, "unlinked.pdf"), bindingMarkedForDeletion: true));

        var result = await h.CreateService().GetSubUnitDetailsByParentAsync(1, new SubUnitDetailsQueryParameters());

        var shopOne = result!.Items.Single(i => i.AssetId == 11);
        // Ground floor (sequence 0) before first floor; the inactive row is left out.
        Assert.Equal(new[] { 102, 101 }, shopOne.FloorDetails.Select(f => f.Id));
        var firstFloor = shopOne.FloorDetails.Single(f => f.Id == 101);
        Assert.Equal("First Floor", firstFloor.FloorName);
        Assert.Equal("RCC", firstFloor.ConstructionTypeName);
        Assert.Equal("Shop", firstFloor.TypeOfUseName);
        Assert.Equal("Retail", firstFloor.SubTypeOfUseName);
        Assert.Equal(400m, firstFloor.CapitalValue);

        var photo = Assert.Single(shopOne.Photos);
        Assert.Equal(shopFront.DocumentGuid, photo.DocumentGuid);
        Assert.Equal(101, photo.SubUnitsDetailsId);
        var document = Assert.Single(shopOne.Documents);
        Assert.Equal(agreement.DocumentGuid, document.DocumentGuid);

        var shopTwo = result.Items.Single(i => i.AssetId == 12);
        Assert.Empty(shopTwo.FloorDetails);
        Assert.Empty(shopTwo.Photos);
        Assert.Empty(shopTwo.Documents);
    }

    #endregion
}
