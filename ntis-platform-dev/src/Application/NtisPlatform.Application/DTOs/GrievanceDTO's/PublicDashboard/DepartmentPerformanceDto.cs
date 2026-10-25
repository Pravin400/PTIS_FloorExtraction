namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;

public class DepartmentPerformanceDto
{
    public int Id { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string? DepartmentNameLocal { get; set; }
    public string? Code { get; set; }
    public string? HodName { get; set; }
    public int? TotalReceived { get; set; }
    public int? Resolved { get; set; }
    public int? InProgress { get; set; }
    public int? PendingWithinTime { get; set; }
    public int? PendingOverdue { get; set; }
    public double? ResolutionRate { get; set; }
    public double? AvgDays { get; set; }
    public double? Satisfaction { get; set; }
    public string? Status { get; set; }
    public int? ResolutionTimelineDays { get; set; }
}
