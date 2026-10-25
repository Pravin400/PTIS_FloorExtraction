namespace NtisPlatform.Application.DTOs.PropertyRevision;

public class PeriodDetailsSectionDto
{
    public int TotalDays { get; set; }
    public int PeriodsCount { get; set; }
    public decimal FinalFyRateableValue { get; set; }
    public decimal FinalFyTax { get; set; }
    public List<RevisionPeriodRowDto> Periods { get; set; } = new();
    public FinalRevisedValuesDto FinalValues { get; set; } = new();
}

public class RevisionPeriodRowDto
{
    public long? PeriodId { get; set; }
    public int PeriodNo { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int NoOfDays { get; set; }
    public decimal ProrationFactor { get; set; }
    public string TypeOfUse { get; set; } = string.Empty;
    public decimal AnnualRateableValue { get; set; }
    public decimal PeriodRateableValue { get; set; }
    public decimal AnnualTax { get; set; }
    public decimal PeriodTax { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class RevisionComparisonValuesDto
{
    public int? RevisionNo { get; set; }
    public string? RevisionType { get; set; }
    public int? PeriodNo { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public decimal AnnualRentalValue { get; set; }
    public decimal RateableValue { get; set; }
    public decimal TotalTax { get; set; }
}

public class RevisionValueDifferenceDto
{
    public decimal RateableValue { get; set; }
    public decimal TotalTax { get; set; }
}

public class FinalRevisedValuesDto
{
    public decimal AnnualRentalValue { get; set; }
    public decimal RateableValue { get; set; }
    public decimal TotalTax { get; set; }
    public int PolicyCodesCount { get; set; }
    public int TaxesCount { get; set; }

    public RevisionComparisonValuesDto? Before { get; set; }
    public RevisionComparisonValuesDto After { get; set; } = new();
    public RevisionValueDifferenceDto Difference { get; set; } = new();
}

public class RevisionPropertyChangesDto
{
    // Period Context
    public long? RevisionPeriodId { get; set; }
    public int? PeriodNo { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    // Identification & Location
    public int WardId { get; set; }
    public string? WardNo { get; set; }
    public string? WardName { get; set; }
    public int? TaxZoneId { get; set; }
    public string? ZoneName { get; set; }
    public string? Division { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? SubZoneNo { get; set; }
    public int? MoujaId { get; set; }
    public string? MoujaName { get; set; }
    public string? RateSectionName { get; set; }
    public string? CSN { get; set; }
    public string? PlotNo { get; set; }
    /// <summary>Plot area in square meters. Null when property mast does not record a separate land/plot area.</summary>
    public double? PlotAreaSqMtr { get; set; }
    /// <summary>Plot area in square feet. Null when property mast does not record a separate land/plot area.</summary>
    public double? PlotAreaSqFeet { get; set; }
    public double? CarpetAreaSqMtr { get; set; }
    public double? CarpetAreaSqFeet { get; set; }
    public double? BuiltupAreaSqMtr { get; set; }
    public double? BuiltupAreaSqFeet { get; set; }

    // Category & Types
    public int? CategoryId { get; set; }
    public string? PropertyCategoryName { get; set; }
    public int? OwnerTypeId { get; set; }
    public string? OwnerCategory { get; set; }

    // Ownership & Occupant (Bilingual)
    public string? OwnerName { get; set; }
    public string? OwnerNameEnglish { get; set; }
    public string? OccupierName { get; set; }
    public string? OccupierNameEnglish { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? FlatOrShopNameEnglish { get; set; }
    public string? AadharNo { get; set; }

    // Address & Contact
    public string? Address { get; set; }
    public string? AddressEnglish { get; set; }
    public string? PinCode { get; set; }
    public string? MobileNo { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? EmailId { get; set; }
}

public class RevisionPeriodFloorsDto
{
    public long? PeriodId { get; set; }
    public int PeriodNo { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? PeriodLabel { get; set; }
    public int TotalFloors { get; set; }
    public double TotalBuiltupAreaSqFeet { get; set; }
    public double TotalCarpetAreaSqFeet { get; set; }
    public List<RevisionFloorDto> Floors { get; set; } = new();
}

public class RevisionFloorDto
{
    public long FloorDetailId { get; set; }
    public long? PeriodId { get; set; }
    public int? PeriodNo { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? PeriodLabel { get; set; }
    public bool IsCurrentPeriod { get; set; }
    public string? PreviousTypeOfUse { get; set; }
    public double? PreviousBuiltupAreaSqFeet { get; set; }
    public bool IsNewlyAddedInRevision { get; set; }
    public bool HasChanges { get; set; }
    public int FloorId { get; set; }
    public string FloorName { get; set; } = string.Empty;
    public int? SubFloorId { get; set; }
    public string? SubFloor { get; set; }
    public int TypeOfUseId { get; set; }
    public string TypeOfUse { get; set; } = string.Empty;
    public string? TypeOfUseCode { get; set; }
    public int? SubTypeOfUseId { get; set; }
    public string? SubTypeOfUse { get; set; }
    public int? ConstructionTypeId { get; set; }
    public string? ConstructionType { get; set; }
    public string? ConstructionTypeCode { get; set; }
    public string? ConstructionYear { get; set; }
    public string? AssessmentYear { get; set; }
    public int? NoOfRooms { get; set; }
    public double? CarpetAreaSqMeter { get; set; }
    public double? CarpetAreaSqFeet { get; set; }
    public double? BuiltupAreaSqMeter { get; set; }
    public double? BuiltupAreaSqFeet { get; set; }
    public bool IsTaxable { get; set; } = true;
    public bool IsRenter { get; set; } = false;
    public RevisionRenterDto? Renter { get; set; }
    public List<RevisionRoomDto> Rooms { get; set; } = new();

    // Calculation Results (from PTIS.RevisionRVCalculationResults)
    public string? AppliedOn { get; set; }
    public double? MonthlyRate { get; set; }
    public double? YearlyRate { get; set; }
    public decimal? Depreciation { get; set; }
    public decimal? DepreciationPer { get; set; }
    public decimal? AnnualRentalValue { get; set; }
    public decimal? Maintenance { get; set; }
    public decimal? RateableValue { get; set; }
}

public class RevisionRenterDto
{
    public long RenterId { get; set; }
    public long? FloorDetailId { get; set; }
    public long? PeriodId { get; set; }
    public string? RenterName { get; set; }
    public double? RentMonthly { get; set; }
    public double? FinalYearlyRent { get; set; }
    public DateTime? AgreementDate { get; set; }
    public DateTime? AgreementFromDate { get; set; }
    public DateTime? AgreementToDate { get; set; }
    public string? TaxLiability { get; set; }
}

public class RevisionRoomMinusDto
{
    public long MinusId { get; set; }
    public long RoomId { get; set; }
    public string? Shape { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? AreaSqMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? Base1Mtr { get; set; }
    public double? Base2Mtr { get; set; }
    public bool IsOffset { get; set; }
}

public class RevisionRoomDto
{
    public long RoomId { get; set; }
    public long? FloorDetailId { get; set; }
    public long? PeriodId { get; set; }
    public string? RoomNo { get; set; }
    public int? RoomTypeId { get; set; }
    public string? RoomTypeName { get; set; }
    public string? RoomType { get; set; }
    public string? Shape { get; set; }
    public double? LengthMtr { get; set; }
    public double? WidthMtr { get; set; }
    public double? HeightMtr { get; set; }
    public double? Base1Mtr { get; set; }
    public double? Base2Mtr { get; set; }
    public int? NoOfRooms { get; set; }
    public double? AreaSqMtr { get; set; }
    public double? TotalAreaSqMtr { get; set; }
    public bool OuterYesNo { get; set; }
    public bool MinusYesNo { get; set; }
    public double? MinusLengthMtr { get; set; }
    public double? MinusWidthMtr { get; set; }
    public double? MinusAreaSqMtr { get; set; }
    public List<RevisionRoomMinusDto> MinusDetails { get; set; } = new();
}

public class RevisionDocumentDto
{
    public long DocumentId { get; set; }
    public string? DocumentTitle { get; set; }
    public string DocumentTypeCode { get; set; } = string.Empty;
    public string DocumentStage { get; set; } = string.Empty;
    public int? DocumentBindingId { get; set; }
    public string? Remarks { get; set; }
}

public class RevisionSocialAttributeDto
{
    public long SocialDetailId { get; set; }
    public int AttributeId { get; set; }
    public string AttributeName { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Remark { get; set; }
    public RevisionDocumentDto? Document { get; set; }
}

public class RevisionCertificateDto
{
    public long CertificateId { get; set; }
    public int CertificateTypeId { get; set; }
    public string CertificateType { get; set; } = string.Empty;
    public string? CertificateNo { get; set; }
    public DateTime? CertificateIssueDate { get; set; }
    public bool TaxApplied { get; set; }
    public DateTime? TaxAppliedDate { get; set; }
    public RevisionDocumentDto? Document { get; set; }
}

public class RevisionTaxCalculationDto
{
    public int TaxId { get; set; }
    public string TaxName { get; set; } = string.Empty;
    public decimal AnnualTaxAmount { get; set; }
    public decimal PeriodTaxAmount { get; set; }
}

public class RevisionRemarksDto
{
    public string? RevisionReason { get; set; }
    public string? AssessmentRemark { get; set; }
    public string? CombPropRemark { get; set; }
    public string? QcRemark { get; set; }
    public string? SurveyRemark { get; set; }
    public string? FlatSystemRemark { get; set; }
    public int? OwnerSignRemarkId { get; set; }
    public string? OwnerSignRemark { get; set; }
    public string? PeriodRemark { get; set; }
    public List<RevisionPeriodRemarkDto> PeriodRemarks { get; set; } = new();
}

public class RevisionPeriodRemarkDto
{
    public long PeriodId { get; set; }
    public int PeriodNo { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public string? Remarks { get; set; }
}
