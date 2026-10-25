using NtisPlatform.Core.Entities;

namespace NtisPlatform.Core.Entities.WaterBill;

public class PortalContentEntity : BaseEntity
{
    public int? DepartmentId { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public string? Badge { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? TitleLocal { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? ReferenceLink { get; set; }
    public string? Category { get; set; }
    public int DisplayOrder { get; set; }
    public bool OpenInNewTab { get; set; }
    public DateTime? PublishFromDate { get; set; }
    public DateTime? PublishToDate { get; set; }

    /// <summary>
    /// Navigation property to the associated DepartmentMaster (null for global portal content).
    /// </summary>
    public virtual DepartmentMasterEntity? Department { get; set; }
}
