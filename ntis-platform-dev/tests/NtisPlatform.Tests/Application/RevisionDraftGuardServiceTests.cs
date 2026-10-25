using NtisPlatform.Application.Services.PropertyRevision;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class RevisionDraftGuardServiceTests
{
    private static RevisionMastEntity Revision(RevisionStatus status) => new()
    {
        Id = 5001,
        PropertyId = 1487254,
        FinanceYearId = 1,
        RevisionNo = 1,
        RevisionType = "AREA_CHANGE",
        RevisionStatus = status
    };

    [Theory]
    [InlineData(RevisionStatus.APPROVED)]
    [InlineData(RevisionStatus.POSTED)]
    [InlineData(RevisionStatus.CANCELLED)]
    public void EnsureEditable_ImmutableStatus_ThrowsRevisionConflictException(RevisionStatus status)
    {
        var service = new RevisionDraftGuardService(Array.Empty<IRevisionCalculationCleanupHandler>());

        Assert.Throws<RevisionConflictException>(() => service.EnsureEditable(Revision(status)));
    }

    [Theory]
    [InlineData(RevisionStatus.DRAFT)]
    [InlineData(RevisionStatus.CALCULATED)]
    public void EnsureEditable_EditableStatus_DoesNotThrow(RevisionStatus status)
    {
        var service = new RevisionDraftGuardService(Array.Empty<IRevisionCalculationCleanupHandler>());

        var exception = Record.Exception(() => service.EnsureEditable(Revision(status)));

        Assert.Null(exception);
    }

    [Fact]
    public async Task ApplyIfTaxRelevantFieldChangedAsync_CalculatedAndFieldChanged_ResetsToDraftAndInvokesHandlers()
    {
        var handlerInvoked = false;
        long? invokedRevisionId = null;
        var handler = new StubCleanupHandler(id =>
        {
            handlerInvoked = true;
            invokedRevisionId = id;
        });
        var service = new RevisionDraftGuardService(new[] { handler });
        var revision = Revision(RevisionStatus.CALCULATED);

        var result = await service.ApplyIfTaxRelevantFieldChangedAsync(revision, anyTaxRelevantFieldChanged: true);

        Assert.True(result);
        Assert.Equal(RevisionStatus.DRAFT, revision.RevisionStatus);
        Assert.True(handlerInvoked);
        Assert.Equal(5001, invokedRevisionId);
    }

    [Fact]
    public async Task ApplyIfTaxRelevantFieldChangedAsync_CalculatedButNoTaxRelevantField_DoesNotReset()
    {
        var service = new RevisionDraftGuardService(Array.Empty<IRevisionCalculationCleanupHandler>());
        var revision = Revision(RevisionStatus.CALCULATED);

        var result = await service.ApplyIfTaxRelevantFieldChangedAsync(revision, anyTaxRelevantFieldChanged: false);

        Assert.False(result);
        Assert.Equal(RevisionStatus.CALCULATED, revision.RevisionStatus);
    }

    [Fact]
    public async Task ApplyIfTaxRelevantFieldChangedAsync_AlreadyDraft_DoesNotReset_EvenIfFieldChanged()
    {
        var service = new RevisionDraftGuardService(Array.Empty<IRevisionCalculationCleanupHandler>());
        var revision = Revision(RevisionStatus.DRAFT);

        var result = await service.ApplyIfTaxRelevantFieldChangedAsync(revision, anyTaxRelevantFieldChanged: true);

        Assert.False(result);
        Assert.Equal(RevisionStatus.DRAFT, revision.RevisionStatus);
    }

    private sealed class StubCleanupHandler : IRevisionCalculationCleanupHandler
    {
        private readonly Action<long> _onInvoked;

        public StubCleanupHandler(Action<long> onInvoked) => _onInvoked = onInvoked;

        public Task ClearStaleCalculationAsync(long revisionMastId, CancellationToken cancellationToken = default)
        {
            _onInvoked(revisionMastId);
            return Task.CompletedTask;
        }
    }
}
