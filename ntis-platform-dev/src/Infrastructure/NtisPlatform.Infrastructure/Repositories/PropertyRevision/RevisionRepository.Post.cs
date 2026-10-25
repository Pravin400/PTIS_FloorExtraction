using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Models.Revision;

namespace NtisPlatform.Infrastructure.Repositories.PropertyRevision;

/// <summary>
/// Posting. Pure C# port of the former usp_Revision_Post.
///   HISTORY_ONLY : the normal API already wrote the live tax/demand rows; we only link the
///                  TransMast rows were already copied into RevisionTransMast by the capture step.
///   PERIOD_WISE  : aggregate the per-period policy-tax rows, replace the live
///                  PolicyTaxDetails / PolicyTaxDetailsCV / TransMast rows and write the trace rows.
/// Either way the revision ends POSTED + IsCurrent (previous current revision is un-set).
/// </summary>
public partial class RevisionRepository
{
    private async Task<RevisionPostResult> PostCoreAsync(
        long revisionMastId,
        int? approvedBy,
        CancellationToken ct)
    {
        var mast = await _context.Set<RevisionMastEntity>()
            .FirstOrDefaultAsync(r => r.Id == revisionMastId && r.IsActive && !r.MarkedForDeletion, ct)
            ?? throw new RevisionNotFoundException(revisionMastId);

        if (mast.RevisionStatus != RevisionStatus.APPROVED)
        {
            throw new RevisionConflictException(
                $"Revision {revisionMastId} is {mast.RevisionStatus} - only an APPROVED revision can be posted.");
        }

        // ---- every required snapshot must exist ------------------------------------------
        if (mast.CalculationScope == RevisionCalculationScope.HISTORY_ONLY)
        {
            var hasSnapshot = await _context.Set<RevisionPropertyMastEntity>()
                .AnyAsync(r => r.RevisionMastId == revisionMastId
                               && r.RevisionPeriodId == null
                               && r.IsActive
                               && !r.MarkedForDeletion, ct);
            if (!hasSnapshot)
            {
                throw new RevisionValidationException("HISTORY_ONLY final snapshot has not been captured.");
            }
        }
        else
        {
            var periodIds = await _context.Set<RevisionPeriodEntity>()
                .AsNoTracking()
                .Where(p => p.RevisionMastId == revisionMastId && p.IsActive && !p.MarkedForDeletion)
                .Select(p => p.Id)
                .ToListAsync(ct);

            var capturedPeriodIds = await _context.Set<RevisionPropertyMastEntity>()
                .AsNoTracking()
                .Where(r => r.RevisionMastId == revisionMastId
                            && r.RevisionPeriodId != null
                            && r.IsActive
                            && !r.MarkedForDeletion)
                .Select(r => r.RevisionPeriodId!.Value)
                .ToListAsync(ct);

            if (periodIds.Any(id => !capturedPeriodIds.Contains(id)))
            {
                throw new RevisionValidationException(
                    "One or more revision periods do not have a captured snapshot.");
            }
        }

        var now = DateTime.Now;

        // ---- publish approved property snapshot to live tables --------------------------
        await PublishApprovedPropertySnapshotToLiveAsync(mast, approvedBy, now, ct);

        // ---- financial effect ------------------------------------------------------------
        if (mast.CalculationScope == RevisionCalculationScope.PERIOD_WISE)
        {
            await ReplaceLiveTaxFromPeriodsAsync(mast, approvedBy, ct);
        }

        // ---- this revision becomes the current posted revision ----------------------------
        // Two saves: the filtered unique index (one current revision per property + FY) must
        // never see two IsCurrent rows at once.
        var previouslyCurrent = await _context.Set<RevisionMastEntity>()
            .Where(r => r.PropertyId == mast.PropertyId
                        && r.FinanceYearId == mast.FinanceYearId
                        && r.Id != revisionMastId
                        && r.IsCurrent
                        && r.IsActive
                        && !r.MarkedForDeletion)
            .ToListAsync(ct);
        foreach (var other in previouslyCurrent)
        {
            other.IsCurrent = false;
            other.UpdatedBy = approvedBy;
            other.UpdatedDate = now;
        }

        if (previouslyCurrent.Count > 0)
        {
            await _context.SaveChangesAsync(ct);
        }

        mast.RevisionStatus = RevisionStatus.POSTED;
        mast.IsCurrent = true;
        mast.ApprovedBy ??= approvedBy;
        mast.ApprovedDate ??= now;
        mast.UpdatedBy = approvedBy;
        mast.UpdatedDate = now;
        await _context.SaveChangesAsync(ct);

        return new RevisionPostResult
        {
            RevisionMastId = mast.Id,
            PropertyId = mast.PropertyId,
            FinanceYearId = mast.FinanceYearId,
            CalculationScope = mast.CalculationScope.ToString(),
            CalculationType = mast.CalculationType.ToString(),
            RevisionStatus = RevisionStatus.POSTED.ToString()
        };
    }

    /// <summary>
    /// PERIOD_WISE posting: replace the current live policy-tax and TransMast rows for the
    /// (policy, tax) pairs this revision covers with the per-period totals, and trace every
    /// period contribution back to the new TransMast row.
    /// </summary>
    private async Task ReplaceLiveTaxFromPeriodsAsync(
        RevisionMastEntity mast,
        int? userId,
        CancellationToken ct)
    {
        var propertyId = mast.PropertyId;
        var financeYearId = mast.FinanceYearId;
        var now = DateTime.Now;

        if (mast.CalculationType == RevisionCalculationType.RV || mast.CalculationType == RevisionCalculationType.BOTH)
        {
            var revisionRows = await _context.Set<RevisionPolicyTaxDetailsEntity>()
                .AsNoTracking()
                .Where(r => r.RevisionMastId == mast.Id && r.IsActive && !r.MarkedForDeletion)
                .ToListAsync(ct);

            var rvResults = await _context.Set<RevisionRVCalculationResultsEntity>()
                .AsNoTracking()
                .Where(r => r.RevisionMastId == mast.Id && r.IsActive && !r.MarkedForDeletion)
                .ToListAsync(ct);

            if (revisionRows.Count == 0 || rvResults.Count == 0)
            {
                throw new RevisionValidationException(
                    $"Cannot post revision: RV calculation results or policy tax rows are missing or incomplete for RevisionId={mast.Id}.");
            }

            var periodCalc = rvResults
                .GroupBy(r => r.RevisionPeriodId)
                .ToDictionary(
                    g => g.Key,
                    g => (AnnualRentalValue: g.Sum(x => x.PeriodAnnualRentalValue ?? 0m),
                          RateableValue: g.Sum(x => x.PeriodRateableValue ?? 0m)));

            var pairs = revisionRows.Select(r => (r.PolicyCodeId, r.TaxId)).ToHashSet();

            // Retire all existing live RV policy-tax and TransMast rows for this property and year (including any removed tax heads).
            var livePolicyTax = await _context.Set<PolicyTaxDetailsEntity>()
                .Where(p => p.PropertyId == propertyId && p.IsCurrent && p.IsActive && !p.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var p in livePolicyTax)
            {
                p.IsCurrent = false;
                p.IsActive = false;
                p.MarkedForDeletion = true;
                p.MarkedForDeletionDate = now;
                p.UpdatedBy = userId;
                p.UpdatedDate = now;
            }

            var liveTransMast = await _context.Set<TransMastEntity>()
                .Where(t => t.PropertyId == propertyId
                            && t.FinanceYearId == financeYearId
                            && t.CalculationType == "RV"
                            && t.IsActive
                            && !t.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var t in liveTransMast)
            {
                t.IsActive = false;
                t.MarkedForDeletion = true;
                t.MarkedForDeletionDate = now;
                t.UpdatedBy = userId;
                t.UpdatedDate = now;
            }

            // Per (policy, tax) totals across all periods.
            var totals = revisionRows
                .GroupBy(r => (r.PolicyCodeId, r.TaxId))
                .Select(g =>
                {
                    decimal annual = 0m, value = 0m;
                    foreach (var row in g)
                    {
                        if (periodCalc.TryGetValue(row.RevisionPeriodId, out var pc))
                        {
                            annual += pc.AnnualRentalValue;
                            value += pc.RateableValue;
                        }
                    }

                    return new
                    {
                        g.Key.PolicyCodeId,
                        g.Key.TaxId,
                        TaxAmount = g.Sum(x => x.TaxAmount ?? 0m),
                        CalculationAnnualValue = annual,
                        CalculationValue = value
                    };
                })
                .ToList();

            foreach (var t in totals)
            {
                _context.Set<PolicyTaxDetailsEntity>().Add(new PolicyTaxDetailsEntity
                {
                    PropertyId = propertyId,
                    PolicyCodeId = t.PolicyCodeId,
                    CalculationValue = t.CalculationValue,
                    TaxId = t.TaxId,
                    TaxAmount = t.TaxAmount,
                    IsCurrent = true,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedBy = userId,
                    CreatedDate = now
                });

                _context.Set<TransMastEntity>().Add(new TransMastEntity
                {
                    PropertyId = propertyId,
                    FinanceYearId = financeYearId,
                    CalculationType = "RV",
                    CalculationAnnualValue = t.CalculationAnnualValue,
                    CalculationValue = t.CalculationValue,
                    TaxId = t.TaxId,
                    TaxAmount = t.TaxAmount,
                    PolicyCodeId = t.PolicyCodeId,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedBy = userId,
                    CreatedDate = now
                });
            }

            await _context.SaveChangesAsync(ct);
        }

        if (mast.CalculationType == RevisionCalculationType.CV || mast.CalculationType == RevisionCalculationType.BOTH)
        {
            var revisionRows = await _context.Set<RevisionPolicyTaxDetailsCVEntity>()
                .AsNoTracking()
                .Where(r => r.RevisionMastId == mast.Id && r.IsActive && !r.MarkedForDeletion)
                .ToListAsync(ct);

            var cvResults = await _context.Set<RevisionPropertyTaxCalculationCVResultsEntity>()
                .AsNoTracking()
                .Where(r => r.RevisionMastId == mast.Id && r.IsActive && !r.MarkedForDeletion)
                .ToListAsync(ct);

            if (revisionRows.Count == 0 || cvResults.Count == 0)
            {
                throw new RevisionValidationException(
                    $"Cannot post revision: CV calculation results or policy tax rows are missing or incomplete for RevisionId={mast.Id}.");
            }

            // Capital value per period = sum over details of the (max) period capital value.
            var periodCv = cvResults
                .GroupBy(r => (r.RevisionPeriodId, r.RevisionPropertyDetailsId))
                .Select(g => (Period: g.Key.RevisionPeriodId, Value: g.Max(x => x.PeriodCapitalValue ?? 0m)))
                .GroupBy(x => x.Period)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Value));

            var pairs = revisionRows.Select(r => (r.PolicyCodeId, r.TaxId)).ToHashSet();

            // Retire all existing live CV policy-tax and TransMast rows for this property and year (including any removed tax heads).
            var livePolicyTax = await _context.Set<PolicyTaxDetailsCVEntity>()
                .Where(p => p.PropertyId == propertyId && p.IsCurrent && p.IsActive && !p.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var p in livePolicyTax)
            {
                p.IsCurrent = false;
                p.IsActive = false;
                p.MarkedForDeletion = true;
                p.MarkedForDeletionDate = now;
                p.UpdatedBy = userId;
                p.UpdatedDate = now;
            }

            var liveTransMast = await _context.Set<TransMastEntity>()
                .Where(t => t.PropertyId == propertyId
                            && t.FinanceYearId == financeYearId
                            && t.CalculationType == "CV"
                            && t.IsActive
                            && !t.MarkedForDeletion)
                .ToListAsync(ct);
            foreach (var t in liveTransMast)
            {
                t.IsActive = false;
                t.MarkedForDeletion = true;
                t.MarkedForDeletionDate = now;
                t.UpdatedBy = userId;
                t.UpdatedDate = now;
            }

            var totals = revisionRows
                .GroupBy(r => (r.PolicyCodeId, r.TaxId))
                .Select(g =>
                {
                    decimal value = 0m;
                    foreach (var row in g)
                    {
                        if (periodCv.TryGetValue(row.RevisionPeriodId, out var pcv))
                        {
                            value += pcv;
                        }
                    }

                    return new
                    {
                        g.Key.PolicyCodeId,
                        g.Key.TaxId,
                        TaxAmount = g.Sum(x => x.TaxAmount ?? 0m),
                        CalculationValue = value
                    };
                })
                .ToList();

            foreach (var t in totals)
            {
                _context.Set<PolicyTaxDetailsCVEntity>().Add(new PolicyTaxDetailsCVEntity
                {
                    PropertyId = propertyId,
                    PolicyCodeId = t.PolicyCodeId,
                    CalculationValue = t.CalculationValue,
                    TaxId = t.TaxId,
                    TaxAmount = t.TaxAmount,
                    IsCurrent = true,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedBy = userId,
                    CreatedDate = now
                });

                _context.Set<TransMastEntity>().Add(new TransMastEntity
                {
                    PropertyId = propertyId,
                    FinanceYearId = financeYearId,
                    CalculationType = "CV",
                    CalculationAnnualValue = 0m,
                    CalculationValue = t.CalculationValue,
                    TaxId = t.TaxId,
                    TaxAmount = t.TaxAmount,
                    PolicyCodeId = t.PolicyCodeId,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedBy = userId,
                    CreatedDate = now
                });
            }

            await _context.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// Atomically syncs the approved property snapshot row to the live PropertyMast entity on post.
    /// </summary>
    private async Task PublishApprovedPropertySnapshotToLiveAsync(
        RevisionMastEntity mast,
        int? userId,
        DateTime now,
        CancellationToken ct)
    {
        var snapshot = await _context.Set<RevisionPropertyMastEntity>()
            .Where(r => r.RevisionMastId == mast.Id && r.IsActive && !r.MarkedForDeletion)
            .OrderByDescending(r => r.RevisionPeriodId)
            .FirstOrDefaultAsync(ct);

        if (snapshot is null) return;

        var liveProp = await _context.Set<PropertyEntity>()
            .FirstOrDefaultAsync(p => p.Id == mast.PropertyId && p.IsActive && !p.MarkedForDeletion, ct);

        if (liveProp != null)
        {
            liveProp.TaxZoneId = snapshot.TaxZoneId;
            liveProp.WardId = snapshot.WardId;
            liveProp.PropertyNo = snapshot.PropertyNo;
            liveProp.PartitionNo = snapshot.PartitionNo;
            liveProp.PropertySeqNo = snapshot.PropertySeqNo;
            liveProp.PropertyTypeId = snapshot.PropertyTypeId;
            liveProp.UPICId = snapshot.UPICId;
            liveProp.MoujaId = snapshot.MoujaId;
            liveProp.CSN = snapshot.CSN;
            liveProp.SubZoneNo = snapshot.SubZoneNo;
            liveProp.PlotNo = snapshot.PlotNo;
            liveProp.CategoryId = snapshot.CategoryId;
            liveProp.Type = snapshot.Type;
            liveProp.OwnerTitle = snapshot.OwnerTitle;
            liveProp.OwnerName = snapshot.OwnerName;
            liveProp.OwnerTitleEnglish = snapshot.OwnerTitleEnglish;
            liveProp.OwnerNameEnglish = snapshot.OwnerNameEnglish;
            liveProp.OccupierTitle = snapshot.OccupierTitle;
            liveProp.OccupierName = snapshot.OccupierName;
            liveProp.OccupierTitleEnglish = snapshot.OccupierTitleEnglish;
            liveProp.OccupierNameEnglish = snapshot.OccupierNameEnglish;
            liveProp.FlatOrShopNo = snapshot.FlatOrShopNo;
            liveProp.FlatOrShopName = snapshot.FlatOrShopName;
            liveProp.FlatOrShopNoEnglish = snapshot.FlatOrShopNoEnglish;
            liveProp.FlatOrShopNameEnglish = snapshot.FlatOrShopNameEnglish;
            liveProp.Address = snapshot.Address;
            liveProp.AddressEnglish = snapshot.AddressEnglish;
            liveProp.PinCode = snapshot.PinCode;
            liveProp.Location = snapshot.Location;
            liveProp.LocationEnglish = snapshot.LocationEnglish;
            liveProp.MobileNo = snapshot.MobileNo;
            liveProp.MobileNoRemarkId = snapshot.MobileNoRemarkId;
            liveProp.AlternateMobileNo = snapshot.AlternateMobileNo;
            liveProp.OccupierMobileNo = snapshot.OccupierMobileNo;
            liveProp.OccupierMobileNoRemarkId = snapshot.OccupierMobileNoRemarkId;
            liveProp.EmailId = snapshot.EmailId;
            liveProp.WingDetailId = snapshot.WingDetailId;
            liveProp.PropertyAssessmentStatusId = snapshot.PropertyAssessmentStatusId;
            liveProp.PropertyFloorId = snapshot.PropertyFloorId;
            liveProp.UpdatedBy = userId;
            liveProp.UpdatedDate = now;
        }
    }
}
