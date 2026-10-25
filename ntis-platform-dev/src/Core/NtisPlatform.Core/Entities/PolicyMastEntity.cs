using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Represents a reusable policy. Maps to [PTIS].[PolicyMaster] table.
/// </summary>
[Table("PolicyMaster", Schema = "PTIS")]
public class PolicyMastEntity : BaseEntity, IHardDeletable
{
    [Column(TypeName = "nvarchar(50)")]
    [StringLength(50)]
    public string? PolicyCode { get; set; }

    [Column(TypeName = "nvarchar(150)")]
    [StringLength(150)]
    public string? PolicyName { get; set; }

    [Column(TypeName = "nvarchar(500)")]
    [StringLength(500)]
    public string? Description { get; set; }

    public ICollection<PolicyConditionDetailsEntity> PolicyConditionDetails { get; set; } = new List<PolicyConditionDetailsEntity>();

    // IHardDeletable implementation
    public bool MarkedForDeletion { get; set; }
    public DateTime? MarkedForDeletionDate { get; set; }
}
