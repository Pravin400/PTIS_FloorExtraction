using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;

namespace NtisPlatform.Application.Interfaces.TaxEngine
{
    /// <summary>
    /// Loads the Dynamic Tax Register configuration (PTIS.TaxConditionRule, PTIS.TaxMasterMapping,
    /// PTIS.TaxHybridConfig, PTIS.DynamicTaxRuleMaster) that the RV calculation pipeline needs.
    ///
    /// <para>
    /// Separate from <see cref="ITaxMasterDataService"/> on purpose: that service caches its reads in
    /// <c>IMemoryCache</c>, which is right for slow-moving masters but wrong for configuration an
    /// admin edits live from the register screen and expects to take effect on the next calculation.
    /// </para>
    /// </summary>
    public interface IDynamicTaxConfigReader
    {
        /// <summary>
        /// Loads every configuration row belonging to <paramref name="taxIds"/>. Returns
        /// <see cref="DynamicTaxConfigSnapshot.Empty"/> when <paramref name="taxIds"/> is empty.
        /// </summary>
        Task<DynamicTaxConfigSnapshot> LoadAsync(
            IReadOnlyCollection<int> taxIds,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// A cheap fingerprint (no row bodies, just count + latest UpdatedDate per table) covering
        /// every row of PTIS.TaxConditionRule, PTIS.TaxMasterMapping, PTIS.TaxHybridConfig and
        /// PTIS.DynamicTaxRuleMaster — active or not, so a row being deactivated/deleted also changes
        /// it. Callers fold this into an RV calculation's cache-invalidation signature so that saving
        /// a condition/mapping row from the register screen invalidates every property's cached
        /// result, not just properties whose own data changed.
        /// </summary>
        Task<string> GetConfigFingerprintAsync(CancellationToken cancellationToken = default);
    }
}
