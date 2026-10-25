using NtisPlatform.Application.DTOs.TaxEngine.DynamicTax;

namespace NtisPlatform.Application.Interfaces.TaxEngine
{
    /// <summary>
    /// Prices a tax from its Dynamic Tax Register configuration, dispatching on the tax's calculation
    /// mode. The single bridge between the register's configuration tables and the live RV pipeline.
    ///
    /// <para>
    /// Dispatch is on the mode's <c>Uses*Config</c> capability flags, never on <c>ModeCode</c> — so a
    /// new mode row that reuses an existing mechanism needs no change here.
    /// </para>
    /// </summary>
    public interface IDynamicTaxAmountResolver
    {
        /// <summary>
        /// Returns the amount this tax's configuration produces, or
        /// <c>DynamicTaxAmount.NotResolved(...)</c> when no configuration applied — including for
        /// value-config taxes, which the RV pipeline keeps pricing through
        /// <c>RateableValueTaxCalculator.ApplyTax</c>. Never throws: a malformed or contradictory
        /// config row must not block a property's tax run.
        /// </summary>
        DynamicTaxAmount Resolve(DynamicTaxResolutionContext context);
    }
}
