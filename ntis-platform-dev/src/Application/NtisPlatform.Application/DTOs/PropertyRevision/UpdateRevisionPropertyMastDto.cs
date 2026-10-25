using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

/// <summary>
/// PUT body for editing a revision's RevisionPropertyMast snapshot row. Full-replace semantics for
/// every field below (mirrors RevisionPropertyMastEntity's editable columns - excludes Id,
/// RevisionMastId, RevisionPeriodId, SourcePropertyId, and the audit/soft-delete columns, none of
/// which the caller may set directly).
///
/// TaxZoneId, WardId, PropertyTypeId and CategoryId are tax-relevant fields (REVISION LOGIC.txt
/// section 19): changing any of them resets a CALCULATED revision back to DRAFT.
/// </summary>
public class UpdateRevisionPropertyMastDto : UpdateBaseDtos
{
    /// <summary>Optional optimistic concurrency check token (e.g. UpdatedDate from GET).</summary>
    public DateTime? ConcurrencyToken { get; set; }

    [Required] public int TaxZoneId { get; set; }
    [Required] public int WardId { get; set; }
    [StringLength(10)] public string? PropertyNo { get; set; }
    [StringLength(10)] public string? PartitionNo { get; set; }
    [Required] public int PropertySeqNo { get; set; }
    public int? PropertyTypeId { get; set; }
    [StringLength(30)] public string? UPICId { get; set; }
    public bool? OpenPlot { get; set; }
    public int? MoujaId { get; set; }
    [StringLength(30)] public string? CSN { get; set; }
    [StringLength(20)] public string? SubZoneNo { get; set; }
    [StringLength(20)] public string? PlotNo { get; set; }
    public int? CategoryId { get; set; }
    [StringLength(50)] public string? Type { get; set; }
    [StringLength(20)] public string? OwnerTitle { get; set; }
    [StringLength(1000)] public string? OwnerName { get; set; }
    [StringLength(20)] public string? OccupierTitle { get; set; }
    [StringLength(1000)] public string? OccupierName { get; set; }
    [StringLength(100)] public string? FlatOrShopNo { get; set; }
    [StringLength(200)] public string? FlatOrShopName { get; set; }
    [StringLength(500)] public string? Address { get; set; }
    [StringLength(6)] public string? PinCode { get; set; }
    [StringLength(200)] public string? Location { get; set; }
    [StringLength(13)] public string? MobileNo { get; set; }
    public int? MobileNoRemarkId { get; set; }
    [StringLength(13)] public string? AlternateMobileNo { get; set; }
    [StringLength(13)] public string? OccupierMobileNo { get; set; }
    public int? OccupierMobileNoRemarkId { get; set; }
    [StringLength(100)] public string? EmailId { get; set; }
    public int? WingDetailId { get; set; }
    [StringLength(20)] public string? OwnerTitleEnglish { get; set; }
    [StringLength(1000)] public string? OwnerNameEnglish { get; set; }
    [StringLength(20)] public string? OccupierTitleEnglish { get; set; }
    [StringLength(1000)] public string? OccupierNameEnglish { get; set; }
    [StringLength(100)] public string? FlatOrShopNoEnglish { get; set; }
    [StringLength(200)] public string? FlatOrShopNameEnglish { get; set; }
    [StringLength(500)] public string? AddressEnglish { get; set; }
    [StringLength(200)] public string? LocationEnglish { get; set; }
    public int? PropertyAssessmentStatusId { get; set; }
    public int? PropertyFloorId { get; set; }
}
