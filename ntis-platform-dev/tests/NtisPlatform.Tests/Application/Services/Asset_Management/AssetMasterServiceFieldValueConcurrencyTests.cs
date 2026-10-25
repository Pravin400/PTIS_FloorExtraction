using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.AssetFieldValue;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// The CreatedBy backfill on AMS.AssetFieldValue (AssetMasterService.UpdateAsync and
/// BulkSaveFieldValuesAsync) against a real EF Core InMemory <see cref="ApplicationDbContext"/>.
/// CreatedBy is a concurrency token there, so when two requests both read a legacy row with no
/// creator, only the first to save records its user: the second's UPDATE no longer matches
/// CreatedBy IS NULL and fails instead of overwriting it. Reproducing that needs two change trackers
/// over one database (one per request), which a MockQueryable-backed repository can't provide.
/// </summary>
[Trait("Category", "Integration")]
public sealed class AssetMasterServiceFieldValueConcurrencyTests : IDisposable
{
    private const int AssetId = 10;
    private const int FieldDefinitionId = 5;

    private readonly string _databaseName = $"AssetMasterServiceFieldValueConcurrencyTests_{Guid.NewGuid()}";
    private readonly List<ApplicationDbContext> _contexts = new();

    public void Dispose()
    {
        foreach (var context in _contexts)
            context.Dispose();
    }

    [Fact]
    public async Task CreatedBy_ConcurrencyToken_SecondBackfillOfALegacyRow_ThrowsInsteadOfOverwriting()
    {
        var id = await SeedLegacyFieldValueAsync();
        var first = NewContext();
        var second = NewContext();

        // Both requests read the row while it still has no creator.
        var firstRow = await first.Set<AssetFieldValueEntity>().SingleAsync(f => f.Id == id);
        var secondRow = await second.Set<AssetFieldValueEntity>().SingleAsync(f => f.Id == id);

        firstRow.CreatedBy ??= 7;
        await first.SaveChangesAsync();

        secondRow.CreatedBy ??= 8; // its snapshot still says null
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());

        Assert.Equal(7, (await ReadAsync(id)).CreatedBy);
    }

    [Fact]
    public async Task BulkSaveFieldValuesAsync_LosingTheRaceToBackfillCreatedBy_ReturnsFalse_AndKeepsTheFirstCreator()
    {
        var id = await SeedLegacyFieldValueAsync();
        var firstContext = NewContext();
        var secondContext = NewContext();

        // The second request has already read the row (no creator yet) when the first one saves; its
        // own query inside BulkSaveFieldValuesAsync then gets that tracked, now-stale instance back.
        await secondContext.Set<AssetFieldValueEntity>().SingleAsync(f => f.Id == id);

        Assert.True(await CreateService(firstContext).BulkSaveFieldValuesAsync(AssetId, [Dto(createdBy: 7, value: "Blue")]));
        Assert.False(await CreateService(secondContext).BulkSaveFieldValuesAsync(AssetId, [Dto(createdBy: 8, value: "Green")]));

        var stored = await ReadAsync(id);
        Assert.Equal(7, stored.CreatedBy);
        Assert.Equal(7, stored.UpdatedBy);
        Assert.Equal("Blue", stored.FieldValue); // the losing request wrote nothing
    }

    [Fact]
    public async Task BulkSaveFieldValuesAsync_SequentialSaves_KeepTheFirstCreator_WithoutAConflict()
    {
        var id = await SeedLegacyFieldValueAsync();

        Assert.True(await CreateService(NewContext()).BulkSaveFieldValuesAsync(AssetId, [Dto(createdBy: 7, value: "Blue")]));
        // A later request reads the creator the first one recorded, so it keeps it and saves normally.
        Assert.True(await CreateService(NewContext()).BulkSaveFieldValuesAsync(AssetId, [Dto(createdBy: 8, value: "Green")]));

        var stored = await ReadAsync(id);
        Assert.Equal(7, stored.CreatedBy);
        Assert.Equal(8, stored.UpdatedBy);
        Assert.Equal("Green", stored.FieldValue);
    }

    /// <summary>A context over the shared database; each one stands for a separate request.</summary>
    private ApplicationDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        var context = new ApplicationDbContext(options);
        _contexts.Add(context);
        return context;
    }

    /// <summary>A field value saved before CreatedBy was captured.</summary>
    private async Task<int> SeedLegacyFieldValueAsync()
    {
        var context = NewContext();
        var row = new AssetFieldValueEntity
        {
            AssetId = AssetId,
            FieldDefinitionId = FieldDefinitionId,
            FieldName = "Color",
            FieldValue = "Red",
            CreatedBy = null,
            CreatedDate = DateTime.Now,
            IsActive = true
        };
        context.Set<AssetFieldValueEntity>().Add(row);
        await context.SaveChangesAsync();
        return row.Id;
    }

    private Task<AssetFieldValueEntity> ReadAsync(int id)
        => NewContext().Set<AssetFieldValueEntity>().AsNoTracking().SingleAsync(f => f.Id == id);

    private static CreateAssetFieldValueDto Dto(int createdBy, string value) => new()
    {
        AssetId = AssetId,
        FieldDefinitionId = FieldDefinitionId,
        FieldName = "Color",
        FieldValue = value,
        CreatedBy = createdBy
    };

    /// <summary>The service as one request runs it: field values and the unit of work on its own context.</summary>
    private static AssetMasterService CreateService(ApplicationDbContext context)
    {
        var mapper = new MapperConfiguration(
            cfg => cfg.AddProfile<AssetMasterMappingProfile>(),
            NullLoggerFactory.Instance).CreateMapper();

        return new AssetMasterService(
            repository: new Mock<IRepository<AssetMasterEntity, int>>().Object,
            unitOfWork: new UnitOfWork(context),
            mapper: mapper,
            referenceValidator: new Mock<IReferenceValidationService>().Object,
            fieldValueRepository: new Repository<AssetFieldValueEntity, int>(context),
            floorDetailsRepository: new Mock<IRepository<SubUnitsDetailsEntity, int>>().Object,
            roomWiseSubmissionRepository: new Mock<IRepository<AssetRoomWiseSubmissionDetailsEntity, int>>().Object,
            assetCategoryRepository: new Mock<IRepository<AssetCategoryEntity, int>>().Object,
            assetTypeRepository: new Mock<IRepository<AssetTypeEntity, int>>().Object,
            ulbRepository: new Mock<IRepository<ULBMasterEntity, int>>().Object,
            detailsRepository: new Mock<IRepository<AssetDetailsEntity, int>>().Object,
            assetDocumentRepository: new Mock<IRepository<AssetDocumentEntity, int>>().Object,
            assetPhotoRepository: new Mock<IRepository<AssetPhotoEntity, int>>().Object,
            assetPhotoApplicationService: new Mock<IAssetPhotoApplicationService>().Object,
            documentApplicationService: new Mock<IDocumentApplicationService>().Object,
            zoneRepository: new Mock<IRepository<ZoneEntity, int>>().Object,
            wardRepository: new Mock<IRepository<WardEntity, int>>().Object,
            moujaRepository: new Mock<IRepository<MoujaEntity, int>>().Object,
            subZoneRepository: new Mock<IRepository<SubZoneDetailsForCVEntity, int>>().Object,
            departmentRepository: new Mock<IRepository<OwningDepartmentEntity, int>>().Object,
            organizationRepository: new Mock<IRepository<AssetOrganizationMasterEntity, int>>().Object,
            conditionRepository: new Mock<IRepository<AssetConditionMasterEntity, int>>().Object,
            deptMasterRepository: new Mock<IRepository<DepartmentMasterEntity, int>>().Object,
            moduleMasterRepository: new Mock<IRepository<ModuleMasterEntity, int>>().Object,
            designationRepository: new Mock<IRepository<AssetDesignationEntity, int>>().Object,
            amsTypeOfUseRepository: new Mock<IRepository<AssetTypeOfUseMasterEntity, int>>().Object,
            amsSubTypeOfUseRepository: new Mock<IRepository<AssetSubTypeOfUseEntity, int>>().Object,
            logger: NullLogger<AssetMasterService>.Instance,
            inventoryBatchRepository: new Mock<IRepository<InventoryBatchEntity, int>>().Object,
            inventoryAssetDetailRepository: new Mock<IRepository<InventoryAssetDetailEntity, int>>().Object,
            inventoryCategoryRepository: new Mock<IRepository<InventoryItemCategoryEntity, int>>().Object,
            inventoryNameRepository: new Mock<IRepository<InventoryItemNameEntity, int>>().Object,
            inventoryModelRepository: new Mock<IRepository<InventoryItemModelEntity, int>>().Object,
            inventoryDepartmentRepository: new Mock<IRepository<OwningDepartmentEntity, int>>().Object,
            inventoryDocumentApplicationService: new Mock<IInventoryDocumentApplicationService>().Object,
            leaseRentDetailsRepository: new Mock<IRepository<AssetLeaseRentDetailsEntity, int>>().Object,
            demandRepository: new Mock<IRepository<MonthWiseDemandEntity, int>>().Object);
    }
}
