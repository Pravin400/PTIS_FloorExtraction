using NtisPlatform.Core.Entities.Master;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Represents a floor entity manage floor information.
/// </summary>
public class FloorEntity : BaseEntity
{

    public string? FloorCode { get; set; }
    public string? Description { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? DescriptionEnglish { get; set; }

    public int? SequenceNo { get; set; }
    public int? MaxFloorNo { get; set; }

    public int? FloorGroupId { get; set; }
    public int FLatGenerationGroupId { get; set; }
    public int FLatGenerationSeq { get; set; }
    public virtual FLatGenerationGroupMasterEntity? FLatGenerationGroupMaster { get; set; }
    public ICollection<RateEntity> Rates { get; set; } = new List<RateEntity>();
    public ICollection<FloorFactorCVMasterEntity> FloorFactorCVMaster { get; set; } = new List<FloorFactorCVMasterEntity>();
    public ICollection<PropertyDetailsEntity> PropertyDetails { get; set; } = new List<PropertyDetailsEntity>();

}