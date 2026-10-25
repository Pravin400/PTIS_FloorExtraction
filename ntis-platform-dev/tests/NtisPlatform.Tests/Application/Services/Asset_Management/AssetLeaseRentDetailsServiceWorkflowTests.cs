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
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Asset_Management;

/// <summary>
/// Tests for <see cref="AssetLeaseRentDetailsService"/>'s workflow surface (CreateAsync's asset
/// validation, every SendToVerification/Verify/Approve/Reject/Revert* transition, and
/// UpdateAndSendToVerificationAsync), plus GetPreviousTenantHistoryAsync.
///
/// Runs against a real EF Core InMemory <see cref="ApplicationDbContext"/> rather than Moq: every
/// workflow transition loads a tracked entity, checks/mutates it, and saves via the normal
/// repository + SaveChangesAsync path, but WorkflowStatus is configured as an EF Core concurrency
/// token (see ApplicationDbContext.OnModelCreating), so SaveChangesAsync throws
/// DbUpdateConcurrencyException if another request already changed the status between this
/// request's read and write — genuinely exercising that needs a real EF Core change tracker and
/// concurrency-token comparison, which a MockQueryable-backed <see cref="IQueryable{T}"/> can't
/// provide.
/// See also <see cref="AssetLeaseRentDetailsServiceIntegrationTests"/> for the hand-rolled
/// LINQ/ProjectTo query paths (GetAllAsync/GetByIdAsync).
/// </summary>
[Trait("Category", "Integration")]
public class AssetLeaseRentDetailsServiceWorkflowTests : IAsyncLifetime
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
    private Repository<AssetPhotoEntity, int>? _assetPhotoRepository;
    private UnitOfWork? _unitOfWork;
    private IMapper? _mapper;
    private string _databaseName = string.Empty;

    public async Task InitializeAsync()
    {
        _databaseName = $"AssetLeaseRentDetailsServiceWorkflowTests_{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: _databaseName)
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
        _assetPhotoRepository = new Repository<AssetPhotoEntity, int>(_context);
        _unitOfWork = new UnitOfWork(_context);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<AssetLeaseRentDetailsMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

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

    /// <param name="referenceValidator">Optional reference validator; defaults to an unconfigured mock.</param>
    /// <param name="unitOfWork">
    /// Optional stand-in for the real UnitOfWork — lets a test force SaveChangesAsync to throw
    /// (e.g. DbUpdateConcurrencyException) while every repository still reads the real InMemory data.
    /// </param>
    private AssetLeaseRentDetailsService CreateService(
        Mock<IReferenceValidationService>? referenceValidator = null, IUnitOfWork? unitOfWork = null) => new(
        _repository!, unitOfWork ?? _unitOfWork!, _mapper!,
        _assetRepository!, _roomWiseRepository!, _historyRepository!, _moduleRepository!,
        _documentRepository!, _documentBindingRepository!, _inventoryAssetDetailRepository!, _userRoleAllocationRepository!,
        new UserAccessRepository(_context!),
        (referenceValidator ?? new Mock<IReferenceValidationService>()).Object,
        new Mock<IDocumentService>().Object,
        new Mock<IFileStorageService>().Object,
        _assetPhotoRepository!,
        new ConfigurationBuilder().Build(),
        new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);

    private async Task<AssetMasterEntity> SeedAssetAsync(int id = 10, bool isActive = true, int? parentAssetId = null)
    {
        var asset = new AssetMasterEntity
        {
            Id = id,
            AssetNo = $"A-{id}",
            AssetName = $"Asset {id}",
            AssetCategoryId = 1,
            AssetTypeId = 1,
            ParentAssetId = parentAssetId,
            IsActive = isActive,
            CreatedDate = DateTime.UtcNow
        };
        _context!.Set<AssetMasterEntity>().Add(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    private async Task<AssetLeaseRentDetailsEntity> SeedLeaseAsync(
        int assetId, string workflowStatus = "Pending", Action<AssetLeaseRentDetailsEntity>? configure = null)
    {
        var lease = new AssetLeaseRentDetailsEntity
        {
            AssetId = assetId,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            LeaseStartDate = DateTime.UtcNow,
            SecurityDeposit = 0m,
            WorkflowStatus = workflowStatus,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        configure?.Invoke(lease);
        _context!.Set<AssetLeaseRentDetailsEntity>().Add(lease);
        await _context.SaveChangesAsync();
        return lease;
    }

    private Task<AssetLeaseRentDetailsEntity> GetPersistedAsync(int id) =>
        _context!.Set<AssetLeaseRentDetailsEntity>().AsNoTracking().SingleAsync(x => x.Id == id);

    /// <summary>
    /// Builds a second, fully independent ApplicationDbContext/repository/service stack pointed at
    /// the SAME InMemory database, so a test can simulate two concurrent requests each holding
    /// their own change tracker — the only way to genuinely exercise the WorkflowStatus concurrency
    /// token (a single sequential call against the shared _context can't reproduce the race, since
    /// by the time it re-reads, the first call's write is already visible).
    /// </summary>
    private (AssetLeaseRentDetailsService Service, ApplicationDbContext Context) CreateSecondaryService()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: _databaseName)
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;
        var context = new ApplicationDbContext(options);
        var service = new AssetLeaseRentDetailsService(
            new Repository<AssetLeaseRentDetailsEntity, int>(context),
            new UnitOfWork(context),
            _mapper!,
            new Repository<AssetMasterEntity, int>(context),
            new Repository<AssetRoomWiseSubmissionDetailsEntity, int>(context),
            new Repository<LeaseRentRegistrationHistoryEntity, int>(context),
            new Repository<ModuleMasterEntity, int>(context),
            new Repository<DocumentEntity, int>(context),
            new Repository<DocumentBindingEntity, int>(context),
            new Repository<InventoryAssetDetailEntity, int>(context),
            new Repository<UserRoleAllocationEntity, int>(context),
            new UserAccessRepository(context),
            new Mock<IReferenceValidationService>().Object,
            new Mock<IDocumentService>().Object,
            new Mock<IFileStorageService>().Object,
            new Repository<AssetPhotoEntity, int>(context),
            new ConfigurationBuilder().Build(),
            new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);
        return (service, context);
    }

    #region CreateAsync — Asset Existence Validation

    [Fact]
    public async Task CreateAsync_ActiveAssetExists_ForcesWorkflowStatusPending_AndPersists()
    {
        await SeedAssetAsync(10);
        var service = CreateService();

        var dto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            WorkflowStatus = "SomethingElse" // must be overridden by the service, not honored from the request
        };

        var result = await service.CreateAsync(dto, CancellationToken.None);

        Assert.Equal("Pending", result.WorkflowStatus);
        Assert.Equal(1, await _context!.Set<AssetLeaseRentDetailsEntity>().CountAsync());
    }

    [Fact]
    public async Task CreateAsync_AssetDoesNotExist_ThrowsValidationException_NoRowPersisted()
    {
        var service = CreateService();
        var dto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 999,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto, CancellationToken.None));

        Assert.Equal(0, await _context!.Set<AssetLeaseRentDetailsEntity>().CountAsync());
    }

    [Fact]
    public async Task CreateAsync_AssetIsInactive_ThrowsValidationException()
    {
        await SeedAssetAsync(10, isActive: false);
        var service = CreateService();

        var dto = new CreateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto, CancellationToken.None));
    }

    #endregion

    #region SendToVerificationAsync

    [Fact]
    public async Task SendToVerificationAsync_FromPending_StaysPending_StampsRemarksAndUpdatedBy()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending");
        var service = CreateService();

        var result = await service.SendToVerificationAsync(lease.Id, "please review", 99, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Pending", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal("please review", persisted.Reason);
        Assert.Equal(99, persisted.UpdatedBy);
    }

    [Fact]
    public async Task SendToVerificationAsync_NotFound_ReturnsNull()
    {
        var service = CreateService();

        Assert.Null(await service.SendToVerificationAsync(999, null, 1, CancellationToken.None));
    }

    #endregion

    #region VerifyAsync

    [Fact]
    public async Task VerifyAsync_FromPending_SetsVerifiedFields_AndTransitionsToVerified()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending");
        var service = CreateService();

        var result = await service.VerifyAsync(lease.Id, "looks good", 55, CancellationToken.None);

        Assert.Equal("Verified", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.True(persisted.IsVerified);
        Assert.Equal(55, persisted.VerifiedBy);
        Assert.NotNull(persisted.VerifiedDate);
    }

    [Theory]
    [InlineData("Verified")]
    [InlineData("Approved")]
    [InlineData("Rejected")]
    public async Task VerifyAsync_FromNonPendingStatus_ThrowsInvalidOperationException(string currentStatus)
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, currentStatus);
        var service = CreateService();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.VerifyAsync(lease.Id, null, 1, CancellationToken.None));
        Assert.Contains("LeaseRent_InvalidTransition", ex.Message);
    }

    #endregion

    #region ApproveAsync

    [Fact]
    public async Task ApproveAsync_FromVerified_SetsApprovedFields()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Verified");
        var service = CreateService();

        var result = await service.ApproveAsync(lease.Id, "ok", 7, CancellationToken.None);

        Assert.Equal("Approved", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.True(persisted.IsApproved);
        Assert.Equal(7, persisted.ApprovedBy);
        Assert.NotNull(persisted.ApprovedDate);
        // Regression test for the Copilot finding: approval remarks were accepted by the API but
        // never persisted anywhere.
        Assert.Equal("ok", persisted.Reason);
    }

    /// <summary>
    /// Regression test: workflow-transition responses (Approve/Reject/Verify/Revert*/
    /// UpdateAndSendToVerification) go through GetEnrichedAsync, which used to only enrich unit
    /// area — ParentAssetName and AssetPhotoGuid (populated by the read endpoint, GetByIdAsync) were
    /// silently missing from every transition response even though the DTO contract exposes them.
    /// </summary>
    [Fact]
    public async Task ApproveAsync_ReturnedDto_IncludesParentAssetName()
    {
        await SeedAssetAsync(1, isActive: true); // parent building
        await SeedAssetAsync(10, parentAssetId: 1); // sub-unit/shop
        var lease = await SeedLeaseAsync(10, "Verified");
        var service = CreateService();

        var result = await service.ApproveAsync(lease.Id, "ok", 7, CancellationToken.None);

        Assert.Equal("Asset 1", result!.ParentAssetName);
    }

    [Fact]
    public async Task ApproveAsync_FromPending_ThrowsInvalidOperationException()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending");
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ApproveAsync(lease.Id, null, 1, CancellationToken.None));
    }

    [Fact]
    public async Task ApproveAsync_NotFound_ReturnsNull()
    {
        var service = CreateService();

        Assert.Null(await service.ApproveAsync(999, null, 1, CancellationToken.None));
    }

    /// <summary>
    /// Genuine optimistic-concurrency regression test for the race Copilot flagged: two independent
    /// DbContexts (simulating two concurrent HTTP requests) BOTH load and track the same Verified
    /// row before either writes. The first request's write commits normally; because WorkflowStatus
    /// is configured as an EF Core concurrency token, the second request's SaveChangesAsync — still
    /// holding its now-stale original-value snapshot — must then throw
    /// DbUpdateConcurrencyException, proving the DB-level protection actually engages instead of
    /// silently letting the second write clobber the first (which is what the un-guarded
    /// read-then-write in the original code allowed).
    /// </summary>
    [Fact]
    public async Task WorkflowStatus_ConcurrencyToken_ThrowsDbUpdateConcurrencyException_WhenTwoContextsRaceToUpdate()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Verified");

        var (_, secondaryContext) = CreateSecondaryService();
        try
        {
            // Both contexts load (and track) the row while it's still Verified.
            var primaryEntity = await _context!.Set<AssetLeaseRentDetailsEntity>().SingleAsync(x => x.Id == lease.Id);
            var secondaryEntity = await secondaryContext.Set<AssetLeaseRentDetailsEntity>().SingleAsync(x => x.Id == lease.Id);

            primaryEntity.WorkflowStatus = "Approved";
            await _context.SaveChangesAsync(); // first "request" commits

            secondaryEntity.WorkflowStatus = "Approved"; // second "request", still holding the stale snapshot
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => secondaryContext.SaveChangesAsync());
        }
        finally
        {
            await secondaryContext.DisposeAsync();
        }
    }

    /// <summary>
    /// Complements the concurrency-token proof above: verifies AssetLeaseRentDetailsService itself
    /// translates a DbUpdateConcurrencyException raised by SaveChangesAsync into the same
    /// InvalidOperationException("LeaseRent_InvalidTransition:...") other invalid transitions
    /// throw, and rolls back rather than committing a partial state.
    /// </summary>
    [Fact]
    public async Task ApproveAsync_SaveChangesThrowsDbUpdateConcurrencyException_TranslatesToInvalidOperationException_AndRollsBack()
    {
        var repository = new Mock<IRepository<AssetLeaseRentDetailsEntity, int>>();
        var unitOfWork = new Mock<IUnitOfWork>();
        var entity = new AssetLeaseRentDetailsEntity
        {
            Id = 1,
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            WorkflowStatus = "Verified",
            LeaseStartDate = DateTime.UtcNow,
            SecurityDeposit = 0m,
            IsActive = true
        };
        repository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        unitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException("simulated concurrent update"));
        unitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<AssetLeaseRentDetailsMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);

        var service = new AssetLeaseRentDetailsService(
            repository.Object, unitOfWork.Object, mapperConfig.CreateMapper(),
            new Mock<IRepository<AssetMasterEntity, int>>().Object,
            new Mock<IRepository<AssetRoomWiseSubmissionDetailsEntity, int>>().Object,
            new Mock<IRepository<LeaseRentRegistrationHistoryEntity, int>>().Object,
            new Mock<IRepository<ModuleMasterEntity, int>>().Object,
            new Mock<IRepository<DocumentEntity, int>>().Object,
            new Mock<IRepository<DocumentBindingEntity, int>>().Object,
            new Mock<IRepository<InventoryAssetDetailEntity, int>>().Object,
            new Mock<IRepository<UserRoleAllocationEntity, int>>().Object,
            new Mock<IUserAccessRepository>().Object,
            new Mock<IReferenceValidationService>().Object,
            new Mock<IDocumentService>().Object,
            new Mock<IFileStorageService>().Object,
            new Mock<IRepository<AssetPhotoEntity, int>>().Object,
            new ConfigurationBuilder().Build(),
            new Mock<ILogger<AssetLeaseRentDetailsService>>().Object);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ApproveAsync(1, "ok", 7, CancellationToken.None));
        Assert.Contains("LeaseRent_InvalidTransition", ex.Message);

        unitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region RejectAsync

    [Theory]
    [InlineData("Pending")]
    [InlineData("Verified")]
    public async Task RejectAsync_FromPendingOrVerified_SetsRejectedFields(string currentStatus)
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, currentStatus);
        var service = CreateService();

        var result = await service.RejectAsync(lease.Id, "Non-payment of dues", 3, CancellationToken.None);

        Assert.Equal("Rejected", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.True(persisted.IsRejection);
        Assert.Equal("Non-payment of dues", persisted.RejectionReason);
        Assert.Equal(3, persisted.RejectionBy);
        Assert.NotNull(persisted.RejectionDate);
    }

    [Fact]
    public async Task RejectAsync_FromApproved_ThrowsInvalidOperationException()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Approved");
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RejectAsync(lease.Id, "reason", 1, CancellationToken.None));
    }

    #endregion

    #region RevertToRegistrationAsync

    [Fact]
    public async Task RevertToRegistrationAsync_FromVerified_ClearsVerifiedFields_TransitionsToPending()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Verified", e =>
        {
            e.IsVerified = true;
            e.VerifiedBy = 5;
            e.VerifiedDate = DateTime.UtcNow;
        });
        var service = CreateService();

        var result = await service.RevertToRegistrationAsync(lease.Id, "reverting", 9, CancellationToken.None);

        Assert.Equal("Pending", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.False(persisted.IsVerified);
        Assert.Null(persisted.VerifiedBy);
        Assert.Null(persisted.VerifiedDate);
    }

    /// <summary>
    /// Pins down existing (likely unintended) behavior: reverting a record that is ALREADY
    /// Pending is accepted and moves it to "Reverted" while clearing IsVerified/VerifiedBy/
    /// VerifiedDate — the same clearing the Verified-&gt;Pending branch does, even though a
    /// Pending record was never verified in the first place.
    /// </summary>
    [Fact]
    public async Task RevertToRegistrationAsync_FromPending_TransitionsToReverted_AndAlsoClearsVerifiedFields()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending");
        var service = CreateService();

        var result = await service.RevertToRegistrationAsync(lease.Id, null, 9, CancellationToken.None);

        Assert.Equal("Reverted", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.False(persisted.IsVerified);
        Assert.Null(persisted.VerifiedBy);
        Assert.Null(persisted.VerifiedDate);
    }

    [Fact]
    public async Task RevertToRegistrationAsync_FromApproved_ThrowsInvalidOperationException()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Approved");
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RevertToRegistrationAsync(lease.Id, null, 1, CancellationToken.None));
    }

    [Fact]
    public async Task RevertToRegistrationAsync_NotFound_ReturnsNull()
    {
        var service = CreateService();

        Assert.Null(await service.RevertToRegistrationAsync(999, null, 1, CancellationToken.None));
    }

    #endregion

    #region RevertToVerificationAsync

    [Fact]
    public async Task RevertToVerificationAsync_FromApproved_ClearsApprovedFields_TransitionsToVerified()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Approved", e =>
        {
            e.IsApproved = true;
            e.ApprovedBy = 4;
            e.ApprovedDate = DateTime.UtcNow;
        });
        var service = CreateService();

        var result = await service.RevertToVerificationAsync(lease.Id, null, 1, CancellationToken.None);

        Assert.Equal("Verified", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.False(persisted.IsApproved);
        Assert.Null(persisted.ApprovedBy);
        Assert.Null(persisted.ApprovedDate);
    }

    [Fact]
    public async Task RevertToVerificationAsync_FromNonApproved_ThrowsInvalidOperationException()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Verified");
        var service = CreateService();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RevertToVerificationAsync(lease.Id, null, 1, CancellationToken.None));
    }

    #endregion

    #region Soft-Deleted / Inactive Leases Are Not Actionable

    private static Task<AssetLeaseRentDetailsDto?> RunTransitionAsync(
        AssetLeaseRentDetailsService service, string transition, int id) => transition switch
    {
        "SendToVerification" => service.SendToVerificationAsync(id, "remarks", 1, CancellationToken.None),
        "Verify" => service.VerifyAsync(id, "remarks", 1, CancellationToken.None),
        "Approve" => service.ApproveAsync(id, "remarks", 1, CancellationToken.None),
        "Reject" => service.RejectAsync(id, "reason", 1, CancellationToken.None),
        "RevertToRegistration" => service.RevertToRegistrationAsync(id, "remarks", 1, CancellationToken.None),
        "RevertToVerification" => service.RevertToVerificationAsync(id, "remarks", 1, CancellationToken.None),
        _ => throw new ArgumentOutOfRangeException(nameof(transition), transition, null)
    };

    /// <summary>
    /// Regression test for the Copilot finding: every transition loaded the row with
    /// GetByIdAsync (FindAsync), which doesn't exclude soft-deleted rows — a DELETEd lease could
    /// still be verified/approved/rejected/reverted and its tenant data returned in the response.
    /// Each transition must treat it as not found (null → the controller's 404) and leave the row
    /// untouched. Each case seeds the one status that transition would otherwise accept, so a
    /// null here can only come from the soft-delete guard, not an invalid-transition check.
    /// </summary>
    [Theory]
    [InlineData("SendToVerification", "Pending")]
    [InlineData("Verify", "Pending")]
    [InlineData("Approve", "Verified")]
    [InlineData("Reject", "Pending")]
    [InlineData("RevertToRegistration", "Verified")]
    [InlineData("RevertToVerification", "Approved")]
    public async Task Transition_OnSoftDeletedLease_ReturnsNull_AndLeavesRowUnchanged(string transition, string currentStatus)
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, currentStatus, e =>
        {
            // What DELETE (BaseCommonCrudService.DeleteAsync on an IHardDeletable) leaves behind.
            e.IsActive = false;
            e.MarkedForDeletion = true;
        });
        var service = CreateService();

        var result = await RunTransitionAsync(service, transition, lease.Id);

        Assert.Null(result);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal(currentStatus, persisted.WorkflowStatus);
        Assert.Null(persisted.UpdatedBy);
        Assert.Null(persisted.Reason);
    }

    /// <summary>
    /// Same rule for a lease that was only deactivated (IsActive=false via PUT, not marked for
    /// deletion): GetByIdAsync already hides it, so the workflow endpoints must too.
    /// </summary>
    [Fact]
    public async Task ApproveAsync_OnDeactivatedLease_ReturnsNull_AndLeavesRowUnchanged()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Verified", e => e.IsActive = false);
        var service = CreateService();

        Assert.Null(await service.ApproveAsync(lease.Id, "ok", 7, CancellationToken.None));

        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal("Verified", persisted.WorkflowStatus);
        Assert.False(persisted.IsApproved);
    }

    #endregion

    #region UpdateAndSendToVerificationAsync

    [Fact]
    public async Task UpdateAndSendToVerificationAsync_NotFound_ReturnsNull()
    {
        var service = CreateService();
        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme",
            TenantMobile = "9999999999"
        };

        Assert.Null(await service.UpdateAndSendToVerificationAsync(999, dto, 1, CancellationToken.None));
    }

    /// <summary>
    /// Pins down existing behavior: this method always forces WorkflowStatus back to "Pending",
    /// even when the record is currently Approved/Rejected — there is no state-machine guard here
    /// (unlike Verify/Approve/Reject/Revert*). Also verifies the fix for the contradictory-state
    /// bug this used to have: restarting the workflow must clear the PRIOR state's markers
    /// (IsApproved/ApprovedBy/ApprovedDate here), not just flip WorkflowStatus while leaving
    /// IsApproved=true on a now-"Pending" row.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_ForcesWorkflowStatusPending_EvenWhenCurrentlyApproved()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Approved", e =>
        {
            e.IsApproved = true;
            e.ApprovedBy = 4;
            e.ApprovedDate = DateTime.UtcNow;
        });
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "New Tenant",
            TenantMobile = "8888888888",
            IsActive = true
        };

        var result = await service.UpdateAndSendToVerificationAsync(lease.Id, dto, 12, CancellationToken.None);

        Assert.Equal("Pending", result!.WorkflowStatus);
        Assert.Equal("New Tenant", result.TenantName);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal(12, persisted.UpdatedBy);
        Assert.False(persisted.IsApproved);
        Assert.Null(persisted.ApprovedBy);
        Assert.Null(persisted.ApprovedDate);
    }

    /// <summary>
    /// Regression test for the Copilot finding: this update path must write the same prior-value
    /// history snapshot UpdateAsync writes, otherwise edits saved through send-for-verification
    /// never show up in GetPreviousTenantHistoryAsync.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_WritesHistorySnapshotOfPriorValues_BeforeApplyingNewValues()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending", e => e.TenantName = "Old Tenant");
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "New Tenant",
            TenantMobile = "8888888888",
            IsActive = true
        };

        var result = await service.UpdateAndSendToVerificationAsync(lease.Id, dto, 12, CancellationToken.None);

        Assert.Equal("New Tenant", result!.TenantName);

        var history = await _context!.Set<LeaseRentRegistrationHistoryEntity>().AsNoTracking()
            .SingleAsync(h => h.LeaseRentRegistrationId == lease.Id);
        Assert.Equal("Old Tenant", history.Snap_TenantName);
        Assert.Equal("Pending", history.Snap_WorkflowStatus);
        Assert.Equal(12, history.PerformedBy);
    }

    /// <summary>
    /// Regression test for the Copilot finding: this DTO can carry a different AssetId than the
    /// lease currently has, reassigning it. The controller authorizes the caller against that
    /// target asset's department, but the target must still be validated as a real, active asset —
    /// otherwise an inactive/nonexistent AssetId either silently succeeds or hits the DB FK
    /// constraint as a 500. The row must stay on its original asset when this is rejected.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_ReassignsToInactiveAsset_ThrowsValidationException_RowStaysOnOriginalAsset()
    {
        await SeedAssetAsync(10);
        await SeedAssetAsync(20, isActive: false);
        var lease = await SeedLeaseAsync(10, "Pending");
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 20, // inactive — must be rejected
            TenantName = "New Tenant",
            TenantMobile = "8888888888",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(
            () => service.UpdateAndSendToVerificationAsync(lease.Id, dto, 12, CancellationToken.None));

        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal(10, persisted.AssetId);
    }

    /// <summary>
    /// Same flag-clearing guarantee starting from Rejected — IsRejection/RejectionBy/
    /// RejectionReason must not survive the restart either.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_FromRejected_ClearsRejectionMarkers()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Rejected", e =>
        {
            e.IsRejection = true;
            e.RejectionBy = 6;
            e.RejectionDate = DateTime.UtcNow;
            e.RejectionReason = "Non-payment";
        });
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = true
        };

        var result = await service.UpdateAndSendToVerificationAsync(lease.Id, dto, 1, CancellationToken.None);

        Assert.Equal("Pending", result!.WorkflowStatus);
        var persisted = await GetPersistedAsync(lease.Id);
        Assert.False(persisted.IsRejection);
        Assert.Null(persisted.RejectionBy);
        Assert.Null(persisted.RejectionDate);
        Assert.Null(persisted.RejectionReason);
    }

    /// <summary>
    /// Regression test: this update path must run the same deactivation guard PUT and DeleteAsync
    /// use — setting IsActive true-&gt;false through send-for-verification must be blocked when
    /// the record is referenced, not silently persisted.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_DeactivationBlockedByReferenceValidator_ThrowsValidationException()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Pending");
        var referenceValidator = new Mock<IReferenceValidationService>();
        referenceValidator
            .Setup(x => x.ValidateReferencesAsync<AssetLeaseRentDetailsEntity>(lease.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("AssetLeaseRentDetails_Referenced"));
        var service = CreateService(referenceValidator);

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999",
            IsActive = false
        };

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAndSendToVerificationAsync(lease.Id, dto, 1, CancellationToken.None));

        var persisted = await GetPersistedAsync(lease.Id);
        Assert.True(persisted.IsActive); // not deactivated
    }

    /// <summary>
    /// Regression test for the Copilot finding: an omitted IsActive used to bind as false and
    /// silently deactivate the lease on send-for-verification, exactly as on the plain PUT.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_OmittedIsActive_KeepsLeaseActive()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Rejected");
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
            // IsActive intentionally omitted.
        };

        var result = await service.UpdateAndSendToVerificationAsync(lease.Id, dto, 1, CancellationToken.None);

        Assert.True(result!.IsActive);
        Assert.True((await GetPersistedAsync(lease.Id)).IsActive);
    }

    /// <summary>
    /// Same soft-delete guard as the other transitions: a DELETEd lease can't be edited and
    /// restarted into the workflow — null (→ 404), no field changes, no history row.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_SoftDeletedLease_ReturnsNull_AndLeavesRowUnchanged()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Rejected", e =>
        {
            e.IsActive = false;
            e.MarkedForDeletion = true;
        });
        var service = CreateService();

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Hijacked Tenant",
            TenantMobile = "9999999999",
            IsActive = true
        };

        Assert.Null(await service.UpdateAndSendToVerificationAsync(lease.Id, dto, 1, CancellationToken.None));

        var persisted = await GetPersistedAsync(lease.Id);
        Assert.Equal("Rejected", persisted.WorkflowStatus);
        Assert.Equal("Acme Traders", persisted.TenantName);
        Assert.False(persisted.IsActive);
        Assert.Empty(await _context!.Set<LeaseRentRegistrationHistoryEntity>().AsNoTracking().ToListAsync());
    }

    /// <summary>
    /// Regression test for the Copilot finding: this path only had a generic catch, so a
    /// concurrent transition's DbUpdateConcurrencyException reached the global middleware as a
    /// 500. It must now translate to the same InvalidOperationException("LeaseRent_InvalidTransition:
    /// ...") SaveTransitionAsync throws (→ 400), and roll back rather than commit.
    /// </summary>
    [Fact]
    public async Task UpdateAndSendToVerificationAsync_SaveChangesThrowsDbUpdateConcurrencyException_TranslatesToInvalidOperationException_AndRollsBack()
    {
        await SeedAssetAsync(10);
        var lease = await SeedLeaseAsync(10, "Rejected");

        var unitOfWork = new Mock<IUnitOfWork>();
        unitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        unitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException("simulated concurrent workflow transition"));
        unitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var service = CreateService(unitOfWork: unitOfWork.Object);

        var dto = new UpdateAssetLeaseRentDetailsDto
        {
            AssetId = 10,
            TenantName = "Acme Traders",
            TenantMobile = "9999999999"
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateAndSendToVerificationAsync(lease.Id, dto, 1, CancellationToken.None));
        Assert.Equal("LeaseRent_InvalidTransition:Concurrent->Pending", ex.Message);

        unitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        unitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region GetPreviousTenantHistoryAsync

    [Fact]
    public async Task GetPreviousTenantHistoryAsync_ReturnsRowsOrderedByPerformedDateDescending()
    {
        var older = new LeaseRentRegistrationHistoryEntity
        {
            LeaseRentRegistrationId = 100,
            PerformedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            PerformedBy = 1,
            Snap_TenantName = "First Tenant",
            Snap_TenantMobile = "1111111111",
            Snap_WorkflowStatus = "Verified"
        };
        var newer = new LeaseRentRegistrationHistoryEntity
        {
            LeaseRentRegistrationId = 100,
            PerformedDate = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            PerformedBy = 2,
            Snap_TenantName = "Second Tenant",
            Snap_TenantMobile = "2222222222",
            Snap_WorkflowStatus = "Approved"
        };
        var otherRegistration = new LeaseRentRegistrationHistoryEntity
        {
            LeaseRentRegistrationId = 200,
            PerformedDate = DateTime.UtcNow,
            Snap_TenantName = "Unrelated Tenant",
            Snap_TenantMobile = "3333333333"
        };
        _context!.Set<LeaseRentRegistrationHistoryEntity>().AddRange(older, newer, otherRegistration);
        await _context.SaveChangesAsync();

        var service = CreateService();
        var result = await service.GetPreviousTenantHistoryAsync(100, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.Equal("Second Tenant", result[0].TenantName); // newest first
        Assert.Equal("First Tenant", result[1].TenantName);
        Assert.Equal("Approved", result[0].WorkflowStatus);
    }

    [Fact]
    public async Task GetPreviousTenantHistoryAsync_NoRows_ReturnsEmptyList()
    {
        var service = CreateService();

        var result = await service.GetPreviousTenantHistoryAsync(999, CancellationToken.None);

        Assert.Empty(result);
    }

    /// <summary>
    /// Regression test for the Copilot finding: both history writers (UpdateAsync and
    /// UpdateAndSendToVerificationAsync) only ever populate Snap_RentAmount, never the legacy
    /// Snap_MonthlyRent column — reading Snap_MonthlyRent alone returned 0 even when the lease had
    /// a real rent amount at the time of the snapshot.
    /// </summary>
    [Fact]
    public async Task GetPreviousTenantHistoryAsync_ReadsRentFromSnapRentAmount_NotLegacySnapMonthlyRent()
    {
        var history = new LeaseRentRegistrationHistoryEntity
        {
            LeaseRentRegistrationId = 300,
            PerformedDate = DateTime.UtcNow,
            Snap_TenantName = "Acme Traders",
            Snap_RentAmount = 15000m
            // Snap_MonthlyRent intentionally left at its default (0) — this is what every real
            // history row written by this service looks like today.
        };
        _context!.Set<LeaseRentRegistrationHistoryEntity>().Add(history);
        await _context.SaveChangesAsync();

        var service = CreateService();
        var result = await service.GetPreviousTenantHistoryAsync(300, CancellationToken.None);

        var row = Assert.Single(result);
        Assert.Equal(15000m, row.MonthlyRent);
    }

    #endregion
}
