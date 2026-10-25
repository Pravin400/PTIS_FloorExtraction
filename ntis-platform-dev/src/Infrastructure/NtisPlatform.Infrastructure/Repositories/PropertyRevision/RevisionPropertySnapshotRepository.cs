using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.PropertyRevision;

/// <inheritdoc cref="IRevisionPropertySnapshotRepository"/>
public class RevisionPropertySnapshotRepository : IRevisionPropertySnapshotRepository
{
    private readonly ApplicationDbContext _context;

    public RevisionPropertySnapshotRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<RevisionMastEntity?> GetRevisionForEditAsync(
        long revisionMastId, CancellationToken cancellationToken = default)
    {
        return _context.Set<RevisionMastEntity>()
            .Include(r => r.Periods.Where(p => p.IsActive && !p.MarkedForDeletion).OrderBy(p => p.PeriodNo))
            .FirstOrDefaultAsync(r => r.Id == revisionMastId && r.IsActive && !r.MarkedForDeletion, cancellationToken);
    }

    public Task<RevisionPropertyMastEntity?> GetPropertyMastAsync(
        long revisionMastId, long? revisionPeriodId, CancellationToken cancellationToken = default)
    {
        return _context.Set<RevisionPropertyMastEntity>()
            .Include(p => p.PropertyMastDetails)
            .FirstOrDefaultAsync(
                p => p.RevisionMastId == revisionMastId
                     && p.RevisionPeriodId == revisionPeriodId
                     && p.IsActive
                     && !p.MarkedForDeletion,
                cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            throw new NtisPlatform.Core.Exceptions.RevisionConflictException(
                "A concurrency conflict occurred: the property snapshot has been modified by another operation.", ex);
        }
    }
}
