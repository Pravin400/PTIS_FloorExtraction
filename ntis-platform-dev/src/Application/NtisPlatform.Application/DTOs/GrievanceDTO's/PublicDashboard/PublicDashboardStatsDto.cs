namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;

public class PublicDashboardStatsDto
{
    public int? TotalReceived { get; set; }
    public int? TotalResolved { get; set; }
    public int? InProgress { get; set; }
    public int? PendingWithinTime { get; set; }
    public int? PendingOverdue { get; set; }
    public double? ResolutionRate { get; set; }
    public double? AvgResolutionDays { get; set; }
}
