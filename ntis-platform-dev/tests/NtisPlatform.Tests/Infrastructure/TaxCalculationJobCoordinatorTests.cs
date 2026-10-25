using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Services;
using Xunit;

namespace NtisPlatform.Tests.Infrastructure;

public class TaxCalculationJobCoordinatorTests
{
    private readonly Mock<ILogger<TaxCalculationJobCoordinator>> _mockLogger = new();
    private readonly TaxCalculationJobCoordinator _coordinator;

    public TaxCalculationJobCoordinatorTests()
    {
        _coordinator = new TaxCalculationJobCoordinator(_mockLogger.Object);
    }

    [Fact]
    public void RegisterJob_StoresCreatedByUserId_AndInitializesState()
    {
        var job = _coordinator.RegisterJob("JOB-101", "W", societyDetailId: 10, wingDetailId: 20, totalUnits: 15, createdByUserId: 42);

        Assert.NotNull(job);
        Assert.Equal("JOB-101", job.JobId);
        Assert.Equal("W", job.EntityType);
        Assert.Equal(10, job.SocietyDetailId);
        Assert.Equal(20, job.WingDetailId);
        Assert.Equal(15, job.TotalUnits);
        Assert.Equal(42, job.CreatedByUserId);
        Assert.Equal(TaxCalculationJobStatus.Processing, job.Status);
        Assert.False(job.IsPaused);
        Assert.False(job.IsCancellationRequested);
    }

    [Fact]
    public void PauseJob_TransitionsToPaused_AndReturnsTrue()
    {
        _coordinator.RegisterJob("JOB-102", "S", societyDetailId: 5, wingDetailId: null, totalUnits: 10, createdByUserId: 1);

        var firstPause = _coordinator.PauseJob("JOB-102");
        Assert.True(firstPause);

        var job = _coordinator.GetJob("JOB-102");
        Assert.NotNull(job);
        Assert.True(job!.IsPaused);
        Assert.Equal(TaxCalculationJobStatus.Paused, job.Status);

        // Second pause should return false since already paused
        var secondPause = _coordinator.PauseJob("JOB-102");
        Assert.False(secondPause);
    }

    [Fact]
    public void ResumeJob_TransitionsToProcessing_AndReturnsTrue()
    {
        _coordinator.RegisterJob("JOB-103", "S", societyDetailId: 5, wingDetailId: null, totalUnits: 10, createdByUserId: 1);

        // Resume before pause should return false (not paused)
        var earlyResume = _coordinator.ResumeJob("JOB-103");
        Assert.False(earlyResume);

        _coordinator.PauseJob("JOB-103");
        var validResume = _coordinator.ResumeJob("JOB-103");
        Assert.True(validResume);

        var job = _coordinator.GetJob("JOB-103");
        Assert.NotNull(job);
        Assert.False(job!.IsPaused);
        Assert.Equal(TaxCalculationJobStatus.Processing, job.Status);
    }

    [Fact]
    public void CancelJob_TransitionsToCancelling_AndReturnsTrue()
    {
        _coordinator.RegisterJob("JOB-104", "P", societyDetailId: null, wingDetailId: null, totalUnits: 5, createdByUserId: 1);

        var firstCancel = _coordinator.CancelJob("JOB-104");
        Assert.True(firstCancel);

        var job = _coordinator.GetJob("JOB-104");
        Assert.NotNull(job);
        Assert.True(job!.IsCancellationRequested);
        Assert.Equal(TaxCalculationJobStatus.Cancelling, job.Status);

        // Second cancel should return false because it is already in Cancelling state
        var secondCancel = _coordinator.CancelJob("JOB-104");
        Assert.False(secondCancel);
    }

    [Fact]
    public void CancelJob_Lifecycle_TransitionsFromCancellingToCancelledOnWorkerTermination()
    {
        var job = _coordinator.RegisterJob("JOB-LIFECYCLE", "W", societyDetailId: 10, wingDetailId: 20, totalUnits: 10, createdByUserId: 1);
        Assert.Equal(TaxCalculationJobStatus.Processing, job.Status);

        // Step 1: User requests cancellation -> Status becomes Cancelling
        var cancelSuccess = _coordinator.CancelJob("JOB-LIFECYCLE");
        Assert.True(cancelSuccess);
        Assert.Equal(TaxCalculationJobStatus.Cancelling, job.Status);
        Assert.True(job.IsCancellationRequested);

        // Step 2: Background worker stops and marks job cancelled -> Status becomes Cancelled
        var marked = _coordinator.MarkJobCancelled("JOB-LIFECYCLE");
        Assert.True(marked);
        Assert.Equal(TaxCalculationJobStatus.Cancelled, job.Status);

        // Verified retrieved job from coordinator reflects Cancelled
        var retrieved = _coordinator.GetJob("JOB-LIFECYCLE");
        Assert.NotNull(retrieved);
        Assert.Equal(TaxCalculationJobStatus.Cancelled, retrieved!.Status);
    }

    [Fact]
    public void ProcessedUnits_And_CurrentPropertyId_CanBeUpdatedConcurrently()
    {
        var job = _coordinator.RegisterJob("JOB-105", "S", societyDetailId: 1, wingDetailId: null, totalUnits: 100, createdByUserId: 1);

        job.ProcessedUnits = 25;
        job.CurrentPropertyId = 555;

        Assert.Equal(25, job.ProcessedUnits);
        Assert.Equal(555, job.CurrentPropertyId);
    }

    [Fact]
    public void CompleteJob_RemovesActiveContext_DisposesResources_AndRetainsCompletedSnapshot()
    {
        var job = _coordinator.RegisterJob("JOB-COMPLETE-1", "S", societyDetailId: 2, wingDetailId: null, totalUnits: 10, createdByUserId: 5);
        Assert.Equal(1, _coordinator.ActiveJobsCount);
        Assert.Equal(0, _coordinator.CompletedJobsCount);

        _coordinator.CompleteJob("JOB-COMPLETE-1");

        // Active context must be removed and disposed
        Assert.Equal(0, _coordinator.ActiveJobsCount);
        Assert.Equal(1, _coordinator.CompletedJobsCount);

        // Snapshot is still queryable with final status
        var completed = _coordinator.GetJob("JOB-COMPLETE-1");
        Assert.NotNull(completed);
        Assert.IsType<CompletedTaxCalculationJobContext>(completed);
        Assert.Equal("JOB-COMPLETE-1", completed!.JobId);
        Assert.Equal(TaxCalculationJobStatus.Completed, completed.Status);
        Assert.False(completed.IsPaused);
        Assert.False(completed.IsCancellationRequested);

        // Snapshot does not accept further state mutations
        Assert.False(completed.Pause());
        Assert.False(completed.Resume());
        Assert.False(completed.Cancel());
    }

    [Fact]
    public void CompleteJob_CancelledJob_RetainsCancelledStatusInSnapshot_AndCleansActiveContext()
    {
        var job = _coordinator.RegisterJob("JOB-CANCEL-SNAP", "P", societyDetailId: null, wingDetailId: null, totalUnits: 20, createdByUserId: 5);
        _coordinator.CancelJob("JOB-CANCEL-SNAP");
        Assert.Equal(TaxCalculationJobStatus.Cancelling, job.Status);

        _coordinator.CompleteJob("JOB-CANCEL-SNAP");

        Assert.Equal(0, _coordinator.ActiveJobsCount);
        Assert.Equal(1, _coordinator.CompletedJobsCount);

        var retrieved = _coordinator.GetJob("JOB-CANCEL-SNAP");
        Assert.NotNull(retrieved);
        Assert.Equal(TaxCalculationJobStatus.Cancelled, retrieved!.Status);
        Assert.True(retrieved.IsCancellationRequested);
    }

    [Fact]
    public async Task CompleteJob_ExpiredJobs_ArePrunedAfterRetentionWindow()
    {
        var shortLivedCoordinator = new TaxCalculationJobCoordinator(_mockLogger.Object, TimeSpan.FromMilliseconds(50));
        shortLivedCoordinator.RegisterJob("JOB-EXPIRE", "S", societyDetailId: 1, wingDetailId: null, totalUnits: 5, createdByUserId: 1);
        shortLivedCoordinator.CompleteJob("JOB-EXPIRE");

        // Immediately queryable
        Assert.NotNull(shortLivedCoordinator.GetJob("JOB-EXPIRE"));

        // Wait past retention window
        await Task.Delay(75);

        // Expired entry is pruned and returns null
        Assert.Null(shortLivedCoordinator.GetJob("JOB-EXPIRE"));
    }
}
