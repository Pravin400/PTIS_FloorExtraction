using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.PropertyRevision;

/// <summary>
/// Implementation of <see cref="IRevisionCalculationCleanupHandler"/> that clears all
/// stale calculation results, policy tax rows, and transaction snapshot rows when
/// a revision's tax-relevant fields are modified and the revision is reset from CALCULATED to DRAFT.
/// </summary>
public class RevisionCalculationCleanupHandler : IRevisionCalculationCleanupHandler
{
    private readonly ApplicationDbContext _context;

    public RevisionCalculationCleanupHandler(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task ClearStaleCalculationAsync(long revisionMastId, CancellationToken cancellationToken = default)
    {
        // 1. RV Calculation Tax Details
        var rvTaxDetails = await _context.Set<RevisionRVCalculationTaxDetailsEntity>()
            .Where(t => t.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (rvTaxDetails.Count > 0)
        {
            _context.Set<RevisionRVCalculationTaxDetailsEntity>().RemoveRange(rvTaxDetails);
        }

        // 2. RV Calculation Results
        var rvCalcResults = await _context.Set<RevisionRVCalculationResultsEntity>()
            .Where(c => c.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (rvCalcResults.Count > 0)
        {
            _context.Set<RevisionRVCalculationResultsEntity>().RemoveRange(rvCalcResults);
        }

        // 3. CV Calculation Results
        var cvCalcResults = await _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>()
            .Where(c => c.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (cvCalcResults.Count > 0)
        {
            _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>().RemoveRange(cvCalcResults);
        }

        // 4. Policy Tax Details (RV)
        var policyTaxes = await _context.Set<RevisionPolicyTaxDetailsEntity>()
            .Where(p => p.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (policyTaxes.Count > 0)
        {
            _context.Set<RevisionPolicyTaxDetailsEntity>().RemoveRange(policyTaxes);
        }

        // 5. Policy Tax Details (CV)
        var policyTaxesCV = await _context.Set<RevisionPolicyTaxDetailsCVEntity>()
            .Where(p => p.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (policyTaxesCV.Count > 0)
        {
            _context.Set<RevisionPolicyTaxDetailsCVEntity>().RemoveRange(policyTaxesCV);
        }

        // 6. Revision TransMast
        var transMast = await _context.Set<RevisionTransMastEntity>()
            .Where(t => t.RevisionMastId == revisionMastId)
            .ToListAsync(cancellationToken);
        if (transMast.Count > 0)
        {
            _context.Set<RevisionTransMastEntity>().RemoveRange(transMast);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
