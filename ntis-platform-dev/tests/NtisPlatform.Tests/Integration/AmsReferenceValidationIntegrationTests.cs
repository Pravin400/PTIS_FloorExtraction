using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using Xunit;
using AppValidationException = NtisPlatform.Application.Exceptions.ValidationException;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for the AMS master entries in <see cref="ReferenceValidationService"/>, run against a real
/// <see cref="ApplicationDbContext"/> (EF Core InMemory provider). Each test seeds only the referencing rows it needs
/// (InMemory does not enforce FKs) and asserts the readable delete/deactivate message: child masters are named
/// ("This Asset Type cannot be deleted because it has Asset Room Types. ..."), while records such as assets,
/// inventory, photos and demands are never named ("This Asset Type cannot be deleted because it is in use.").
///
/// What this does NOT cover: the InMemory provider does not translate LINQ to SQL, so it cannot catch a reference
/// query that fails to translate on SQL Server.
/// </summary>
[Trait("Category", "Integration")]
public class AmsReferenceValidationIntegrationTests : IAsyncLifetime
{
    private readonly string _databaseName = $"AmsReferenceValidationIntegrationTests_{Guid.NewGuid()}";

    private ApplicationDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .EnableSensitiveDataLogging()
            .Options);

    public async Task InitializeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureDeletedAsync();
    }

    private async Task SeedAsync(params BaseEntity[] entities)
    {
        // CreatedDate is a required column on most AMS tables; stamp it so each test only sets what it asserts on.
        foreach (var entity in entities)
            entity.CreatedDate ??= DateTime.Now;

        await using var context = CreateContext();
        context.AddRange(entities);
        await context.SaveChangesAsync();
    }

    private async Task<ValidationResult> ValidateAsync<TEntity>(
        int id, ReferenceValidationOperation operation = ReferenceValidationOperation.Delete) where TEntity : BaseEntity
    {
        await using var context = CreateContext();
        return await new ReferenceValidationService(context).ValidateReferencesAsync<TEntity>(id, operation);
    }

    private static string FailureMessage(ValidationResult result)
    {
        Assert.False(result.IsValid);
        return Assert.Single(result.Errors).ErrorMessage;
    }

    private static string HasMasters(string entity, string masters, string action = "deleted")
        => $"This {entity} cannot be {action} because it has {masters}. Please delete all {masters} for this {entity} first.";

    private static string InUse(string entity, string action = "deleted")
        => $"This {entity} cannot be {action} because it is in use.";

    private static AssetMasterEntity Asset(int id, bool markedForDeletion = false) => new()
    {
        Id = id,
        AssetNo = $"A-{id}",
        AssetName = $"Asset {id}",
        AssetCategoryId = 1,
        AssetTypeId = 10,
        MarkedForDeletion = markedForDeletion
    };

    #region Message format

    [Fact]
    public async Task AssetCategory_UsedByChildMastersAndAsset_NamesOnlyTheChildMasters()
    {
        await SeedAsync(
            Asset(1),
            new AssetRoomTypeMasterEntity { Id = 1, AssetCategoryId = 1, AssetTypeId = 10, RoomTypeName = "Hall" },
            new InventoryItemCategoryEntity { Id = 1, AssetCategoryId = 1, TypeCode = "FURN", TypeName = "Furniture" },
            new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Asset", CategoryId = 1, ConditionName = "Good" });

        var message = FailureMessage(await ValidateAsync<AssetCategoryEntity>(1));

        Assert.Equal(
            "This Asset Category cannot be deleted because it has Asset Room Types, Inventory Categories and Asset Conditions. " +
            "Please delete all Asset Room Types, Inventory Categories and Asset Conditions for this Asset Category first.",
            message);
        Assert.DoesNotContain("Asset Master", message);
    }

    [Fact]
    public async Task AssetCategory_OnlyUsedByAsset_IsInUse()
    {
        await SeedAsync(Asset(1));

        Assert.Equal("This Asset Category cannot be deleted because it is in use.", FailureMessage(await ValidateAsync<AssetCategoryEntity>(1)));
    }

    [Fact]
    public async Task Deactivate_UsedByChildMasters_SaysDeactivated()
    {
        await SeedAsync(
            new AssetTypeOfUseMasterEntity { Id = 20, AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "RES", TypeOfUseGroupId = 10 },
            new CVRateMasterEntity { Id = 1, TypeOfUseGroupCVId = 10, RateAmount = 1500m, IsActive = true });

        Assert.Equal(
            "This Type Of Use Group cannot be deactivated because it has Type Of Uses and CV Rates. " +
            "Please delete all Type Of Uses and CV Rates for this Type Of Use Group first.",
            FailureMessage(await ValidateAsync<AssetTypeOfUseGroupEntity>(10, ReferenceValidationOperation.Deactivate)));
    }

    [Fact]
    public async Task Deactivate_OnlyUsedByRecords_SaysDeactivated()
    {
        await SeedAsync(Asset(1));

        Assert.Equal("This Asset Type cannot be deactivated because it is in use.",
            FailureMessage(await ValidateAsync<AssetTypeEntity>(10, ReferenceValidationOperation.Deactivate)));
    }

    [Fact]
    public async Task ValidateWithoutOperation_KeepsTableListMessage()
    {
        // The overload without an operation is the shared one (used outside AMS) and is unchanged: it still lists
        // every referencing table. The AMS master services always pass the operation.
        await SeedAsync(Asset(1));

        await using var context = CreateContext();
        var result = await new ReferenceValidationService(context).ValidateReferencesAsync<AssetTypeEntity>(10);

        Assert.Equal("Cannot deactivate/delete this AssetType because it is referenced in: Asset Master", FailureMessage(result));
    }

    #endregion

    [Fact]
    public async Task AssetCategory_InventoryConditionWithSameCategoryId_IsNotAReference()
    {
        // CategoryId is polymorphic: an 'Inventory' condition with CategoryId 1 points at InventoryItemCategoryMaster.
        await SeedAsync(new AssetConditionMasterEntity { Id = 1, ConditionCategory = "Inventory", CategoryId = 1, ConditionName = "New" });

        Assert.True((await ValidateAsync<AssetCategoryEntity>(1)).IsValid);
    }

    [Fact]
    public async Task AssetType_UsedByRoomTypeAndAsset_NamesOnlyRoomTypes()
    {
        await SeedAsync(
            Asset(1),
            new AssetRoomTypeMasterEntity { Id = 1, AssetTypeId = 10, RoomTypeName = "Hall" });

        Assert.Equal(HasMasters("Asset Type", "Asset Room Types"), FailureMessage(await ValidateAsync<AssetTypeEntity>(10)));
    }

    [Fact]
    public async Task AssetType_OnlyReferencedByAssetMarkedForDeletion_IsValid()
    {
        await SeedAsync(Asset(1, markedForDeletion: true));

        Assert.True((await ValidateAsync<AssetTypeEntity>(10)).IsValid);
    }

    [Fact]
    public async Task AssetAssessmentYearRange_UsedByActiveCVRate_NamesCVRates()
    {
        await SeedAsync(new CVRateMasterEntity { Id = 1, AssessmentYearRangeId = 40, RateAmount = 100m, IsActive = true });

        Assert.Equal(HasMasters("Assessment Year Range", "CV Rates"),
            FailureMessage(await ValidateAsync<AssetAssessmentYearRangeMasterCVEntity>(40)));
    }

    [Fact]
    public async Task AssetAssessmentYearRange_UsedByInactiveCVRate_StillFails()
    {
        // CVRateMaster is never purged: an inactive rate still holds AssessmentYearRangeId and can be reactivated.
        await SeedAsync(new CVRateMasterEntity { Id = 1, AssessmentYearRangeId = 40, RateAmount = 100m, IsActive = false });

        Assert.Equal(HasMasters("Assessment Year Range", "CV Rates"),
            FailureMessage(await ValidateAsync<AssetAssessmentYearRangeMasterCVEntity>(40)));
        Assert.Equal(HasMasters("Assessment Year Range", "CV Rates", "deactivated"),
            FailureMessage(await ValidateAsync<AssetAssessmentYearRangeMasterCVEntity>(40, ReferenceValidationOperation.Deactivate)));
    }

    [Fact]
    public async Task AssetAssessmentYearRange_RateForAnotherYearRange_IsValid()
    {
        await SeedAsync(new CVRateMasterEntity { Id = 1, AssessmentYearRangeId = 41, RateAmount = 100m, IsActive = false });

        Assert.True((await ValidateAsync<AssetAssessmentYearRangeMasterCVEntity>(40)).IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    public async Task UndefinedOperation_IsRejected(int operation)
    {
        // A new enum value must not be read as Delete: it fails until its wording is defined. That holds for an
        // entity with the readable message (Asset Type) and one without it (Floor Factor).
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => ValidateAsync<AssetTypeEntity>(10, (ReferenceValidationOperation)operation));
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => ValidateAsync<AssetFloorFactorCVEntity>(10, (ReferenceValidationOperation)operation));
    }

    [Fact]
    public async Task InventoryItemCategory_UsedByDeactivatedItemName_StillFails()
    {
        // A deactivated (not deleted) item name still holds the Restrict FK, so it must block the delete.
        await SeedAsync(new InventoryItemNameEntity { Id = 1, InventoryItemCategoryId = 80, SubTypeCode = "CHAIR", SubTypeName = "Chair", IsActive = false });

        Assert.Equal(HasMasters("Inventory Category", "Inventory Names"), FailureMessage(await ValidateAsync<InventoryItemCategoryEntity>(80)));
    }

    [Fact]
    public async Task InventoryItemName_UsedByDeactivatedItemModel_StillFails()
    {
        await SeedAsync(new InventoryItemModelEntity { Id = 1, InventoryItemNameId = 81, IsActive = false });

        Assert.Equal(HasMasters("Inventory Name", "Inventory Models"), FailureMessage(await ValidateAsync<InventoryItemNameEntity>(81)));
    }

    [Fact]
    public async Task AssetFieldDefinition_UsedByFieldValue_IsInUse()
    {
        await SeedAsync(
            Asset(1),
            new AssetFieldValueEntity { Id = 1, AssetId = 1, FieldDefinitionId = 30, FieldName = "Survey No" });

        Assert.Equal(InUse("Asset Field Definition"), FailureMessage(await ValidateAsync<AssetFieldDefinitionEntity>(30)));
    }

    [Fact]
    public async Task AssetFieldDefinition_OnlyUsedByValueOfAssetMarkedForDeletion_IsValid()
    {
        await SeedAsync(
            Asset(1, markedForDeletion: true),
            new AssetFieldValueEntity { Id = 1, AssetId = 1, FieldDefinitionId = 30, FieldName = "Survey No" });

        Assert.True((await ValidateAsync<AssetFieldDefinitionEntity>(30)).IsValid);
    }

    [Theory]
    [InlineData("Asset")]
    [InlineData("InventoryBatch")]
    [InlineData("InventoryUnit")]
    public async Task AssetConditionMaster_UsedByARecord_IsInUse(string usedBy)
    {
        var asset = Asset(1);
        asset.AssetConditionId = 7;
        await SeedAsync(usedBy switch
        {
            "Asset" => asset,
            "InventoryBatch" => new InventoryBatchEntity { Id = 1, ParentAssetId = 1, ConditionId = 7, PurchaseDate = DateTime.Today },
            _ => new InventoryAssetDetailEntity { Id = 1, AssetId = 1, BatchId = 1, UnitNumber = 1, InventoryItemConditionId = 7 }
        });

        Assert.Equal(InUse("Condition"), FailureMessage(await ValidateAsync<AssetConditionMasterEntity>(7)));
    }

    [Fact]
    public async Task AssetConditionMaster_Unused_IsValid()
    {
        Assert.True((await ValidateAsync<AssetConditionMasterEntity>(7)).IsValid);
    }

    [Fact]
    public async Task OwnershipType_UsedByAssetOwnershipTypeName_IsInUse()
    {
        var asset = Asset(1);
        asset.OwnershipType = "Self Owned";
        await SeedAsync(
            asset,
            new OwnershipTypeEntity { Id = 70, OwnershipTypeName = "Self Owned" },
            new OwnershipTypeEntity { Id = 71, OwnershipTypeName = "Leased" });

        Assert.Equal(InUse("Ownership Type"), FailureMessage(await ValidateAsync<OwnershipTypeEntity>(70)));
        Assert.True((await ValidateAsync<OwnershipTypeEntity>(71)).IsValid);
    }

    [Fact]
    public async Task OwningDepartment_UsedByDesignationAndRecords_NamesOnlyDesignations()
    {
        var asset = Asset(1);
        asset.DepartmentId = 5;
        await SeedAsync(
            asset,
            new AssetDesignationEntity { Id = 1, OwningDepartmentId = 5, DesignationCode = "EE", DesignationName = "Executive Engineer" },
            new UserOwningDepartmentAllocationEntity { Id = 1, UserId = 1, OwningDepartmentId = 5 },
            new InventoryBatchEntity { Id = 1, ParentAssetId = 1, OwningDepartmentId = 5, PurchaseDate = DateTime.Today },
            new InventoryAssetDetailEntity { Id = 1, AssetId = 1, BatchId = 1, UnitNumber = 1, OwningDepartmentId = 5 });

        Assert.Equal(HasMasters("Owning Department", "Designations"), FailureMessage(await ValidateAsync<OwningDepartmentEntity>(5)));
    }

    [Theory]
    [InlineData("Asset")]
    [InlineData("UserAllocation")]
    [InlineData("InventoryBatch")]
    [InlineData("InventoryUnit")]
    public async Task OwningDepartment_OnlyUsedByARecord_IsInUse(string usedBy)
    {
        var asset = Asset(1);
        asset.DepartmentId = 5;
        await SeedAsync(usedBy switch
        {
            "Asset" => asset,
            "UserAllocation" => new UserOwningDepartmentAllocationEntity { Id = 1, UserId = 1, OwningDepartmentId = 5 },
            "InventoryBatch" => new InventoryBatchEntity { Id = 1, ParentAssetId = 1, OwningDepartmentId = 5, PurchaseDate = DateTime.Today },
            _ => new InventoryAssetDetailEntity { Id = 1, AssetId = 1, BatchId = 1, UnitNumber = 1, OwningDepartmentId = 5 }
        });

        Assert.Equal(InUse("Owning Department"), FailureMessage(await ValidateAsync<OwningDepartmentEntity>(5)));
    }

    [Fact]
    public async Task PenaltyRuleAndGst_UsedByMonthWiseDemand_AreInUse()
    {
        await SeedAsync(new MonthWiseDemandEntity { Id = 1, AssetId = 1, LeaseRegistrationId = 1, PenaltyRuleMasterId = 50, GSTMasterId = 60 });

        Assert.Equal(InUse("Penalty Rule"), FailureMessage(await ValidateAsync<PenaltyRuleMasterEntity>(50)));
        Assert.Equal(InUse("GST"), FailureMessage(await ValidateAsync<GSTMasterEntity>(60)));
        Assert.True((await ValidateAsync<PenaltyRuleMasterEntity>(51)).IsValid);
        Assert.True((await ValidateAsync<GSTMasterEntity>(61)).IsValid);
    }

    #region Asset Photo Type

    private const string PhotoTypeInUseMessage = "This Asset Photo Type cannot be deleted because it is in use.";

    [Fact]
    public async Task AssetPhotoType_UsedByAssetPhoto_IsInUse()
    {
        await SeedAsync(AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5));

        Assert.Equal(PhotoTypeInUseMessage, FailureMessage(await ValidateAsync<AssetPhotoTypeEntity>(5)));
        Assert.True((await ValidateAsync<AssetPhotoTypeEntity>(6)).IsValid);
    }

    [Fact]
    public async Task AssetPhotoType_OnlyUsedByPhotoMarkedForDeletion_StillFails()
    {
        // AssetPhoto.PhotoTypeId is a Restrict FK: a photo that is only marked for deletion still physically
        // references the type until the nightly purge, so the type must stay undeletable until then
        // (otherwise the photo type's own purge fails on the FK) — same rule as AssetDocumentDefinition.
        var deletedPhoto = AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5);
        deletedPhoto.MarkForDeletion();
        await SeedAsync(deletedPhoto);

        Assert.Equal(PhotoTypeInUseMessage, FailureMessage(await ValidateAsync<AssetPhotoTypeEntity>(5)));
    }

    [Fact]
    public async Task AssetPhotoType_UsedBySubUnitPhoto_IsInUse()
    {
        // Sub-unit photos live in the same AMS.AssetPhoto table, keyed by SubUnitsDetailsId.
        await SeedAsync(AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5, subUnitDetailsId: 3));

        Assert.Equal(PhotoTypeInUseMessage, FailureMessage(await ValidateAsync<AssetPhotoTypeEntity>(5)));
    }

    [Fact]
    public async Task AssetPhotoType_OnlyUsedBySupersededPhoto_StillFails()
    {
        // A replaced photo is kept as history (IsLatest = 0) and still holds the FK.
        var supersededPhoto = AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5);
        supersededPhoto.MarkAsSuperseded();
        await SeedAsync(supersededPhoto);

        Assert.Equal(PhotoTypeInUseMessage, FailureMessage(await ValidateAsync<AssetPhotoTypeEntity>(5)));
    }

    private readonly IMapper _mapper = new MapperConfiguration(
        cfg => cfg.AddMaps(typeof(NtisPlatform.Application.Mappings.AssetTypeMappingProfile).Assembly),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

    private AssetPhotoTypeService PhotoTypeService(ApplicationDbContext context) =>
        new(new Repository<AssetPhotoTypeEntity, int>(context), new Repository<AssetCategoryEntity, int>(context),
            new Repository<AssetTypeEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    private async Task<AssetPhotoTypeEntity> LoadPhotoTypeAsync(int id)
    {
        await using var context = CreateContext();
        return await context.Set<AssetPhotoTypeEntity>().AsNoTracking().SingleAsync(x => x.Id == id);
    }

    [Fact]
    public async Task AssetPhotoType_DeleteWhileUsedByAssetPhoto_ThrowsAndIsNotMarkedForDeletion()
    {
        await SeedAsync(
            new AssetPhotoTypeEntity { Id = 5, PhotoTypeCode = "FRONT", PhotoTypeName = "Front View" },
            AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5));

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => PhotoTypeService(context).DeleteAsync(5));
            Assert.Equal(PhotoTypeInUseMessage, ex.Message);
        }

        var saved = await LoadPhotoTypeAsync(5);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task AssetPhotoType_DeactivateWhileUsedByAssetPhoto_ThrowsAndStaysActive()
    {
        await SeedAsync(
            new AssetPhotoTypeEntity { Id = 5, PhotoTypeCode = "FRONT", PhotoTypeName = "Front View" },
            AssetPhotoEntity.Create(assetId: 1, photoTypeId: 5));

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => PhotoTypeService(context).UpdateAsync(5,
                new UpdateAssetPhotoTypeDto { PhotoTypeCode = "FRONT", PhotoTypeName = "Front View", IsActive = false }));
            Assert.Equal("This Asset Photo Type cannot be deactivated because it is in use.", ex.Message);
        }

        Assert.True((await LoadPhotoTypeAsync(5)).IsActive);
    }

    [Fact]
    public async Task AssetPhotoType_DeleteWhenUnused_IsSoftDeleted()
    {
        await SeedAsync(
            new AssetPhotoTypeEntity { Id = 5, PhotoTypeCode = "FRONT", PhotoTypeName = "Front View" },
            AssetPhotoEntity.Create(assetId: 1, photoTypeId: 6));

        await using (var context = CreateContext())
        {
            Assert.True(await PhotoTypeService(context).DeleteAsync(5));
        }

        var saved = await LoadPhotoTypeAsync(5);
        Assert.True(saved.MarkedForDeletion);
        Assert.False(saved.IsActive);
    }

    #endregion

    #region Asset Room Type Master

    private const string RoomTypeInUseMessage = "This Asset Room Type cannot be deleted because it is in use.";

    // Room type 7 belongs to asset type 10 (the Asset(...) helper's AssetTypeId).
    private static AssetRoomTypeMasterEntity RoomType(int id = 7, int assetTypeId = 10, string name = "Hall", string? code = "HL")
        => new() { Id = id, AssetTypeId = assetTypeId, RoomTypeName = name, RoomTypeCode = code };

    private static AssetRoomWiseSubmissionDetailsEntity Room(int id, int assetId, string? roomType, bool markedForDeletion = false)
        => new() { Id = id, AssetId = assetId, RoomNo = id.ToString(), RoomType = roomType, MarkedForDeletion = markedForDeletion };

    [Fact]
    public async Task AssetRoomType_UsedByRoomNameOnAssetOfSameType_IsInUse()
    {
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "Hall"));

        Assert.Equal(RoomTypeInUseMessage, FailureMessage(await ValidateAsync<AssetRoomTypeMasterEntity>(7)));
    }

    [Fact]
    public async Task AssetRoomType_RoomHoldingTheCode_IsNotAReference()
    {
        // Rooms store the room type name; the code is not matched.
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "HL"));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
    }

    [Fact]
    public async Task AssetRoomType_CodeOfOneTypeEqualsNameOfAnother_RoomBlocksOnlyTheNamedType()
    {
        // Previously "HL" matched room type 7's code and room type 8's name, so one room blocked both.
        await SeedAsync(
            RoomType(id: 7, name: "Hall", code: "HL"),
            RoomType(id: 8, name: "HL", code: "HLX"),
            Asset(1),
            Room(1, assetId: 1, roomType: "HL"));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
        Assert.Equal(RoomTypeInUseMessage, FailureMessage(await ValidateAsync<AssetRoomTypeMasterEntity>(8)));
    }

    [Fact]
    public async Task AssetRoomType_SameNameOnAssetOfAnotherAssetType_IsValid()
    {
        // The master is scoped per asset type: a "Hall" under asset type 20 is a different room type.
        var otherTypeAsset = Asset(1);
        otherTypeAsset.AssetTypeId = 20;
        await SeedAsync(RoomType(), otherTypeAsset, Room(1, assetId: 1, roomType: "Hall"));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
    }

    [Fact]
    public async Task AssetRoomType_OnlyUsedByRoomMarkedForDeletion_IsValid()
    {
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "Hall", markedForDeletion: true));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
    }

    [Fact]
    public async Task AssetRoomType_OnlyUsedByRoomOfAssetMarkedForDeletion_IsValid()
    {
        await SeedAsync(RoomType(), Asset(1, markedForDeletion: true), Room(1, assetId: 1, roomType: "Hall"));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
    }

    [Fact]
    public async Task AssetRoomType_RoomWithDifferentLabel_IsValid()
    {
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "Bedroom"));

        Assert.True((await ValidateAsync<AssetRoomTypeMasterEntity>(7)).IsValid);
    }

    private NtisPlatform.Application.Services.AssetRoomTypeService RoomTypeService(ApplicationDbContext context) =>
        new(new Repository<AssetRoomTypeMasterEntity, int>(context), new Repository<AssetTypeEntity, int>(context),
            new Repository<AssetCategoryEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    private async Task<AssetRoomTypeMasterEntity> LoadRoomTypeAsync(int id)
    {
        await using var context = CreateContext();
        return await context.Set<AssetRoomTypeMasterEntity>().AsNoTracking().SingleAsync(x => x.Id == id);
    }

    [Fact]
    public async Task AssetRoomType_DeleteWhileUsedByRoom_ThrowsAndIsNotMarkedForDeletion()
    {
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "Hall"));

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => RoomTypeService(context).DeleteAsync(7));
            Assert.Equal(RoomTypeInUseMessage, ex.Message);
        }

        var saved = await LoadRoomTypeAsync(7);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task AssetRoomType_DeactivateWhileUsedByRoom_ThrowsAndStaysActive()
    {
        await SeedAsync(
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "OFFICE", TypeName = "Office Building" },
            RoomType(),
            Asset(1),
            Room(1, assetId: 1, roomType: "Hall"));

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => RoomTypeService(context).UpdateAsync(7,
                new NtisPlatform.Application.DTOs.Master.AssetRoomType.UpdateAssetRoomTypeDto
                {
                    AssetTypeId = 10, RoomTypeName = "Hall", RoomTypeCode = "HL", IsActive = false
                }));
            Assert.Equal(InUse("Asset Room Type", "deactivated"), ex.Message);
        }

        Assert.True((await LoadRoomTypeAsync(7)).IsActive);
    }

    [Fact]
    public async Task AssetRoomType_DeleteWhenUnused_IsSoftDeleted()
    {
        await SeedAsync(RoomType(), Asset(1), Room(1, assetId: 1, roomType: "Bedroom"));

        await using (var context = CreateContext())
        {
            Assert.True(await RoomTypeService(context).DeleteAsync(7));
        }

        var saved = await LoadRoomTypeAsync(7);
        Assert.True(saved.MarkedForDeletion);
        Assert.False(saved.IsActive);
    }

    private static NtisPlatform.Application.DTOs.Master.AssetRoomType.UpdateAssetRoomTypeDto RoomTypeUpdate(
        int assetTypeId = 10, string name = "Hall", string? code = "HL")
        => new() { AssetTypeId = assetTypeId, RoomTypeName = name, RoomTypeCode = code, IsActive = true };

    private async Task SeedRoomTypeInUseAsync()
        => await SeedAsync(
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "OFFICE", TypeName = "Office Building" },
            new AssetTypeEntity { Id = 20, AssetCategoryId = 1, TypeCode = "SHOP", TypeName = "Shop Building" },
            RoomType(),
            Asset(1),
            Room(1, assetId: 1, roomType: "Hall"));

    [Fact]
    public async Task AssetRoomType_RenameWhileRoomsUseIt_ThrowsAndKeepsName()
    {
        // Rooms store "Hall" as text: renaming the type would leave them with a name the master no longer has.
        await SeedRoomTypeInUseAsync();

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => RoomTypeService(context).UpdateAsync(7, RoomTypeUpdate(name: "Main Hall")));
            Assert.Equal("Room Type Name cannot be changed because this Asset Room Type is in use.", ex.Message);
        }

        Assert.Equal("Hall", (await LoadRoomTypeAsync(7)).RoomTypeName);
    }

    [Fact]
    public async Task AssetRoomType_MoveToAnotherAssetTypeWhileRoomsUseIt_Throws()
    {
        await SeedRoomTypeInUseAsync();

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => RoomTypeService(context).UpdateAsync(7, RoomTypeUpdate(assetTypeId: 20)));
            Assert.Equal("Asset Type cannot be changed because this Asset Room Type is in use.", ex.Message);
        }

        Assert.Equal(10, (await LoadRoomTypeAsync(7)).AssetTypeId);
    }

    [Fact]
    public async Task AssetRoomType_ChangeCodeWhileRoomsUseIt_Succeeds()
    {
        // The code is not what rooms store.
        await SeedRoomTypeInUseAsync();

        await using (var context = CreateContext())
        {
            Assert.NotNull(await RoomTypeService(context).UpdateAsync(7, RoomTypeUpdate(code: "HAL")));
        }

        Assert.Equal("HAL", (await LoadRoomTypeAsync(7)).RoomTypeCode);
    }

    [Fact]
    public async Task AssetRoomType_RenameWhenUnused_Succeeds()
    {
        await SeedAsync(
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "OFFICE", TypeName = "Office Building" },
            RoomType(),
            Asset(1),
            Room(1, assetId: 1, roomType: "Bedroom"));

        await using (var context = CreateContext())
        {
            Assert.NotNull(await RoomTypeService(context).UpdateAsync(7, RoomTypeUpdate(name: "Main Hall")));
        }

        Assert.Equal("Main Hall", (await LoadRoomTypeAsync(7)).RoomTypeName);
    }

    #endregion

    #region Ownership Type rename

    private NtisPlatform.Application.Services.OwnershipTypeService OwnershipTypeService(ApplicationDbContext context) =>
        new(new Repository<OwnershipTypeEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task OwnershipType_RenameWhileAssetsUseIt_ThrowsAndKeepsName()
    {
        // AssetMaster.OwnershipType stores "Leased" as text.
        var asset = Asset(1);
        asset.OwnershipType = "Leased";
        await SeedAsync(asset, new OwnershipTypeEntity { Id = 70, OwnershipTypeName = "Leased" });

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => OwnershipTypeService(context).UpdateAsync(70,
                new NtisPlatform.Application.DTOs.Master.UpdateOwnershipTypeDto { OwnershipTypeName = "Rented", IsActive = true }));
            Assert.Equal("Ownership Type Name cannot be changed because this Ownership Type is in use.", ex.Message);
        }

        await using var verify = CreateContext();
        Assert.Equal("Leased", (await verify.Set<OwnershipTypeEntity>().AsNoTracking().SingleAsync(x => x.Id == 70)).OwnershipTypeName);
    }

    [Fact]
    public async Task OwnershipType_RenameWhenUnused_Succeeds()
    {
        var asset = Asset(1);
        asset.OwnershipType = "Self Owned";
        await SeedAsync(asset, new OwnershipTypeEntity { Id = 70, OwnershipTypeName = "Leased" });

        await using (var context = CreateContext())
        {
            Assert.NotNull(await OwnershipTypeService(context).UpdateAsync(70,
                new NtisPlatform.Application.DTOs.Master.UpdateOwnershipTypeDto { OwnershipTypeName = "Rented", IsActive = true }));
        }

        await using var verify = CreateContext();
        Assert.Equal("Rented", (await verify.Set<OwnershipTypeEntity>().AsNoTracking().SingleAsync(x => x.Id == 70)).OwnershipTypeName);
    }

    #endregion

    #region Asset Mouja Master / Asset Sub Zone Details For CV

    private static AssetMoujaMasterEntity Mouja(int id = 3)
        => new() { Id = id, MoujaNo = $"M{id}", MoujaName = $"Mouja {id}" };

    private static AssetSubZoneDetailsForCVEntity SubZone(int id = 4, int moujaId = 3, bool markedForDeletion = false)
        => new() { Id = id, MoujaId = moujaId, SubZoneNo = $"{id}", SubZoneName = $"Sub Zone {id}", MarkedForDeletion = markedForDeletion };

    private AssetMoujaService MoujaService(ApplicationDbContext context) =>
        new(new Repository<AssetMoujaMasterEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    [Fact]
    public async Task AssetMouja_UsedBySubZone_NamesSubZones()
    {
        await SeedAsync(Mouja(), SubZone());

        Assert.Equal(
            "This Mouja cannot be deleted because it has Sub Zones. Please delete all Sub Zones for this Mouja first.",
            FailureMessage(await ValidateAsync<AssetMoujaMasterEntity>(3)));
    }

    [Fact]
    public async Task AssetMouja_OnlyUsedBySubZoneMarkedForDeletion_IsValid()
    {
        await SeedAsync(Mouja(), SubZone(markedForDeletion: true));

        Assert.True((await ValidateAsync<AssetMoujaMasterEntity>(3)).IsValid);
    }

    [Fact]
    public async Task AssetSubZone_UsedByActiveCVRate_NamesCVRates()
    {
        await SeedAsync(SubZone(), new CVRateMasterEntity { Id = 1, SubZoneId = 4, RateAmount = 1500m, IsActive = true });

        Assert.Equal(HasMasters("Sub Zone", "CV Rates"), FailureMessage(await ValidateAsync<AssetSubZoneDetailsForCVEntity>(4)));
    }

    [Fact]
    public async Task AssetSubZone_UsedByInactiveCVRate_StillFails()
    {
        // CVRateMaster is never purged: an inactive rate still holds SubZoneId and can be reactivated.
        await SeedAsync(SubZone(), new CVRateMasterEntity { Id = 1, SubZoneId = 4, RateAmount = 1500m, IsActive = false });

        Assert.Equal(HasMasters("Sub Zone", "CV Rates"), FailureMessage(await ValidateAsync<AssetSubZoneDetailsForCVEntity>(4)));
    }

    [Fact]
    public async Task AssetSubZone_RateForAnotherSubZone_IsValid()
    {
        await SeedAsync(SubZone(), new CVRateMasterEntity { Id = 1, SubZoneId = 5, RateAmount = 1500m, IsActive = true });

        Assert.True((await ValidateAsync<AssetSubZoneDetailsForCVEntity>(4)).IsValid);
    }

    [Fact]
    public async Task AssetSubZone_DeleteWhileUsedByCVRate_ThrowsAndIsNotMarkedForDeletion()
    {
        await SeedAsync(SubZone(), new CVRateMasterEntity { Id = 1, SubZoneId = 4, RateAmount = 1500m, IsActive = true });

        await using (var context = CreateContext())
        {
            var service = new AssetSubZoneDetailsForCVService(
                new Repository<AssetSubZoneDetailsForCVEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.DeleteAsync(4));
            Assert.Equal(HasMasters("Sub Zone", "CV Rates"), ex.Message);
        }

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetSubZoneDetailsForCVEntity>().AsNoTracking().SingleAsync(x => x.Id == 4);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task AssetMouja_DeleteWhileUsedBySubZone_ThrowsAndIsNotMarkedForDeletion()
    {
        await SeedAsync(Mouja(), SubZone());

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => MoujaService(context).DeleteAsync(3));
            Assert.Equal(HasMasters("Mouja", "Sub Zones"), ex.Message);
        }

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetMoujaMasterEntity>().AsNoTracking().SingleAsync(x => x.Id == 3);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task AssetMouja_DeactivateWhileUsedBySubZone_SaysDeactivatedAndStaysActive()
    {
        await SeedAsync(Mouja(), SubZone());

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => MoujaService(context).UpdateAsync(3,
                new UpdateAssetMoujaDto { MoujaNo = "M3", MoujaName = "Mouja 3", IsActive = false }));
            Assert.Equal(
                "This Mouja cannot be deactivated because it has Sub Zones. Please delete all Sub Zones for this Mouja first.",
                ex.Message);
        }

        await using var verify = CreateContext();
        Assert.True((await verify.Set<AssetMoujaMasterEntity>().AsNoTracking().SingleAsync(x => x.Id == 3)).IsActive);
    }

    #endregion

    #region Asset Type Of Use Group / Type Of Use / Sub Type Of Use

    private static AssetUseFactorCVMasterEntity UseFactor(int typeOfUseId = 20, int subTypeOfUseId = 30, bool markedForDeletion = false)
        => new() { Id = 1, TypeOfUseId = typeOfUseId, SubTypeOfUseId = subTypeOfUseId, Factor = 1.2m, YearRangeCVId = 40, MarkedForDeletion = markedForDeletion };

    private static SubUnitsDetailsEntity Floor(int typeOfUseId = 20, int? subTypeOfUseId = 30, bool isActive = true)
        => new() { Id = 1, AssetId = 1, FloorId = 1, ConstructionTypeId = 1, TypeOfUseId = typeOfUseId, SubTypeOfUseId = subTypeOfUseId, IsActive = isActive };

    [Fact]
    public async Task AssetTypeOfUseGroup_UsedByActiveCVRate_NamesCVRates()
    {
        await SeedAsync(new CVRateMasterEntity { Id = 1, TypeOfUseGroupCVId = 10, RateAmount = 1500m, IsActive = true });

        Assert.Equal(HasMasters("Type Of Use Group", "CV Rates"), FailureMessage(await ValidateAsync<AssetTypeOfUseGroupEntity>(10)));
    }

    [Fact]
    public async Task AssetTypeOfUseGroup_UsedByTypeOfUseAndCVRate_NamesBoth()
    {
        await SeedAsync(
            new AssetTypeOfUseMasterEntity { Id = 20, AssetCategoryId = 1, AssetTypeId = 10, TypeOfUseCode = "RES", TypeOfUseGroupId = 10 },
            new CVRateMasterEntity { Id = 1, TypeOfUseGroupCVId = 10, RateAmount = 1500m, IsActive = true });

        Assert.Equal(HasMasters("Type Of Use Group", "Type Of Uses and CV Rates"), FailureMessage(await ValidateAsync<AssetTypeOfUseGroupEntity>(10)));
    }

    [Fact]
    public async Task AssetTypeOfUseGroup_UsedByInactiveCVRate_StillFails()
    {
        await SeedAsync(new CVRateMasterEntity { Id = 1, TypeOfUseGroupCVId = 10, RateAmount = 1500m, IsActive = false });

        Assert.Equal(HasMasters("Type Of Use Group", "CV Rates"), FailureMessage(await ValidateAsync<AssetTypeOfUseGroupEntity>(10)));
    }

    [Fact]
    public async Task AssetTypeOfUse_UsedByUseFactorAndFloor_NamesOnlyUseFactors()
    {
        await SeedAsync(UseFactor(), Floor());

        Assert.Equal(HasMasters("Type Of Use", "Use Factors"), FailureMessage(await ValidateAsync<AssetTypeOfUseMasterEntity>(20)));
    }

    [Fact]
    public async Task AssetTypeOfUse_OnlyUsedByUseFactorMarkedForDeletion_IsValid()
    {
        await SeedAsync(UseFactor(markedForDeletion: true));

        Assert.True((await ValidateAsync<AssetTypeOfUseMasterEntity>(20)).IsValid);
    }

    [Fact]
    public async Task AssetTypeOfUse_UsedByDeletedFloor_StillFails()
    {
        // A deleted floor is only set IsActive = 0 and is never purged, so it keeps holding the FK.
        await SeedAsync(Floor(isActive: false));

        Assert.Equal(InUse("Type Of Use"), FailureMessage(await ValidateAsync<AssetTypeOfUseMasterEntity>(20)));
    }

    [Fact]
    public async Task AssetSubTypeOfUse_UsedByUseFactorAndFloor_NamesOnlyUseFactors()
    {
        await SeedAsync(UseFactor(), Floor());

        Assert.Equal(HasMasters("Sub Type Of Use", "Use Factors"), FailureMessage(await ValidateAsync<AssetSubTypeOfUseEntity>(30)));
    }

    [Fact]
    public async Task AssetSubTypeOfUse_FloorWithoutSubTypeOfUse_IsValid()
    {
        await SeedAsync(Floor(subTypeOfUseId: null), UseFactor(subTypeOfUseId: 31));

        Assert.True((await ValidateAsync<AssetSubTypeOfUseEntity>(30)).IsValid);
    }

    [Fact]
    public async Task AssetSubTypeOfUse_DeleteWhileUsedByFloor_ThrowsAndIsNotMarkedForDeletion()
    {
        // Previously AssetSubTypeOfUseEntity was unregistered, so this delete always "succeeded".
        await SeedAsync(new AssetSubTypeOfUseEntity { Id = 30, TypeOfUseId = 20, Description = "Shop" }, Floor());

        await using (var context = CreateContext())
        {
            var service = new AssetSubTypeOfUseService(
                new Repository<AssetSubTypeOfUseEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.DeleteAsync(30));
            Assert.Equal(InUse("Sub Type Of Use"), ex.Message);
        }

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetSubTypeOfUseEntity>().AsNoTracking().SingleAsync(x => x.Id == 30);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    #endregion

    #region Asset Designation Master

    private static AssetDetailsEntity Details(int assetId, int? inChargeDesignationId, bool markedForDeletion = false)
        => new() { Id = assetId, AssetId = assetId, OrganizationId = 1, InChargeDesignationId = inChargeDesignationId, MarkedForDeletion = markedForDeletion };

    [Fact]
    public async Task AssetDesignation_UsedAsAssetInCharge_IsInUse()
    {
        await SeedAsync(Asset(1), Details(1, inChargeDesignationId: 8));

        Assert.Equal(InUse("Designation"), FailureMessage(await ValidateAsync<AssetDesignationEntity>(8)));
        Assert.True((await ValidateAsync<AssetDesignationEntity>(9)).IsValid);
    }

    [Fact]
    public async Task AssetDesignation_OnlyUsedByDetailsMarkedForDeletion_IsValid()
    {
        await SeedAsync(Asset(1), Details(1, inChargeDesignationId: 8, markedForDeletion: true));

        Assert.True((await ValidateAsync<AssetDesignationEntity>(8)).IsValid);
    }

    [Fact]
    public async Task AssetDesignation_OnlyUsedByAssetMarkedForDeletion_IsValid()
    {
        // AssetDetails is 1:1 with AssetMaster and cascades away when the asset is purged.
        await SeedAsync(Asset(1, markedForDeletion: true), Details(1, inChargeDesignationId: 8));

        Assert.True((await ValidateAsync<AssetDesignationEntity>(8)).IsValid);
    }

    [Fact]
    public async Task AssetDesignation_DeleteWhileAssetInCharge_ThrowsAndIsNotMarkedForDeletion()
    {
        // Previously AssetDesignationEntity was unregistered, so this delete always "succeeded".
        await SeedAsync(
            new AssetDesignationEntity { Id = 8, OwningDepartmentId = 5, DesignationCode = "EE", DesignationName = "Executive Engineer" },
            Asset(1),
            Details(1, inChargeDesignationId: 8));

        await using (var context = CreateContext())
        {
            var service = new NtisPlatform.Application.Services.AssetDesignationService(
                new Repository<AssetDesignationEntity, int>(context), new Repository<OwningDepartmentEntity, int>(context),
                new UnitOfWork(context), _mapper, new ReferenceValidationService(context));
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.DeleteAsync(8));
            Assert.Equal(InUse("Designation"), ex.Message);
        }

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetDesignationEntity>().AsNoTracking().SingleAsync(x => x.Id == 8);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    #endregion
}
