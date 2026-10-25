using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Services.PropertyRevision;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Repositories.PropertyRevision;

namespace NtisPlatform.Tests.Integration;

public class PropertyRevisionLifecycleIntegrationTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"RevisionTestDb_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SnapshotUpdate_DoesNotDeactivateIsActive()
    {
        using var context = CreateDbContext();
        var snapshotRepo = new RevisionPropertySnapshotRepository(context);
        var guard = new RevisionDraftGuardService(Enumerable.Empty<NtisPlatform.Core.Interfaces.IRevisionCalculationCleanupHandler>());
        var currentUserService = new Moq.Mock<NtisPlatform.Application.Interfaces.ICurrentUserService>();
        currentUserService.Setup(u => u.GetCurrentUserId()).Returns(1);

        var service = new PropertyRevisionSnapshotService(snapshotRepo, guard, currentUserService.Object);

        var mast = new RevisionMastEntity
        {
            Id = 100,
            PropertyId = 1,
            FinanceYearId = 1,
            RevisionStatus = RevisionStatus.DRAFT,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            IsActive = true
        };
        context.Set<RevisionMastEntity>().Add(mast);

        var snapshot = new RevisionPropertyMastEntity
        {
            Id = 1000,
            RevisionMastId = 100,
            RevisionPeriodId = null,
            TaxZoneId = 1,
            WardId = 2,
            PropertySeqNo = 1,
            IsActive = true
        };
        context.Set<RevisionPropertyMastEntity>().Add(snapshot);
        await context.SaveChangesAsync();

        // Client request with IsActive = false (default value or untrusted)
        var updateRequest = new UpdateRevisionPropertyMastDto
        {
            TaxZoneId = 1,
            WardId = 2,
            PropertySeqNo = 1,
            IsActive = false
        };

        var result = await service.UpdatePropertyMastAsync(100, updateRequest);

        // Verify snapshot remains active!
        var updated = await context.Set<RevisionPropertyMastEntity>().FindAsync(1000L);
        Assert.NotNull(updated);
        Assert.True(updated.IsActive);
        Assert.True(result.Property.IsActive);
    }

    [Fact]
    public async Task SnapshotUpdate_ConcurrencyConflict_ThrowsConflict()
    {
        using var context = CreateDbContext();
        var snapshotRepo = new RevisionPropertySnapshotRepository(context);
        var guard = new RevisionDraftGuardService(Enumerable.Empty<NtisPlatform.Core.Interfaces.IRevisionCalculationCleanupHandler>());
        var currentUserService = new Moq.Mock<NtisPlatform.Application.Interfaces.ICurrentUserService>();
        currentUserService.Setup(u => u.GetCurrentUserId()).Returns(1);

        var service = new PropertyRevisionSnapshotService(snapshotRepo, guard, currentUserService.Object);

        var mast = new RevisionMastEntity
        {
            Id = 200,
            PropertyId = 1,
            FinanceYearId = 1,
            RevisionStatus = RevisionStatus.DRAFT,
            CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
            IsActive = true
        };
        context.Set<RevisionMastEntity>().Add(mast);

        var snapshot = new RevisionPropertyMastEntity
        {
            Id = 2000,
            RevisionMastId = 200,
            RevisionPeriodId = null,
            TaxZoneId = 1,
            WardId = 2,
            PropertySeqNo = 1,
            IsActive = true,
            UpdatedDate = DateTime.UtcNow.AddMinutes(5) // Future/modified by someone else
        };
        context.Set<RevisionPropertyMastEntity>().Add(snapshot);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateRevisionPropertyMastDto
        {
            TaxZoneId = 1,
            WardId = 2,
            PropertySeqNo = 1,
            ConcurrencyToken = DateTime.UtcNow // Stale token
        };

        await Assert.ThrowsAsync<RevisionConflictException>(() =>
            service.UpdatePropertyMastAsync(200, updateRequest));
    }

    [Fact]
    public async Task CalculationCleanupHandler_ClearsStaleResults()
    {
        using var context = CreateDbContext();
        var handler = new RevisionCalculationCleanupHandler(context);

        // Seed calculations for revision 300
        context.Set<RevisionRVCalculationResultsEntity>().Add(new RevisionRVCalculationResultsEntity
        {
            Id = 1,
            RevisionMastId = 300,
            IsActive = true
        });
        context.Set<RevisionPolicyTaxDetailsEntity>().Add(new RevisionPolicyTaxDetailsEntity
        {
            Id = 2,
            RevisionMastId = 300,
            PolicyCodeId = 1,
            TaxId = 1,
            IsActive = true
        });
        context.Set<RevisionPropertyTaxCalculationCVResultsEntity>().Add(new RevisionPropertyTaxCalculationCVResultsEntity
        {
            Id = 3,
            RevisionMastId = 300,
            RevisionPeriodId = 1,
            IsActive = true
        });
        await context.SaveChangesAsync();

        // Clear stale calculations
        await handler.ClearStaleCalculationAsync(300);

        Assert.Empty(await context.Set<RevisionRVCalculationResultsEntity>().Where(c => c.RevisionMastId == 300).ToListAsync());
        Assert.Empty(await context.Set<RevisionPolicyTaxDetailsEntity>().Where(c => c.RevisionMastId == 300).ToListAsync());
        Assert.Empty(await context.Set<RevisionPropertyTaxCalculationCVResultsEntity>().Where(c => c.RevisionMastId == 300).ToListAsync());
    }

    [Fact]
    public async Task ApproveAsync_WhenCalculated_TransitionsToApproved()
    {
        using var context = CreateDbContext();
        var repo = new RevisionRepository(context);

        var mast = new RevisionMastEntity
        {
            Id = 400,
            PropertyId = 1,
            FinanceYearId = 1,
            RevisionStatus = RevisionStatus.CALCULATED,
            IsActive = true
        };
        context.Set<RevisionMastEntity>().Add(mast);
        await context.SaveChangesAsync();

        var result = await repo.ApproveAsync(400, 99);

        Assert.Equal(RevisionStatus.APPROVED, result.RevisionStatus);
        Assert.Equal(99, result.ApprovedBy);
        Assert.NotNull(result.ApprovedDate);
    }

    [Fact]
    public async Task ApproveAsync_WhenDraft_ThrowsConflict()
    {
        using var context = CreateDbContext();
        var repo = new RevisionRepository(context);

        var mast = new RevisionMastEntity
        {
            Id = 500,
            PropertyId = 1,
            FinanceYearId = 1,
            RevisionStatus = RevisionStatus.DRAFT,
            IsActive = true
        };
        context.Set<RevisionMastEntity>().Add(mast);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<RevisionConflictException>(() =>
            repo.ApproveAsync(500, 99));
    }

    [Fact]
    public async Task PostAsync_WhenCalculated_ThrowsConflict_RequiresApproved()
    {
        using var context = CreateDbContext();
        var repo = new RevisionRepository(context);

        var mast = new RevisionMastEntity
        {
            Id = 600,
            PropertyId = 1,
            FinanceYearId = 1,
            RevisionStatus = RevisionStatus.CALCULATED,
            IsActive = true
        };
        context.Set<RevisionMastEntity>().Add(mast);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<RevisionConflictException>(() =>
            repo.PostAsync(600, 99));
    }
}
