namespace NtisPlatform.Application.DTOs.Master.SocietyWingDetails;

/// <summary>
/// Response DTO for property lookup by SocietyDetailId and PropertyNo.
/// Maps to: SELECT Id AS PropertyID
///          PropertyNo + '-' + PartitionNo AS PropertyNo, OwnerName, OccupierName
/// FROM PTIS.PropertyMast
/// </summary>
public class WingPropertyDetailsDto
{
    public int PropertyId { get; set; }
    public int? WingDetailId { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public int? WardId { get; set; }
    public string? OwnerName { get; set; }
    public string? OccupierName { get; set; }
    public string? BHK { get; set; }
    public string? FlatOrShopNo { get; set; }
    public string? FlatOrShopName { get; set; }
    public int? DocumentBindingId { get; set; }
    public Guid? DocumentGuid { get; set; }
    public bool IsActive { get; set; }
}
