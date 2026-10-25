using System.Collections.Generic;
using System.Linq;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Services.TaxEngine.DynamicTax
{
    /// <summary>
    /// All Dynamic Tax Register configuration needed for one RV calculation run, loaded once and
    /// scoped to that run's active tax ids. Read-only — resolvers only look things up in here.
    ///
    /// <para>
    /// Deliberately loaded per run rather than through <c>ITaxMasterDataService</c>'s memory cache:
    /// these tables are edited live from the register screen, and an admin who saves a condition row
    /// must see it take effect on the next calculation, not after a cache expiry.
    /// </para>
    /// </summary>
    public sealed class DynamicTaxConfigSnapshot
    {
        /// <summary>Condition rows by TaxId, each list already ordered by SortOrder then Id.</summary>
        public IReadOnlyDictionary<int, List<TaxConditionRuleEntity>> ConditionRulesByTax { get; init; }
            = new Dictionary<int, List<TaxConditionRuleEntity>>();

        /// <summary>Master mappings by TaxId.</summary>
        public IReadOnlyDictionary<int, List<TaxMasterMappingEntity>> MasterMappingsByTax { get; init; }
            = new Dictionary<int, List<TaxMasterMappingEntity>>();

        /// <summary>Hybrid strategy row by TaxId (at most one per tax — unique index).</summary>
        public IReadOnlyDictionary<int, TaxHybridConfigEntity> HybridConfigByTax { get; init; }
            = new Dictionary<int, TaxHybridConfigEntity>();

        /// <summary>Rule Master rows by Id, for resolving a MASTER_BASED tax's AttachedReference.</summary>
        public IReadOnlyDictionary<int, DynamicTaxRuleEntity> RulesById { get; init; }
            = new Dictionary<int, DynamicTaxRuleEntity>();

        public static DynamicTaxConfigSnapshot Empty { get; } = new();

        public IReadOnlyList<TaxConditionRuleEntity> ConditionRulesFor(int taxId) =>
            ConditionRulesByTax.TryGetValue(taxId, out var rows) ? rows : [];

        public IReadOnlyList<TaxMasterMappingEntity> MasterMappingsFor(int taxId) =>
            MasterMappingsByTax.TryGetValue(taxId, out var rows) ? rows : [];

        public TaxHybridConfigEntity? HybridConfigFor(int taxId) =>
            HybridConfigByTax.TryGetValue(taxId, out var row) ? row : null;

        public DynamicTaxRuleEntity? RuleFor(int? ruleDefinitionId) =>
            ruleDefinitionId.HasValue && RulesById.TryGetValue(ruleDefinitionId.Value, out var rule) ? rule : null;

        /// <summary>Total configuration rows loaded — for a single summary log line per run.</summary>
        public int TotalRowCount =>
            ConditionRulesByTax.Values.Sum(v => v.Count)
            + MasterMappingsByTax.Values.Sum(v => v.Count)
            + HybridConfigByTax.Count;
    }
}
