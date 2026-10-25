using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Response of <c>GET /api/property-revisions/{revisionId}</c> (revision_api_rules.txt section 5).
/// Phase 1 only returns the revision header + periods; the full property/floor/renter/etc.
/// snapshot is served by the section-wise draft-editing GET endpoints added in Phase 2.
/// </summary>
public class PropertyRevisionDetailsDto
{
    public long RevisionId { get; set; }
    public int PropertyId { get; set; }
    public int FinanceYearId { get; set; }
    public string FinanceYear { get; set; } = string.Empty;
    public int RevisionNo { get; set; }
    public long? PreviousRevisionMastId { get; set; }
    public RevisionCalculationType CalculationType { get; set; }
    public RevisionCalculationScope CalculationScope { get; set; }
    public string RevisionType { get; set; } = string.Empty;
    public DateTime? EffectiveDate { get; set; }
    public string? RevisionReason { get; set; }
    public RevisionStatus RevisionStatus { get; set; }
    public bool IsCurrent { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public int? ApprovedBy { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public DateTime? CreatedDate { get; set; }
    public List<PropertyRevisionPeriodDto> Periods { get; set; } = new();
    public PeriodDetailsSectionDto PeriodDetails { get; set; } = new();
    public List<RevisionPropertyChangesDto> PropertyChanges { get; set; } = new();
    public List<RevisionFloorDto> FloorDetails { get; set; } = new();
    public List<RevisionPeriodFloorsDto> PeriodWiseFloors { get; set; } = new();
    public List<RevisionRenterDto> RenterDetails { get; set; } = new();
    public List<RevisionRoomDto> RoomDetails { get; set; } = new();
    public List<RevisionSocialAttributeDto> SocialAttributes { get; set; } = new();
    public List<RevisionCertificateDto> Certificates { get; set; } = new();
    public List<RevisionTaxCalculationDto> TaxCalculation { get; set; } = new();
    public RevisionRemarksDto Remarks { get; set; } = new();
}
