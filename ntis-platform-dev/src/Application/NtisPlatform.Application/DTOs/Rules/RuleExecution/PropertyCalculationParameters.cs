using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.DTOs.Rules.RuleExecution
{
    /// <summary>
    /// Carries all scalar and transient calculation parameters for property tax rule execution.
    /// This is the strongly-typed alternative to a <c>Dictionary&lt;string, object&gt;</c> parameter bag.
    ///
    /// <para>
    /// <b>Design intent:</b><br/>
    /// — Scalar inputs resolved once per property load (<see cref="FinanceYear"/>, <see cref="ConstructionYearValue"/>, etc.)
    ///   are set by <c>PropertyContextLoaderService</c> and remain constant across all detail iterations.<br/>
    /// — Per-detail overrides (<see cref="Detail"/>, <see cref="DetailTypeOfUse"/>) are populated only
    ///   during a <c>CloneForDetail</c> operation and are scoped to a single detail's rule evaluation.
    /// </para>
    ///
    /// <para>
    /// <b>Extensibility:</b><br/>
    /// Add new calculation parameters as strongly-typed properties here.
    /// The compiler will immediately guide you to every call site that needs updating.
    /// </para>
    /// </summary>
    public sealed class PropertyCalculationParameters
    {
        // ─── Global Parameters (set once per property load) ────────────────────────

        /// <summary>
        /// The financial year for which tax is being calculated (e.g. 2026 for FY 2026-27).
        /// Derived from the current calendar date at the time of calculation.
        /// </summary>
        public int FinanceYear { get; set; }

        /// <summary>
        /// The parsed integer value of <c>PropertyDetailsEntity.ConstructionYear</c>.
        /// Used to compute <c>PropertyAge</c> and to resolve the applicable year range.
        /// </summary>
        public int ConstructionYearValue { get; set; }

        /// <summary>
        /// The primary key of the <c>AssessmentYearRangeEntity</c> that matches
        /// <see cref="ConstructionYearValue"/>. Used to filter tax percentage records.
        /// This is the default/property-level value; per-detail overrides are applied in <see cref="CloneForDetail"/>.
        /// </summary>
        public int YearRangeRVId { get; set; }

        /// <summary>
        /// Per-detail assessment year for the current detail evaluation.
        /// Set during <see cref="CloneForDetail"/> from <see cref="Detail"/>.AssessmentYear.
        /// Used to resolve the correct <see cref="YearRangeRVIdForDetail"/> when assessment years vary.
        /// </summary>
        public int? AssessmentYearValue { get; set; }

        /// <summary>
        /// Per-detail assessment year range ID resolved from <see cref="AssessmentYearValue"/>.
        /// Overrides <see cref="YearRangeRVId"/> during detail-level tax calculations.
        /// Set during <see cref="CloneForDetail"/> and used for filtering tax percentages per detail.
        /// </summary>
        public int? YearRangeRVIdForDetail { get; set; }

        /// <summary>
        /// The highest SequenceNo among all floor details of the property.
        /// </summary>
        public int BuildingMaxFloorSequence { get; set; }

        /// <summary>
        /// The highest numbered floor (e.g. 1 for First Floor, 4 for Fourth Floor, 5 for Fifth Floor)
        /// derived from FloorCode or SequenceNo.
        /// </summary>
        public int BuildingMaxFloorNumber { get; set; }

        /// <summary>
        /// The FloorMaster ID associated with the highest-sequence floor in the property/building.
        /// </summary>
        public int BuildingMaxFloorId { get; set; }

        /// <summary>
        /// The total Rateable Value summed across sibling properties in the building
        /// (excluding the target property currently being calculated).
        /// </summary>
        public decimal SiblingTotalRateableValue { get; set; }

        /// <summary>
        /// The total Annual Rental Value summed across sibling properties in the building —
        /// the ALV counterpart to <see cref="SiblingTotalRateableValue"/>.
        /// </summary>
        public decimal SiblingTotalAnnualRentalValue { get; set; }

        /// <summary>
        /// The total Rateable Value summed across every property detail in the building
        /// (same WardId+PropertyNo group as <see cref="BuildingMaxFloorSequence"/>), not just
        /// this single property's own details.
        /// </summary>
        public decimal BuildingTotalRateableValue { get; set; }

        /// <summary>
        /// The total Annual Rental Value summed across every property detail in the building —
        /// the ALV counterpart to <see cref="BuildingTotalRateableValue"/>.
        /// </summary>
        public decimal BuildingTotalAnnualRentalValue { get; set; }

        /// <summary>
        /// A list of selected SocialAttributeIds against the property (from PropertySocialDetailsEntity).
        /// Used for multi-select rules (e.g. Contains Any, Contains All).
        /// </summary>
        public List<int> SocialAttributeId { get; set; } = new();

        /// <summary>
        /// All active social attributes for the property, keyed by <c>SocialAttributeCode</c>.
        /// Values are typed CLR objects: <c>bool</c> for BIT, <c>int</c> for INT,
        /// <c>decimal</c> for DECIMAL, <c>string</c> for TEXT.
        ///
        /// <para>
        /// <b>Adding a new attribute to the rule engine:</b><br/>
        /// 1. Add the attribute row to <c>PTIS.SocialAttributeMaster</c> (DB only).<br/>
        /// 2. Ensure the property data entry saves a row in <c>PropertySocialDetails</c>.<br/>
        /// 3. Reference it in a rule expression as <c>input.HAS_SOLAR</c>, <c>input.NO_OF_WELL</c>, etc.<br/>
        /// No C# code changes are required.
        /// </para>
        /// </summary>
        public Dictionary<string, object> SocialAttributes { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        // ─── Certificate Parameters (RulesFieldMaster & Dynamic by Code) ───────────

        /// <summary>
        /// Indicates whether an active Occupancy Certificate (OC) exists for the evaluated scope.
        /// Corresponds to RulesFieldMaster Id 13 (FieldName: "Occupancy Certificate", DatabaseColumnName: "OccupancyCertificate").
        /// </summary>
        public bool OccupancyCertificate { get; set; }

        /// <summary>
        /// Indicates whether an active Commencement/Completion Certificate (CC) exists for the evaluated scope.
        /// Corresponds to RulesFieldMaster Id 14 (FieldName: "Commencement Certificate", DatabaseColumnName: "CommencementCertificate").
        /// </summary>
        public bool CommencementCertificate { get; set; }

        /// <summary>
        /// Indicates whether an active Electric Bill Date certificate exists for the evaluated scope.
        /// Corresponds to RulesFieldMaster Id 4013 (FieldName: "Electric Bill Date", DatabaseColumnName: "ElectricBillDate").
        /// </summary>
        public bool ElectricBillDate { get; set; }

        /// <summary>
        /// Dynamic map of all active certificate types present for the evaluated scope,
        /// keyed by CertificateTypeCode (e.g. "OC", "CC", "EleBillDt", "POSSESSION_CERTIFICATE").
        /// </summary>
        public Dictionary<string, bool> CertificatesByCode { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        // ─── Per-Detail Overrides (set during CloneForDetail) ──────────────────────

        /// <summary>
        /// The specific <c>PropertyDetailsEntity</c> record being evaluated in the
        /// current rule execution cycle. Null at the context root level.
        /// </summary>
        public PropertyDetailsEntity? Detail { get; set; }

        /// <summary>
        /// The <c>TypeOfUseEntity</c> that corresponds to <see cref="Detail"/>.
        /// Null at the context root level.
        /// </summary>
        public TypeOfUseEntity? DetailTypeOfUse { get; set; }

        /// <summary>
        /// Creates a shallow copy of the global parameters, then overrides
        /// the per-detail fields for a new detail evaluation scope.
        /// Called exclusively by <see cref="PropertyCalculationContext.CloneForDetail"/>.
        /// </summary>
        internal PropertyCalculationParameters CloneForDetail(
            PropertyDetailsEntity detail,
            TypeOfUseEntity detailTypeOfUse,
            List<AssessmentYearRangeEntity> yearRanges,
            IReadOnlyList<PropertyCertificateEntity>? certificates = null,
            PropertyEntity? property = null,
            int? societyDetailId = null)
        {
            int? assessmentYearValue = null;
            int? yearRangeRVIdForDetail = null;

            if (!string.IsNullOrWhiteSpace(detail.AssessmentYear) &&
                int.TryParse(detail.AssessmentYear, out int parsedAssessmentYear))
            {
                assessmentYearValue = parsedAssessmentYear;
                var matchingYearRange = yearRanges.FirstOrDefault(
                    y => y.FromYear <= parsedAssessmentYear && y.ToYear >= parsedAssessmentYear);
                yearRangeRVIdForDetail = matchingYearRange?.Id;
            }

            var (occupancyCertificate, commencementCertificate, electricBillDate, certificatesByCode) =
                ResolveCertificates(certificates, detail.Id, property?.Id ?? detail.PropertyId, property?.WingDetailId, societyDetailId);

            return new PropertyCalculationParameters
            {
                // Global — unchanged across all detail iterations
                FinanceYear = this.FinanceYear,
                ConstructionYearValue = this.ConstructionYearValue,
                YearRangeRVId = this.YearRangeRVId,
                SocialAttributeId = this.SocialAttributeId,
                SocialAttributes = this.SocialAttributes,
                BuildingMaxFloorSequence = this.BuildingMaxFloorSequence,
                BuildingMaxFloorNumber = this.BuildingMaxFloorNumber,
                BuildingMaxFloorId = this.BuildingMaxFloorId,
                SiblingTotalRateableValue = this.SiblingTotalRateableValue,
                SiblingTotalAnnualRentalValue = this.SiblingTotalAnnualRentalValue,
                BuildingTotalRateableValue = this.BuildingTotalRateableValue,
                BuildingTotalAnnualRentalValue = this.BuildingTotalAnnualRentalValue,

                // Certificate overrides for this detail
                OccupancyCertificate = occupancyCertificate,
                CommencementCertificate = commencementCertificate,
                ElectricBillDate = electricBillDate,
                CertificatesByCode = certificatesByCode,

                // Per-detail — overridden for this clone
                Detail = detail,
                DetailTypeOfUse = detailTypeOfUse,
                AssessmentYearValue = assessmentYearValue,
                YearRangeRVIdForDetail = yearRangeRVIdForDetail
            };
        }

        /// <summary>
        /// Resolves certificate flags for a given detail/property scope following the hierarchy:
        /// Detail-level > Property-level > Wing-level > Society-level.
        /// Validates EntityType scope for each level:
        /// - Detail: EntityType "P" or null/empty, PropertyDetailsId matching detailId
        /// - Property: EntityType "P" or null/empty, PropertyId matching propertyId (no PropertyDetailsId)
        /// - Wing: EntityType "W", WingDetailId matching wingDetailId (no PropertyDetailsId)
        /// - Society: EntityType "S", SocietyDetailId matching societyDetailId (no PropertyDetailsId)
        /// </summary>
        public static (bool OccupancyCertificate, bool CommencementCertificate, bool ElectricBillDate, Dictionary<string, bool> CertificatesByCode) ResolveCertificates(
            IReadOnlyList<PropertyCertificateEntity>? certificates,
            int? propertyDetailId,
            int? propertyId,
            int? wingDetailId,
            int? societyDetailId = null)
        {
            var byCode = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
            bool hasOc = false;
            bool hasCc = false;
            bool hasEleBill = false;

            if (certificates == null || certificates.Count == 0)
                return (false, false, false, byCode);

            var applicableCerts = certificates
                .Where(c => c.IsActive && !c.MarkedForDeletion
                         && (
                             (propertyDetailId.HasValue && c.PropertyDetailsId == propertyDetailId.Value && (string.IsNullOrEmpty(c.EntityType) || c.EntityType == "P"))
                             || (!c.PropertyDetailsId.HasValue && propertyId.HasValue && c.PropertyId == propertyId.Value && (string.IsNullOrEmpty(c.EntityType) || c.EntityType == "P"))
                             || (!c.PropertyDetailsId.HasValue && wingDetailId.HasValue && c.WingDetailId == wingDetailId.Value && c.EntityType == "W")
                             || (!c.PropertyDetailsId.HasValue && societyDetailId.HasValue && c.SocietyDetailId == societyDetailId.Value && c.EntityType == "S")
                         ))
                .OrderBy(c => GetScopePriority(c, propertyDetailId, propertyId, wingDetailId, societyDetailId))
                .ToList();

            foreach (var cert in applicableCerts)
            {
                var code = cert.CertificateType?.CertificateTypeCode?.Trim();
                var name = cert.CertificateType?.CertificateTypeName?.Trim();

                if (!string.IsNullOrWhiteSpace(code))
                {
                    byCode[code] = true;
                    byCode["HAS_" + code] = true;
                }

                if (IsOccupancyCertificate(code, name))
                {
                    hasOc = true;
                    byCode["OccupancyCertificate"] = true;
                    byCode["OC"] = true;
                    byCode["HAS_OC"] = true;
                }

                if (IsCommencementCertificate(code, name))
                {
                    hasCc = true;
                    byCode["CommencementCertificate"] = true;
                    byCode["CC"] = true;
                    byCode["HAS_CC"] = true;
                }

                if (IsElectricBillCertificate(code, name))
                {
                    hasEleBill = true;
                    byCode["ElectricBillDate"] = true;
                    byCode["EleBillDt"] = true;
                    byCode["ELECTRIC_BILL"] = true;
                    byCode["HAS_ELEBILLDT"] = true;
                    byCode["HAS_ELECTRIC_BILL"] = true;
                }
            }

            return (hasOc, hasCc, hasEleBill, byCode);
        }

        private static int GetScopePriority(PropertyCertificateEntity cert, int? detailId, int? propertyId, int? wingDetailId, int? societyDetailId)
        {
            if (detailId.HasValue && cert.PropertyDetailsId == detailId.Value && (string.IsNullOrEmpty(cert.EntityType) || cert.EntityType == "P")) return 1;
            if (propertyId.HasValue && cert.PropertyId == propertyId.Value && cert.PropertyDetailsId == null && (string.IsNullOrEmpty(cert.EntityType) || cert.EntityType == "P")) return 2;
            if (wingDetailId.HasValue && cert.WingDetailId == wingDetailId.Value && cert.EntityType == "W") return 3;
            if (societyDetailId.HasValue && cert.SocietyDetailId == societyDetailId.Value && cert.EntityType == "S") return 4;
            return 5;
        }

        private static bool IsOccupancyCertificate(string? code, string? name)
        {
            if (string.Equals(code, "OC", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(code, "OccupancyCertificate", StringComparison.OrdinalIgnoreCase)) return true;
            if (name != null && name.IndexOf("Occupancy", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            return false;
        }

        private static bool IsCommencementCertificate(string? code, string? name)
        {
            if (string.Equals(code, "CC", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(code, "CommencementCertificate", StringComparison.OrdinalIgnoreCase)) return true;
            if (name != null && (name.IndexOf("Commencement", StringComparison.OrdinalIgnoreCase) >= 0 || name.IndexOf("Completion", StringComparison.OrdinalIgnoreCase) >= 0)) return true;
            return false;
        }

        private static bool IsElectricBillCertificate(string? code, string? name)
        {
            if (string.Equals(code, "EleBillDt", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(code, "ELECTRIC_BILL", StringComparison.OrdinalIgnoreCase)) return true;
            if (string.Equals(code, "ElectricBillDate", StringComparison.OrdinalIgnoreCase)) return true;
            if (name != null && name.IndexOf("Electric", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            return false;
        }
    }
}
