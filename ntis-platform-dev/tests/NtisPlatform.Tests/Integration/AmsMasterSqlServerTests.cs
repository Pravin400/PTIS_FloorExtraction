using AutoMapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Storage;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using NtisPlatform.Tests.Application.Services.Asset_Management;
using Xunit;

namespace NtisPlatform.Tests.Integration;

/// <summary>
/// Creates a throwaway SQL Server database holding every [AMS] table, from the EF model itself (columns, defaults,
/// unique indexes exactly as mapped), and drops it afterwards. Foreign keys are left out so each test seeds only
/// the rows it needs. Only runs when NTIS_TEST_SQLSERVER is set (see <see cref="SqlServerFactAttribute"/>).
/// </summary>
public sealed class AmsMasterSqlServerFixture : IAsyncLifetime
{
    private const string Schema = "AMS";

    public DbContextOptions<ApplicationDbContext> Options { get; private set; } = null!;
    public bool IsAvailable { get; private set; }

    public async Task InitializeAsync()
    {
        var serverConnectionString = SqlServerFactAttribute.ConnectionString;
        if (string.IsNullOrWhiteSpace(serverConnectionString))
            return;

        var connectionString = new SqlConnectionStringBuilder(serverConnectionString)
        {
            InitialCatalog = $"NtisAmsMasterTests_{Guid.NewGuid():N}"
        }.ConnectionString;
        // NetTopologySuite: the model maps geometry columns (GisAssetGeometry).
        Options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString, sql => sql.UseNetTopologySuite())
            .Options;

        await using var context = new ApplicationDbContext(Options);
        var creator = context.GetService<IRelationalDatabaseCreator>();
        await creator.CreateAsync();
        try
        {
            await CreateAmsTablesAsync(context);
        }
        catch
        {
            await creator.DeleteAsync();
            throw;
        }

        IsAvailable = true;
    }

    private static async Task CreateAmsTablesAsync(ApplicationDbContext context)
    {
        var model = context.GetService<IDesignTimeModel>().Model;
        var operations = context.GetService<IMigrationsModelDiffer>()
            .GetDifferences(null, model.GetRelationalModel())
            .Where(operation => operation switch
            {
                CreateTableOperation table => table.Schema == Schema,
                CreateIndexOperation index => index.Schema == Schema,
                _ => false
            })
            .ToList();

        foreach (var table in operations.OfType<CreateTableOperation>())
            table.ForeignKeys.Clear();

        await context.Database.ExecuteSqlRawAsync($"IF SCHEMA_ID(N'{Schema}') IS NULL EXEC(N'CREATE SCHEMA [{Schema}]')");
        foreach (var command in context.GetService<IMigrationsSqlGenerator>().Generate(operations, model))
            await context.Database.ExecuteSqlRawAsync(command.CommandText);
    }

    public async Task DisposeAsync()
    {
        if (!IsAvailable)
            return;

        await using var context = new ApplicationDbContext(Options);
        await context.Database.EnsureDeletedAsync();
    }
}

/// <summary>
/// The AMS master reference rules and bulk create/update against real SQL Server, for what the InMemory provider
/// can't show: every reference query translates to SQL and runs (including the combined UNION ALL query), and the
/// bulk transaction really commits, skips failed items, rolls back the items already saved on an unexpected error,
/// and survives a duplicate saved by another request between an item's check and its save. The database is shared
/// by the tests, so each one uses its own codes and ids.
/// </summary>
[Trait("Category", "SqlServer")]
public class AmsMasterSqlServerTests : IClassFixture<AmsMasterSqlServerFixture>
{
    private readonly AmsMasterSqlServerFixture _database;
    private readonly IMapper _mapper = new MapperConfiguration(
        cfg => cfg.AddMaps(typeof(NtisPlatform.Application.Mappings.AssetTypeMappingProfile).Assembly),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance).CreateMapper();

    public AmsMasterSqlServerTests(AmsMasterSqlServerFixture database) => _database = database;

    private ApplicationDbContext NewContext() => new(_database.Options);

    private static string Unique() => Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();

    private async Task<T> SeedAsync<T>(T entity) where T : BaseEntity
    {
        entity.CreatedDate ??= DateTime.Now;
        await using var context = NewContext();
        context.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private async Task<string?> FailureAsync<TEntity>(int id, ReferenceValidationOperation operation = ReferenceValidationOperation.Delete)
        where TEntity : BaseEntity
    {
        await using var context = NewContext();
        var result = await new ReferenceValidationService(context).ValidateReferencesAsync<TEntity>(id, operation);
        return result.IsValid ? null : Assert.Single(result.Errors).ErrorMessage;
    }

    #region Reference rules

    // An id nothing references, so every check of the rule runs: both the child-master query and the records query
    // for the AMS masters with the readable message, and each table query for the others.
    private async Task AssertRuleRunsAsync<TEntity>() where TEntity : BaseEntity
    {
        const int unusedId = int.MaxValue;
        await using var context = NewContext();
        var validator = new ReferenceValidationService(context);

        Assert.True((await validator.ValidateReferencesAsync<TEntity>(unusedId, ReferenceValidationOperation.Delete)).IsValid);
        Assert.True((await validator.ValidateReferencesAsync<TEntity>(unusedId, ReferenceValidationOperation.Deactivate)).IsValid);
        Assert.True((await validator.ValidateReferencesAsync<TEntity>(unusedId)).IsValid);
    }

    [SqlServerFact]
    public async Task EveryAmsReferenceRule_TranslatesAndRunsOnSqlServer()
    {
        await AssertRuleRunsAsync<AssetCategoryEntity>();
        await AssertRuleRunsAsync<AssetTypeEntity>();
        await AssertRuleRunsAsync<AssetDocumentDefinitionEntity>();
        await AssertRuleRunsAsync<AssetFieldDefinitionEntity>();
        await AssertRuleRunsAsync<AssetPhotoTypeEntity>();
        await AssertRuleRunsAsync<AssetRoomTypeMasterEntity>();
        await AssertRuleRunsAsync<AssetConditionMasterEntity>();
        await AssertRuleRunsAsync<InventoryItemCategoryEntity>();
        await AssertRuleRunsAsync<InventoryItemNameEntity>();
        await AssertRuleRunsAsync<InventoryItemModelEntity>();
        await AssertRuleRunsAsync<AssetAssessmentYearRangeMasterCVEntity>();
        await AssertRuleRunsAsync<AssetMoujaMasterEntity>();
        await AssertRuleRunsAsync<AssetSubZoneDetailsForCVEntity>();
        await AssertRuleRunsAsync<AssetTypeOfUseGroupEntity>();
        await AssertRuleRunsAsync<AssetTypeOfUseMasterEntity>();
        await AssertRuleRunsAsync<AssetSubTypeOfUseEntity>();
        await AssertRuleRunsAsync<OwnershipTypeEntity>();
        await AssertRuleRunsAsync<OwningDepartmentEntity>();
        await AssertRuleRunsAsync<AssetDesignationEntity>();
        await AssertRuleRunsAsync<PenaltyRuleMasterEntity>();
        await AssertRuleRunsAsync<GSTMasterEntity>();
        await AssertRuleRunsAsync<AssetGrievanceCategoryEntity>();
        await AssertRuleRunsAsync<AssetGrievanceRemarkMasterEntity>();
        await AssertRuleRunsAsync<AssetAuthorityMasterEntity>();
        await AssertRuleRunsAsync<AssetFloorFactorCVEntity>();
        await AssertRuleRunsAsync<ScreenEntity>();
        await AssertRuleRunsAsync<ScreenFormSectionMasterEntity>();
        await AssertRuleRunsAsync<ScreenFormFieldMasterEntity>();
    }

    [SqlServerFact]
    public async Task CombinedQuery_NamesEveryMatchingChildMasterInOrder_IncludingInactiveCvRates()
    {
        const int groupId = 910001, subZoneId = 910002, yearRangeId = 910003;
        await SeedAsync(new CVRateMasterEntity
        {
            SubZoneId = subZoneId, TypeOfUseGroupCVId = groupId, AssessmentYearRangeId = yearRangeId, RateAmount = 1500m, IsActive = false
        });
        await SeedAsync(new AssetTypeOfUseMasterEntity { AssetCategoryId = 1, AssetTypeId = 1, TypeOfUseCode = $"T{Unique()}", TypeOfUseGroupId = groupId });

        Assert.Equal(
            "This Type Of Use Group cannot be deleted because it has Type Of Uses and CV Rates. Please delete all Type Of Uses and CV Rates for this Type Of Use Group first.",
            await FailureAsync<AssetTypeOfUseGroupEntity>(groupId));
        Assert.Equal(
            "This Sub Zone cannot be deactivated because it has CV Rates. Please delete all CV Rates for this Sub Zone first.",
            await FailureAsync<AssetSubZoneDetailsForCVEntity>(subZoneId, ReferenceValidationOperation.Deactivate));
        Assert.Equal(
            "This Assessment Year Range cannot be deleted because it has CV Rates. Please delete all CV Rates for this Assessment Year Range first.",
            await FailureAsync<AssetAssessmentYearRangeMasterCVEntity>(yearRangeId));
    }

    [SqlServerFact]
    public async Task RoomTypeRule_MatchesTheNameWithinTheAssetsType_NotTheCode()
    {
        const int assetTypeId = 910010;
        var suffix = Unique();
        var asset = await SeedAsync(new AssetMasterEntity { AssetNo = $"A-{suffix}", AssetName = $"Asset {suffix}", AssetCategoryId = 1, AssetTypeId = assetTypeId });
        var hall = await SeedAsync(new AssetRoomTypeMasterEntity { AssetTypeId = assetTypeId, RoomTypeName = $"Hall {suffix}", RoomTypeCode = $"H{suffix}" });
        var named = await SeedAsync(new AssetRoomTypeMasterEntity { AssetTypeId = assetTypeId, RoomTypeName = $"H{suffix}", RoomTypeCode = $"X{suffix}" });
        await SeedAsync(new AssetRoomWiseSubmissionDetailsEntity { AssetId = asset.Id, RoomNo = "1", RoomType = $"H{suffix}" });

        Assert.Null(await FailureAsync<AssetRoomTypeMasterEntity>(hall.Id));
        Assert.Equal("This Asset Room Type cannot be deleted because it is in use.", await FailureAsync<AssetRoomTypeMasterEntity>(named.Id));
    }

    #endregion

    #region Bulk create transaction

    private GSTService GstService(ApplicationDbContext context) =>
        new(new Repository<GSTMasterEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    private static CreateGSTDto Rate(string code, string name)
        => new() { TaxCode = code, TaxName = name, TaxPercentage = 18, EffectiveFromDate = new DateTime(2024, 4, 1), IsActive = true };

    private async Task<List<string>> SavedTaxCodesAsync(string suffix)
    {
        await using var context = NewContext();
        return await context.Set<GSTMasterEntity>().AsNoTracking()
            .Where(x => x.TaxCode.EndsWith(suffix)).OrderBy(x => x.TaxCode).Select(x => x.TaxCode).ToListAsync();
    }

    [SqlServerFact]
    public async Task BulkCreate_ValidItems_AreCommitted()
    {
        var s = Unique();

        await using (var context = NewContext())
        {
            var result = await GstService(context).BulkCreateAsync(new[] { Rate($"A{s}", $"Rate A {s}"), Rate($"B{s}", $"Rate B {s}") });
            Assert.Equal(2, result.SuccessCount);
        }

        Assert.Equal(new[] { $"A{s}", $"B{s}" }, await SavedTaxCodesAsync(s));
    }

    [SqlServerFact]
    public async Task BulkCreate_ItemFailingValidation_IsSkippedAndTheOthersCommitted()
    {
        // The second item repeats the first one's Tax Name in the same batch.
        var s = Unique();

        await using (var context = NewContext())
        {
            var result = await GstService(context).BulkCreateAsync(new[]
            {
                Rate($"A{s}", $"Rate {s}"), Rate($"B{s}", $"Rate {s}"), Rate($"C{s}", $"Rate C {s}")
            });

            Assert.Equal(2, result.SuccessCount);
            Assert.Equal($"Item 1: TaxName: Tax Name 'Rate {s}' already exists.", Assert.Single(result.Errors!));
        }

        Assert.Equal(new[] { $"A{s}", $"C{s}" }, await SavedTaxCodesAsync(s));
    }

    private AssetCategoryService CategoryService(ApplicationDbContext context, Repository<AssetCategoryEntity, int>? repository = null) =>
        new(repository ?? new Repository<AssetCategoryEntity, int>(context), new UnitOfWork(context), _mapper, new ReferenceValidationService(context));

    private async Task<List<string>> SavedCategoryCodesAsync(string suffix)
    {
        await using var context = NewContext();
        return await context.Set<AssetCategoryEntity>().AsNoTracking()
            .Where(x => x.CategoryCode.EndsWith(suffix)).OrderBy(x => x.CategoryCode).Select(x => x.CategoryCode).ToListAsync();
    }

    [SqlServerFact]
    public async Task BulkCreate_UnexpectedDatabaseError_RollsBackTheItemsAlreadySaved()
    {
        // The first item is saved before the second fails on the column length (not a duplicate), so this shows the
        // per-item saves are inside the batch transaction and undone with it.
        var s = Unique();

        await using (var context = NewContext())
        {
            await Assert.ThrowsAsync<DbUpdateException>(() => CategoryService(context).BulkCreateAsync(new[]
            {
                new CreateAssetCategoryDto { CategoryCode = $"OK{s}", CategoryName = $"Saved first {s}", IsActive = true },
                new CreateAssetCategoryDto { CategoryCode = new string('X', 101) + s, CategoryName = $"Too long {s}", IsActive = true }
            }));
        }

        Assert.Empty(await SavedCategoryCodesAsync(s));
    }

    /// <summary>Saves a category with the racing code from another connection just before the service adds its own.</summary>
    private sealed class RacingRepository(ApplicationDbContext context, Func<Task> otherRequest, string racingCode)
        : Repository<AssetCategoryEntity, int>(context)
    {
        public override async Task<AssetCategoryEntity> AddAsync(AssetCategoryEntity entity, CancellationToken cancellationToken = default)
        {
            if (entity.CategoryCode == racingCode)
                await otherRequest();
            return await base.AddAsync(entity, cancellationToken);
        }
    }

    [SqlServerFact]
    public async Task BulkCreate_DuplicateSavedByAnotherRequestMeanwhile_FailsOnlyThatItem()
    {
        // The second item passes its check, then another request saves the same code before this batch does. The
        // unique index rejects the save: only that item fails, and the items before and after it are committed.
        var s = Unique();
        var racingCode = $"RACE{s}";

        Task OtherRequest() => SeedAsync(new AssetCategoryEntity { CategoryCode = racingCode, CategoryName = $"Other request {s}" });

        await using (var context = NewContext())
        {
            var service = CategoryService(context, new RacingRepository(context, OtherRequest, racingCode));
            var result = await service.BulkCreateAsync(new[]
            {
                new CreateAssetCategoryDto { CategoryCode = $"BLDG{s}", CategoryName = $"Building {s}", IsActive = true },
                new CreateAssetCategoryDto { CategoryCode = racingCode, CategoryName = $"Race {s}", IsActive = true },
                new CreateAssetCategoryDto { CategoryCode = $"SHOP{s}", CategoryName = $"Shop {s}", IsActive = true }
            });

            Assert.Equal(2, result.SuccessCount);
            Assert.Equal(1, result.FailedCount);
            Assert.Equal("Item 1: A record with the same details already exists.", Assert.Single(result.Errors!));
        }

        Assert.Equal(new[] { $"BLDG{s}", racingCode, $"SHOP{s}" }, await SavedCategoryCodesAsync(s));
    }

    #endregion
}
