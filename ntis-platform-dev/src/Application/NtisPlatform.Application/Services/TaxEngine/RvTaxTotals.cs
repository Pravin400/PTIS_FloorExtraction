using NtisPlatform.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace NtisPlatform.Application.Services.TaxEngine
{
    /// <summary>
    /// Totals the tax rows of an RV calculation the same way <see cref="RVPersistenceService"/> saves them,
    /// so a preview of a year's tax equals what saving that year stores as its TaxTotal row.
    /// </summary>
    /// <remarks>
    /// <see cref="RateableValueService"/> gives EVERY detail of a property its own education tax row (and
    /// employment tax row) carrying the WHOLE property-level amount. Adding up the rows therefore counts
    /// that amount once per detail. Persistence takes it once (the largest value per property-type group),
    /// and this does the same.
    /// </remarks>
    public static class RvTaxTotals
    {
        /// <summary>
        /// The property's annual rental value the way <see cref="RVPersistenceService"/> saves it on the TransMast rows
        /// (<c>CalculationAnnualValue</c>): the live results rows added up.
        /// </summary>
        public static decimal SumAnnualRentalValue(IEnumerable<RVCalculationResultsEntity> resultsRows) =>
            resultsRows
                .Where(x => x.IsActive && !x.MarkedForDeletion)
                .Sum(x => Convert.ToDecimal(x.AnnualRentalValue ?? 0d));

        /// <summary>
        /// Regular taxes: summed over the details and rounded to whole rupees per tax. Education tax:
        /// the largest R value plus the largest C value. Employment tax: the largest C value.
        /// </summary>
        /// <param name="taxDetailRows">The per-detail tax rows of the calculation.</param>
        /// <param name="resultsRows">The per-detail results rows (they carry the education / employment amounts).</param>
        /// <param name="educationTaxId">TaxMaster id of the education tax, or null when the master has none.</param>
        /// <param name="employmentTaxId">TaxMaster id of the employment tax, or null when the master has none.</param>
        public static decimal SumAsSaved(
            IEnumerable<RVCalculationTaxDetailsEntity> taxDetailRows,
            IEnumerable<RVCalculationResultsEntity> resultsRows,
            int? educationTaxId,
            int? employmentTaxId)
        {
            var liveTaxRows = taxDetailRows.Where(x => x.TaxId > 0 && x.IsActive && !x.MarkedForDeletion);
            var liveResultRows = resultsRows.Where(x => x.IsActive && !x.MarkedForDeletion).ToList();

            decimal total = 0m;

            foreach (var taxGroup in liveTaxRows.GroupBy(x => x.TaxId))
            {
                var isSpecial = (educationTaxId.HasValue && taxGroup.Key == educationTaxId.Value) ||
                                (employmentTaxId.HasValue && taxGroup.Key == employmentTaxId.Value);
                if (isSpecial)
                {
                    continue;
                }

                total += Math.Round(taxGroup.Sum(x => x.TaxAmount ?? 0m), 0, MidpointRounding.AwayFromZero);
            }

            if (educationTaxId.HasValue)
            {
                var rEducationTax = liveResultRows.Where(x => x.REducationTax.HasValue).Max(x => x.REducationTax) ?? 0m;
                var cEducationTax = liveResultRows.Where(x => x.CEducationTax.HasValue).Max(x => x.CEducationTax) ?? 0m;
                total += rEducationTax + cEducationTax;
            }

            if (employmentTaxId.HasValue)
            {
                total += liveResultRows.Where(x => x.CEmploymentTax.HasValue).Max(x => x.CEmploymentTax) ?? 0m;
            }

            return total;
        }
    }
}
