using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyRevision;

/// <inheritdoc cref="IRevisionDraftGuardService"/>
public class RevisionDraftGuardService : IRevisionDraftGuardService
{
    private readonly IEnumerable<IRevisionCalculationCleanupHandler> _cleanupHandlers;

    public RevisionDraftGuardService(IEnumerable<IRevisionCalculationCleanupHandler> cleanupHandlers)
    {
        _cleanupHandlers = cleanupHandlers;
    }

    public void EnsureEditable(RevisionMastEntity revision)
    {
        if (revision.RevisionStatus is RevisionStatus.APPROVED or RevisionStatus.POSTED or RevisionStatus.CANCELLED)
        {
            throw new RevisionConflictException(
                $"Revision {revision.Id} is {revision.RevisionStatus} and can no longer be edited.");
        }
    }

    public async Task<bool> ApplyIfTaxRelevantFieldChangedAsync(
        RevisionMastEntity revision,
        bool anyTaxRelevantFieldChanged,
        CancellationToken cancellationToken = default)
    {
        if (!anyTaxRelevantFieldChanged || revision.RevisionStatus != RevisionStatus.CALCULATED)
        {
            return false;
        }

        revision.RevisionStatus = RevisionStatus.DRAFT;

        foreach (var handler in _cleanupHandlers)
        {
            await handler.ClearStaleCalculationAsync(revision.Id, cancellationToken);
        }

        return true;
    }
}
