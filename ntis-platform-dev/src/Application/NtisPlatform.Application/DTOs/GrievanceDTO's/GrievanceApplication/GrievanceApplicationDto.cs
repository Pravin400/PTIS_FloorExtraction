using System.ComponentModel.DataAnnotations;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;

public class GrievanceApplicationDto : BaseDtos
{
    public string GrievanceNo { get; set; } = string.Empty;
    public int CitizenId { get; set; }
    public string? CitizenName { get; set; }
    public string? CitizenMobileNo { get; set; }
    public int GrievanceDepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public int GrievanceTypeId { get; set; }
    public string? GrievanceType { get; set; }
    public string? RoadLandmark { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Description { get; set; }
    public int WorkflowId { get; set; }
    public string? WorkflowName { get; set; }
    public int CurrentStateId { get; set; }
    public string? CurrentStateName { get; set; }
    public int? CurrentAssignedToUserId { get; set; }
    public string? CurrentAssignedToUserName { get; set; }
    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public int? ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public DateTime SubmittedDate { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public DateTime? ClosedDate { get; set; }
}

public class CreateGrievanceApplicationDto : CreateBaseDtos
{
    [Required(ErrorMessage = "CitizenId is required")]
    public int CitizenId { get; set; }

    [Required(ErrorMessage = "GrievanceDepartmentId is required")]
    public int GrievanceDepartmentId { get; set; }

    [Required(ErrorMessage = "GrievanceTypeId is required")]
    public int GrievanceTypeId { get; set; }

    public int? WardId { get; set; }
    public int? ZoneId { get; set; }

    [StringLength(500, ErrorMessage = "Road / Landmark cannot exceed 500 characters")]
    public string? RoadLandmark { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and +90 degrees.")]
    public decimal? Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and +180 degrees.")]
    public decimal? Longitude { get; set; }

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public int? WorkflowId { get; set; }
}

public class UpdateGrievanceApplicationDto : UpdateBaseDtos
{
    [Required(ErrorMessage = "GrievanceDepartmentId is required")]
    public int GrievanceDepartmentId { get; set; }

    [Required(ErrorMessage = "GrievanceTypeId is required")]
    public int GrievanceTypeId { get; set; }

    public int? WardId { get; set; }
    public int? ZoneId { get; set; }

    [StringLength(500, ErrorMessage = "Road / Landmark cannot exceed 500 characters")]
    public string? RoadLandmark { get; set; }

    [Range(-90.0, 90.0, ErrorMessage = "Latitude must be between -90 and +90 degrees.")]
    public decimal? Latitude { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "Longitude must be between -180 and +180 degrees.")]
    public decimal? Longitude { get; set; }

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
    public string? Description { get; set; }

    public int? CurrentAssignedToUserId { get; set; }
}
