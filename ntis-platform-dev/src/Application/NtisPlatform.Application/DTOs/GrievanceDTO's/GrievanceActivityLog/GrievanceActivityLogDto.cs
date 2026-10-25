using System;

namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;

public class GrievanceActivityLogDto
{
    public long Id { get; set; }
    public int GrievanceApplicationId { get; set; }
    public string? GrievanceNo { get; set; }
    public int? FromStateId { get; set; }
    public string? FromStateName { get; set; }
    public int ToStateId { get; set; }
    public string? ToStateName { get; set; }
    public int? TransitionId { get; set; }
    public string? TransitionName { get; set; }
    public int? ActionByUserId { get; set; }
    public string? ActionByUserName { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public string? Remark { get; set; }
    public DateTime ActionAt { get; set; }
}
