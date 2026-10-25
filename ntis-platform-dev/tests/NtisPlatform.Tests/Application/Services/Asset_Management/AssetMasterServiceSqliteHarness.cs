using System.Linq.Expressions;
using AutoMapper;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// <see cref="AssetMasterService"/> backed by a real SQLite in-memory database, for the list
/// endpoints (<c>GetParentAssetDetailsAsync</c>, <c>GetSubUnitDetailsByParentAsync</c>) whose queries
/// compose several repositories into one statement — sub-unit, floor, lease and demand roll-ups keyed
/// off an <c>IQueryable</c> of parent ids, and the tenant-search subquery. MockQueryable runs those
/// through LINQ-to-Objects, which dereferences null navigations a real LEFT JOIN propagates and never
/// exercises SQL translation (see AssetMasterServiceLocationTests for the same reasoning). The photo,
/// document, type-of-use and condition lookups are standalone queries, so they stay on MockQueryable
/// and are exposed as mocks for tests to fill.
/// </summary>
internal sealed class AssetMasterServiceSqliteHarness : IDisposable
{
    public const int CategoryId = 1;
    public const int TypeId = 1;
    public const int GroundFloorId = 1;
    public const int FirstFloorId = 2;
    public const int RccConstructionTypeId = 1;
    public const int LoadBearingConstructionTypeId = 2;

    private readonly SqliteConnection _connection;

    public AssetMasterServiceSqliteHarness()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        Context = new HarnessDbContext(new DbContextOptionsBuilder<HarnessDbContext>().UseSqlite(_connection).Options);
        Context.Database.EnsureCreated();

        Context.Set<AssetCategoryEntity>().Add(new AssetCategoryEntity { Id = CategoryId, CategoryCode = "BLDG", CategoryName = "Building" });
        Context.Set<AssetTypeEntity>().Add(new AssetTypeEntity { Id = TypeId, TypeCode = "BLDG-SHOP", TypeName = "Shopping Complex" });
        Context.Set<FloorEntity>().Add(new FloorEntity { Id = GroundFloorId, FloorCode = "G", Description = "Ground Floor", SequenceNo = 0 });
        Context.Set<FloorEntity>().Add(new FloorEntity { Id = FirstFloorId, FloorCode = "1", Description = "First Floor", SequenceNo = 1 });
        Context.Set<ConstructionTypeEntity>().Add(new ConstructionTypeEntity { Id = RccConstructionTypeId, ConstructionCode = "RCC", Description = "RCC" });
        Context.Set<ConstructionTypeEntity>().Add(new ConstructionTypeEntity { Id = LoadBearingConstructionTypeId, ConstructionCode = "LB", Description = "Load Bearing" });
        Context.SaveChanges();

        SetRows(PhotoRepository);
        SetRows(DocumentRepository);
        SetRows(TypeOfUseRepository);
        SetRows(SubTypeOfUseRepository);
        SetRows(ConditionRepository);
    }

    public DbContext Context { get; }

    public Mock<IRepository<AssetPhotoEntity, int>> PhotoRepository { get; } = new();
    public Mock<IRepository<AssetDocumentEntity, int>> DocumentRepository { get; } = new();
    public Mock<IRepository<AssetTypeOfUseMasterEntity, int>> TypeOfUseRepository { get; } = new();
    public Mock<IRepository<AssetSubTypeOfUseEntity, int>> SubTypeOfUseRepository { get; } = new();
    public Mock<IRepository<AssetConditionMasterEntity, int>> ConditionRepository { get; } = new();

    /// <summary>Adds the rows, saves, and clears the change tracker so the service reads from the database.</summary>
    public void Seed(params object[] rows)
    {
        Context.AddRange(rows);
        Context.SaveChanges();
        Context.ChangeTracker.Clear();
    }

    public static void SetRows<T>(Mock<IRepository<T, int>> repoMock, params T[] rows) where T : class
        => repoMock.Setup(r => r.GetQueryable()).Returns(rows.ToList().BuildMockDbSet().Object);

    public AssetMasterService CreateService()
    {
        var mapper = new MapperConfiguration(
            cfg => cfg.AddProfile<AssetMasterMappingProfile>(),
            NullLoggerFactory.Instance).CreateMapper();

        return new AssetMasterService(
            Repo<AssetMasterEntity>(),
            new Mock<IUnitOfWork>().Object,
            mapper,
            new Mock<IReferenceValidationService>().Object,
            Repo<AssetFieldValueEntity>(),
            Repo<SubUnitsDetailsEntity>(),
            EmptyMock<AssetRoomWiseSubmissionDetailsEntity>(),
            Repo<AssetCategoryEntity>(),
            Repo<AssetTypeEntity>(),
            EmptyMock<ULBMasterEntity>(),
            Repo<AssetDetailsEntity>(),
            DocumentRepository.Object,
            PhotoRepository.Object,
            new Mock<IAssetPhotoApplicationService>().Object,
            new Mock<IDocumentApplicationService>().Object,
            Repo<ZoneEntity>(),
            Repo<WardEntity>(),
            Repo<MoujaEntity>(),
            Repo<SubZoneDetailsForCVEntity>(),
            Repo<OwningDepartmentEntity>(),
            Repo<AssetOrganizationMasterEntity>(),
            ConditionRepository.Object,
            EmptyMock<DepartmentMasterEntity>(),
            EmptyMock<ModuleMasterEntity>(),
            EmptyMock<AssetDesignationEntity>(),
            TypeOfUseRepository.Object,
            SubTypeOfUseRepository.Object,
            NullLogger<AssetMasterService>.Instance,
            EmptyMock<InventoryBatchEntity>(),
            Repo<InventoryAssetDetailEntity>(),
            EmptyMock<InventoryItemCategoryEntity>(),
            EmptyMock<InventoryItemNameEntity>(),
            EmptyMock<InventoryItemModelEntity>(),
            EmptyMock<OwningDepartmentEntity>(),
            new Mock<IInventoryDocumentApplicationService>().Object,
            Repo<AssetLeaseRentDetailsEntity>(),
            Repo<MonthWiseDemandEntity>());
    }

    #region Row factories

    public static AssetMasterEntity Asset(
        int id,
        int? parentAssetId = null,
        string? assetNo = null,
        string? assetName = null,
        bool isActive = true,
        bool markedForDeletion = false,
        DateTime? createdDate = null,
        string? encroachmentStatus = null)
        => new()
        {
            Id = id,
            ParentAssetId = parentAssetId,
            AssetNo = assetNo ?? $"AST-{id}",
            AssetName = assetName ?? $"Asset {id}",
            AssetCategoryId = CategoryId,
            AssetTypeId = TypeId,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion,
            CreatedDate = createdDate ?? new DateTime(2026, 1, 1),
            EncroachmentStatus = encroachmentStatus
        };

    /// <summary>A lease whose dates are offsets in days from today (null end = open-ended).</summary>
    public static AssetLeaseRentDetailsEntity Lease(
        int id,
        int assetId,
        string tenantName,
        int startOffsetDays,
        int? endOffsetDays,
        decimal rentAmount = 0m,
        string paymentFrequency = "Monthly",
        bool isActive = true,
        bool markedForDeletion = false)
        => new()
        {
            Id = id,
            AssetId = assetId,
            TenantName = tenantName,
            TenantMobile = "9999999999",
            LeaseStartDate = DateTime.Today.AddDays(startOffsetDays),
            LeaseEndDate = endOffsetDays.HasValue ? DateTime.Today.AddDays(endOffsetDays.Value) : null,
            RentAmount = rentAmount,
            PaymentFrequency = paymentFrequency,
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion
        };

    /// <summary>A rent demand row; PendingAmount is a computed column in SQL Server, so it is set directly here.</summary>
    public static MonthWiseDemandEntity Demand(int id, int assetId, decimal pendingAmount, string demandStatus = "Pending", bool isActive = true)
    {
        var demand = new MonthWiseDemandEntity
        {
            Id = id,
            AssetId = assetId,
            DemandStatus = demandStatus,
            IsActive = isActive
        };
        typeof(MonthWiseDemandEntity).GetProperty(nameof(MonthWiseDemandEntity.PendingAmount))!.SetValue(demand, pendingAmount);
        return demand;
    }

    /// <summary>An uploaded file; live (active, not deleted) unless told otherwise.</summary>
    public static DocumentEntity UploadedFile(int id, string fileName, bool isActive = true, bool markedForDeletion = false)
        => new()
        {
            Id = id,
            DocumentGuid = Guid.NewGuid(),
            OriginalFileName = fileName,
            MimeType = "application/octet-stream",
            IsActive = isActive,
            MarkedForDeletion = markedForDeletion
        };

    /// <summary>
    /// A latest photo record; with no <paramref name="file"/> it is an enabled slot with nothing uploaded.
    /// The binding to <paramref name="file"/> is live unless told otherwise.
    /// </summary>
    public static AssetPhotoEntity PhotoSlot(int id, int assetId, int photoTypeId, DocumentEntity? file = null,
        string? remarks = null, int? subUnitsDetailsId = null, bool isLatest = true,
        bool bindingIsActive = true, bool bindingMarkedForDeletion = false)
    {
        var photo = file == null
            ? AssetPhotoEntity.Create(assetId, photoTypeId, subUnitsDetailsId, remarks: remarks)
            : AssetPhotoEntity.CreateWithDocument(assetId, photoTypeId, file.Id, subUnitsDetailsId, remarks: remarks);
        photo.Id = id;
        if (!isLatest)
        {
            photo.MarkAsSuperseded();
        }

        SetPrivate(photo, nameof(AssetPhotoEntity.PhotoType),
            new AssetPhotoTypeEntity { Id = photoTypeId, PhotoTypeCode = $"PT-{photoTypeId}", PhotoTypeName = $"Photo {photoTypeId}" });
        if (file != null)
        {
            SetPrivate(photo, nameof(AssetPhotoEntity.DocumentBinding), Binding(file, bindingIsActive, bindingMarkedForDeletion));
        }
        return photo;
    }

    /// <summary>
    /// A latest document record; with no <paramref name="file"/> it is an enabled slot with nothing uploaded.
    /// The binding to <paramref name="file"/> is live unless told otherwise.
    /// </summary>
    public static AssetDocumentEntity DocumentSlot(int id, int assetId, int definitionId, string documentCode, DocumentEntity? file = null,
        bool bindingIsActive = true, bool bindingMarkedForDeletion = false)
    {
        var document = file == null
            ? AssetDocumentEntity.Create(assetId, definitionId)
            : AssetDocumentEntity.CreateWithDocument(assetId, definitionId, file.Id);
        document.Id = id;

        SetPrivate(document, nameof(AssetDocumentEntity.DocumentDefinition),
            new AssetDocumentDefinitionEntity { Id = definitionId, DocumentCode = documentCode, DocumentName = documentCode });
        if (file != null)
        {
            SetPrivate(document, nameof(AssetDocumentEntity.DocumentBinding), Binding(file, bindingIsActive, bindingMarkedForDeletion));
        }
        return document;
    }

    private static DocumentBindingEntity Binding(DocumentEntity file, bool isActive, bool markedForDeletion)
        => new() { Id = file.Id, DocumentId = file.Id, Document = file, IsActive = isActive, MarkedForDeletion = markedForDeletion };

    private static void SetPrivate(object target, string propertyName, object value)
        => target.GetType().GetProperty(propertyName)!.SetValue(target, value);

    #endregion

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }

    private IRepository<T, int> Repo<T>() where T : class => new SqliteQueryRepository<T>(Context);

    private static IRepository<T, int> EmptyMock<T>() where T : class
    {
        var mock = new Mock<IRepository<T, int>>();
        SetRows(mock);
        return mock.Object;
    }

    /// <summary>
    /// Minimal portable model of only the tables these list queries touch — not the real
    /// ApplicationDbContext, whose SQL-Server-only configuration does not run on SQLite.
    /// </summary>
    private sealed class HarnessDbContext(DbContextOptions<HarnessDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AssetMasterEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.HasOne(x => x.AssetCategory).WithMany().HasForeignKey(x => x.AssetCategoryId);
                b.HasOne(x => x.AssetType).WithMany().HasForeignKey(x => x.AssetTypeId);
                b.HasOne(x => x.ParentAsset).WithMany().HasForeignKey(x => x.ParentAssetId);
                b.HasOne(x => x.Details).WithOne(d => d.Asset).HasForeignKey<AssetDetailsEntity>(d => d.AssetId);
                b.HasMany(x => x.FieldValues).WithOne(fv => fv.Asset).HasForeignKey(fv => fv.AssetId);
                b.Ignore(x => x.InventoryBatch);
                b.Ignore(x => x.SubUnitsDetails);
            });

            HasManualKey<AssetCategoryEntity>(modelBuilder);
            HasManualKey<AssetTypeEntity>(modelBuilder);
            HasManualKey<AssetFieldValueEntity>(modelBuilder);
            HasManualKey<AssetDetailsEntity>(modelBuilder);
            HasManualKey<AssetOrganizationMasterEntity>(modelBuilder);
            HasManualKey<OwningDepartmentEntity>(modelBuilder);

            modelBuilder.Entity<SubUnitsDetailsEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.HasOne(x => x.Asset).WithMany().HasForeignKey(x => x.AssetId);
                b.HasOne(x => x.Floor).WithMany().HasForeignKey(x => x.FloorId);
                b.HasOne(x => x.SubFloor).WithMany().HasForeignKey(x => x.SubFloorId);
                b.HasOne(x => x.ConstructionType).WithMany().HasForeignKey(x => x.ConstructionTypeId);
                // Type-of-use ids point at the AMS masters, resolved separately by the service.
                b.Ignore(x => x.TypeOfUse);
                b.Ignore(x => x.SubTypeOfUse);
            });
            modelBuilder.Entity<FloorEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Rates);
                b.Ignore(x => x.FloorFactorCVMaster);
                b.Ignore(x => x.PropertyDetails);
            });
            modelBuilder.Entity<SubFloorEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.PropertyDetails);
            });
            modelBuilder.Entity<ConstructionTypeEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Rates);
                b.Ignore(x => x.NatureFactorCVMaster);
                b.Ignore(x => x.AgeFactorCVMaster);
                b.Ignore(x => x.PropertyDetails);
                b.Ignore(x => x.DepreciationMaster);
            });

            modelBuilder.Entity<AssetLeaseRentDetailsEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.HasOne(x => x.Asset).WithMany().HasForeignKey(x => x.AssetId);
                b.Ignore(x => x.ApplicationType);
                b.Ignore(x => x.History);
            });
            modelBuilder.Entity<MonthWiseDemandEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.GSTMaster);
                b.Ignore(x => x.PenaltyRuleMaster);
            });
            modelBuilder.Entity<InventoryAssetDetailEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.AssetMaster);
                b.Ignore(x => x.Batch);
            });

            // Location masters are joined by scalar id in Location.cs, never through navigations.
            modelBuilder.Entity<ZoneEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Ward);
            });
            modelBuilder.Entity<WardEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Zone);
                b.Ignore(x => x.BlockMaster);
                b.Ignore(x => x.RateSectionDetails);
                b.Ignore(x => x.Property);
            });
            modelBuilder.Entity<MoujaEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Property);
                b.Ignore(x => x.CSNDetails);
                b.Ignore(x => x.SubZoneDetails);
            });
            modelBuilder.Entity<SubZoneDetailsForCVEntity>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
                b.Ignore(x => x.Mouja);
            });

            modelBuilder.Ignore<DynamicTaxRuleEntity>();
            modelBuilder.Ignore<TaxConditionRuleEntity>();
        }

        private static void HasManualKey<T>(ModelBuilder modelBuilder) where T : BaseEntity
            => modelBuilder.Entity<T>(b =>
            {
                b.HasKey(x => x.Id);
                b.Property(x => x.Id).ValueGeneratedNever();
            });
    }

    /// <summary>Read-only <see cref="IRepository{T,TKey}"/> over the harness context; only GetQueryable is used by the code under test.</summary>
    private sealed class SqliteQueryRepository<T>(DbContext context) : IRepository<T, int> where T : class
    {
        public IQueryable<T> GetQueryable() => context.Set<T>();

        public Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<T> AddAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task UpdateAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task DeleteAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task DeleteAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task HardDeleteAsync(T entity, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>>? filter = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
