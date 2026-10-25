namespace NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;

public class PublicDashboardResponseDto
{
    public PublicDashboardStatsDto Summary { get; set; } = new();
    public IReadOnlyList<DepartmentPerformanceDto> Departments { get; set; } = Array.Empty<DepartmentPerformanceDto>();
}
