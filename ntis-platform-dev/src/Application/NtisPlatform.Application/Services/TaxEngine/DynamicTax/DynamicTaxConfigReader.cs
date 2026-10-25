using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.TaxEngine.DynamicTax
{
    /// <inheritdoc cref="IDynamicTaxConfigReader"/>
    public class DynamicTaxConfigReader : IDynamicTaxConfigReader
    {
        private readonly IRepository<TaxConditionRuleEntity, int> _conditionRuleRepo;
        private readonly IRepository<TaxMasterMappingEntity, int> _masterMappingRepo;
        private readonly IRepository<TaxHybridConfigEntity, int> _hybridConfigRepo;
        private readonly IRepository<DynamicTaxRuleEntity, int> _ruleRepo;
        private readonly IRepository<TaxMasterEntity, int> _taxMasterRepo;

        public DynamicTaxConfigReader(
            IRepository<TaxConditionRuleEntity, int> conditionRuleRepo,
            IRepository<TaxMasterMappingEntity, int> masterMappingRepo,
            IRepository<TaxHybridConfigEntity, int> hybridConfigRepo,
            IRepository<DynamicTaxRuleEntity, int> ruleRepo,
            IRepository<TaxMasterEntity, int> taxMasterRepo)
        {
            _conditionRuleRepo = conditionRuleRepo;
            _masterMappingRepo = masterMappingRepo;
            _hybridConfigRepo = hybridConfigRepo;
            _ruleRepo = ruleRepo;
            _taxMasterRepo = taxMasterRepo;
        }

        public async Task<DynamicTaxConfigSnapshot> LoadAsync(
            IReadOnlyCollection<int> taxIds,
            CancellationToken cancellationToken = default)
        {
            if (taxIds.Count == 0)
            {
                return DynamicTaxConfigSnapshot.Empty;
            }

            var ids = taxIds.Distinct().ToList();

            // Ordered here, once, so the resolver can iterate rows in evaluation order without
            // re-sorting per property detail.
            var conditionRules = await _conditionRuleRepo.GetQueryable()
                .AsNoTracking()
                .Where(c => ids.Contains(c.TaxId) && c.IsActive)
                .OrderBy(c => c.TaxId).ThenBy(c => c.SortOrder).ThenBy(c => c.Id)
                .ToListAsync(cancellationToken);

            var masterMappings = await _masterMappingRepo.GetQueryable()
                .AsNoTracking()
                .Where(m => ids.Contains(m.TaxId) && m.IsActive)
                .ToListAsync(cancellationToken);

            var hybridConfigs = await _hybridConfigRepo.GetQueryable()
                .AsNoTracking()
                .Where(h => ids.Contains(h.TaxId) && h.IsActive)
                .ToListAsync(cancellationToken);

            var rules = await _ruleRepo.GetQueryable()
                .AsNoTracking()
                .Where(r => r.IsActive)
                .ToListAsync(cancellationToken);

            return new DynamicTaxConfigSnapshot
            {
                ConditionRulesByTax = conditionRules
                    .GroupBy(c => c.TaxId)
                    .ToDictionary(g => g.Key, g => g.ToList()),
                MasterMappingsByTax = masterMappings
                    .GroupBy(m => m.TaxId)
                    .ToDictionary(g => g.Key, g => g.ToList()),
HybridConfigByTax = hybridConfigs.ToDictionary(h => h.TaxId),
                RulesById = rules.ToDictionary(r => r.Id)
            };
        }

        public async Task<string> GetConfigFingerprintAsync(CancellationToken cancellationToken = default)
        {
            var (conditionCount, conditionMax) = await SummarizeAsync(_conditionRuleRepo.GetQueryable(), cancellationToken);
            var (mappingCount, mappingMax) = await SummarizeAsync(_masterMappingRepo.GetQueryable(), cancellationToken);
            var (hybridCount, hybridMax) = await SummarizeAsync(_hybridConfigRepo.GetQueryable(), cancellationToken);
            var (ruleCount, ruleMax) = await SummarizeAsync(_ruleRepo.GetQueryable(), cancellationToken);
            // DynamicTaxRegisterService.UpdateSettingsAsync changes TaxMaster.CalculationModeId,
            // RuleDefinitionId, and IsActive directly — none of the four tables above. Switching a
            // tax to a different calculation mode or a different linked rule (within the same mode)
            // need not touch any condition/mapping/hybrid/rule row, so without this TaxMaster itself
            // must be in the fingerprint too, or that edit would never invalidate the fast path.
            var (taxMasterCount, taxMasterMax) = await SummarizeAsync(_taxMasterRepo.GetQueryable(), cancellationToken);

            return string.Join(
                '|',
                $"CR:{conditionCount}:{conditionMax:O}",
                $"MM:{mappingCount}:{mappingMax:O}",
                $"HC:{hybridCount}:{hybridMax:O}",
                $"RL:{ruleCount}:{ruleMax:O}",
                $"TM:{taxMasterCount}:{taxMasterMax:O}");
        }

        /// <summary>
        /// COUNT and MAX(UpdatedDate ?? CreatedDate) for one table in a SINGLE round trip. Grouping
        /// on a constant collapses to one aggregate row without EF Core issuing a separate COUNT
        /// query first — two queries per table here would mean 8 round trips on every fingerprint
        /// call, and this fingerprint is computed on every RV calculation (including every fast-path
        /// cache hit), so that cost is paid once per property in a batch run.
        /// </summary>
        private static async Task<(int Count, DateTime Max)> SummarizeAsync<T>(
            IQueryable<T> query,
            CancellationToken cancellationToken)
            where T : BaseEntity
        {
            var stats = await query
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Count = g.Count(),
                    // Falls back to CreatedDate for rows never updated since insert, so a fresh row
                    // without an UpdatedDate still moves the fingerprint.
                    Max = g.Max(e => (DateTime?)(e.UpdatedDate ?? e.CreatedDate))
                })
                .FirstOrDefaultAsync(cancellationToken);

            return stats == null ? (0, DateTime.MinValue) : (stats.Count, stats.Max ?? DateTime.MinValue);
        }
    }
}
