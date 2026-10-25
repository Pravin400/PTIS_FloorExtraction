using System.Data;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models.Revision;
using NtisPlatform.Application.Utilities;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Repositories.PropertyRevision;

/// <summary>
/// Revision data access AND revision workflow logic, implemented entirely in C# / EF Core
/// (no stored procedures). Split into partial files:
///   RevisionRepository.cs           - header reads, Begin, EnsureBaseline, CaptureSnapshot, Post entry points
///   RevisionRepository.Snapshot.cs  - copies live property + RV/CV state into the Revision* snapshot tables
///   RevisionRepository.Post.cs      - posting (PERIOD_WISE live tax replacement, mark POSTED/current)
/// Every write operation runs in ONE database transaction (joins the ambient one if the caller
/// already started it) at SERIALIZABLE isolation, which replaces the old sp_getapplock guard.
/// </summary>
public partial class RevisionRepository : IRevisionRepository
{
    private readonly ApplicationDbContext _context;

    public RevisionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ------------------------------------------------------------------ helpers

    /// <summary>
    /// Runs <paramref name="work"/> inside a single transaction. If the caller already has an
    /// ambient EF transaction we simply join it (the caller commits/rolls back).
    /// </summary>
    private async Task<T> InTransactionAsync<T>(Func<Task<T>> work, CancellationToken cancellationToken)
    {
        if (_context.Database.CurrentTransaction is not null)
        {
            return await work();
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database
                .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var result = await work();
            await transaction.CommitAsync(cancellationToken);
            return result;
        });
    }

    private static (DateTime Start, DateTime End) FinanceYearRange(int year) =>
        (new DateTime(year, 4, 1), new DateTime(year + 1, 3, 31));

    private async Task<int> GetFinanceYearAsync(int financeYearId, CancellationToken cancellationToken)
    {
        var year = await _context.Set<NtisPlatform.Core.Entities.Master.YearMasterEntity>()
            .AsNoTracking()
            .Where(y => y.Id == financeYearId && y.IsActive)
            .Select(y => (int?)y.Year)
            .FirstOrDefaultAsync(cancellationToken);

        return year ?? throw new RevisionValidationException("FinanceYearId not found or inactive.");
    }

    private static RevisionCalculationType ParseCalculationType(string value)
    {
        if (Enum.TryParse<RevisionCalculationType>(value, true, out var parsed)
            && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        throw new RevisionValidationException("CalculationType must be RV, CV, or BOTH.");
    }

    private static RevisionCalculationScope ParseCalculationScope(string value)
    {
        if (Enum.TryParse<RevisionCalculationScope>(value, true, out var parsed)
            && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        throw new RevisionValidationException("CalculationScope must be HISTORY_ONLY or PERIOD_WISE.");
    }

    // ------------------------------------------------------------------ gate

    public Task<bool> IsPropertyAtApprovalByUlbAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return _context.Set<PropertyWorkflowDetailsEntity>()
            .AsNoTracking()
            .AnyAsync(
                w => w.PropertyId == propertyId
                     && w.IsActive
                     && w.CurrentStatus == true
                     && w.WorkflowStage.StageName == "ApprovalByULB",
                cancellationToken);
    }

    // ------------------------------------------------------------------ baseline

    public Task<RevisionBaselineResult> EnsureBaselineAsync(
        int propertyId,
        int financeYearId,
        string calculationType,
        int? createdBy,
        CancellationToken cancellationToken = default)
    {
        return InTransactionAsync(async () =>
        {
            var calcType = ParseCalculationType(calculationType);

            var existingId = await _context.Set<RevisionMastEntity>()
                .AsNoTracking()
                .Where(r => r.PropertyId == propertyId
                            && r.FinanceYearId == financeYearId
                            && r.IsCurrent
                            && r.RevisionStatus == RevisionStatus.POSTED
                            && r.IsActive
                            && !r.MarkedForDeletion)
                .OrderByDescending(r => r.RevisionNo)
                .Select(r => (long?)r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingId.HasValue)
            {
                return new RevisionBaselineResult { RevisionId = existingId.Value, Created = false };
            }

            var propertyExists = await _context.Set<PropertyEntity>()
                .AnyAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);
            if (!propertyExists)
            {
                throw new RevisionValidationException("Property not found or inactive.");
            }

            var now = DateTime.Now;
            var nextRevisionNo = (await _context.Set<RevisionMastEntity>()
                .Where(r => r.PropertyId == propertyId && r.FinanceYearId == financeYearId && !r.MarkedForDeletion)
                .MaxAsync(r => (int?)r.RevisionNo, cancellationToken) ?? 0) + 1;

            // Created APPROVED first and flipped to POSTED after the snapshot + trace rows are
            // written, so the revision is never "immutable" while still being filled.
            var mast = new RevisionMastEntity
            {
                PropertyId = propertyId,
                FinanceYearId = financeYearId,
                RevisionNo = nextRevisionNo,
                PreviousRevisionMastId = null,
                CalculationType = calcType,
                CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
                RevisionType = "INITIAL",
                EffectiveDate = null,
                RevisionReason = "Initial baseline revision snapshot",
                SourceType = "API",
                RevisionStatus = RevisionStatus.APPROVED,
                IsCurrent = true,
                ApprovedBy = createdBy,
                ApprovedDate = now,
                IsActive = true,
                CreatedBy = createdBy,
                CreatedDate = now
            };
            _context.Set<RevisionMastEntity>().Add(mast);
            await _context.SaveChangesAsync(cancellationToken);

            await CaptureSnapshotCoreAsync(mast, null, createdBy, "NO_PRORATION", cancellationToken);

            mast.RevisionStatus = RevisionStatus.POSTED;
            mast.UpdatedBy = createdBy;
            mast.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync(cancellationToken);

            return new RevisionBaselineResult { RevisionId = mast.Id, Created = true };
        }, cancellationToken);
    }

    // ------------------------------------------------------------------ begin

    public Task<RevisionBeginResult> BeginRevisionAsync(
        RevisionBeginParameters parameters,
        CancellationToken cancellationToken = default)
    {
        return InTransactionAsync(async () =>
        {
            var calcType = ParseCalculationType(parameters.CalculationType);
            var scope = ParseCalculationScope(parameters.CalculationScope);

            var propertyExists = await _context.Set<PropertyEntity>()
                .AnyAsync(p => p.Id == parameters.PropertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);
            if (!propertyExists)
            {
                throw new RevisionValidationException("Property not found or inactive.");
            }

            var financeYear = await GetFinanceYearAsync(parameters.FinanceYearId, cancellationToken);
            var (fyStart, fyEnd) = FinanceYearRange(financeYear);

            DateTime? effectiveDate = parameters.EffectiveDate?.Date;
            if (scope == RevisionCalculationScope.PERIOD_WISE)
            {
                if (effectiveDate is null)
                {
                    throw new RevisionValidationException("EffectiveDate is required for PERIOD_WISE.");
                }

                if (effectiveDate < fyStart || effectiveDate > fyEnd)
                {
                    throw new RevisionValidationException("EffectiveDate must be inside the selected financial year.");
                }
            }

            var openStatuses = new[] { RevisionStatus.DRAFT, RevisionStatus.CALCULATED, RevisionStatus.APPROVED };
            var hasOpen = await _context.Set<RevisionMastEntity>()
                .AnyAsync(r => r.PropertyId == parameters.PropertyId
                               && r.FinanceYearId == parameters.FinanceYearId
                               && openStatuses.Contains(r.RevisionStatus)
                               && r.IsActive
                               && !r.MarkedForDeletion, cancellationToken);
            if (hasOpen)
            {
                throw new RevisionConflictException(
                    "An open revision already exists for this property and finance year.");
            }

            var previousId = await _context.Set<RevisionMastEntity>()
                .AsNoTracking()
                .Where(r => r.PropertyId == parameters.PropertyId
                            && r.FinanceYearId == parameters.FinanceYearId
                            && r.RevisionStatus == RevisionStatus.POSTED
                            && r.IsActive
                            && !r.MarkedForDeletion)
                .OrderByDescending(r => r.RevisionNo)
                .Select(r => (long?)r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var nextRevisionNo = (await _context.Set<RevisionMastEntity>()
                .Where(r => r.PropertyId == parameters.PropertyId
                            && r.FinanceYearId == parameters.FinanceYearId
                            && !r.MarkedForDeletion)
                .MaxAsync(r => (int?)r.RevisionNo, cancellationToken) ?? 0) + 1;

            var now = DateTime.Now;
            var mast = new RevisionMastEntity
            {
                PropertyId = parameters.PropertyId,
                FinanceYearId = parameters.FinanceYearId,
                RevisionNo = nextRevisionNo,
                PreviousRevisionMastId = previousId,
                CalculationType = calcType,
                CalculationScope = scope,
                RevisionType = parameters.RevisionType,
                EffectiveDate = effectiveDate,
                RevisionReason = parameters.RevisionReason,
                PolicyCodeId = parameters.PolicyCodeId,
                SourceType = "API",
                RevisionStatus = RevisionStatus.DRAFT,
                IsCurrent = false,
                IsActive = true,
                CreatedBy = parameters.CreatedBy,
                CreatedDate = now
            };
            _context.Set<RevisionMastEntity>().Add(mast);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                if (IsUniqueConstraintViolation(ex))
                {
                    throw new RevisionConflictException(
                        "An open revision already exists for this property and finance year.", ex);
                }
                throw;
            }

            RevisionPeriodEntity? oldPeriod = null;
            RevisionPeriodEntity? newPeriod = null;

            if (scope == RevisionCalculationScope.PERIOD_WISE)
            {
                var prevPeriods = previousId.HasValue
                    ? await _context.Set<RevisionPeriodEntity>()
                        .AsNoTracking()
                        .Where(p => p.RevisionMastId == previousId.Value && p.IsActive && !p.MarkedForDeletion)
                        .OrderBy(p => p.PeriodNo)
                        .ToListAsync(cancellationToken)
                    : new List<RevisionPeriodEntity>();

                if (prevPeriods.Count > 0)
                {
                    // Carry forward previous period timeline
                    var affectedPeriod = prevPeriods.FirstOrDefault(p => effectiveDate >= p.EffectiveFrom && effectiveDate <= p.EffectiveTo);
                    if (affectedPeriod is null)
                    {
                        throw new RevisionValidationException(
                            $"EffectiveDate {effectiveDate:yyyy-MM-dd} must fall within the periods of the previous revision ({prevPeriods.First().EffectiveFrom:yyyy-MM-dd} to {prevPeriods.Last().EffectiveTo:yyyy-MM-dd}).");
                    }

                    int periodNo = 1;
                    foreach (var prior in prevPeriods.Where(p => p.PeriodNo < affectedPeriod.PeriodNo))
                    {
                        var clonedPrior = new RevisionPeriodEntity
                        {
                            RevisionMastId = mast.Id,
                            PeriodNo = periodNo++,
                            EffectiveFrom = prior.EffectiveFrom,
                            EffectiveTo = prior.EffectiveTo,
                            Remarks = prior.Remarks ?? $"Carried forward from revision {previousId.Value}",
                            CreatedBy = parameters.CreatedBy,
                            CreatedDate = now
                        };
                        _context.Set<RevisionPeriodEntity>().Add(clonedPrior);
                    }

                    if (effectiveDate > affectedPeriod.EffectiveFrom)
                    {
                        oldPeriod = new RevisionPeriodEntity
                        {
                            RevisionMastId = mast.Id,
                            PeriodNo = periodNo++,
                            EffectiveFrom = affectedPeriod.EffectiveFrom,
                            EffectiveTo = effectiveDate!.Value.AddDays(-1),
                            Remarks = "Existing state before revision effective date",
                            CreatedBy = parameters.CreatedBy,
                            CreatedDate = now
                        };
                        _context.Set<RevisionPeriodEntity>().Add(oldPeriod);
                    }

                    newPeriod = new RevisionPeriodEntity
                    {
                        RevisionMastId = mast.Id,
                        PeriodNo = periodNo++,
                        EffectiveFrom = effectiveDate!.Value,
                        EffectiveTo = affectedPeriod.EffectiveTo,
                        Remarks = "New state from revision effective date",
                        CreatedBy = parameters.CreatedBy,
                        CreatedDate = now
                    };
                    _context.Set<RevisionPeriodEntity>().Add(newPeriod);

                    foreach (var subsequent in prevPeriods.Where(p => p.PeriodNo > affectedPeriod.PeriodNo))
                    {
                        var clonedSubsequent = new RevisionPeriodEntity
                        {
                            RevisionMastId = mast.Id,
                            PeriodNo = periodNo++,
                            EffectiveFrom = subsequent.EffectiveFrom,
                            EffectiveTo = subsequent.EffectiveTo,
                            Remarks = subsequent.Remarks ?? $"Carried forward from revision {previousId.Value}",
                            CreatedBy = parameters.CreatedBy,
                            CreatedDate = now
                        };
                        _context.Set<RevisionPeriodEntity>().Add(clonedSubsequent);
                    }

                    await _context.SaveChangesAsync(cancellationToken);

                    if (newPeriod is not null)
                    {
                        await CaptureSnapshotCoreAsync(
                            mast, newPeriod.Id, parameters.CreatedBy, "DAY_WISE", cancellationToken);
                    }

                    if (oldPeriod is not null)
                    {
                        await CaptureSnapshotCoreAsync(
                            mast, oldPeriod.Id, parameters.CreatedBy, "DAY_WISE", cancellationToken);
                    }
                }
                else
                {
                    // Old period exists only when the effective date is after the FY start.
                    if (effectiveDate > fyStart)
                    {
                        oldPeriod = new RevisionPeriodEntity
                        {
                            RevisionMastId = mast.Id,
                            PeriodNo = 1,
                            EffectiveFrom = fyStart,
                            EffectiveTo = effectiveDate!.Value.AddDays(-1),
                            Remarks = "Existing state before revision effective date",
                            CreatedBy = parameters.CreatedBy,
                            CreatedDate = now
                        };
                        _context.Set<RevisionPeriodEntity>().Add(oldPeriod);
                    }

                    newPeriod = new RevisionPeriodEntity
                    {
                        RevisionMastId = mast.Id,
                        PeriodNo = oldPeriod is null ? 1 : 2,
                        EffectiveFrom = effectiveDate!.Value,
                        EffectiveTo = fyEnd,
                        Remarks = "New state from revision effective date",
                        CreatedBy = parameters.CreatedBy,
                        CreatedDate = now
                    };
                    _context.Set<RevisionPeriodEntity>().Add(newPeriod);
                    await _context.SaveChangesAsync(cancellationToken);

                    // Capture the OLD state now - before any revision edits.
                    if (oldPeriod is not null)
                    {
                        await CaptureSnapshotCoreAsync(
                            mast, oldPeriod.Id, parameters.CreatedBy, "DAY_WISE", cancellationToken);
                    }

                    // Initialize the editable snapshot for the NEW period so draft editing works immediately.
                    if (newPeriod is not null)
                    {
                        await CaptureSnapshotCoreAsync(
                            mast, newPeriod.Id, parameters.CreatedBy, "DAY_WISE", cancellationToken);
                    }
                }
            }
            else
            {
                // HISTORY_ONLY: initialize the editable snapshot row (RevisionPeriodId = null) immediately.
                await CaptureSnapshotCoreAsync(
                    mast, null, parameters.CreatedBy, "NO_PRORATION", cancellationToken);
            }

            return new RevisionBeginResult
            {
                RevisionId = mast.Id,
                RevisionNo = mast.RevisionNo,
                OldPeriodId = oldPeriod?.Id,
                NewPeriodId = newPeriod?.Id
            };
        }, cancellationToken);
    }

    public Task<RevisionMastEntity> ApproveAsync(
        long revisionMastId,
        int? approvedBy,
        CancellationToken cancellationToken = default)
    {
        return InTransactionAsync(async () =>
        {
            var mast = await _context.Set<RevisionMastEntity>()
                .FirstOrDefaultAsync(r => r.Id == revisionMastId && r.IsActive && !r.MarkedForDeletion, cancellationToken)
                ?? throw new RevisionNotFoundException(revisionMastId);

            if (mast.RevisionStatus == RevisionStatus.POSTED)
            {
                throw new RevisionConflictException("Revision is already POSTED.");
            }

            if (mast.RevisionStatus == RevisionStatus.CANCELLED)
            {
                throw new RevisionConflictException("A cancelled revision cannot be approved.");
            }

            if (mast.RevisionStatus == RevisionStatus.DRAFT)
            {
                throw new RevisionConflictException("Revision is in DRAFT status. Please calculate taxes before approving.");
            }

            if (mast.RevisionStatus == RevisionStatus.APPROVED)
            {
                return mast;
            }

            var now = DateTime.Now;
            mast.RevisionStatus = RevisionStatus.APPROVED;
            mast.ApprovedBy = approvedBy;
            mast.ApprovedDate = now;
            mast.UpdatedBy = approvedBy;
            mast.UpdatedDate = now;

            await _context.SaveChangesAsync(cancellationToken);
            return mast;
        }, cancellationToken);
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        for (Exception? current = ex; current != null; current = current.InnerException)
        {
            if (current is Microsoft.Data.SqlClient.SqlException sqlEx)
            {
                if (sqlEx.Number is 2601 or 2627) return true;
            }
            if (current.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) ||
                current.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) ||
                current.Message.Contains("PRIMARY KEY", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------------------ capture

    public Task<RevisionCaptureSnapshotResult> CaptureSnapshotAsync(
        RevisionCaptureSnapshotParameters parameters,
        CancellationToken cancellationToken = default)
    {
        return InTransactionAsync(async () =>
        {
            var mast = await _context.Set<RevisionMastEntity>()
                .FirstOrDefaultAsync(
                    r => r.Id == parameters.RevisionMastId && r.IsActive && !r.MarkedForDeletion,
                    cancellationToken)
                ?? throw new RevisionNotFoundException(parameters.RevisionMastId);

            if (mast.RevisionStatus == RevisionStatus.POSTED)
            {
                throw new RevisionConflictException("Posted revision is immutable. Create a new revision.");
            }

            if (mast.RevisionStatus == RevisionStatus.CANCELLED)
            {
                throw new RevisionConflictException("Cancelled revision cannot be changed.");
            }

            if (mast.CalculationScope == RevisionCalculationScope.HISTORY_ONLY && parameters.RevisionPeriodId.HasValue)
            {
                throw new RevisionValidationException("HISTORY_ONLY revision must use RevisionPeriodId = NULL.");
            }

            if (mast.CalculationScope == RevisionCalculationScope.PERIOD_WISE && !parameters.RevisionPeriodId.HasValue)
            {
                throw new RevisionValidationException("PERIOD_WISE revision requires RevisionPeriodId.");
            }

            return await CaptureSnapshotCoreAsync(
                mast,
                parameters.RevisionPeriodId,
                parameters.CreatedBy,
                parameters.ProrationMethod,
                cancellationToken);
        }, cancellationToken);
    }

    // ------------------------------------------------------------------ post

    public Task<RevisionPostResult> PostAsync(
        long revisionMastId,
        int? approvedBy,
        CancellationToken cancellationToken = default)
    {
        return InTransactionAsync(
            () => PostCoreAsync(revisionMastId, approvedBy, cancellationToken),
            cancellationToken);
    }

    // ------------------------------------------------------------------ reads

    public Task<RevisionMastEntity?> GetByIdAsync(long revisionId, CancellationToken cancellationToken = default)
    {
        return _context.Set<RevisionMastEntity>()
            .AsNoTracking()
            .Include(r => r.Periods.Where(p => p.IsActive && !p.MarkedForDeletion).OrderBy(p => p.PeriodNo))
            .FirstOrDefaultAsync(r => r.Id == revisionId && r.IsActive && !r.MarkedForDeletion, cancellationToken);
    }

    public Task<List<RevisionPeriodEntity>> GetPeriodsAsync(long revisionId, CancellationToken cancellationToken = default)
    {
        return _context.Set<RevisionPeriodEntity>()
            .AsNoTracking()
            .Where(p => p.RevisionMastId == revisionId && p.IsActive && !p.MarkedForDeletion)
            .OrderBy(p => p.PeriodNo)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<RevisionMastEntity> Items, int TotalCount)> GetHistoryAsync(
        int propertyId,
        int pageNumber,
        int pageSize,
        RevisionStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Set<RevisionMastEntity>()
            .AsNoTracking()
            .Where(r => r.PropertyId == propertyId && r.IsActive && !r.MarkedForDeletion);

        if (status.HasValue)
        {
            query = query.Where(r => r.RevisionStatus == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var (_, _, skip, take) = PaginationHelper.Calculate(pageNumber, pageSize, totalCount);

        var items = await query
            .OrderByDescending(r => r.RevisionNo)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<bool> HasOpenRevisionAsync(
        int propertyId,
        int financeYearId,
        CancellationToken cancellationToken = default)
    {
        return _context.Set<RevisionMastEntity>()
            .AsNoTracking()
            .AnyAsync(
                r => r.PropertyId == propertyId
                     && r.FinanceYearId == financeYearId
                     && r.IsActive
                     && !r.MarkedForDeletion
                     && (r.RevisionStatus == RevisionStatus.DRAFT || r.RevisionStatus == RevisionStatus.CALCULATED || r.RevisionStatus == RevisionStatus.APPROVED),
                cancellationToken);
    }
}
