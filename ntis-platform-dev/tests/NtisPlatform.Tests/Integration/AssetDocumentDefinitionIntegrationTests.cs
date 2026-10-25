using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using Xunit;
using AppValidationException = NtisPlatform.Application.Exceptions.ValidationException;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Integration tests for AssetDocumentDefinition against a real <see cref="ApplicationDbContext"/> (EF Core InMemory
/// provider) and the real <see cref="ReferenceValidationService"/>. Seeding and each operation run on their own
/// DbContext, mirroring separate HTTP requests, so an update sees exactly what FindAsync loads.
/// Seed: definition 100 is unused; definition 101 is used by one AssetDocument.
/// </summary>
[Trait("Category", "Integration")]
public class AssetDocumentDefinitionIntegrationTests : IAsyncLifetime
{
    private readonly string _databaseName = $"AssetDocumentDefinitionIntegrationTests_{Guid.NewGuid()}";
    private readonly IMapper _mapper = new MapperConfiguration(
        cfg => cfg.AddProfile<AssetDocumentDefinitionMappingProfile>(),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

    private ApplicationDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(_databaseName)
            .EnableSensitiveDataLogging()
            .Options);

    private AssetDocumentDefinitionService CreateService(ApplicationDbContext context) =>
        new(
            new Repository<AssetDocumentDefinitionEntity, int>(context),
            new Repository<AssetCategoryEntity, int>(context),
            new Repository<AssetTypeEntity, int>(context),
            new UnitOfWork(context),
            _mapper,
            new ReferenceValidationService(context));

    private async Task<AssetDocumentDefinitionEntity> LoadDefinitionAsync(int id)
    {
        await using var context = CreateContext();
        return await context.Set<AssetDocumentDefinitionEntity>().AsNoTracking().SingleAsync(x => x.Id == id);
    }

    public async Task InitializeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureCreatedAsync();

        context.Set<AssetCategoryEntity>().AddRange(
            new AssetCategoryEntity { Id = 1, CategoryCode = "LAND", CategoryName = "Land", CreatedDate = DateTime.Now },
            new AssetCategoryEntity { Id = 2, CategoryCode = "BLDG", CategoryName = "Building", CreatedDate = DateTime.Now });
        context.Set<AssetTypeEntity>().AddRange(
            new AssetTypeEntity { Id = 10, AssetCategoryId = 1, TypeCode = "PLOT", TypeName = "Open Plot", CreatedDate = DateTime.Now },
            new AssetTypeEntity { Id = 20, AssetCategoryId = 2, TypeCode = "OFFICE", TypeName = "Office Building", CreatedDate = DateTime.Now });
        context.Set<AssetDocumentDefinitionEntity>().AddRange(
            new AssetDocumentDefinitionEntity { Id = 100, AssetCategoryId = 1, AssetTypeId = 10, DocumentCode = "SALE_DEED", DocumentName = "Sale Deed", IsActive = true, CreatedBy = 1, CreatedDate = DateTime.Now },
            new AssetDocumentDefinitionEntity { Id = 101, AssetCategoryId = 2, AssetTypeId = 20, DocumentCode = "OC_CERT", DocumentName = "Occupancy Certificate", IsActive = true, CreatedBy = 1, CreatedDate = DateTime.Now });

        var usedDocument = AssetDocumentEntity.Create(assetId: 1, documentDefinitionId: 101);
        usedDocument.CreatedDate = DateTime.Now;
        context.Set<AssetDocumentEntity>().Add(usedDocument);

        await context.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureDeletedAsync();
    }

    private static UpdateAssetDocumentDefinitionDto CreateUpdateDto(int? categoryId, int? typeId, string code, string name) => new()
    {
        AssetCategoryId = categoryId,
        AssetTypeId = typeId,
        DocumentCode = code,
        DocumentName = name,
        Description = "Updated",
        IsRequired = true,
        DisplayOrder = 2,
        IsActive = true,
        UpdatedBy = 5
    };

    [Fact]
    public async Task UpdateAsync_ChangesPersistAndResponseCarriesCategoryAndTypeNames()
    {
        AssetDocumentDefinitionDto? result;
        await using (var context = CreateContext())
        {
            result = await CreateService(context).UpdateAsync(100, CreateUpdateDto(2, 20, "SALE_DEED", "Registered Sale Deed"));
        }

        Assert.NotNull(result);
        Assert.Equal("Registered Sale Deed", result.DocumentName);
        Assert.Equal(2, result.AssetCategoryId);
        Assert.Equal(20, result.AssetTypeId);
        Assert.Equal("Building", result.AssetCategoryName);
        Assert.Equal("Office Building", result.AssetTypeName);

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetDocumentDefinitionEntity>().AsNoTracking().SingleAsync(x => x.Id == 100);
        Assert.Equal("Registered Sale Deed", saved.DocumentName);
        Assert.Equal(2, saved.AssetCategoryId);
        Assert.Equal(20, saved.AssetTypeId);
        Assert.Equal(5, saved.UpdatedBy);
        Assert.Equal(1, saved.CreatedBy);
        Assert.NotNull(saved.UpdatedDate);
    }

    [Fact]
    public async Task UpdateAsync_ClearingCategoryAndType_ReturnsNullNames()
    {
        AssetDocumentDefinitionDto? result;
        await using (var context = CreateContext())
        {
            result = await CreateService(context).UpdateAsync(100, CreateUpdateDto(null, null, "SALE_DEED", "Sale Deed"));
        }

        Assert.NotNull(result);
        Assert.Null(result.AssetCategoryId);
        Assert.Null(result.AssetCategoryName);
        Assert.Null(result.AssetTypeId);
        Assert.Null(result.AssetTypeName);
    }

    [Fact]
    public async Task UpdateAsync_DocumentCodeTakenByAnotherRecord_ThrowsAndDoesNotPersist()
    {
        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(
                () => CreateService(context).UpdateAsync(100, CreateUpdateDto(1, 10, "OC_CERT", "Sale Deed")));
            Assert.Equal("Document Code 'OC_CERT' already exists.", ex.Errors[nameof(AssetDocumentDefinitionEntity.DocumentCode)]);
        }

        await using var verify = CreateContext();
        var saved = await verify.Set<AssetDocumentDefinitionEntity>().AsNoTracking().SingleAsync(x => x.Id == 100);
        Assert.Equal("SALE_DEED", saved.DocumentCode);
    }

    [Fact]
    public async Task CreateAsync_ResponseCarriesCategoryAndTypeNames()
    {
        AssetDocumentDefinitionDto result;
        await using (var context = CreateContext())
        {
            result = await CreateService(context).CreateAsync(new CreateAssetDocumentDefinitionDto
            {
                AssetCategoryId = 1,
                AssetTypeId = 10,
                DocumentCode = "MUTATION",
                DocumentName = "Mutation Entry",
                IsActive = true,
                CreatedBy = 1
            });
        }

        Assert.True(result.Id > 0);
        Assert.Equal("MUTATION", result.DocumentCode);
        Assert.Equal("Land", result.AssetCategoryName);
        Assert.Equal("Open Plot", result.AssetTypeName);
    }

    [Fact]
    public async Task UpdateAsync_UnknownId_ReturnsNull()
    {
        await using var context = CreateContext();

        var result = await CreateService(context).UpdateAsync(999, CreateUpdateDto(1, 10, "NEW_CODE", "Anything"));

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_TypeFromAnotherCategory_ThrowsAndDoesNotPersist()
    {
        await using (var context = CreateContext())
        {
            // Type 20 (Office Building) belongs to category 2 (Building), not category 1 (Land).
            var ex = await Assert.ThrowsAsync<AppValidationException>(
                () => CreateService(context).UpdateAsync(100, CreateUpdateDto(1, 20, "SALE_DEED", "Sale Deed")));
            Assert.Equal("AssetDocumentDefinition_AssetTypeId_Invalid", ex.Errors[nameof(AssetDocumentDefinitionEntity.AssetTypeId)]);
        }

        Assert.Equal(10, (await LoadDefinitionAsync(100)).AssetTypeId);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingDefinitionUsedByAssetDocument_ThrowsAndStaysActive()
    {
        var dto = CreateUpdateDto(2, 20, "OC_CERT", "Occupancy Certificate");
        dto.IsActive = false;

        await using (var context = CreateContext())
        {
            await Assert.ThrowsAsync<AppValidationException>(() => CreateService(context).UpdateAsync(101, dto));
        }

        Assert.True((await LoadDefinitionAsync(101)).IsActive);
    }

    [Fact]
    public async Task DeleteAsync_DefinitionUsedByAssetDocument_ThrowsAndIsNotMarkedForDeletion()
    {
        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => CreateService(context).DeleteAsync(101));
            Assert.Contains("Asset Document", ex.Message);
        }

        var saved = await LoadDefinitionAsync(101);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task DeleteAsync_DefinitionUsedOnlyByDocumentMarkedForDeletion_ThrowsAndIsNotMarkedForDeletion()
    {
        // The AssetDocument -> AssetDocumentDefinition FK is Restrict: a document that is only marked for
        // deletion still physically references the definition, so the definition must stay undeletable
        // until that document is purged (otherwise the definition's own purge fails on the FK).
        await using (var seed = CreateContext())
        {
            var document = await seed.Set<AssetDocumentEntity>().SingleAsync(d => d.DocumentDefinitionId == 101);
            document.MarkForDeletion();
            await seed.SaveChangesAsync();
        }

        await using (var context = CreateContext())
        {
            var ex = await Assert.ThrowsAsync<AppValidationException>(() => CreateService(context).DeleteAsync(101));
            Assert.Contains("Asset Document", ex.Message);
        }

        var saved = await LoadDefinitionAsync(101);
        Assert.False(saved.MarkedForDeletion);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task DeleteAsync_UnusedDefinition_IsSoftDeleted()
    {
        bool deleted;
        await using (var context = CreateContext())
        {
            deleted = await CreateService(context).DeleteAsync(100);
        }

        Assert.True(deleted);
        var saved = await LoadDefinitionAsync(100);
        Assert.True(saved.MarkedForDeletion);
        Assert.NotNull(saved.MarkedForDeletionDate);
        Assert.False(saved.IsActive);
    }
}
