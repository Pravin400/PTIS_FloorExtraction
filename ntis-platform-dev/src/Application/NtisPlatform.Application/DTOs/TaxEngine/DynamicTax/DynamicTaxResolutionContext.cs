using System;
using System.Collections.Generic;
using NtisPlatform.Application.Services.TaxEngine.DynamicTax;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.DTOs.TaxEngine.DynamicTax
{
    /// <summary>
    /// Everything the resolver needs to price one (property detail, tax) pair from Dynamic Tax
    /// Register configuration.
    /// </summary>
    public sealed class DynamicTaxResolutionContext
    {
        /// <summary>The tax being priced. Its <c>CalculationModeMaster</c> navigation must be loaded.</summary>
        public required TaxMasterEntity Tax { get; init; }

        /// <summary>This detail's rateable value, as just computed by the RV pipeline.</summary>
        public decimal RateableValue { get; init; }

        /// <summary>This detail's annual rental value, as just computed by the RV pipeline.</summary>
        public decimal AnnualRentalValue { get; init; }

        /// <summary>Property's total rateable value summed across all details.</summary>
        public decimal PropertyTotalRateableValue { get; init; }

        /// <summary>Property's total annual rental value summed across all details.</summary>
        public decimal PropertyTotalAnnualRentalValue { get; init; }

        /// <summary>Property's total carpet area in sq. meters summed across all active details.</summary>
        public decimal PropertyTotalCarpetAreaSqMeter { get; init; } = 0m;

        /// <summary>Property's total carpet area in sq. feet summed across all active details.</summary>
        public decimal PropertyTotalCarpetAreaSqFeet { get; init; } = 0m;

        /// <summary>Property's total built-up area in sq. feet summed across all active details.</summary>
        public decimal PropertyTotalBuiltupAreaSqFeet { get; init; } = 0m;

        /// <summary>Property's total built-up area in sq. meters summed across all active details.</summary>
        public decimal PropertyTotalBuiltupAreaSqMeter { get; init; } = 0m;

        /// <summary>
        /// Building's total rateable value — summed across every property detail in the same
        /// building (same WardId+PropertyNo group), not just this one property's own details.
        /// </summary>
        public decimal BuildingTotalRateableValue { get; init; }

        /// <summary>Building's total annual rental value — the ALV counterpart to <see cref="BuildingTotalRateableValue"/>.</summary>
        public decimal BuildingTotalAnnualRentalValue { get; init; }

        /// <summary>Floor's total built-up area in square feet summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalBuiltupAreaSqFeet { get; init; }

        /// <summary>Floor's total built-up area in square meters summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalBuiltupAreaSqMeter { get; init; }

        /// <summary>Floor's total carpet area in square feet summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalCarpetAreaSqFeet { get; init; }

        /// <summary>Floor's total carpet area in square meters summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalCarpetAreaSqMeter { get; init; }

        /// <summary>Floor's total rateable value summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalRateableValue { get; init; }

        /// <summary>Floor's total annual rental value summed across all details of this property on the same floor.</summary>
        public decimal FloorTotalAnnualRentalValue { get; init; }

        /// <summary>This detail's built-up area in square feet.</summary>
        public decimal DetailBuiltupAreaSqFeet { get; init; }

        /// <summary>This detail's built-up area in square meters.</summary>
        public decimal DetailBuiltupAreaSqMeter { get; init; }

        /// <summary>Total count of details on this floor for this property.</summary>
        public int FloorDetailCount { get; init; } = 1;
        /// <summary>The detail's resolved assessment year range — config rows scoped to another year are skipped.</summary>
        public int DetailYearRangeRVId { get; init; }

        /// <summary>The detail's TypeOfUseId — a MASTER_BASED "TypeOfUse" key source.</summary>
        public int TypeOfUseId { get; init; }

        /// <summary><c>Property.PropertyTypeId</c> — a MASTER_BASED "PropertyType" key source.</summary>
        public int? PropertyTypeId { get; init; }

        /// <summary><c>PropertyAssessment.OwnerTypeId</c> — a MASTER_BASED "OwnerType" key source.</summary>
        public int? OwnerTypeId { get; init; }

        /// <summary>
        /// Flattened field values for this detail, as produced by
        /// <c>IPropertyFieldFlattenerService.Flatten</c>. Empty when the detail has no resolvable
        /// Floor/TypeOfUseGroup — conditions then simply fail to match rather than throwing.
        /// </summary>
        public IReadOnlyDictionary<string, object> FieldValues { get; init; }
            = new Dictionary<string, object>();

        public required DynamicTaxConfigSnapshot Config { get; init; }

        /// <summary>
        /// Resolves an already-computed tax amount for THIS detail by TaxId, backing
        /// <c>ResultBase = OTHER_TAX</c>. Returns null when the referenced tax has not been computed
        /// yet (an ordering cycle) — the row then contributes zero rather than guessing.
        /// </summary>
        public required Func<int, decimal?> ReferenceTaxAmountLookup { get; init; }
    }
}
