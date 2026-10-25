using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Core.Entities;

[Table("PropertySurveyVisit", Schema = "GSMS")]
public class PropertySurveyVisitEntity : BaseEntity
{
    public int PropertyWorkflowDetailsId { get; set; }
    public bool? InternalSurveyVerified { get; set; }
    public int? RemarkId { get; set; }

    [MaxLength(1000)]
    public string? RemarkText { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    [ForeignKey(nameof(PropertyWorkflowDetailsId))]
    public virtual PropertyWorkflowDetailsEntity PropertyWorkflowDetails { get; set; } = null!;

    [ForeignKey(nameof(RemarkId))]
    public virtual CommonRemarkDetailsEntity? Remark { get; set; }
}
