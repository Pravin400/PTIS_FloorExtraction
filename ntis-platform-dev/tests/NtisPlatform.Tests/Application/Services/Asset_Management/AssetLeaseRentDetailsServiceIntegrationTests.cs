using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.AssetLeaseRentDetails;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories;
using NtisPlatform.Infrastructure.Services;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Integration tests for <see cref="AssetLeaseRentDetailsService"/> against a real
/// <see cref="ApplicationDbContext"/> (EF Core InMemory provider), per CLAUDE.md Section 17
/// ("Add at least one integration test against a real DB ... per aggregate"). GetAllAsync and the
/// overridden GetByIdAsync use hand-rolled LINQ joins and ProjectTo projections over
/// _repository.GetQueryable()/_assetRepository.GetQueryable() that a mocked IQueryable can't
/// faithfully exercise (EF null-conditional navigation translation, GroupBy, DefaultIfEmpty
/// left-join semantics).
///
/// </summary>
[Trait("Category", "Integration")]
public class AssetLeaseRentDetailsServiceIntegrationTests : IAsyncLifetime
{
    private ApplicationDbContext? _context;
    private Repository<AssetLeaseRentDetailsEntity, int>? _repository;
    private Repository<AssetMasterEntity, int>? _assetRepository;
    private Repository<AssetRoomWiseSubmissionDetailsEntity, int>? _roomWiseRepository;
    private Repository<LeaseRentRegistrationHistoryEntity, int>? _historyRepository;
    private Repository<ModuleMasterEntity, int>? _moduleRepository;
    private Repository<DocumentEntity, int>? _documentRepository;
    private Repository<DocumentBindingEntity, int>? _documentBindingRepository;
    private Repository<InventoryAssetDetailEntity, int>? _inventoryAssetDetailRepository;
    private Repository<UserRoleAllocationEntity, int>? _userRoleAllocationRepository;
    private UserAccessRepository? _userAccessRepository;
    private Repository<AssetPhotoEntity, int>? _assetPhotoRepository;
    private UnitOfWork? _unitOfWork;
    private IMapper? _mapper;
    private Mock<IReferenceValidationService>? _referenceValidator;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"AssetLeaseRentDetailsServiceIntegrationTests_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new Repository<AssetLeaseRentDetailsEntity, int>(_context);
        _assetRepository = new Repository<AssetMasterEntity, int>(_context);
        _roomWiseRepository = new Repository<AssetRoomWiseSubmissionDetailsEntity, int>(_context);
        _historyRepository = new Repository<LeaseRentRegistrationHistoryEntity, int>(_context);
        _moduleRepository = new Repository<ModuleMasterEntity, int>(_context);
        _documentRepository = new Repository<DocumentEntity, int>(_context);
        _documentBindingRepository = new Repository<DocumentBindingEntity, int>(_context);
        _inventoryAssetDetailRepository = new Repository<InventoryAssetDetailEntity, int>(_context);
        _userRoleAllocationRepository = new Repository<UserRoleAllocationEntity, int>(_context);
        _userAccessRepository = new UserAccessRepository(_context);
        _assetPhotoRepository = new Repository<AssetPhotoEntity, int>(_context);
        _unitOfWork = new UnitOfWork(_context);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<AssetLeaseRentDetailsMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _referenceValidator = new Mock<IReferenceValidationService>();
        _referenceValidator
            .Setup(x => x.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
    }

    /// <param name="unitOfWork">
    /// Optional stand-in for the real UnitOfWork — lets a test force SaveChangesAsync to throw
    /// (e.g. DbUpdateConcurrencyException) while every repository still reads the real InMemory data.
    /// </param>
    private AssetLeaseRentDetailsService CreateService(IUnitOfWork? unitOfWork = null) => new(
        _repository!, unitOfWork ?? _unitOfWork!, _mapper!,
        _assetRepository!, _roomWiseRepository!, _historyRepository!, _moduleRepository!,
        _documentRepository!, _documentBindingRepository!, _inventoryAssetDetailRepository!, _userRoleAllocationRepository!,
        _userAccessRepository!,
        _referenceValidator!.Object,
        new Mock<IDocumentService>().Object,
        new Mock<IFileStorageService>().Object,
        _assetPhotoRepository!,
        new ConfigurationBuilder().Build(),
        new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);

    private AssetLeaseRentDetailsService CreateServiceForUpload(
        IDocumentService documentService, IFileStorageService fileStorageService, IConfiguration configuration) => new(
        _repository!, _unitOfWork!, _mapper!,
        _assetRepository!, _roomWiseRepository!, _historyRepository!, _moduleRepository!,
        _documentRepository!, _documentBindingRepository!, _inventoryAssetDetailRepository!, _userRoleAllocationRepository!,
        _userAccessRepository!,
        _referenceValidator!.Object,
        documentService,
        fileStorageService,
        _assetPhotoRepository!,
        configuration,
        new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);

    /// <summary>
    /// A real (non-mocked) IDocumentService backed by the same DbContext — needed for tests that
    /// verify document persistence (title, binding scope, download count) end-to-end, since a fully
    /// mocked IDocumentService never actually inserts CORE.Document/CORE.DocumentBinding rows.
    /// </summary>
    private DocumentService CreateRealDocumentService() =>
        new(_documentRepository!, _documentBindingRepository!, _unitOfWork!);

    private async Task<AssetMasterEntity> SeedAssetAsync(int id, int? parentAssetId = null, string? assetName = null, int? departmentId = null)
    {
        var asset = new AssetMasterEntity
        {
            Id = id,
            AssetNo = $"A-{id}",
            AssetName = assetName ?? $"Asset {id}",
            AssetCategoryId = 1,
            AssetTypeId = 1,
            ParentAssetId = parentAssetId,
            DepartmentId = departmentId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<AssetMasterEntity>().Add(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    /// <summary>
    /// UserRoleId 1 has no UserRoleMaster row, so these allocations are deliberately NOT "Admin" —
    /// see <see cref="SeedAdminRoleAllocationAsync"/> for the one that is.
    /// </summary>
    private async Task SeedUserRoleAllocationAsync(int userId, int departmentId, int userRoleId = 1, bool isActive = true)
    {
        _context!.Set<UserRoleAllocationEntity>().Add(new UserRoleAllocationEntity
        {
            UserId = userId,
            DepartmentId = departmentId,
            UserRoleId = userRoleId,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    private const int AdminRoleId = 99;

    /// <summary>
    /// Seeds a real "Admin" UserRoleMaster row plus an allocation to it, so IsAdminAsync (the same
    /// definition login uses) returns true for <paramref name="userId"/>.
    /// </summary>
    private async Task SeedAdminRoleAllocationAsync(int userId, int departmentId, bool allocationIsActive = true)
    {
        _context!.Set<UserRoleMasterEntity>().Add(new UserRoleMasterEntity
        {
            Id = AdminRoleId,
            UserRoleName = "Admin",
            DepartmentId = departmentId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        await SeedUserRoleAllocationAsync(userId, departmentId, AdminRoleId, allocationIsActive);
    }

    /// <summary>
    /// Document upload/download is department-scoped and fails closed, so these tests seed the
    /// asset in a department the uploader (userId 1 — the uploadedBy every upload below passes) is
    /// allocated to.
    /// </summary>
    private async Task<AssetLeaseRentDetailsEntity> SeedLeaseAccessibleToUploaderAsync()
    {
        await SeedAssetAsync(10, departmentId: 5);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);
        return await SeedLeaseAsync(10, workflowStatus: "Pending");
    }

    private async Task<AssetLeaseRentDetailsEntity> SeedLeaseAsync(
        int assetId, string workflowStatus = "Pending", string tenantName = "Acme Traders", decimal? totalAreaSqFt = null)
    {
        var lease = new AssetLeaseRentDetailsEntity
        {
            AssetId = assetId,
            TenantName = tenantName,
            TenantMobile = "9999999999",
            LeaseStartDate = DateTime.UtcNow,
            SecurityDeposit = 0m,
            WorkflowStatus = workflowStatus,
            TotalAreaSqFt = totalAreaSqFt,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await _context.SaveChangesAsync();
        return lease;
    }

    #region GetByIdAsync / GetAllAsync

    /// <summary>
    /// GetByIdAsync's ProjectTo goes through AutoMapper's Asset-navigation ForMembers
    /// (<c>src.Asset != null ? src.Asset.AssetNo : null</c>, etc.), which this file's EF Core
    /// <b>InMemory</b> provider silently translates to zero rows for a row that genuinely exists
    /// (confirmed directly: a bare, ForMember-free ProjectTo of the same entity works fine; adding
    /// those ForMembers makes it return nothing). GetByIdAsync now falls back to a plain
    /// <c>_repository.GetByIdAsync</c> + in-memory <c>_mapper.Map</c> when ProjectTo returns null
    /// (same pattern as CreateAsync/UpdateAsync/GetEnrichedAsync), so this is no longer a case of
    /// "returns nothing" — but the fallback's in-memory map still can't populate Asset-derived
    /// fields (AssetNo/AssetName/Names/AssetCategoryName) without eager-loading the Asset
    /// navigation, which GetByIdAsync's repository call doesn't do. That's the still-open part of
    /// GetByIdAsync's coverage; the positive test below asserts what the fallback path CAN prove
    /// today — a real row's direct fields and its separately-queried enrichment (ParentAssetName)
    /// come back correctly.
    ///
    /// GetAllAsync is a SEPARATE, worse problem: it never calls ProjectTo at all (hand-rolled
    /// GroupJoin + OrderByDescending().Take(1) for "latest lease per asset", then a manual Select),
    /// yet a positive test against a genuinely seeded asset+lease was confirmed empirically (not
    /// just theorized) to return zero rows under this InMemory provider — this is a correlated-
    /// subquery-inside-a-join translation limitation, not something a ProjectTo-style fallback can
    /// paper over, and rewriting the production query shape just to satisfy this test provider
    /// risks changing real behavior against SQL Server. A real relational provider is needed to
    /// exercise it properly (see AssetMasterServiceLocationTests in this suite for the established
    /// SQLite-in-memory pattern; reproducing it for this entity hit a separate, unresolved model-
    /// discovery anomaly specific to AssetMasterEntity in a scoped-down context). Only the
    /// not-found path is covered for GetByIdAsync's fallback-independent case. GetAllAsync's
    /// filtering and sorting are proven against real SQL Server in
    /// AssetLeaseRentDetailsServiceSqlServerTests; here only what doesn't depend on rows coming back
    /// (sort-field validation) is checked.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        var service = CreateService();
        Assert.Null(await service.GetByIdAsync(999, CancellationToken.None));
    }

    [Fact]
    public async Task GetByIdAsync_ExistingLease_ReturnsDirectFieldsAndEnrichedData()
    {
        await SeedAssetAsync(1, assetName: "Building A");
        await SeedAssetAsync(10, parentAssetId: 1, assetName: "Shop 10");
        var lease = await SeedLeaseAsync(10, workflowStatus: "Verified", tenantName: "Acme Traders");

        var service = CreateService();
        var dto = await service.GetByIdAsync(lease.Id, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(lease.Id, dto!.Id);
        Assert.Equal("Acme Traders", dto.TenantName);
        Assert.Equal("Verified", dto.WorkflowStatus);
        Assert.Equal(10, dto.AssetId);
        // Populated by EnrichAssetPhotoAndNameAsync's own direct query against _assetRepository,
        // not by the entity's (unloaded) Asset navigation, so this comes through correctly even
        // via the ProjectTo fallback.
        Assert.Equal("Building A", dto.ParentAssetName);
    }

    /// <summary>
    /// Regression test for the Copilot finding: DELETE must make a lease unreachable by ID, not
    /// just invisible from GetAllAsync — otherwise a "deleted" lease's tenant Aadhaar/PAN/address
    /// stays fetchable by anyone who still has the id.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_SoftDeletedLease_ReturnsNull()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        var service = CreateService();

        await service.DeleteAsync(lease.Id, CancellationToken.None);

        Assert.Null(await service.GetByIdAsync(lease.Id, CancellationToken.None));
    }

    /// <summary>
    /// Regression test for the Copilot finding: the room-wise unit-area fallback used to sum the
    /// SQUARE-METRE columns straight into TotalAreaSqFt (a SQUARE-FOOT field), under-reporting the
    /// area by roughly 10.76x. It must now convert square metres to square feet (1 sq.mt ≈
    /// 10.7639 sq.ft).
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_UnitAreaFallback_ConvertsSquareMetresToSquareFeet()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, totalAreaSqFt: null); // no area on the lease itself
        _context!.Set<AssetRoomWiseSubmissionDetailsEntity>().Add(new AssetRoomWiseSubmissionDetailsEntity
        {
            AssetId = 10,
            AreaSqMtr = 10d, // no square-foot value recorded — must be converted, not summed as-is
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var service = CreateService();
        var dto = await service.GetByIdAsync(lease.Id, CancellationToken.None);

        Assert.NotNull(dto);
        // 10 sq.mt / 0.092903 ≈ 107.64 sq.ft — nowhere near the old (wrong) value of 10.
        Assert.True(dto!.TotalAreaSqFt > 100m && dto.TotalAreaSqFt < 110m,
            $"Expected ~107.64 sq.ft, got {dto.TotalAreaSqFt}");
    }

    /// <summary>
    /// When a room row already records its own square-foot area, that recorded value must be used
    /// directly — not silently overwritten by a metre-to-foot conversion.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_UnitAreaFallback_PrefersRecordedSquareFootValue_OverMetreConversion()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, totalAreaSqFt: null);
        _context!.Set<AssetRoomWiseSubmissionDetailsEntity>().Add(new AssetRoomWiseSubmissionDetailsEntity
        {
            AssetId = 10,
            AreaSqFeet = 200d,
            AreaSqMtr = 10d, // present too, but the recorded sq.ft value must win
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var service = CreateService();
        var dto = await service.GetByIdAsync(lease.Id, CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(200m, dto!.TotalAreaSqFt);
    }

    /// <summary>
    /// Regression test for the Copilot finding: the query parameters mark TenantMobile [Sortable] and
    /// [Filterable], but GetAllAsync builds its own query, whose sort switch rejected TenantMobile
    /// with FilterValidationException and whose filters ignored it. Results are checked against SQL
    /// Server in AssetLeaseRentDetailsServiceSqlServerTests.
    /// </summary>
    [Theory]
    [InlineData("TenantMobile")]
    [InlineData("tenantmobile")]
    public async Task GetAllAsync_SortByTenantMobile_IsAccepted(string sortBy)
    {
        var service = CreateService();

        var exception = await Record.ExceptionAsync(() => service.GetAllAsync(
            new AssetLeaseRentDetailsQueryParameters { SortBy = sortBy, TenantMobile = "43210" }, CancellationToken.None));

        Assert.Null(exception);
    }

    [Fact]
    public async Task GetAllAsync_UnknownSortField_ListsTenantMobileAmongAllowedFields()
    {
        var ex = await Assert.ThrowsAsync<FilterValidationException>(() => CreateService().GetAllAsync(
            new AssetLeaseRentDetailsQueryParameters { SortBy = "AdvanceBalance" }, CancellationToken.None));

        Assert.Contains("TenantMobile", ex.Errors["SortBy"]);
    }

    #endregion

    #region CreateAsync

    [Fact]
    public async Task CreateAsync_PersistsWithWorkflowStatusPending_RegardlessOfRequestedStatus()
    {
        await SeedAssetAsync(10);
        var service = CreateService();
        var dto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            WorkflowStatus = "Approved" // must be overridden server-side
        };

        var created = await service.CreateAsync(dto, CancellationToken.None);

        Assert.Equal("Pending", created.WorkflowStatus);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == created.Id);
        Assert.Equal("Pending", persisted.WorkflowStatus);
    }

    [Fact]
    public async Task CreateAsync_AssetNotFound_ThrowsValidationException_NoRowPersisted()
    {
        var service = CreateService();
        var dto = new CreateAssetLeaseRentDetailsDto { AssetId = 999, TenantName = "Acme", TenantMobile = "9999999999" };

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto, CancellationToken.None));

        Assert.Equal(0, await _context!.Set<AssetLeaseRentDetailsEntity>().CountAsync());
    }

    /// <summary>
    /// Regression test for the Copilot finding: CreateBaseDtos.IsActive defaults to false (plain
    /// bool), and the mapping profile used to copy it straight over BaseEntity's IsActive = true
    /// default — a create request that simply omits IsActive (the overwhelmingly common case; the
    /// UI never sets it explicitly on create) silently produced an inactive lease that would then
    /// fail GetById, document upload, and every other active-only operation.
    /// </summary>
    [Fact]
    public async Task CreateAsync_OmittedIsActive_DefaultsToActive()
    {
        await SeedAssetAsync(10);
        var service = CreateService();
        var dto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
            // IsActive intentionally left unset (defaults to false on the DTO).
        };

        var created = await service.CreateAsync(dto, CancellationToken.None);

        Assert.True(created.IsActive);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == created.Id);
        Assert.True(persisted.IsActive);
    }

    #endregion

    #region UpdateAsync — History Snapshot + Deactivation Guard Gap

    [Fact]
    public async Task UpdateAsync_WritesHistorySnapshotOfPriorValues_BeforeApplyingNewValues()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending", tenantName: "Old Tenant");
        var service = CreateService();

        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "New Tenant",
            TenantMobile = "8888888888",
            UpdatedBy = 5
            // IsActive omitted — must leave the lease active (see UpdateAsync_OmittedIsActive_*).
        };

        var updated = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.NotNull(updated);
        Assert.Equal("New Tenant", updated.TenantName);
        Assert.True(updated.IsActive);

        var history = await _context!.Set<LeaseRentRegistrationHistoryEntity>().AsNoTracking()
            .SingleAsync(h => h.LeaseRentRegistrationId == lease.Id);
        Assert.Equal("Old Tenant", history.Snap_TenantName);
        Assert.Equal("Pending", history.Snap_WorkflowStatus);
        Assert.Equal(5, history.PerformedBy);
    }

    /// <summary>
    /// Regression test: a missing id must come back as null (so ExecuteUpdate's null-check takes
    /// the real not-found response) rather than throwing — a thrown KeyNotFoundException falls
    /// through ExecuteUpdate's generic catch and surfaces as a 500 instead of the advertised 404.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_NonExistentId_ReturnsNull()
    {
        var service = CreateService();
        var updateDto = new UpdateAssetLeaseRentDetailsDto { AssetId = 10, TenantName = "T", TenantMobile = "9999999999" };

        var result = await service.UpdateAsync(999, updateDto, CancellationToken.None);

        Assert.Null(result);
    }

    /// <summary>
    /// Regression test: PUT must run the same deactivation guard DeleteAsync already enforces via
    /// ValidateForDeleteAsync — setting IsActive from true to false through UpdateAsync must be
    /// blocked when the reference validator refuses it, and the row must stay untouched (still
    /// active, no history row committed) rather than silently persisting the deactivation.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_DeactivationBlockedByReferenceValidator_ThrowsValidationException_RowStaysActive()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending");
        _referenceValidator!
            .Setup(x => x.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(lease.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("AssetLeaseRentDetails_Referenced"));

        var service = CreateService();
        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = false
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(lease.Id, updateDto, CancellationToken.None));

        // The row itself must never be deactivated — this is the guard the fix adds.
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.True(persisted.IsActive);

        // Note: a real relational provider would also roll back the history snapshot row written
        // earlier in the same transaction (BeginTransactionAsync/RollbackTransactionAsync in
        // UpdateAsync). EF Core's InMemory provider doesn't support real transactions — it ignores
        // BeginTransactionAsync/RollbackTransactionAsync entirely (see
        // ConfigureWarnings(...InMemoryEventId.TransactionIgnoredWarning) above) — so that part of
        // the rollback can't be asserted under this test's provider.
    }

    /// <summary>
    /// Deactivating a record the reference validator does NOT block must still succeed normally —
    /// the guard only rejects, it never blocks a legitimate deactivation.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_DeactivationNotReferenced_Succeeds()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending");

        var service = CreateService();
        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = false
        };

        var updated = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.NotNull(updated);
        Assert.False(updated.IsActive);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.False(persisted.IsActive);
    }

    /// <summary>
    /// Regression test: only the guarded workflow-transition endpoints (Verify/Approve/Reject/
    /// Revert*) may change WorkflowStatus. A plain PUT must not be able to set it to an arbitrary
    /// value (e.g. forging "Approved" directly), nor silently reset an Approved/Rejected row back
    /// to "Pending" just because UpdateAssetLeaseRentDetailsDto.WorkflowStatus defaults to Pending.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_CannotChangeWorkflowStatus_EvenWhenDtoSuppliesADifferentValue()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Approved");

        var service = CreateService();
        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = true,
            WorkflowStatus = "Rejected" // attempted forge — must be ignored
        };

        var updated = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.NotNull(updated);
        Assert.Equal("Approved", updated.WorkflowStatus);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.Equal("Approved", persisted.WorkflowStatus);
    }

    /// <summary>
    /// Regression test for the Copilot finding: AssetId is mutable through this update, but only
    /// the deactivation guard used to run afterward — an inactive or nonexistent target asset was
    /// accepted (inactive) or hit the DB FK constraint as a 500 (nonexistent). Reusing
    /// ValidateForCreateAsync's active-asset check closes both, as a proper 400.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_ReassignsToInactiveAsset_ThrowsValidationException_RowStaysOnOriginalAsset()
    {
        await SeedAssetAsync(10);
        var inactiveAsset = await SeedAssetAsync(20);
        inactiveAsset.IsActive = false;
        await _context!.SaveChangesAsync();
        var lease = await SeedLeaseAsync(10);

        var service = CreateService();
        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 20, // inactive — must be rejected
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(lease.Id, updateDto, CancellationToken.None));

        var persisted = await _context.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.Equal(10, persisted.AssetId);
    }

    /// <summary>
    /// Regression test for the Copilot finding: UpdateBaseDtos.IsActive is a plain bool, so a PUT
    /// body that simply omitted IsActive bound it as false and silently deactivated an active
    /// lease. UpdateAssetLeaseRentDetailsDto.IsActive is now nullable — omitted means "unchanged" —
    /// and the reference validator must not even be consulted, since no deactivation happened.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_OmittedIsActive_KeepsLeaseActive()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        var service = CreateService();

        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
            // IsActive intentionally omitted.
        };

        var updated = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.NotNull(updated);
        Assert.True(updated!.IsActive);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.True(persisted.IsActive);
        _referenceValidator!.Verify(
            x => x.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// "Omitted means unchanged" in the other direction too: editing a lease that was previously
    /// deactivated through PUT must not silently reactivate it either.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_OmittedIsActive_KeepsDeactivatedLeaseInactive()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        lease.IsActive = false; // deactivated via PUT earlier — not soft-deleted (not MarkedForDeletion)
        await _context!.SaveChangesAsync();
        var service = CreateService();

        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Renamed Tenant",
            TenantMobile = "9999999999"
        };

        var updated = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.NotNull(updated);
        var persisted = await _context.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.False(persisted.IsActive);
        Assert.Equal("Renamed Tenant", persisted.TenantName);
    }

    /// <summary>
    /// A soft-deleted (DELETE → MarkedForDeletion) lease must not be editable through PUT — neither
    /// its tenant data rewritten nor IsActive flipped back to true while it stays queued for hard
    /// delete. Returning null gives ExecuteUpdate's normal not-found response.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_SoftDeletedLease_ReturnsNull_RowUnchanged()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, tenantName: "Original Tenant");
        var service = CreateService();
        await service.DeleteAsync(lease.Id, CancellationToken.None);

        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Hijacked Tenant",
            TenantMobile = "9999999999",
            IsActive = true // attempted reactivation
        };

        var result = await service.UpdateAsync(lease.Id, updateDto, CancellationToken.None);

        Assert.Null(result);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.Equal("Original Tenant", persisted.TenantName);
        Assert.False(persisted.IsActive);
        Assert.True(persisted.MarkedForDeletion);
        Assert.Empty(await _context.Set<LeaseRentRegistrationHistoryEntity>().AsNoTracking().ToListAsync());
    }

    /// <summary>
    /// WorkflowStatus is a concurrency token, so a Verify/Approve/Reject that lands between this
    /// PUT's read and write makes SaveChangesAsync throw DbUpdateConcurrencyException.
    /// ExecuteUpdate turns anything but a ValidationException into a 500, so UpdateAsync must
    /// translate it into one (→ 400) and roll back rather than commit.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_SaveChangesThrowsDbUpdateConcurrencyException_ThrowsValidationException_AndRollsBack()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending");

        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        unitOfWork.SetupSequence(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1) // history snapshot insert
            .ThrowsAsync(new DbUpdateConcurrencyException("simulated concurrent workflow transition"));
        unitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var service = CreateService(unitOfWork.Object);

        var updateDto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(lease.Id, updateDto, CancellationToken.None));

        Assert.Equal("LeaseRent_ConcurrentModification", ex.Errors[nameof(AssetLeaseRentDetailsEntity.WorkflowStatus)]);
        unitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region DeleteAsync — Soft Delete Guarded By IReferenceValidationService

    [Fact]
    public async Task DeleteAsync_WhenReferenced_ThrowsValidationException_RowStaysActive()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        _referenceValidator!
            .Setup(x => x.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(lease.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("AssetLeaseRentDetails_Referenced"));

        var service = CreateService();

        await Assert.ThrowsAsync<ValidationException>(() => service.DeleteAsync(lease.Id, CancellationToken.None));

        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == lease.Id);
        Assert.True(persisted.IsActive);
        Assert.False(persisted.MarkedForDeletion);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotReferenced_SoftDeletes_MarksForDeletion_RowStillExists()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10);
        var service = CreateService();

        var result = await service.DeleteAsync(lease.Id, CancellationToken.None);

        Assert.True(result);
        var persisted = await _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == lease.Id);
        Assert.NotNull(persisted); // soft delete: the row is not physically removed
        Assert.False(persisted!.IsActive);
        Assert.True(persisted.MarkedForDeletion); // IHardDeletable — eligible for nightly hard-delete cleanup
    }

    #endregion

    #region CanUserAccessLeaseAsync — Department-Scoped Authorization

    /// <summary>
    /// Regression test for the Copilot finding: a lease whose asset had no DepartmentId used to
    /// fail OPEN — every authenticated account could read its tenant Aadhaar/PAN/address and drive
    /// its workflow. Missing ownership metadata must fail closed for a non-admin caller, even one
    /// with a real allocation in some other department.
    /// </summary>
    [Fact]
    public async Task CanUserAccessLeaseAsync_AssetHasNoDepartment_NonAdmin_ReturnsFalse()
    {
        await SeedAssetAsync(10, departmentId: null);
        var lease = await SeedLeaseAsync(10);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(lease.Id, userId: 1, CancellationToken.None);

        Assert.False(canAccess);
    }

    /// <summary>
    /// The one explicit exception to fail-closed: an active Admin role allocation.
    /// </summary>
    [Fact]
    public async Task CanUserAccessLeaseAsync_AssetHasNoDepartment_Admin_ReturnsTrue()
    {
        await SeedAssetAsync(10, departmentId: null);
        var lease = await SeedLeaseAsync(10);
        await SeedAdminRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(lease.Id, userId: 1, CancellationToken.None);

        Assert.True(canAccess);
    }

    [Fact]
    public async Task CanUserAccessLeaseAsync_UserHasMatchingDepartmentAllocation_ReturnsTrue()
    {
        await SeedAssetAsync(10, departmentId: 5);
        var lease = await SeedLeaseAsync(10);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(lease.Id, userId: 1, CancellationToken.None);

        Assert.True(canAccess);
    }

    [Fact]
    public async Task CanUserAccessLeaseAsync_UserHasNoMatchingDepartmentAllocation_ReturnsFalse()
    {
        await SeedAssetAsync(10, departmentId: 5);
        var lease = await SeedLeaseAsync(10);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 9); // different department

        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(lease.Id, userId: 1, CancellationToken.None);

        Assert.False(canAccess);
    }

    [Fact]
    public async Task CanUserAccessLeaseAsync_UserHasNoRoleAllocationAtAll_ReturnsFalse_WhenAssetHasDepartment()
    {
        await SeedAssetAsync(10, departmentId: 5);
        var lease = await SeedLeaseAsync(10);
        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(lease.Id, userId: 1, CancellationToken.None);

        Assert.False(canAccess);
    }

    [Fact]
    public async Task CanUserAccessLeaseAsync_LeaseDoesNotExist_ReturnsTrue()
    {
        var service = CreateService();

        var canAccess = await service.CanUserAccessLeaseAsync(999, userId: 1, CancellationToken.None);

        Assert.True(canAccess);
    }

    #endregion

    #region CanUserAccessAssetAsync — Department-Scoped Authorization By AssetId Directly

    /// <summary>
    /// Regression coverage for the Copilot finding: Create/Update/SendForVerification can name an
    /// AssetId the caller doesn't already have a lease for (a new lease, or reassigning an existing
    /// one), so authorization needs its own by-AssetId entry point rather than only the
    /// by-lease-id CanUserAccessLeaseAsync. Same fail-closed and department-match rules — an asset
    /// with no department must not let a non-admin create or reassign a lease onto it.
    /// </summary>
    [Fact]
    public async Task CanUserAccessAssetAsync_AssetHasNoDepartment_NonAdmin_ReturnsFalse()
    {
        await SeedAssetAsync(10, departmentId: null);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        Assert.False(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    [Fact]
    public async Task CanUserAccessAssetAsync_AssetHasNoDepartment_Admin_ReturnsTrue()
    {
        await SeedAssetAsync(10, departmentId: null);
        await SeedAdminRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        Assert.True(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    /// <summary>
    /// The Admin exception is global (cross-department), matching how login treats Admin — not
    /// just a fallback for assets with no department.
    /// </summary>
    [Fact]
    public async Task CanUserAccessAssetAsync_AdminAllocatedToDifferentDepartment_ReturnsTrue()
    {
        await SeedAssetAsync(10, departmentId: 5);
        await SeedAdminRoleAllocationAsync(userId: 1, departmentId: 9);
        var service = CreateService();

        Assert.True(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    /// <summary>
    /// The exception is explicit, not incidental: a deactivated Admin allocation grants nothing.
    /// </summary>
    [Fact]
    public async Task CanUserAccessAssetAsync_AssetHasNoDepartment_InactiveAdminAllocation_ReturnsFalse()
    {
        await SeedAssetAsync(10, departmentId: null);
        await SeedAdminRoleAllocationAsync(userId: 1, departmentId: 5, allocationIsActive: false);
        var service = CreateService();

        Assert.False(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    [Fact]
    public async Task CanUserAccessAssetAsync_UserHasMatchingDepartmentAllocation_ReturnsTrue()
    {
        await SeedAssetAsync(10, departmentId: 5);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);
        var service = CreateService();

        Assert.True(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    [Fact]
    public async Task CanUserAccessAssetAsync_UserHasNoMatchingDepartmentAllocation_ReturnsFalse()
    {
        await SeedAssetAsync(10, departmentId: 5);
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 9); // different department
        var service = CreateService();

        Assert.False(await service.CanUserAccessAssetAsync(10, userId: 1, CancellationToken.None));
    }

    [Fact]
    public async Task CanUserAccessAssetAsync_AssetDoesNotExist_ReturnsTrue()
    {
        var service = CreateService();

        Assert.True(await service.CanUserAccessAssetAsync(999, userId: 1, CancellationToken.None));
    }

    #endregion

    #region UploadDocumentAsync — Size Guard

    private async Task<ModuleMasterEntity> SeedModuleAsync(int id = 1)
    {
        var module = new ModuleMasterEntity
        {
            Id = id,
            DepartmentId = 1,
            ModuleCode = "AMS",
            ModuleName = "Asset Management",
            IsActive = true
        };
        _context!.Set<ModuleMasterEntity>().Add(module);
        await _context.SaveChangesAsync();
        return module;
    }

    /// <summary>
    /// Regression test for the Copilot finding: the service-layer guard must reject an upload for
    /// a lease outside the caller's department, independent of (and as defense in depth alongside)
    /// the controller's own CanUserAccessLeaseAsync check — this protects the write path itself for
    /// any other caller of this service.
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_UserCannotAccessLease_ThrowsUnauthorizedAccessException()
    {
        await SeedAssetAsync(10, departmentId: 5);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending");
        var module = await SeedModuleAsync();
        // uploadedBy (userId 1) has no UserRoleAllocation row at all, so it can't access the
        // asset's department 5.

        var fileStorageService = new Mock<IFileStorageService>();
        var documentService = new Mock<IDocumentService>();
        var service = CreateServiceForUpload(documentService.Object, fileStorageService.Object,
            new ConfigurationBuilder().Build());

        using var stream = new MemoryStream(new byte[10]);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 10,
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: null,
            remarks: null, isPrimaryDocument: false, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None));

        fileStorageService.Verify(
            f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never); // never reached permanent storage
    }

    /// <summary>
    /// The service-layer guard fails closed too: a lease whose asset has no department can't be
    /// uploaded to by a non-admin (it used to be open to every authenticated account).
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_AssetHasNoDepartment_NonAdmin_ThrowsUnauthorizedAccessException()
    {
        await SeedAssetAsync(10, departmentId: null);
        var lease = await SeedLeaseAsync(10, workflowStatus: "Pending");
        var module = await SeedModuleAsync();
        await SeedUserRoleAllocationAsync(userId: 1, departmentId: 5);

        var fileStorageService = new Mock<IFileStorageService>();
        var service = CreateServiceForUpload(new Mock<IDocumentService>().Object, fileStorageService.Object,
            new ConfigurationBuilder().Build());

        using var stream = new MemoryStream(new byte[10]);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 10,
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: null,
            remarks: null, isPrimaryDocument: false, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None));

        fileStorageService.Verify(
            f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// Regression test: the size guard must be enforced against bytes actually streamed off the
    /// request, not the caller-supplied fileSizeBytes — a caller under-reporting the size (a
    /// spoofed or simply wrong Content-Length) must not be able to push a stream past
    /// FileStorage:MaxFileSizeBytes onto disk.
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_ActualStreamExceedsMaxSize_ThrowsArgumentException_RegardlessOfReportedSize()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        var documentService = new Mock<IDocumentService>();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["FileStorage:MaxFileSizeBytes"] = "10" })
            .Build();
        var service = CreateServiceForUpload(documentService.Object, fileStorageService.Object, configuration);

        // Caller claims 5 bytes (passes the upfront Guard check against the 10-byte limit) but the
        // real stream is 50 bytes.
        using var stream = new MemoryStream(new byte[50]);

        await Assert.ThrowsAsync<ArgumentException>(() => service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 5,
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: null,
            remarks: null, isPrimaryDocument: false, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None));

        fileStorageService.Verify(
            f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never); // never reached permanent storage
        documentService.Verify(d => d.CreateDocumentAsync(
            It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
            It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never); // never reached CORE.Document either
    }

    /// <summary>
    /// When the real stream IS within the limit, the persisted/returned size must reflect the
    /// actual bytes read, not whatever (possibly wrong) value the caller reported.
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_ActualSizeWithinLimit_PersistsActualByteCount_NotCallerReportedSize()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        long? capturedSize = null;
        var documentService = new Mock<IDocumentService>();
        documentService
            .Setup(d => d.CreateDocumentAsync(
                It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<int, int?, string, string, string, string, long, string, string?, string?, string?, CancellationToken>(
                (_, _, _, _, _, _, size, _, _, _, _, _) => capturedSize = size)
            .ReturnsAsync((1, Guid.NewGuid()));
        documentService
            .Setup(d => d.CreateDocumentBindingAsync(
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(),
                It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<bool>(),
                It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["FileStorage:MaxFileSizeBytes"] = "1000" })
            .Build();
        var service = CreateServiceForUpload(documentService.Object, fileStorageService.Object, configuration);

        using var stream = new MemoryStream(new byte[50]);

        var result = await service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 999, // caller over-reports
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: null,
            remarks: null, isPrimaryDocument: false, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None);

        Assert.Equal(50, result.FileSizeBytes);
        Assert.Equal(50, capturedSize);
    }

    /// <summary>
    /// Regression test: the supplied documentTitle must actually be persisted (onto CORE.Document)
    /// and returned by the document list — it was being computed (finalDocumentTitle) but never
    /// written anywhere, so callers silently lost the title they supplied.
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_PersistsSuppliedDocumentTitle()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        using var stream = new MemoryStream(new byte[10]);
        await service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 10,
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: "Signed Lease Agreement",
            remarks: null, isPrimaryDocument: true, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None);

        var documents = await service.GetDocumentsByAssetLeaseRentDetailsIdAsync(lease.Id, CancellationToken.None);

        Assert.Single(documents);
        Assert.Equal("Signed Lease Agreement", documents[0].DocumentTitle);
    }

    /// <summary>
    /// Regression test: the supplied remarks must actually be persisted (onto
    /// CORE.DocumentBinding.Notes, since IDocumentService.CreateDocumentBindingAsync has no
    /// remarks/notes parameter of its own) and returned by the document list.
    /// </summary>
    [Fact]
    public async Task UploadDocumentAsync_PersistsSuppliedRemarks()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        using var stream = new MemoryStream(new byte[10]);
        await service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 10,
            assetLeaseRentDetailsId: lease.Id, moduleId: module.Id,
            documentType: null, documentTitle: null,
            remarks: "Notarized copy on file", isPrimaryDocument: true, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None);

        var documents = await service.GetDocumentsByAssetLeaseRentDetailsIdAsync(lease.Id, CancellationToken.None);

        Assert.Single(documents);
        Assert.Equal("Notarized copy on file", documents[0].Remarks);
    }

    #endregion

    #region GetDocumentFileAsync — Bound-To-Lease Authorization + Download Count

    private async Task<(Guid DocumentGuid, int LeaseId)> UploadTestDocumentAsync(
        int leaseId, int moduleId, Mock<IFileStorageService> fileStorageService)
    {
        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        using var stream = new MemoryStream(new byte[10]);
        var uploadResult = await service.UploadDocumentAsync(
            stream, "test.pdf", "application/pdf", fileSizeBytes: 10,
            assetLeaseRentDetailsId: leaseId, moduleId: moduleId,
            documentType: null, documentTitle: null,
            remarks: null, isPrimaryDocument: true, bindingPurpose: null, uploadedBy: 1,
            cancellationToken: CancellationToken.None);

        return (uploadResult.DocumentGuid, leaseId);
    }

    /// <summary>
    /// IDOR regression test: a document uploaded for lease A must not be downloadable by claiming
    /// a different lease id B in the route, even by an authenticated caller who has the correct
    /// GUID — GetDocumentFileAsync must verify the document is actually bound to the lease id the
    /// caller supplied.
    /// </summary>
    [Fact]
    public async Task GetDocumentFileAsync_DocumentBoundToDifferentLease_ReturnsNullStream()
    {
        var leaseA = await SeedLeaseAccessibleToUploaderAsync();
        var leaseB = await SeedLeaseAsync(10, workflowStatus: "Pending");
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        var (documentGuid, _) = await UploadTestDocumentAsync(leaseA.Id, module.Id, fileStorageService);

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        var (fileStream, _, _) = await service.GetDocumentFileAsync(leaseB.Id, documentGuid, userId: 1, CancellationToken.None);

        Assert.Null(fileStream);
    }

    /// <summary>
    /// Happy path complementing the IDOR test above: downloading with the CORRECT lease id
    /// succeeds and increments the document's download count.
    /// </summary>
    [Fact]
    public async Task GetDocumentFileAsync_DocumentBoundToRequestedLease_ReturnsStream_AndIncrementsDownloadCount()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");
        fileStorageService
            .Setup(f => f.ReadFileAsync("uploads/test.pdf", It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new MemoryStream(new byte[10]));

        var (documentGuid, _) = await UploadTestDocumentAsync(lease.Id, module.Id, fileStorageService);

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        var (fileStream, fileName, _) = await service.GetDocumentFileAsync(lease.Id, documentGuid, userId: 1, CancellationToken.None);

        Assert.NotNull(fileStream);
        Assert.Equal("test.pdf", fileName);

        var document = await _context!.Set<DocumentEntity>().AsNoTracking().SingleAsync(d => d.DocumentGuid == documentGuid);
        Assert.Equal(1, document.DownloadCount);
    }

    /// <summary>
    /// Defense-in-depth regression test: a binding whose MarkedForDeletion flag is set (even if
    /// IsActive was, inconsistently, left true — MarkForDeletion() always sets both together, but
    /// the query must not assume that invariant always holds) must not be downloadable.
    /// </summary>
    [Fact]
    public async Task GetDocumentFileAsync_BindingMarkedForDeletion_ReturnsNullStream_EvenIfBindingIsActiveIsStillTrue()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        var (documentGuid, _) = await UploadTestDocumentAsync(lease.Id, module.Id, fileStorageService);

        var binding = await _context!.Set<DocumentBindingEntity>()
            .SingleAsync(b => b.ReferenceTableName == "AssetLeaseRentDetails" && b.ReferenceTableId == lease.Id);
        binding.MarkedForDeletion = true; // set directly, deliberately not via MarkForDeletion(),
                                           // to prove the query doesn't rely on IsActive alone
        await _context.SaveChangesAsync();

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        var (fileStream, _, _) = await service.GetDocumentFileAsync(lease.Id, documentGuid, userId: 1, CancellationToken.None);

        Assert.Null(fileStream);
    }

    /// <summary>
    /// Same guard on the list side: GetDocumentsByAssetLeaseRentDetailsIdAsync must not return a
    /// document whose binding is marked for deletion.
    /// </summary>
    [Fact]
    public async Task GetDocumentsByAssetLeaseRentDetailsIdAsync_ExcludesBindingsMarkedForDeletion()
    {
        var lease = await SeedLeaseAccessibleToUploaderAsync();
        var module = await SeedModuleAsync();

        var fileStorageService = new Mock<IFileStorageService>();
        fileStorageService
            .Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("uploads/test.pdf");

        await UploadTestDocumentAsync(lease.Id, module.Id, fileStorageService);

        var binding = await _context!.Set<DocumentBindingEntity>()
            .SingleAsync(b => b.ReferenceTableName == "AssetLeaseRentDetails" && b.ReferenceTableId == lease.Id);
        binding.MarkedForDeletion = true;
        await _context.SaveChangesAsync();

        var service = CreateServiceForUpload(CreateRealDocumentService(), fileStorageService.Object,
            new ConfigurationBuilder().Build());

        var documents = await service.GetDocumentsByAssetLeaseRentDetailsIdAsync(lease.Id, CancellationToken.None);

        Assert.Empty(documents);
    }

    #endregion
}
