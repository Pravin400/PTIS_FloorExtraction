namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// Full read view of a revision's RevisionPropertyMast snapshot row (the editable target - either
/// the single HISTORY_ONLY row, or the latest period's row for a PERIOD_WISE revision).
/// </summary>
public class RevisionPropertyMastDto : LongBaseDto
{
    public long RevisionPropertyMastId { get; set; }
    public long RevisionId { get; set; }
    public long? RevisionPeriodId { get; set; }
    public int SourcePropertyId { get; set; }

    public int TaxZoneId { get; set; }
    public int WardId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int PropertySeqNo { get; set; }
    public int? PropertyTypeId { get; set; }
    public string? UPICId { get; set; }
    public bool? OpenPlot { get; set; }
    public int? MoujaId { get; set; }
    public string? CSN { get; set; }
    public string? SubZoneNo { get; set; }
    public string? PlotNo { get; set; }
    public int? CategoryId { get; set; }
    public string? Type { get; set; }
    public string? OwnerTitle { get; set; }
    public string? OwnerName { get; set; }
    public string? OccupierTitle { get; set; }
    public string? OccupierName { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? Address { get; set; }
    public string? PinCode { get; set; }
    public string? Location { get; set; }
    public string? MobileNo { get; set; }
    public int? MobileNoRemarkId { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? OccupierMobileNo { get; set; }
    public int? OccupierMobileNoRemarkId { get; set; }
    public string? EmailId { get; set; }
    public int? WingDetailId { get; set; }
    public string? OwnerTitleEnglish { get; set; }
    public string? OwnerNameEnglish { get; set; }
    public string? OccupierTitleEnglish { get; set; }
    public string? OccupierNameEnglish { get; set; }
    public string? FlatOrShopNoEnglish { get; set; }
    public string? FlatOrShopNameEnglish { get; set; }
    public string? AddressEnglish { get; set; }
    public string? LocationEnglish { get; set; }
    public int? PropertyAssessmentStatusId { get; set; }
    public int? PropertyFloorId { get; set; }

    /// <summary>True if this GET reflects the revision's current DRAFT/CALCULATED editable snapshot; always true today since only the editable row is ever returned.</summary>
    public bool IsEditable { get; set; } = true;
}
