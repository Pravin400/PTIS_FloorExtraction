using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDeptForwarding;

public class GrievanceDeptForwardingDto : BaseDtos
{
    public int GrievanceApplicationId { get; set; }
    public string? GrievanceNo { get; set; }
    public long ActivityLogId { get; set; }
    public int ForwardedToDeptId { get; set; }
    public string? ForwardedToDeptName { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public string ForwardingStatus { get; set; } = "PENDING";
    public string? Remark { get; set; }
    public DateTime ForwardedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateGrievanceDeptForwardingDto : CreateBaseDtos
{
    [Required(ErrorMessage = "GrievanceApplicationId_Required")]
    public int GrievanceApplicationId { get; set; }

    public long? ActivityLogId { get; set; }

    [Required(ErrorMessage = "ForwardedToDeptId_Required")]
    public int ForwardedToDeptId { get; set; }

    public int? AssignedToUserId { get; set; }

    [StringLength(20, ErrorMessage = "ForwardingStatus_MaxLen_20")]
    public string ForwardingStatus { get; set; } = "PENDING";

    [StringLength(2000, ErrorMessage = "Remark_MaxLen_2000")]
    public string? Remark { get; set; }
}

public class UpdateGrievanceDeptForwardingDto : UpdateBaseDtos
{
    public int? AssignedToUserId { get; set; }

    [Required(ErrorMessage = "ForwardingStatus_Required")]
    [StringLength(20, ErrorMessage = "ForwardingStatus_MaxLen_20")]
    public string ForwardingStatus { get; set; } = "PENDING";

    [StringLength(2000, ErrorMessage = "Remark_MaxLen_2000")]
    public string? Remark { get; set; }

    public DateTime? ResolvedAt { get; set; }
}
