using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities;

[Table("WardAllocation", Schema = "GSMS")]
public class GlobalSurveyWardAllocationEntity : BaseEntity, IHardDeletable
{
    public int UserId { get; set; }
    public int DepartmentId { get; set; }
    public int ModuleId { get; set; }
    public int ZoneId { get; set; }
    public int WardId { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserEntity? User { get; set; }

    [ForeignKey(nameof(DepartmentId))]
    public virtual DepartmentMasterEntity? Department { get; set; }

    [ForeignKey(nameof(ModuleId))]
    public virtual ModuleMasterEntity? Module { get; set; }

    [ForeignKey(nameof(ZoneId))]
    public virtual ZoneEntity? Zone { get; set; }

    [ForeignKey(nameof(WardId))]
    public virtual WardEntity? Ward { get; set; }
    public int? OldWardId { get; set; }

    [ForeignKey(nameof(OldWardId))]
    public virtual OldWardMasterEntity? OldWard { get; set; }

    [MaxLength(50)]
    public string? FromPropertyNo { get; set; }

    [MaxLength(50)]
    public string? ToPropertyNo { get; set; }

    public bool MarkedForDeletion { get; set; } = false;
    public DateTime? MarkedForDeletionDate { get; set; }
}