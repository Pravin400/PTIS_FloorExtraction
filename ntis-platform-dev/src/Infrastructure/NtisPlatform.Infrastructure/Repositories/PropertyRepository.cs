using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.PropertyWorkflowDetails;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Utilities;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Enums;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;
using NtisPlatform.Infrastructure.Data;
using System.Reflection;

namespace NtisPlatform.Infrastructure.Repositories;

/// <summary>
/// Specialized repository implementation for Property entity
/// Provides custom query methods for property-related operations
/// </summary>
public class PropertyRepository : Repository<PropertyEntity, int>, IPropertyRepository
{
    private readonly IFinanceYearProvider _financeYearProvider;

    public PropertyRepository(ApplicationDbContext context, IFinanceYearProvider financeYearProvider) : base(context)
    {
        _financeYearProvider = financeYearProvider;
    }

    public async Task<PropertyTaxDetailsDto?> GetTaxDetailsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var policies = await GetTaxDetailsPivotedAsync(
            propertyId,
            isCapitalValue: false,
            excludeEducationEmploymentTax: true,  // Hide education/employment tax in details-taxes API
            cancellationToken);

        if (policies == null)
            return null;

        return new PropertyTaxDetailsDto
        {
            PropertyId = propertyId,
            Policies = policies
        };
    }

    /// <summary>
    /// Private helper method to query and pivot tax details from a given tax details table.
    /// Joins with TaxMaster, filters by active/deleted flags, orders by DisplayOrder, and groups by PolicyCode.
    /// </summary>
    /// <param name="propertyId">The property identifier</param>
    /// <param name="isCapitalValue">Whether to query CapitalValue or RateableValue tax details</param>
    /// <param name="excludeEducationEmploymentTax">If true, excludes Education and Employment taxes from results</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of pivoted PolicyTaxDetail objects, or null if property not found or no data exists</returns>
    private async Task<List<PolicyTaxDetail>?> GetTaxDetailsPivotedAsync(
        int propertyId,
        bool isCapitalValue,
        bool excludeEducationEmploymentTax = false,
        CancellationToken cancellationToken = default)
    {
        // Step 1: Check if property exists
        var propertyExists = await _context.PropertyMast
            .AnyAsync(p => p.Id == propertyId && p.IsActive && !p.MarkedForDeletion, cancellationToken);

        if (!propertyExists)
            return null;

        // Step 2: Query tax details with TaxMaster join, ordered by PolicyCodeMaster Id and TaxMaster DisplayOrder
        List<(string PolicyCode, string PolicyName, string TaxNameAlias, decimal? TaxAmount, int TaxId, int PolicyCodeId)> taxData;

        if (isCapitalValue)
        {
            // PolicyTaxDetailsCV has no separate display name column, so the code itself is used
            // as the name (matching the RV side's fallback when PolicyCodeMaster is missing).
            taxData = await (from td in _context.PolicyTaxDetailsCV
                             join tm in _context.TaxMaster on td.TaxId equals tm.Id
                             join tc in _context.TaxCategoryMaster on tm.TaxCategoryId equals tc.Id
                             join pcm in _context.PolicyCodeMaster on td.PolicyCodeId equals pcm.Id into pcmJoin
                             from pcm in pcmJoin.DefaultIfEmpty()
                             where td.PropertyId == propertyId && td.IsActive && !td.MarkedForDeletion
                                && tm.IsActive && (pcm == null || pcm.IsActive)
                             orderby pcm != null ? pcm.Id : 999, tm.DisplayOrder
                             select new ValueTuple<string, string, string, decimal?, int, int>(
                                 pcm != null ? pcm.PolicyCode : string.Empty,
                                 pcm != null ? pcm.PolicyCode : string.Empty,
                                 (!string.IsNullOrEmpty(tm.TaxNameAlias) ? tm.TaxNameAlias : tm.TaxName) ?? string.Empty,
                                 td.TaxAmount,
                                 td.TaxId,
                                 pcm != null ? pcm.Id : 999
                             ))
                            .ToListAsync(cancellationToken);
        }
        else
        {
            // DBA/lead/business-confirmed schema: PolicyTaxDetails holds exactly ONE active row per
            // (PropertyId, PolicyCodeId, TaxId) -- the CURRENT state only, no per-year history and no
            // PolicyYear column. Retro/arrears years live only in TaxPendingDetails/TaxPendingDetailsRetro,
            // never here, so no year-based filter is needed: IsActive/MarkedForDeletion already scope
            // this query to the property's current, active determination.
            taxData = await (from td in _context.PolicyTaxDetails
                             join tm in _context.TaxMaster on td.TaxId equals tm.Id
                             join tc in _context.TaxCategoryMaster on tm.TaxCategoryId equals tc.Id
                             join pcm in _context.PolicyCodeMaster on td.PolicyCodeId equals pcm.Id into pcmJoin
                             from pcm in pcmJoin.DefaultIfEmpty()
                             where td.PropertyId == propertyId && td.IsActive && !td.MarkedForDeletion
                                && tm.IsActive && (pcm == null || pcm.IsActive)
                             orderby pcm != null ? pcm.Id : 999, tm.DisplayOrder
                             select new ValueTuple<string, string, string, decimal?, int, int>(
                                 pcm != null ? pcm.PolicyCode : string.Empty,
                                 pcm != null ? pcm.PolicyName : string.Empty,
                                 (!string.IsNullOrEmpty(tm.TaxNameAlias) ? tm.TaxNameAlias : tm.TaxName) ?? string.Empty,
                                 td.TaxAmount,
                                 td.TaxId,
                                 pcm != null ? pcm.Id : 999
                             ))
                            .ToListAsync(cancellationToken);
        }

        // Step 3: Return null if no tax details found
        if (taxData.Count == 0)
            return null;

        // Step 3b (RV only): PolicyTaxDetails holds the raw annual Rateable Value amount, but
        // OccupationTaxApplicationService writes certificate-driven (prorated/retrospective)
        // amounts for the CURRENT finance year into TransMast, not back into PolicyTaxDetails.
        // Without this, the Tax Details panel would never reflect a CC/OC/Electricity-Bill date
        // change even though the certificate-change pipeline ran successfully end-to-end. Use the
        // TransMast amount per TaxId when one exists for the current finance year; otherwise fall
        // back to the raw PolicyTaxDetails amount (e.g. the certificate-change pipeline has never
        // run for this property yet). Safe now that taxData (above) is itself already filtered to
        // the current finance year -- this can no longer misattribute a retro year's row.
        Dictionary<int, decimal> transMastOverridesByTaxId = new();
        var liveCurrentYear = _financeYearProvider.GetCurrentFinanceYear();
        int? currentFinanceYearId = null;
        if (!isCapitalValue)
        {
            currentFinanceYearId = await _context.YearMaster
                .Where(y => y.Year == liveCurrentYear)
                .Select(y => (int?)y.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (currentFinanceYearId.HasValue)
            {
                transMastOverridesByTaxId = await _context.TransMast
                    .Where(tm => tm.PropertyId == propertyId
                        && tm.FinanceYearId == currentFinanceYearId.Value
                        && tm.CalculationType == "RV"
                        && tm.IsActive
                        && !tm.MarkedForDeletion)
                    .GroupBy(tm => tm.TaxId)
                    .Select(g => new { TaxId = g.Key, Amount = g.Sum(x => x.TaxAmount) })
                    .ToDictionaryAsync(x => x.TaxId, x => x.Amount, cancellationToken);
            }
        }

        var policyGroupCount = taxData.Select(x => x.Item1).Distinct(StringComparer.OrdinalIgnoreCase).Count();

        // Step 4: Group by PolicyCode and create pivoted structure
        var policies = taxData
            .GroupBy(x => new { PolicyCode = x.Item1, PolicyCodeId = x.Item6 })
            .OrderBy(g => g.Key.PolicyCodeId)
            .Select(g =>
            {
                var policyCode = g.Key.PolicyCode;
                var policyName = g.First().Item2;
                var isNetTax = string.Equals(policyCode, "NETTAX", StringComparison.OrdinalIgnoreCase);

                var allTaxAmounts = g
                    .GroupBy(x => x.Item3)
                    .Select(tg => new TaxAmountDetail
                    {
                        TaxName = tg.Key,
                        // Apply the TransMast override once per distinct TaxId for certificate policy rows
                        // (PARTIAL_OC, OC, etc.), or for NETTAX when it is the single policy group present.
                        // Baseline NETTAX must NOT be overridden when certificate policy rows co-exist so that
                        // the UI can display both base NETTAX and the prorated certificate tax line item.
                        TaxAmount = tg
                            .GroupBy(x => x.Item5)
                            .Sum(taxIdGroup => (!isNetTax || policyGroupCount == 1) && transMastOverridesByTaxId.TryGetValue(taxIdGroup.Key, out var overridden)
                                ? overridden
                                : taxIdGroup.Sum(x => x.Item4 ?? 0))
                    })
                    .ToList();

                var taxAmounts = allTaxAmounts;

                // Sum individual tax components (excluding TaxTotal row if present to avoid double counting)
                var taxTotal = allTaxAmounts
                    .Where(t => !string.Equals(t.TaxName, "TaxTotal", StringComparison.OrdinalIgnoreCase)
                             && !string.Equals(t.TaxName, "Tax Total", StringComparison.OrdinalIgnoreCase))
                    .Sum(t => t.TaxAmount);

                // If TaxTotal / Tax Total row exists and is 0, sync it with the computed taxTotal
                var taxTotalRow = allTaxAmounts.FirstOrDefault(t =>
                    string.Equals(t.TaxName, "TaxTotal", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(t.TaxName, "Tax Total", StringComparison.OrdinalIgnoreCase));
                if (taxTotalRow != null && taxTotalRow.TaxAmount == 0m)
                {
                    taxTotalRow.TaxAmount = taxTotal;
                }

                return new PolicyTaxDetail
                {
                    PolicyCode = policyCode,
                    PolicyName = policyName,
                    TaxAmounts = taxAmounts
                };
            })
            .ToList();

        // Step 5 (RV only): attach the year-wise retro/arrears breakdown from
        // TaxPendingDetailsRetro (joined with YearMaster for its YearCode) onto whichever policy
        // group(s) belong to the certificate-tax family (OC/CC/Electric-Bill and their PARTIAL_
        // variants) -- this is purely additive display data alongside the current-year TaxAmounts
        // computed above; it does not change what those current-year figures are, and it does not
        // reintroduce retro-year rows into the main taxData query (Step 2 above still correctly
        // filters PolicyTaxDetails to the current finance year only).
        if (!isCapitalValue)
        {
            // The retro years below are the property's retrospective LEDGER (the TransMast rows the engine
            // keeps), so they are shown as they are. They used to be cut off at the earliest certificate of the
            // property's OWN, which hid ledger years whenever the evidence sat at Wing / Society level or a
            // unit's own certificate came after the apartment's (the screen then showed less than was billed).
            var currentAssessmentYear = liveCurrentYear;
            if (currentFinanceYearId.HasValue)
            {
                var yearVal = await _context.YearMaster
                    .Where(y => y.Id == currentFinanceYearId.Value)
                    .Select(y => (int?)y.Year)
                    .FirstOrDefaultAsync(cancellationToken);
                if (yearVal.HasValue)
                {
                    currentAssessmentYear = yearVal.Value;
                }
            }

            // Migrated ULB arrears -- PTIS.TransMast rows tagged PolicyCode = OLD_ARREARS (see
            // RetrospectiveTaxCalculationEngineService.SyncPolicyTaxAndTransMastAsync, the writer).
            var summaryPendingRowsRaw = await (from tm2 in _context.TransMast
                                               join ym in _context.YearMaster on tm2.FinanceYearId equals ym.Id
                                               join tm in _context.TaxMaster on tm2.TaxId equals tm.Id
                                               join pcm in _context.PolicyCodeMaster on tm2.PolicyCodeId equals pcm.Id
                                               where tm2.PropertyId == propertyId && tm2.IsActive && !tm2.MarkedForDeletion && tm.IsActive
                                                  && pcm.PolicyCode == PolicyCodes.OldArrears
                                                  && ym.Year < currentAssessmentYear
                                               select new
                                               {
                                                   PendingYearId = tm2.FinanceYearId,
                                                   ym.YearCode,
                                                   ym.Year,
                                                   ym.StartDate,
                                                   TaxNameAlias = (!string.IsNullOrEmpty(tm.TaxNameAlias) ? tm.TaxNameAlias : tm.TaxName) ?? string.Empty,
                                                   PendingAmount = tm2.TaxAmount,
                                                   tm.DisplayOrder
                                               }).ToListAsync(cancellationToken);

            // Retrospective demand -- PTIS.TransMast rows whose policy is flagged IsRetroDemand
            // (OC/CC/Electric Bill and their PARTIAL_ variants).
            var retroPendingRowsRaw = await (from tm2 in _context.TransMast
                                             join ym in _context.YearMaster on tm2.FinanceYearId equals ym.Id
                                             join tm in _context.TaxMaster on tm2.TaxId equals tm.Id
                                             join pcm in _context.PolicyCodeMaster on tm2.PolicyCodeId equals pcm.Id
                                             where tm2.PropertyId == propertyId && tm2.IsActive && !tm2.MarkedForDeletion && tm.IsActive
                                                && pcm.IsRetroDemand
                                                && ym.Year < currentAssessmentYear
                                             select new
                                             {
                                                 PendingYearId = tm2.FinanceYearId,
                                                 ym.YearCode,
                                                 ym.Year,
                                                 ym.StartDate,
                                                 PolicyCode = pcm.PolicyCode,
                                                 TaxNameAlias = (!string.IsNullOrEmpty(tm.TaxNameAlias) ? tm.TaxNameAlias : tm.TaxName) ?? string.Empty,
                                                 PendingAmount = tm2.TaxAmount,
                                                 tm.DisplayOrder
                                             }).ToListAsync(cancellationToken);

            // Initialize PendingYears list for all existing policies
            foreach (var policy in policies)
            {
                policy.PendingYears = new List<PendingYearTaxDetail>();
            }

            // Find the Arrears policy group -- only created below when there is actual summary
            // pending data to attach, so properties with no arrears never show an empty group.
            var arrearsPolicy = policies.FirstOrDefault(p => p.PolicyCode.Equals("Arrears", StringComparison.OrdinalIgnoreCase));

            // Map summary pending rows from TaxPendingDetails to Arrears policy group
            if (summaryPendingRowsRaw.Any())
            {
                if (arrearsPolicy == null)
                {
                    arrearsPolicy = new PolicyTaxDetail
                    {
                        PolicyCode = "Arrears",
                        PolicyName = "Arrears",
                        TaxAmounts = new List<TaxAmountDetail>(),
                        PendingYears = new List<PendingYearTaxDetail>()
                    };
                    policies.Add(arrearsPolicy);
                }

                var summaryPendingYears = summaryPendingRowsRaw
                    .GroupBy(r => new { r.PendingYearId, r.YearCode, r.Year })
                    .OrderBy(g => g.Key.Year)
                    .Select(gy =>
                    {
                        var amounts = gy
                            .OrderBy(r => r.DisplayOrder)
                            .Select(r => new TaxAmountDetail
                            {
                                TaxName = r.TaxNameAlias,
                                TaxAmount = r.PendingAmount
                            })
                            .ToList();

                        var totalSum = amounts
                            .Where(r => !string.Equals(r.TaxName, "TaxTotal", StringComparison.OrdinalIgnoreCase)
                                     && !string.Equals(r.TaxName, "Tax Total", StringComparison.OrdinalIgnoreCase))
                            .Sum(a => a.TaxAmount);

                        return new PendingYearTaxDetail
                        {
                            PendingYearId = gy.Key.PendingYearId,
                            YearCode = gy.Key.YearCode,
                            PolicyCode = "Arrears",
                            TaxAmounts = amounts,
                            TaxTotal = totalSum
                        };
                    })
                    .ToList();

                arrearsPolicy.PendingYears = summaryPendingYears;
            }

            // Map retro pending rows from TaxPendingDetailsRetro to Certificate policy groups
            if (retroPendingRowsRaw.Any())
            {
                // The certificate family a year was charged under is whatever the retrospective engine wrote
                // for THAT year: the policy of the year's own TransMast row (OC / CC / ELECTRIC_BILL, or the
                // PARTIAL_ form of one of them, which shares its family's column). It is not re-derived from
                // the property's own certificates -- a unit covered by a Wing / Society certificate has none
                // of its own (every year came out as a generic "RETROSPECTIVE"), and a unit whose own OC is
                // later than the apartment's CC had its CC years labelled "OC".
                static string ResolveYearPolicyCode(string policyCode)
                {
                    const string partialPrefix = "PARTIAL_";
                    var code = (policyCode ?? string.Empty).Trim();
                    return code.StartsWith(partialPrefix, StringComparison.OrdinalIgnoreCase)
                        ? code[partialPrefix.Length..]
                        : code;
                }

                var retroPendingYears = retroPendingRowsRaw
                    .Select(x =>
                    {
                        int startYear;
                        if (x.StartDate.HasValue) startYear = x.StartDate.Value.Year;
                        else if (!string.IsNullOrEmpty(x.YearCode) && int.TryParse(x.YearCode.Split('-')[0].Trim(), out var parsed)) startYear = parsed;
                        else startYear = x.Year;
                        return new
                        {
                            x.PendingYearId,
                            x.YearCode,
                            Year = startYear,
                            x.PolicyCode,
                            x.TaxNameAlias,
                            x.PendingAmount,
                            x.DisplayOrder
                        };
                    })
                    .Where(x => x.Year < currentAssessmentYear)
                    .GroupBy(r => new { r.PendingYearId, r.YearCode, r.Year, r.PolicyCode })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.PolicyCode, StringComparer.OrdinalIgnoreCase)
                    .Select(gy =>
                    {
                        var amounts = gy
                            .OrderBy(r => r.DisplayOrder)
                            .Select(r => new TaxAmountDetail
                            {
                                TaxName = r.TaxNameAlias,
                                TaxAmount = r.PendingAmount
                            })
                            .ToList();

                        var totalSum = amounts
                            .Where(r => !string.Equals(r.TaxName, "TaxTotal", StringComparison.OrdinalIgnoreCase)
                                     && !string.Equals(r.TaxName, "Tax Total", StringComparison.OrdinalIgnoreCase))
                            .Sum(a => a.TaxAmount);

                        return new PendingYearTaxDetail
                        {
                            PendingYearId = gy.Key.PendingYearId,
                            YearCode = gy.Key.YearCode,
                            PolicyCode = ResolveYearPolicyCode(gy.Key.PolicyCode),
                            TaxAmounts = amounts,
                            TaxTotal = totalSum
                        };
                    })
                    .ToList();

                foreach (var pendingYear in retroPendingYears)
                {
                    var bestPolicy = policies.FirstOrDefault(p =>
                        !p.PolicyCode.Equals("NETTAX", StringComparison.OrdinalIgnoreCase) &&
                        !p.PolicyCode.Equals("Arrears", StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(p.PolicyCode, pendingYear.PolicyCode, StringComparison.OrdinalIgnoreCase));

                    if (bestPolicy == null && !string.IsNullOrWhiteSpace(pendingYear.PolicyCode))
                    {
                        bestPolicy = policies.FirstOrDefault(p =>
                            !string.IsNullOrWhiteSpace(p.PolicyCode) &&
                            !p.PolicyCode.Equals("NETTAX", StringComparison.OrdinalIgnoreCase) &&
                            !p.PolicyCode.Equals("Arrears", StringComparison.OrdinalIgnoreCase) &&
                            (p.PolicyCode.Contains(pendingYear.PolicyCode, StringComparison.OrdinalIgnoreCase) ||
                             pendingYear.PolicyCode.Contains(p.PolicyCode, StringComparison.OrdinalIgnoreCase)));
                    }

                    if (bestPolicy == null)
                    {
                        var retroPolicyCode = pendingYear.PolicyCode;
                        var policyMasterRow = await _context.PolicyCodeMaster
                            .AsNoTracking()
                            .FirstOrDefaultAsync(p => p.PolicyCode == retroPolicyCode, cancellationToken);

                        var policyName = policyMasterRow?.PolicyName ?? retroPolicyCode switch
                        {
                            "CC" => "Completion Certificate",
                            "OC" => "Occupancy Certificate",
                            "ELECTRIC_BILL" => "Electricity Bill",
                            _ => retroPolicyCode
                        };

                        bestPolicy = new PolicyTaxDetail
                        {
                            PolicyCode = retroPolicyCode,
                            PolicyName = policyName,
                            TaxAmounts = new List<TaxAmountDetail>(),
                            PendingYears = new List<PendingYearTaxDetail>()
                        };

                        policies.Add(bestPolicy);
                    }

                    bestPolicy.PendingYears.Add(pendingYear);
                }
            }

        }

        // Filter out zero-tax placeholder policies except NETTAX and Arrears
        policies = policies
            .Where(p => p.PolicyCode.Equals("NETTAX", StringComparison.OrdinalIgnoreCase) ||
                        p.PolicyCode.Equals("Arrears", StringComparison.OrdinalIgnoreCase) ||
                        p.TaxAmounts
                            .Where(t => !string.Equals(t.TaxName, "TaxTotal", StringComparison.OrdinalIgnoreCase)
                                     && !string.Equals(t.TaxName, "Tax Total", StringComparison.OrdinalIgnoreCase))
                            .Sum(t => t.TaxAmount) > 0m ||
                        (p.PendingYears != null && p.PendingYears.Count > 0))
            .ToList();

        // Step 6: order policy groups by PolicyCodeMaster.Id (DBA-configured display order) so the
        // Tax Details grid presents them consistently instead of relying on incidental query order.
        var policyMasterOrder = await _context.PolicyCodeMaster
            .AsNoTracking()
            .Select(p => new { p.PolicyCode, p.Id })
            .ToDictionaryAsync(p => p.PolicyCode, p => p.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);

        policies = policies
            .OrderBy(p => policyMasterOrder.TryGetValue(p.PolicyCode, out var order) ? order : int.MaxValue)
            .ThenBy(p => p.PolicyCode)
            .ToList();

        return policies;
    }

    public async Task<PropertyTaxDetailsCVDto?> GetTaxDetailsCVAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var policies = await GetTaxDetailsPivotedAsync(
            propertyId,
            isCapitalValue: true,
            excludeEducationEmploymentTax: false,  // Show all taxes for CV
            cancellationToken);

        if (policies == null)
            return null;

        return new PropertyTaxDetailsCVDto
        {
            PropertyId = propertyId,
            Policies = policies
        };
    }

    public async Task<PropertyTaxApartmentDetailsDto?> GetAggregatedPropertyTaxDetailsAsync(PropertyApartmentTaxRequestDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedPropertyNo = string.IsNullOrWhiteSpace(dto.PropertyNo) ? null : dto.PropertyNo.ToLower();
        var normalizedPartType = string.IsNullOrWhiteSpace(dto.PartType) ? null : dto.PartType.ToLower();
        var normalizedPartitionNo = string.IsNullOrWhiteSpace(dto.PartitionNo) ? null : dto.PartitionNo.ToLower();

        var totalwingList = await _context.Set<WingEntity>().AsNoTracking()
            .Where(d => d.IsActive && d.WingNo != null)
            .Select(d => d.WingNo.ToLower())
            .ToListAsync(cancellationToken);

        var isPartitionInWingList = normalizedPartitionNo != null && totalwingList.Contains(normalizedPartitionNo);

        List<int> propertyIds;
        if (dto.PropertyId.HasValue)
        {
            var societyQuery = _context.SocietyDetailsMast.AsNoTracking();
            var wingDetailsMastQuery = _context.Set<NtisPlatform.Core.Entities.WingDetailsMastEntity>().AsNoTracking();

            var searchedProperty = await _context.PropertyMast.AsNoTracking().FirstOrDefaultAsync(p => p.Id == dto.PropertyId.Value, cancellationToken);
            var targetPropertyNo = searchedProperty?.PropertyNo;
            var targetWardId = searchedProperty?.WardId;

            var isSociety = searchedProperty != null && await societyQuery.AnyAsync(s => s.IsActive && !s.MarkedForDeletion &&
                _context.PropertyMast.Any(sp => sp.Id == s.PropertyId && sp.PropertyNo == targetPropertyNo && sp.WardId == targetWardId && sp.IsActive && !sp.MarkedForDeletion), cancellationToken);

            if (isSociety && searchedProperty != null)
            {
                propertyIds = await (from pm in _context.PropertyMast.AsNoTracking()
                                     where pm.IsActive && !pm.MarkedForDeletion &&
                                           pm.WingDetailId.HasValue &&
                                           wingDetailsMastQuery.Any(wdm => wdm.Id == pm.WingDetailId.Value && wdm.IsActive && !wdm.MarkedForDeletion &&
                                               societyQuery.Any(s => s.Id == wdm.SocietyDetailsMastId && s.IsActive && !s.MarkedForDeletion &&
                                                   _context.PropertyMast.Any(sp => sp.Id == s.PropertyId && sp.PropertyNo == targetPropertyNo && sp.WardId == targetWardId && sp.IsActive && !sp.MarkedForDeletion)))
                                     select pm.Id)
                                    .ToListAsync(cancellationToken);
            }
            else
            {
                propertyIds = new List<int> { dto.PropertyId.Value };
            }
        }
        else
        {
            propertyIds = await (from pm in _context.PropertyMast.AsNoTracking()
                                 join pt in _context.PropertyTypeMasters.AsNoTracking() on pm.PropertyTypeId equals pt.Id
                                 where (dto.WardId == null || pm.WardId == dto.WardId) &&
                                       (normalizedPropertyNo == null || (pm.PropertyNo != null && pm.PropertyNo.ToLower().Contains(normalizedPropertyNo))) &&
                                       (normalizedPartitionNo == null || (pm.PartitionNo != null &&
                                           (isPartitionInWingList
                                               ? pm.PartitionNo.ToLower().Contains(normalizedPartitionNo)
                                               : pm.PartitionNo.ToLower() == normalizedPartitionNo))) &&
                                       (normalizedPartType == null || (pt.PartType != null && pt.PartType.ToLower().Contains(normalizedPartType))) &&
                                       pm.IsActive && !pm.MarkedForDeletion &&
                                       pt.IsActive
                                 select pm.Id)
                                .ToListAsync(cancellationToken);
        }

        if (propertyIds == null || !propertyIds.Any())
            return null;

        var taxAmountList = await (from tmrv in _context.TransMast.AsNoTracking()
                                   join tm in _context.TaxMaster.AsNoTracking() on tmrv.TaxId equals tm.Id
                                   join ym in _context.YearMaster.AsNoTracking() on tmrv.FinanceYearId equals ym.Id
                                   where propertyIds.Contains(tmrv.PropertyId)
                                      && tmrv.CalculationType == "RV"
                                      && tmrv.IsActive && !tmrv.MarkedForDeletion
                                      && tm.IsActive
                                      && ym.IsActive
                                   group tmrv by new { tm.TaxName, tm.DisplayOrder } into g
                                   orderby g.Key.DisplayOrder
                                   select new TaxAmountDto
                                   {
                                       TaxName = g.Key.TaxName,
                                       TaxAmount = g.Sum(x => x.TaxAmount),
                                       DisplayOrder = g.Key.DisplayOrder
                                   })
                                  .ToListAsync(cancellationToken);

        if (!taxAmountList.Any())
            return null;

        return new PropertyTaxApartmentDetailsDto
        {
            PropertyId = propertyIds.Count == 1 ? propertyIds[0] : 0,
            PropertyCount = propertyIds.Count,
            TaxAmounts = taxAmountList
        };
    }

    public async Task<PropertyTaxApartmentDetailsCVDto?> GetAggregatedPropertyTaxDetailsCVAsync(PropertyApartmentTaxRequestDto dto, CancellationToken cancellationToken = default)
    {
        var normalizedPropertyNo = string.IsNullOrWhiteSpace(dto.PropertyNo) ? null : dto.PropertyNo.ToLower();
        var normalizedPartType = string.IsNullOrWhiteSpace(dto.PartType) ? null : dto.PartType.ToLower();
        var normalizedPartitionNo = string.IsNullOrWhiteSpace(dto.PartitionNo) ? null : dto.PartitionNo.ToLower();

        var totalwingList = await _context.Set<WingEntity>().AsNoTracking()
            .Where(d => d.IsActive && d.WingNo != null)
            .Select(d => d.WingNo.ToLower())
            .ToListAsync(cancellationToken);

        var isPartitionInWingList = normalizedPartitionNo != null && totalwingList.Contains(normalizedPartitionNo);

        List<int> propertyIds;
        if (dto.PropertyId.HasValue)
        {
            var societyQuery = _context.SocietyDetailsMast.AsNoTracking();
            var wingDetailsMastQuery = _context.Set<NtisPlatform.Core.Entities.WingDetailsMastEntity>().AsNoTracking();

            var searchedProperty = await _context.PropertyMast.AsNoTracking().FirstOrDefaultAsync(p => p.Id == dto.PropertyId.Value, cancellationToken);
            var targetPropertyNo = searchedProperty?.PropertyNo;
            var targetWardId = searchedProperty?.WardId;

            var isSociety = searchedProperty != null && await societyQuery.AnyAsync(s => s.IsActive && !s.MarkedForDeletion &&
                _context.PropertyMast.Any(sp => sp.Id == s.PropertyId && sp.PropertyNo == targetPropertyNo && sp.WardId == targetWardId && sp.IsActive && !sp.MarkedForDeletion), cancellationToken);

            if (isSociety && searchedProperty != null)
            {
                propertyIds = await (from pm in _context.PropertyMast.AsNoTracking()
                                     where pm.IsActive && !pm.MarkedForDeletion &&
                                           pm.WingDetailId.HasValue &&
                                           wingDetailsMastQuery.Any(wdm => wdm.Id == pm.WingDetailId.Value && wdm.IsActive && !wdm.MarkedForDeletion &&
                                               societyQuery.Any(s => s.Id == wdm.SocietyDetailsMastId && s.IsActive && !s.MarkedForDeletion &&
                                                   _context.PropertyMast.Any(sp => sp.Id == s.PropertyId && sp.PropertyNo == targetPropertyNo && sp.WardId == targetWardId && sp.IsActive && !sp.MarkedForDeletion)))
                                     select pm.Id)
                                    .ToListAsync(cancellationToken);
            }
            else
            {
                propertyIds = new List<int> { dto.PropertyId.Value };
            }
        }
        else
        {
            propertyIds = await (from pm in _context.PropertyMast.AsNoTracking()
                                 join pt in _context.PropertyTypeMasters.AsNoTracking() on pm.PropertyTypeId equals pt.Id
                                 where (dto.WardId == null || pm.WardId == dto.WardId) &&
                                       (normalizedPropertyNo == null || (pm.PropertyNo != null && pm.PropertyNo.ToLower().Contains(normalizedPropertyNo))) &&
                                       (normalizedPartitionNo == null || (pm.PartitionNo != null &&
                                           (isPartitionInWingList
                                               ? pm.PartitionNo.ToLower().Contains(normalizedPartitionNo)
                                               : pm.PartitionNo.ToLower() == normalizedPartitionNo))) &&
                                       (normalizedPartType == null || (pt.PartType != null && pt.PartType.ToLower().Contains(normalizedPartType))) &&
                                       pm.IsActive && !pm.MarkedForDeletion &&
                                       pt.IsActive
                                 select pm.Id)
                                .ToListAsync(cancellationToken);
        }

        if (propertyIds == null || !propertyIds.Any())
            return null;

        var taxAmountList = await (from tmcv in _context.TransMast.AsNoTracking()
                                   join tm in _context.TaxMaster.AsNoTracking() on tmcv.TaxId equals tm.Id
                                   join ym in _context.YearMaster.AsNoTracking() on tmcv.FinanceYearId equals ym.Id
                                   where propertyIds.Contains(tmcv.PropertyId)
                                      && tmcv.CalculationType == "CV"
                                      && tmcv.IsActive && !tmcv.MarkedForDeletion
                                      && tm.IsActive
                                      && ym.IsActive
                                   group tmcv by new { tm.TaxName, tm.DisplayOrder } into g
                                   orderby g.Key.DisplayOrder
                                   select new TaxAmountDto
                                   {
                                       TaxName = g.Key.TaxName,
                                       TaxAmount = g.Sum(x => x.TaxAmount),
                                       DisplayOrder = g.Key.DisplayOrder
                                   })
                                  .ToListAsync(cancellationToken);

        if (!taxAmountList.Any())
            return null;

        return new PropertyTaxApartmentDetailsCVDto
        {
            PropertyId = propertyIds.Count == 1 ? propertyIds[0] : 0,
            PropertyCount = propertyIds.Count,
            TaxAmounts = taxAmountList
        };
    }


    /// <summary>
    /// Generates a preview layout matrix of building floors, units, flat numbers, and partition identifiers
    /// according to the specified generation strategy (<c>H</c>, <c>V</c>, <c>HC</c>, or <c>VC</c>).
    /// </summary>
    /// <param name="dto">The input parameters defining floor ranges, units per floor, wing, and generation strategy.</param>
    /// <param name="cancellationToken">Propagates notification that operations should be canceled.</param>
    /// <returns>A list of <see cref="BuildingGenerateStructureDto"/> representing the generated building layout matrix.</returns>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="dto"/> is <see langword="null"/>.</exception>
    /// <exception cref="PropertyValidationException">Thrown when validation rules or domain constraints fail.</exception>
    /// <remarks>
    /// <para>
    /// <b>Execution Pipeline:</b>
    /// <list type="number">
    /// <item><description><b>Validation &amp; Normalization:</b> Validates parameters and normalizes generation type and flat prefix.</description></item>
    /// <item><description><b>Floor Range Resolution:</b> Fetches active floors belonging to the selected group within the requested sequence range.</description></item>
    /// <item><description><b>Wing Lookup:</b> Sequentially fetches the wing number (DbContext is not thread-safe for parallel calls).</description></item>
    /// <item><description><b>Partition Baseline:</b> Computes the highest existing partition sequence to project prospective preview numbers.</description></item>
    /// <item><description><b>Matrix Generation:</b> Computes the Cartesian cross-join of floors and units, applying ordering and numbering formulas.</description></item>
    /// </list>
    /// </para>
    /// <para>
    /// <i>Concurrency Note:</i> Partition numbers returned here are preview identifiers for UI staging.
    /// Final persistence must commit or lock partition allocation within an atomic transaction.
    /// </para>
    /// </remarks>
    public async Task<List<BuildingGenerateStructureDto>> GetGenerateBuildingStructureAsync(BuildingGenerateDetailsDto dto, CancellationToken cancellationToken = default)
    {
        // Step 1: Validate payload inputs, business invariants, and floor sequence numbers
        ValidateRequest(dto, out var generationType, out var formattedPrefix, out var fromSeq, out var toSeq);

        // Step 2: Fetch and validate active floors belonging to the selected flat generation group strictly by FLatGenerationSeq
        var selectedFloors = await GetFloorsAsync(dto.FLatGenerationGroupId, fromSeq, toSeq, dto.NoOfFlatOnOneFloor, cancellationToken);

        // Step 3: Fetch wing number (kept sequential to adhere to EF Core DbContext instance thread-safety)
        var wingNo = await GetWingNoAsync(dto.WingId, cancellationToken);

        // Step 4: Determine the maximum existing partition number to compute prospective sequential preview allocations
        var lastPartitionNo = await GetLastPartitionNoAsync(dto.WardId, dto.PropertyNo!, dto.WingId, wingNo, cancellationToken);

        // Step 5: Perform cross-join generation, order units/floors per strategy, and map to DTOs
        return GenerateBuildingStructure(dto, generationType, formattedPrefix, selectedFloors, wingNo, lastPartitionNo, fromSeq);
    }

    /// <summary>
    /// Validates request parameters and ensures generation type compatibility against business invariants.
    /// </summary>
    /// <param name="dto">The generation request DTO.</param>
    /// <param name="normalizedGenerationType">Outputs the validated uppercase generation type code.</param>
    /// <param name="formattedPrefix">Outputs the normalized flat prefix with trailing separator, or empty string.</param>
    /// <param name="fromSeq">Outputs the validated starting FLatGenerationSeq number.</param>
    /// <param name="toSeq">Outputs the validated ending FLatGenerationSeq number.</param>
    /// <exception cref="ArgumentNullException">Thrown when <paramref name="dto"/> is <see langword="null"/>.</exception>
    /// <exception cref="PropertyValidationException">Thrown when validation rules are violated.</exception>
    private static void ValidateRequest(BuildingGenerateDetailsDto dto, out string normalizedGenerationType, out string formattedPrefix, out int fromSeq, out int toSeq)
    {
        // 1. Guard against null payload
        ArgumentNullException.ThrowIfNull(dto);

        // 2. Validate generation strategy code against supported domain constants
        var rawType = dto.GenerationType?.Trim().ToUpperInvariant();
        if (rawType is not (PropertyConstants.GenerationTypes.Horizontal
                         or PropertyConstants.GenerationTypes.Vertical
                         or PropertyConstants.GenerationTypes.HorizontalCustom
                         or PropertyConstants.GenerationTypes.VerticalCustom))
        {
            throw new PropertyValidationException("Invalid Generation Type");
        }
        normalizedGenerationType = rawType;

        // 3. Ensure unit count per floor is strictly positive and does not exceed 100
        if (dto.NoOfFlatOnOneFloor <= 0)
            throw new InvalidOperationException("No Of Flat On One Floor must be greater than zero");

        if (dto.NoOfFlatOnOneFloor > 100)
            throw new PropertyValidationException("No Of Flat On One Floor cannot exceed 100");

        // 4. Vertical Custom (VC) domain constraint: exactly 1 unit per floor allowed
        if (normalizedGenerationType == PropertyConstants.GenerationTypes.VerticalCustom && dto.NoOfFlatOnOneFloor > 1)
            throw new PropertyValidationException("Vertical Custom Generation no of flat in one floor must be 1");

        // 5. Flat generation group master selection is required
        if (dto.FLatGenerationGroupId <= 0)
            throw new PropertyValidationException("Flat generation group is required");

        // 6. FromFloor and ToFloor strictly support FLatGenerationSeq sequence numbers
        if (!int.TryParse(dto.FromFloor?.Trim(), out fromSeq))
            throw new PropertyValidationException("From floor must be a valid sequence number");

        if (!int.TryParse(dto.ToFloor?.Trim(), out toSeq))
            throw new PropertyValidationException("To floor must be a valid sequence number");

        if (fromSeq <= 0)
            throw new PropertyValidationException("From floor sequence must be greater than zero");

        if (toSeq <= 0)
            throw new PropertyValidationException("To floor sequence must be greater than zero");

        if (fromSeq > toSeq)
            throw new PropertyValidationException("From Floor cannot be greater than To Floor");

        // 7. Horizontal Custom (HC) domain constraint: FromFloor and ToFloor must target the exact same floor sequence
        var isHorizontalCustom = normalizedGenerationType == PropertyConstants.GenerationTypes.HorizontalCustom;
        if (isHorizontalCustom && fromSeq != toSeq)
            throw new PropertyValidationException("From floor and to floor must be same");

        // 8. Normalize flat prefix (appends trailing '-' if provided)
        formattedPrefix = FormatPrefix(dto.Prifix);
    }

    /// <summary>
    /// Normalizes a flat prefix by trimming whitespace and appending a trailing separator if non-empty.
    /// </summary>
    /// <param name="rawPrefix">The raw user-provided prefix string.</param>
    /// <returns>A formatted prefix (e.g., <c>"A-"</c>), or <see cref="string.Empty"/> if null or whitespace.</returns>
    private static string FormatPrefix(string? rawPrefix) =>
        string.IsNullOrWhiteSpace(rawPrefix) ? string.Empty : $"{rawPrefix.Trim()}-";

    /// <summary>
    /// Retrieves active floors for the specified flat generation group strictly by FLatGenerationSeq range.
    /// </summary>
    /// <param name="flatGenerationGroupId">Target flat generation group master identifier.</param>
    /// <param name="fromSeq">Starting FLatGenerationSeq boundary.</param>
    /// <param name="toSeq">Ending FLatGenerationSeq boundary.</param>
    /// <param name="noOfFlatOnOneFloor">Number of units configured per floor.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The filtered list of active <see cref="FloorEntity"/> records ordered by <see cref="FloorEntity.FLatGenerationSeq"/>.</returns>
    /// <exception cref="PropertyValidationException">Thrown if group or sequence numbers are invalid or max rows exceeded.</exception>
    private async Task<List<FloorEntity>> GetFloorsAsync(int flatGenerationGroupId, int fromSeq, int toSeq, int noOfFlatOnOneFloor, CancellationToken cancellationToken)
    {
        // 1. Fetch active floors mapped to the FLatGenerationGroupId, ordered by generation sequence (FLatGenerationSeq)
        var groupFloors = await _context.FloorEntity
            .AsNoTracking()
            .Where(f => f.IsActive && f.FLatGenerationGroupId == flatGenerationGroupId && f.FLatGenerationGroupMaster != null && f.FLatGenerationGroupMaster.IsActive)
            .OrderBy(f => f.FLatGenerationSeq)
            .ToListAsync(cancellationToken);

        // 2. Validate group existence if no active floors were found
        if (groupFloors.Count == 0)
        {
            var groupExists = await _context.Set<FLatGenerationGroupMasterEntity>()
                .AnyAsync(g => g.Id == flatGenerationGroupId && g.IsActive, cancellationToken);
            if (!groupExists)
                throw new PropertyValidationException("Flat generation group not found or inactive");
        } // 3. Locate FromFloor and ToFloor strictly by FLatGenerationSeq within the group
        var fromFloorExists = groupFloors.Any(f => f.FLatGenerationSeq == fromSeq);
        if (!fromFloorExists)
            throw new PropertyValidationException($"Floor sequence '{fromSeq}' not found in this group");

        var toFloorExists = groupFloors.Any(f => f.FLatGenerationSeq == toSeq);
        if (!toFloorExists)
            throw new PropertyValidationException($"Floor sequence '{toSeq}' not found in this group");

        // 4. Validate sequence order: from FLatGenerationSeq cannot exceed to FLatGenerationSeq
        if (fromSeq > toSeq)
            throw new PropertyValidationException("From Floor cannot be greater than To Floor");

        // 5. Select floor range: strictly from fromSeq to toSeq (inclusive)
        var selectedFloors = groupFloors
            .Where(f => f.FLatGenerationSeq >= fromSeq && f.FLatGenerationSeq <= toSeq)
            .OrderBy(f => f.FLatGenerationSeq)
            .ToList();

        // 6. Guard against runaway Cartesian product explosion
        if ((long)selectedFloors.Count * noOfFlatOnOneFloor > PropertyConstants.MaxGeneratedRows)
            throw new PropertyValidationException($"Cannot generate more than {PropertyConstants.MaxGeneratedRows} rows at once");

        return selectedFloors;
    }

    /// <summary>
    /// Retrieves the active wing number for the specified wing identifier.
    /// </summary>
    /// <param name="wingId">Wing master identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The active wing code/number string.</returns>
    /// <exception cref="PropertyValidationException">Thrown when the wing is not found or inactive.</exception>
    private async Task<string> GetWingNoAsync(int wingId, CancellationToken cancellationToken)
    {
        var wingNo = await _context.Set<WingEntity>()
            .AsNoTracking()
            .Where(w => w.Id == wingId && w.IsActive)
            .Select(w => w.WingNo)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrEmpty(wingNo))
            throw new PropertyValidationException("Wing Not Found");

        return wingNo;
    }

    /// <summary>
    /// Queries the highest partition sequence number already allocated to properties within the specified wing.
    /// </summary>
    /// <param name="wardId">Ward identifier.</param>
    /// <param name="propertyNo">Parent property number.</param>
    /// <param name="wingId">Wing master identifier.</param>
    /// <param name="wingNo">Wing code prefix used in partition strings.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The highest numeric suffix among existing partitions, or 0 if none exist.</returns>
    /// <remarks>
    /// <para>
    /// <i>Note:</i> This baseline is used to generate prospective preview partition numbers for UI inspection.
    /// During final property record creation, partition assignment should be locked or committed inside
    /// an atomic transaction to prevent duplicates across concurrent requests.
    /// </para>
    /// </remarks>
    private async Task<int> GetLastPartitionNoAsync(int wardId, string propertyNo, int wingId, string wingNo, CancellationToken cancellationToken)
    {
        // 1. Query distinct existing partition numbers matching the wing prefix using read-only join
        var partitionNos = await (from p in _context.PropertyMast.AsNoTracking()
                                  join s in _context.SocietyDetailsMast.AsNoTracking()
                                      on p.Id equals s.PropertyId
                                  join wdm in _context.Set<WingDetailsMastEntity>().AsNoTracking()
                                      on s.Id equals wdm.SocietyDetailsMastId
                                  join childProp in _context.PropertyMast.AsNoTracking()
                                      on wdm.Id equals childProp.WingDetailId
                                  where p.WardId == wardId
                                        && p.PropertyNo == propertyNo
                                        && wdm.WingMasterId == wingId
                                        && p.IsActive && !p.MarkedForDeletion
                                        && s.IsActive && !s.MarkedForDeletion
                                        && wdm.IsActive && !wdm.MarkedForDeletion
                                        && childProp.IsActive && !childProp.MarkedForDeletion
                                        && childProp.PartitionNo != null
                                        && childProp.PartitionNo.StartsWith(wingNo)
                                  select childProp.PartitionNo!)
                                 .Distinct()
                                 .ToListAsync(cancellationToken);

        // 2. Parse numeric suffix in-memory and identify the maximum allocated partition index
        return partitionNos
            .Where(x => x.Length > wingNo.Length && x[wingNo.Length..].All(char.IsDigit))
            .Select(x => int.Parse(x[wingNo.Length..]))
            .DefaultIfEmpty(0)
            .Max();
    }

    /// <summary>
    /// Computes a flat number based on starting flat index, floor step offset, and unit sequence.
    /// </summary>
    /// <param name="prefix">Normalized prefix string with trailing hyphen, or empty.</param>
    /// <param name="flatStart">Starting base flat number (e.g., 1 or 101).</param>
    /// <param name="floorStepOffset">Floor sequence offset relative to fromSeq.</param>
    /// <param name="incrementedBy">Number to increment between successive floors (e.g., 100 for 101, 201, 301).</param>
    /// <param name="unitNo">One-based unit sequence within the floor.</param>
    /// <param name="isHorizontalCustom">Indicates if custom horizontal mode is active (floor offset is suppressed).</param>
    /// <returns>The formatted flat string (e.g., <c>"A-101"</c> or <c>"101"</c>).</returns>
    private static string FormatFlatNumber(string prefix, int flatStart, int floorStepOffset, int incrementedBy, int unitNo, bool isHorizontalCustom)
    {
        // For Horizontal Custom (HC), all units belong to a single floor, so floor offset is 0
        var floorOffset = isHorizontalCustom ? 0 : floorStepOffset * incrementedBy;
        var unitOffset = unitNo - 1;
        return $"{prefix}{flatStart + floorOffset + unitOffset}";
    }

    public async Task<MaxPartitionNoDto?> GetMaxPartition(int wardId, string propertyNo, CancellationToken cancellationToken = default)
    {
        var buildingProperties = await (
                    from pm in _context.PropertyMast
                    join pcm in _context.PropertyCategoryMaster
                        on pm.CategoryId equals pcm.Id
                    join wm in _context.WardMaster
                        on pm.WardId equals wm.Id
                    where pm.WardId == wardId
                          && pm.PropertyNo == propertyNo
                          && pm.IsActive
                          && !pm.MarkedForDeletion
                          && wm.IsActive
                          && pcm.IsActive
                    select new MaxPartitionNoDto
                    {
                        WardNo = wm.WardNo,
                        PropertyNo = pm.PropertyNo,
                        Category = pcm.PropertyCategoryName,
                        MaxPartitionNo = pm.PartitionNo
                    }
                ).ToListAsync(cancellationToken);

                        var result = buildingProperties
                            .OrderByDescending(
                                x => x.MaxPartitionNo,
                                NaturalStringComparer.Instance)
                            .FirstOrDefault();

        return result;

    }

    public async Task<List<SocietyAminityDetailsDto>?> GetSocietyAmenityDetailsAsync(int SocietyDetailId, bool isAmenity, CancellationToken cancellationToken = default)
    {
        var amenityProperties = await (
            from pm in _context.PropertyMast
            join ptm in _context.PropertyTypeMasters on pm.PropertyTypeId equals ptm.Id
            join wm in _context.WardMaster on pm.WardId equals wm.Id
            join sdm in _context.SocietyDetailsMast on pm.Id equals sdm.PropertyId
            join wdm in _context.Set<WingDetailsMastEntity>().AsNoTracking().Where(x => x.IsActive && !x.MarkedForDeletion) on sdm.Id equals wdm.SocietyDetailsMastId
            join we in _context.WingEntity.AsNoTracking().Where(x => x.IsActive) on wdm.WingMasterId equals we.Id
            where sdm.Id == SocietyDetailId
            && !string.IsNullOrEmpty(pm.PartitionNo)
            && pm.PartitionNo != we.WingNo
            && pm.MarkedForDeletion != true
            && pm.IsActive == true
            && (
                isAmenity
                    ? ptm.PartType == PartTypeConstants.Amenity
                    : ptm.PartType != PartTypeConstants.Amenity
            )
            orderby pm.Id descending

            select new SocietyAminityDetailsDto
            {
                PropertyId = pm.Id,
                SocietyDetailId = sdm.Id,
                WardId = pm.WardId,
                WardNo = wm.WardNo,
                wingId = we.Id,
                WingNo = we.WingNo,
                WingName = wdm.WingName,
                PropertyNo = pm.PropertyNo,
                PartitionNo = pm.PartitionNo,
                PartType = ptm.PartType
            })
            .ToListAsync(cancellationToken);

        return amenityProperties;
    }

    /// <summary>
    /// Creates and orders the Cartesian product (cross-join) of floors and units based on generation strategy.
    /// </summary>
    /// <param name="selectedFloors">List of active floors in the requested sequence range.</param>
    /// <param name="noOfFlatOnOneFloor">Number of units configured per floor.</param>
    /// <param name="isVertical">
    /// <see langword="true"/> for vertical ordering (column-wise: unit first, then floor);
    /// <see langword="false"/> for horizontal ordering (row-wise: floor first, then unit).
    /// </param>
    /// <returns>An ordered enumerable of tuples containing the floor entity, floor sequence index, and unit number.</returns>
    /// <remarks>
    /// <b>Ordering Rules:</b>
    /// <list type="bullet">
    /// <item><description><b>Vertical (<c>V</c>, <c>VC</c>):</b> Ordered by Unit ascending, then FloorIndex ascending (vertical column striping).</description></item>
    /// <item><description><b>Horizontal (<c>H</c>, <c>HC</c>):</b> Ordered by FloorIndex ascending, then Unit ascending (horizontal floor striping).</description></item>
    /// </list>
    /// </remarks>
    private static IEnumerable<(FloorEntity Floor, int FloorIndex, int UnitNo)> OrderUnitsAndFloors(List<FloorEntity> selectedFloors, int noOfFlatOnOneFloor, bool isVertical)
    {
        var generatedUnits = Enumerable.Range(1, noOfFlatOnOneFloor);
        var indexedFloors = selectedFloors.Select((floor, index) => (Floor: floor, FloorIndex: index));

        // Cartesian product of units and floors
        var unitsWithFloors = from unit in generatedUnits
                              from floor in indexedFloors
                              select (floor.Floor, floor.FloorIndex, UnitNo: unit);

        return isVertical ? unitsWithFloors.OrderBy(x => x.UnitNo).ThenBy(x => x.FloorIndex) : unitsWithFloors.OrderBy(x => x.FloorIndex).ThenBy(x => x.UnitNo);
    }


    /// <summary>
    /// Maps a single cross-joined floor and unit item into a <see cref="BuildingGenerateStructureDto"/> model.
    /// </summary>
    /// <param name="dto">Source generation request parameters.</param>
    /// <param name="generationType">Normalized generation type code.</param>
    /// <param name="formattedPrefix">Normalized prefix string.</param>
    /// <param name="wingNo">Wing identifier string for partition numbering.</param>
    /// <param name="lastPartitionNo">Base partition sequence number.</param>
    /// <param name="item">Tuple containing the floor entity, floor index, and unit sequence.</param>
    /// <param name="rowIndex">Zero-based sequential index across all generated preview rows.</param>
    /// <param name="isHorizontalCustom">Indicates whether horizontal custom mode is active.</param>
    /// <param name="fromSeq">Starting floor sequence number.</param>
    /// <returns>A populated <see cref="BuildingGenerateStructureDto"/> instance.</returns>
    private static BuildingGenerateStructureDto MapToBuildingGenerateStructureDto(
        BuildingGenerateDetailsDto dto, string generationType, string formattedPrefix,
        string wingNo, int lastPartitionNo, (FloorEntity Floor, int FloorIndex, int UnitNo) item,
        int rowIndex, bool isHorizontalCustom, int fromSeq)
    {
        var floorStepOffset = item.Floor.FLatGenerationSeq - fromSeq;
        return new BuildingGenerateStructureDto 
        { 
            WardId = dto.WardId,
            PropertyNo = dto.PropertyNo,
            WingId = dto.WingId,
            RowNo = rowIndex + 1,
            FloorNo = item.Floor.FLatGenerationSeq,
            FloorCode = item.Floor.FloorCode ?? string.Empty,
            Description = item.Floor.Description,
            PropertyFloorId = item.Floor.Id,
            UnitNo = item.UnitNo,
            FlatNo = FormatFlatNumber(formattedPrefix, dto.FlatStart, floorStepOffset, dto.IncrementedBy, item.UnitNo, isHorizontalCustom),
            PartitionNo = $"{wingNo}{lastPartitionNo + rowIndex + 1}",
            GenerationType = generationType
        };
    }

    /// <summary>
    /// Coordinates ordering and transformation of floors and units into the final list of structure DTOs.
    /// </summary>
    /// <param name="dto">The generation request parameters.</param>
    /// <param name="generationType">Normalized generation type code.</param>
    /// <param name="formattedPrefix">Normalized prefix string with trailing separator, if any.</param>
    /// <param name="selectedFloors">Selected active floors for generation.</param>
    /// <param name="wingNo">Wing prefix identifier.</param>
    /// <param name="lastPartitionNo">Base partition sequence number.</param>
    /// <param name="fromSeq">Starting floor sequence number.</param>
    /// <returns>The complete list of generated building structure DTOs.</returns>
    private static List<BuildingGenerateStructureDto> GenerateBuildingStructure(BuildingGenerateDetailsDto dto, string generationType, string formattedPrefix,
        List<FloorEntity> selectedFloors,
        string wingNo,
        int lastPartitionNo,
        int fromSeq)
    {
        // 1. Determine boolean flags for generation modes
        var isVertical = generationType is PropertyConstants.GenerationTypes.Vertical
                                        or PropertyConstants.GenerationTypes.VerticalCustom;
        var isHorizontalCustom = generationType == PropertyConstants.GenerationTypes.HorizontalCustom;
        // 2. Cross-join and order floors and units based on vertical vs horizontal strategy
        var orderedItems = OrderUnitsAndFloors(selectedFloors, dto.NoOfFlatOnOneFloor, isVertical);
        // 3. Project ordered items into preview structure DTOs with flat and partition numbering
        return orderedItems
            .Select((item, index) => MapToBuildingGenerateStructureDto(dto, generationType, formattedPrefix, wingNo, lastPartitionNo, item, index, isHorizontalCustom, fromSeq))
            .ToList();
    }

    public async Task<List<PropertySocietyDetailsDto>?> GetSocietyWingListAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        var property = await (
        from p in _context.PropertyMast
        join w in _context.WardMaster
            on p.WardId equals w.Id
        where p.Id == propertyId
              && p.IsActive
              && !p.MarkedForDeletion
        select new
        {
            p.Id,
            WardId = w.Id,
            WardNo = w.WardNo,
            PropertyNo = p.PropertyNo
        }
    ).FirstOrDefaultAsync(cancellationToken);


        if (property == null)
            return null;

        // Find all PropertyMast IDs that share the same WardId + PropertyNo (same building)
        var buildingPropertyIds = await _context.PropertyMast
            .AsNoTracking()
            .Where(p => p.WardId == property.WardId
                     && p.PropertyNo == property.PropertyNo
                     && p.IsActive
                     && !p.MarkedForDeletion)
            .Select(p => p.Id)
            .ToListAsync(cancellationToken);

        var amenityProperties = await (
      from sdm in _context.SocietyDetailsMast
      join wdm in _context.Set<NtisPlatform.Core.Entities.WingDetailsMastEntity>() on sdm.Id equals wdm.SocietyDetailsMastId into wdmJoin
      from wdm in wdmJoin.Where(x => x.IsActive && !x.MarkedForDeletion).DefaultIfEmpty()
      join we in _context.WingEntity on (wdm != null ? (int?)wdm.WingMasterId : null) equals (int?)we.Id into wingJoin
      from we in wingJoin.Where(x => x.IsActive).DefaultIfEmpty()
      where sdm.PropertyId.HasValue && buildingPropertyIds.Contains(sdm.PropertyId.Value)
            && sdm.IsActive
            && !sdm.MarkedForDeletion
      select new PropertySocietyDetailsDto
      {
          PropertyId = sdm.PropertyId,
          SocietyDetailId = sdm.Id,
          WingId = wdm != null ? (int?)wdm.WingMasterId : null,
          WingNo = we != null ? we.WingNo : null,
          WardNo = property.WardNo,
          PropertyNo = property.PropertyNo,
          WingName = wdm != null ? wdm.WingName : null,
          SocietyName = sdm.SocietyName,
          SocietyAddress = sdm.SocietyAddress,
          SecretaryName = sdm.SecretaryName,
          ManagerName = sdm.ManagerName,
          LandOwnerName = sdm.LandOwnerName,
          BuilderName = sdm.BuilderName,
          SocietyNameEnglish = sdm.SocietyNameEnglish,
          SocietyAddressEnglish = sdm.SocietyAddressEnglish,
          SecretaryNameEnglish = sdm.SecretaryNameEnglish,
          ManagerNameEnglish = sdm.ManagerNameEnglish,
          LandOwnerNameEnglish = sdm.LandOwnerNameEnglish,
          BuilderNameEnglish = sdm.BuilderNameEnglish,
          ManagerMobileNo = sdm.ManagerMobileNo,
          SecretaryMobileNo = sdm.SecretaryMobileNo,
          SocietyEmailId = sdm.SocietyEmailId,
          SecretaryEmailId = sdm.SecretaryEmailId,
          ManagerEmailId = sdm.ManagerEmailId,
          PropertyCount = wdm == null ? 0 : _context.PropertyMast
              .Where(pm => pm.WingDetailId == wdm.Id
                  && !string.IsNullOrEmpty(pm.PartitionNo)
                  && pm.IsActive
                  && !pm.MarkedForDeletion)
              .Join(_context.PropertyTypeMasters,
                  pm => pm.PropertyTypeId,
                  ptm => ptm.Id,
                  (pm, ptm) => ptm)
              .Count(ptm => ptm.PartType != PartTypeConstants.Amenity && ptm.IsActive),
          AminityCount = wdm == null ? 0 : _context.PropertyMast
              .Where(pm => pm.WingDetailId == wdm.Id
                  && !string.IsNullOrEmpty(pm.PartitionNo)
                  && pm.IsActive
                  && !pm.MarkedForDeletion)
              .Join(_context.PropertyTypeMasters,
                  pm => pm.PropertyTypeId,
                  ptm => ptm.Id,
                  (pm, ptm) => ptm)
              .Count(ptm => ptm.PartType == PartTypeConstants.Amenity && ptm.IsActive),
      })
      .AsNoTracking()
      .ToListAsync(cancellationToken);
        return amenityProperties;
    }

    public async Task<List<BuildingListDto>?> GetBuildingListAsync(int wardId, CancellationToken cancellationToken = default)
    {
        var WardDetails = await _context.WardMaster
     .Where(p => p.Id == wardId && p.IsActive)
     .Select(p => new { p.Id })
     .FirstOrDefaultAsync(cancellationToken);

        if (WardDetails == null)
            return null;

        // Step 1: Query builing list properties as per ward
        var buildingProperties = await (from pm in _context.PropertyMast
                                        join pcm in _context.PropertyCategoryMaster on pm.CategoryId equals pcm.Id
                                        join wm in _context.WardMaster on pm.WardId equals wm.Id
                                        where pm.WardId == wardId
                                        && string.IsNullOrEmpty(pm.PartitionNo)
                                         && pm.IsActive
                                         && !pm.MarkedForDeletion
                                         && wm.IsActive
                                         && pcm.IsActive

                                        select new BuildingListDto
                                        {
                                            PropertyId = pm.Id,
                                            WardNo = wm.WardNo,
                                            CatPropertyCategoryName = pcm.PropertyCategoryName,
                                            PropertyNo = pm.PropertyNo,
                                            PartitionNo = pm.PartitionNo
                                        })
                                      .ToListAsync(cancellationToken);


        return buildingProperties;
    }



    public async Task<bool> IsPropertyExists(int wardId, string propertyNo, int? propertyId)
    {
        return await _context.PropertyMast.AnyAsync(x =>
            x.WardId == wardId &&
            x.PropertyNo == propertyNo &&
            (x.PartitionNo == "" || x.PartitionNo == null) && x.MarkedForDeletion == false &&
            (!propertyId.HasValue || x.Id != propertyId.Value));
    }

    private static CreateNewPropertyResponseDto Failure(string message)
    {
        return new CreateNewPropertyResponseDto
        {
            Success = false,
            Message = message
        };
    }

    private static bool ContainsAny(string source, params string[] values)
    {
        return values.Any(v =>
            source.Contains(v, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Gets all RoomWiseMinusData entities by list of RoomWiseSubmissionId values.
    /// Used during property deletion to mark all minus data records for deletion.
    /// This entity only has RoomWiseSubmissionId column (no PropertyId), so we query by parent RoomWiseSubmissionDetails IDs.
    /// </summary>
    public async Task<List<RoomWiseMinusDataEntity>> GetRoomWiseMinusBySubmissionIdsAsync(List<int> roomWiseSubmissionIds, CancellationToken cancellationToken = default)
    {
        return await _context.RoomWiseMinusData.Where(x => roomWiseSubmissionIds.Contains(x.RoomWiseSubmissionId))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Gets PropertyDetails entities for a property.
    /// Used as the first step in property deletion to identify related PropertyDetailsId values.
    /// </summary>
    public async Task<List<PropertyDetailsEntity>> GetPropertyDetailsByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.PropertyDetails
            .Where(pd => pd.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    #region PropertyTaxCalculationRVResults - Entity has BOTH PropertyId AND PropertyDetailsId

    /// <summary>
    /// Gets all PropertyTaxCalculationRVResults for a property by PropertyId.
    /// USED FOR DELETION: PropertyId alone is sufficient because it's the primary FK relationship.
    /// All RV results for a property MUST have PropertyId, so this query guarantees complete coverage.
    /// </summary>
    public async Task<List<RVCalculationResultsEntity>> GetRvResultsByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.RVCalculationResults
            .Include(x => x.TaxDetails)
            .Where(x => x.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region PropertyTaxCalculationSection129Results - Entity has BOTH PropertyId AND PropertyDetailsId

    /// <summary>
    /// Gets all PropertyTaxCalculationSection129Results for a property by PropertyId.
    /// USED FOR DELETION: PropertyId alone is sufficient because it's the primary FK relationship.
    /// All Section129 results for a property MUST have PropertyId, so this query guarantees complete coverage.
    /// </summary>
    public async Task<List<PropertyTaxCalculationSection129ResultsEntity>> GetSection129ResultsByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.PropertyTaxCalculationSection129Results
            .Where(x => x.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Entities with ONLY PropertyDetailsId (no PropertyId column)

    /// <summary>
    /// Gets RenterMast by PropertyDetailsId list.
    /// This entity only has PropertyDetailsId column (no PropertyId), so simple query is sufficient.
    /// </summary>
    public async Task<List<RenterMastEntity>> GetRentersByPropertyDetailIdsAsync(List<int> propertyDetailIds, CancellationToken cancellationToken = default)
    {
        return await _context.RenterMast
            .Where(x => propertyDetailIds.Contains(x.PropertyDetailsId))
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region RoomWiseSubmissionDetails - Entity has BOTH PropertyId AND PropertyDetailsId (nullable)

    /// <summary>
    /// Gets all RoomWiseSubmissionDetails for a property by PropertyId.
    /// USED FOR DELETION: PropertyId alone is sufficient to catch all records.
    /// Catches all records regardless of PropertyDetailsId state (NULL, valid, or orphaned).
    /// Use this method when deleting a property to ensure no orphaned records remain.
    /// </summary>
    public async Task<List<RoomWiseSubmissionDetailsEntity>> GetRoomWiseSubmissionByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.RoomWiseSubmissionDetails
            .Where(x => x.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Entities with ONLY PropertyId - BaseEntity only (no IHardDeletable)

    /// <summary>
    /// Gets PropertySocialDetails by PropertyId.
    /// This entity extends BaseEntity but does NOT implement IHardDeletable.
    /// Used for deactivation (IsActive=false) during property deletion.
    /// </summary>
    public async Task<List<PropertySocialDetailsEntity>> GetPropertySocialDetailsByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<PropertySocialDetailsEntity>()
            .Where(x => x.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Gets WaterConnectionMaster by PropertyId.
    /// This entity extends BaseEntity but does NOT implement IHardDeletable.
    /// Used for deactivation (IsActive=false) during property deletion.
    /// </summary>
    public async Task<List<WaterConnectionMasterEntity>> GetWaterConnectionsByPropertyIdAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<WaterConnectionMasterEntity>()
            .Where(x => x.PropertyId == propertyId)
            .ToListAsync(cancellationToken);
    }

    #endregion

    // TODO: Uncomment when database table structure is finalized for PropertyTaxCalculationCVResultsEntity
    //public async Task<List<PropertyTaxCalculationCVResultsEntity>> GetCvResultsByPropertyDetailIdsAsync(List<int> propertyDetailIds, CancellationToken cancellationToken = default)
    //{
    //    return await _context.PropertyTaxCalculationCVResults
    //        .AsNoTracking()
    //        .Where(x => propertyDetailIds.Contains(x.PropertyDetailsIds))
    //        .ToListAsync(cancellationToken);
    //}

    /// <summary>
    /// Gets RenterDetail entities by PropertyDetailsId list.
    /// This entity only has PropertyDetailsId column (no PropertyId), so simple query is sufficient.
    /// Used during property deletion to identify and mark all renter detail records.
    /// </summary>
    public async Task<List<RenterDetailEntity>> GetRenterDetailsByPropertyDetailIdsAsync(List<int> propertyDetailIds, CancellationToken cancellationToken = default)
    {
        return await _context.RenterDetails
            .AsNoTracking()
            .Where(x => propertyDetailIds.Contains(x.PropertyDetailsId))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Gets all related entities for a property that need to be marked for deletion.
    /// Returns entities implementing IHardDeletable.
    /// 
    /// NOTE: Queries are executed sequentially to avoid DbContext concurrency issues.
    /// EF Core's DbContext is not thread-safe and cannot handle parallel queries on the same instance.
    /// </summary>
    public async Task<List<IHardDeletable>> GetRelatedEntitiesForDeletionAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // Build the list of related entities
        var relatedEntities = new List<IHardDeletable>();

        // Execute queries sequentially to avoid DbContext concurrency issues
        // Each query is independent but must run one at a time on the same DbContext

        var applyTaxes = await _context.ApplyTaxesMaster.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(applyTaxes);

        var flags = await _context.FlagMaster.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(flags);

        var policyTax = await _context.PolicyTaxDetails.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(policyTax);

        var assessmentDetails = await _context.PropertyAssessmentDetails.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(assessmentDetails);

        var images = await _context.PropertyImagesMast.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(images);

        // Note: PropertySocialDetails and WaterConnectionMaster do not implement IHardDeletable.
        // These entities are now handled using DeactivatePropertyEntities() in PropertyService.MarkPropertyDetailsAndRelatedAsync().
        // They only get IsActive=false and UpdatedDate set, without MarkedForDeletion flags.

        // Note: PropertyTaxCalculationCVResultsEntity and RenterDetailEntity use PropertyDetailsId (not PropertyId).
        // They are handled in PropertyService.MarkPropertyDetailsAndRelatedAsync() method with TODO comments there.

        // TransMast now holds both RV and CV rows (CalculationType discriminator), so this single
        // query already covers what a separate TransMastCV load used to cover.
        var transMast = await _context.TransMast.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(transMast);

        var transMastArchive = await _context.TransMastArchive.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(transMastArchive);

        var transMastLookup = await _context.TransMastLookup.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(transMastLookup);

        // TODO: Uncomment when database table structure is finalized

        //var propertyCertificates = await _context.PropertyCertificates.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        //relatedEntities.AddRange(propertyCertificates);

        var propertyAssessments = await _context.PropertyMastDetails.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        relatedEntities.AddRange(propertyAssessments);

        //var societyDetails = await _context.SocietyDetails.Where(x => x.PropertyId == propertyId).ToListAsync(cancellationToken);
        //relatedEntities.AddRange(societyDetails);

        return relatedEntities;
    }

    /// <summary>
    /// Marks a collection of entities for soft deletion using the same logic as Repository.DeleteAsync.
    /// Sets MarkedForDeletion to true, MarkedForDeletionDate to current time (if not already set),
    /// IsActive to false, and UpdatedDate to current time for entities implementing BaseEntity.
    /// This method ensures consistency with the deletion logic in the base Repository class.
    /// </summary>
    /// <typeparam name="T">Entity type that implements IHardDeletable</typeparam>
    /// <param name="entities">The entities to mark for deletion</param>
    public void MarkEntitiesForDeletion<T>(IEnumerable<T> entities) where T : class, IHardDeletable
    {
        var deletionTime = DateTime.Now;

        foreach (var entity in entities)
        {
            // Set hard deletion flags
            entity.MarkedForDeletion = true;

            // Only set deletion date if not already set (preserves original deletion timestamp)
            if (!entity.MarkedForDeletionDate.HasValue)
            {
                entity.MarkedForDeletionDate = deletionTime;
            }

            // Set IsActive and UpdatedDate if the entity is a BaseEntity
            if (entity is BaseEntity baseEntity)
            {
                baseEntity.IsActive = false;
                baseEntity.UpdatedDate = deletionTime;
            }

            // Mark entity as modified in EF Core
            _context.Entry(entity).State = EntityState.Modified;
        }
    }
    /// <summary>
    /// Deactivates a collection of BaseEntity-derived entities by setting IsActive = false and UpdatedDate = now.
    /// Does NOT touch MarkedForDeletion or MarkedForDeletionDate.
    /// Used for entities that don't implement IHardDeletable (e.g., PropertySocialDetails, WaterConnectionMaster).
    /// </summary>
    /// <param name="entities">The entities to deactivate</param>
    public void DeactivatePropertyEntities(IEnumerable<BaseEntity> entities)
    {
        var now = DateTime.Now;
        foreach (var entity in entities)
        {
            entity.IsActive = false;
            entity.UpdatedDate = now;
            _context.Entry(entity).State = EntityState.Modified;
        }
    }

    public async Task<CreateBulkPropertyResponseDto?> CreateBulkPropertyAsync(CreateBulkPropertyDto dto, CancellationToken cancellationToken = default)
    {

        // Transaction
        PropertyEntity? property = null;
        PropertyAssessmentEntity? propertyMastDetails = null;
        try
        {
            var ward = await _context.WardMaster.FirstOrDefaultAsync(x => x.Id == dto.WardId && x.IsActive, cancellationToken);
            if (ward == null)
            {
                throw new PropertyValidationException($"Ward with Id {dto.WardId} not found or inactive.");
            }

            if (dto.TaxZoneId <= 0 || !await _context.TaxZoneMaster.AnyAsync(x => x.Id == dto.TaxZoneId && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"TaxZone with Id {dto.TaxZoneId} not found or inactive.");
            }

            if (dto.CategoryId <= 0 || !await _context.PropertyCategoryMaster.AnyAsync(x => x.Id == dto.CategoryId && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"Category with Id {dto.CategoryId} not found or inactive.");
            }

            if (dto.PropertyTypeId <= 0 || !await _context.PropertyTypeMasters.AnyAsync(x => x.Id == dto.PropertyTypeId && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"PropertyType with Id {dto.PropertyTypeId} not found or inactive.");
            }

            if (dto.BHKId.HasValue && dto.BHKId.Value > 0
                && !await _context.BHKMasters.AnyAsync(x => x.Id == dto.BHKId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"BHK with Id {dto.BHKId.Value} not found or inactive.");
            }

            if (dto.OwnerTypeId.HasValue && dto.OwnerTypeId.Value > 0
                && !await _context.OwnerTypeMaster.AnyAsync(x => x.Id == dto.OwnerTypeId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"OwnerType with Id {dto.OwnerTypeId.Value} not found or inactive.");
            }

            if (dto.PropertyFloorId.HasValue && dto.PropertyFloorId.Value > 0
                && !await _context.FloorEntity.AnyAsync(x => x.Id == dto.PropertyFloorId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"Floor with Id {dto.PropertyFloorId.Value} not found or inactive.");
            }

            if (dto.SubFloorId.HasValue && dto.SubFloorId.Value > 0
                && !await _context.SubFloorEntity.AnyAsync(x => x.Id == dto.SubFloorId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"SubFloor with Id {dto.SubFloorId.Value} not found or inactive.");
            }

            if (dto.ConstructionTypeId.HasValue && dto.ConstructionTypeId.Value > 0
                && !await _context.ConstructionTypeEntity.AnyAsync(x => x.Id == dto.ConstructionTypeId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"ConstructionType with Id {dto.ConstructionTypeId.Value} not found or inactive.");
            }

            if (dto.TypeOfUseId.HasValue && dto.TypeOfUseId.Value > 0
                && !await _context.TypeOfUse.AnyAsync(x => x.Id == dto.TypeOfUseId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"TypeOfUse with Id {dto.TypeOfUseId.Value} not found or inactive.");
            }

            if (dto.SubTypeOfUseId.HasValue && dto.SubTypeOfUseId.Value > 0
                && !await _context.SubTypeOfUse.AnyAsync(x => x.Id == dto.SubTypeOfUseId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"SubTypeOfUse with Id {dto.SubTypeOfUseId.Value} not found or inactive.");
            }

            if (dto.WingDetailId.HasValue && dto.WingDetailId.Value > 0
                && !await _context.WingDetailsMast.AnyAsync(x => x.Id == dto.WingDetailId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"WingDetail with Id {dto.WingDetailId.Value} not found or inactive.");
            }

            if (dto.WorkflowStageId.HasValue && dto.WorkflowStageId.Value > 0
                && !await _context.PropertyWorkflowStageMaster.AnyAsync(x => x.Id == dto.WorkflowStageId.Value && x.IsActive, cancellationToken))
            {
                throw new PropertyValidationException($"WorkflowStage with Id {dto.WorkflowStageId.Value} not found or inactive.");
            }

            // Get default UNASSESSED status for property
            var unassessedStatus = await _context.PropertyAssessmentStatuses
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.StatusName == PropertyAssessmentStatus.Unassessed && x.IsActive, cancellationToken);

            // Property insert
            var propertyNo = dto.PropertyNo.Trim();
            if (dto.IsVirtualProperty == true && !propertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                propertyNo = $"{VirtualPropertyConstants.VirtualPropertyPrefix}{propertyNo}";
            }

            property = new PropertyEntity
            {
                TaxZoneId = dto.TaxZoneId,
                WardId = dto.WardId,
                PropertyNo = propertyNo,
                PartitionNo = dto.PartitionNo.Trim(),
                PropertySeqNo = dto.PropertySeqNo,
                PropertyTypeId = dto.PropertyTypeId,
                CategoryId = dto.CategoryId,
                PropertyAssessmentStatusId = unassessedStatus?.Id,
                UPICId = UpicIdBuilderHelper.Generate(ward.WardNo, propertyNo, dto.PartitionNo),
                OwnerTitle = string.Empty,
                OwnerTitleEnglish = string.Empty,
                OpenPlot = dto.OpenPlot,
                OwnerName = dto.OwnerName,
                Type = dto.Type,
                OwnerNameEnglish = dto.OwnerNameEnglish,
                FlatOrShopNo = dto.FlatOrShopNo,
                FlatOrShopNoEnglish = dto.FlatOrShopNoEnglish,
                Address = dto?.Address,
                AddressEnglish = dto?.AddressEnglish,
                Location = dto?.Location,
                LocationEnglish = dto?.LocationEnglish,
                WingDetailId = dto?.WingDetailId,
                PropertyFloorId = dto?.PropertyFloorId,
                IsVirtualProperty = dto?.IsVirtualProperty ?? false,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedBy = dto?.CreatedBy
            };

            _context.PropertyMast.Add(property);
            var propertySaveResult = await _context.SaveChangesAsync(cancellationToken);


            // Assessment insert 
            propertyMastDetails = new PropertyAssessmentEntity
            {
                PropertyId = property.Id,
                OwnerTypeId = dto?.OwnerTypeId,
                UnitGenerationType = dto?.UnitGenerationType,
                BHKId = dto?.BHKId,
                IsActive = true,
                MarkedForDeletion = false,
                CreatedBy = dto?.CreatedBy
            };

            _context.PropertyMastDetails.Add(propertyMastDetails);
            var assessmentSaveResult = await _context.SaveChangesAsync(cancellationToken);

            if (dto != null && dto.ConstructionTypeId != null && dto.TypeOfUseId != null && dto.SubTypeOfUseId != null && dto.ConstructionYear != null)
            {
                // PropertyDetails insert
                var propertyDetails = new PropertyDetailsEntity
                {
                    PropertyId = property.Id,
                    FloorId = property.PropertyFloorId,
                    SubFloorId = dto.SubFloorId,
                    ConstructionTypeId = dto.ConstructionTypeId,
                    TypeOfUseId = dto.TypeOfUseId!.Value,
                    SubTypeOfUseId = dto.SubTypeOfUseId,
                    ConstructionYear = dto.ConstructionYear,
                    AssessmentYear = dto.AssessmentYear,
                    CarpetAreaSqMeter = dto.CarpetAreaSqMeter,
                    CarpetAreaSqFeet = dto.CarpetAreaSqFeet,
                    BuiltupAreaSqMeter = dto.BuiltupAreaSqMeter,
                    BuiltupAreaSqFeet = dto.BuiltupAreaSqFeet,
                    NoOfRooms = dto.NoOfRooms,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedBy = dto?.CreatedBy
                };

                _context.PropertyDetails.Add(propertyDetails);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Workflow details insert
            var existingWorkflows = await _context.PropertyWorkflowDetails
                .Where(x => x.PropertyId == property.Id && x.CurrentStatus == true)
                .ToListAsync(cancellationToken);

            foreach (var item in existingWorkflows)
            {
                item.CurrentStatus = false;
                item.UpdatedDate = DateTime.Now;
                _context.Entry(item).State = EntityState.Modified;
            }

            var workflowDetails = new PropertyWorkflowDetailsEntity
            {
                PropertyId = property.Id,
                WorkflowStageId = dto?.WorkflowStageId ?? 1,
                IsActive = true,
                CurrentStatus = true,
                ModuleId = dto?.ModuleId,
                CreatedBy = dto?.CreatedBy,
                CreatedDate = DateTime.Now
            };

            _context.PropertyWorkflowDetails.Add(workflowDetails);
            await _context.SaveChangesAsync(cancellationToken);

            return new CreateBulkPropertyResponseDto
            {
                PropertyId = property!.Id,
                Success = true,
                Message = "Property generated successfully."
            };
        }
        catch (PropertyValidationException ex)
        {
            return new CreateBulkPropertyResponseDto
            {
                Success = false,
                Message = ex.Message
            };
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // Another user modified the same record mid-transaction
            return new CreateBulkPropertyResponseDto
            {
                Success = false,
                Message = $"A concurrency conflict occurred. Please retry. detail: {ex.Message}"
            };
        }
        catch (Exception ex)
        {
            // Any unexpected error
            return new CreateBulkPropertyResponseDto
            {
                Success = false,
                Message = $"An unexpected error occurred : {ex.Message}"
            };
        }
    }
    
    public async Task<PropertyEntity?> CheckBuildingIfExists(CreateBulkPropertyDto dto, CancellationToken cancellationToken = default)
    {
        var propertyNo = dto.PropertyNo?.Trim() ?? string.Empty;
        if (dto.IsVirtualProperty == true && !propertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            propertyNo = $"{VirtualPropertyConstants.VirtualPropertyPrefix}{propertyNo}";
        }

        return await _context.PropertyMast.FirstOrDefaultAsync(x => x.WardId == dto.WardId && x.PropertyNo == propertyNo && (x.PartitionNo == null || x.PartitionNo == "") && x.MarkedForDeletion == false && x.IsActive, cancellationToken);
    }
    public async Task<PropertyCategoryEntity?> GetBuildingCategory(int CategoryId, CancellationToken cancellationToken = default)
    {
        return await _context.PropertyCategoryMaster.FirstOrDefaultAsync(x => x.Id == CategoryId, cancellationToken);
    }
    public async Task<PropertyTypeMasterEntity?> GetAmenityPropertyType(CancellationToken cancellationToken = default)
    {
        return await _context.PropertyTypeMasters.FirstOrDefaultAsync(x => x.PartType == PartTypeConstants.Amenity, cancellationToken);
    }
    public async Task<bool> CheckPropertyIfExists(CreateBulkPropertyDto dto, CancellationToken cancellationToken = default)
    {
        var propertyNo = dto.PropertyNo?.Trim() ?? string.Empty;

        if (dto.IsVirtualProperty == true &&
            !propertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            propertyNo = $"{VirtualPropertyConstants.VirtualPropertyPrefix}{propertyNo}";
        }

        return await _context.PropertyMast.AnyAsync(
            x => x.WardId == dto.WardId
              && x.PropertyNo == propertyNo
              && x.WingDetailId == dto.WingDetailId
              && x.PartitionNo == dto.PartitionNo
              && x.IsActive
              && !x.MarkedForDeletion,
            cancellationToken);
    }
    public async Task<bool> CheckPropertyFlatIfExists(
  CreateBulkPropertyDto dto,
  CancellationToken cancellationToken = default)
    {
        var propertyNo = dto.PropertyNo?.Trim() ?? string.Empty;
        if (dto.IsVirtualProperty == true && !propertyNo.StartsWith(VirtualPropertyConstants.VirtualPropertyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            propertyNo = $"{VirtualPropertyConstants.VirtualPropertyPrefix}{propertyNo}";
        }

        return await _context.PropertyMast.AnyAsync(
            x => x.WardId == dto.WardId
              && x.PropertyNo == propertyNo
              && x.WingDetailId == dto.WingDetailId
              && x.FlatOrShopNo == dto.FlatOrShopNo
              && x.IsActive
              && !x.MarkedForDeletion,
            cancellationToken);
    }


    public async Task ExecuteSoftDeletePropertiesRelatedEntitiesAsync(int[] propertyIds, CancellationToken cancellationToken = default)
    {
        var deletionTime = DateTime.Now;

        // 1. PropertyDetails
        await _context.PropertyDetails
            .Where(pd => propertyIds.Contains(pd.PropertyId) && pd.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 2. RVCalculationResults
        await _context.RVCalculationResults
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 3. PropertyTaxCalculationSection129Results
        await _context.PropertyTaxCalculationSection129Results
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 4. RoomWiseSubmissionDetails
        await _context.RoomWiseSubmissionDetails
            .Where(x => x.PropertyId.HasValue && propertyIds.Contains(x.PropertyId.Value) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 5. RenterMast
        await _context.RenterMast
            .Where(x => _context.PropertyDetails.Where(pd => propertyIds.Contains(pd.PropertyId)).Select(pd => pd.Id).Contains(x.PropertyDetailsId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 6. RenterDetails
        await _context.RenterDetails
            .Where(x => _context.PropertyDetails.Where(pd => propertyIds.Contains(pd.PropertyId)).Select(pd => pd.Id).Contains(x.PropertyDetailsId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 7. RoomWiseMinusData
        await _context.RoomWiseMinusData
            .Where(x => _context.RoomWiseSubmissionDetails.Where(r => r.PropertyId.HasValue && propertyIds.Contains(r.PropertyId.Value)).Select(r => r.Id).Contains(x.RoomWiseSubmissionId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 8. PropertySocialDetails
        await _context.Set<PropertySocialDetailsEntity>()
            .Where(x => x.PropertyId.HasValue && propertyIds.Contains(x.PropertyId.Value) && x.IsActive == true)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 9. WaterConnectionMaster
        await _context.Set<WaterConnectionMasterEntity>()
            .Where(x => propertyIds.Contains(x.PropertyId) && x.IsActive == true)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 10. ApplyTaxesMaster
        await _context.ApplyTaxesMaster
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 11. FlagMaster
        await _context.FlagMaster
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 13. PolicyTaxDetails
        await _context.PolicyTaxDetails
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 14. PropertyAssessmentDetails
        await _context.PropertyAssessmentDetails
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 15. PropertyImagesMast
        await _context.PropertyImagesMast
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 22. TransMast
        await _context.TransMast
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 23. TransMastArchive
        await _context.TransMastArchive
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 24. TransMastLookup
        await _context.TransMastLookup
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);

        // 25. PropertyMastDetails
        await _context.PropertyMastDetails
            .Where(x => propertyIds.Contains(x.PropertyId) && x.MarkedForDeletion == false)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.MarkedForDeletion, true)
                .SetProperty(p => p.MarkedForDeletionDate, deletionTime)
                .SetProperty(p => p.IsActive, false)
                .SetProperty(p => p.UpdatedDate, deletionTime),
                cancellationToken);
    }
}