using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class PublicDashboardService : IPublicDashboardService
{
    private readonly IRepository<GrievanceApplicationEntity, int> _applicationRepository;
    private readonly IRepository<GrievanceDepartmentMasterEntity, int> _departmentRepository;

    public PublicDashboardService(
        IRepository<GrievanceApplicationEntity, int> applicationRepository,
        IRepository<GrievanceDepartmentMasterEntity, int> departmentRepository)
    {
        _applicationRepository = applicationRepository;
        _departmentRepository = departmentRepository;
    }

    public async Task<PublicDashboardResponseDto> GetDashboardAsync(
        PublicDashboardQueryParameters? queryParameters = null,
        CancellationToken cancellationToken = default)
    {
        // 1. Query active departments with optional filtering
        var deptQuery = _departmentRepository.GetQueryable()
            .AsNoTracking()
            .Where(d => d.IsActive);

        if (queryParameters?.DepartmentId != null)
        {
            deptQuery = deptQuery.Where(d => d.Id == queryParameters.DepartmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters?.SearchTerm))
        {
            var term = queryParameters.SearchTerm.Trim();
            deptQuery = deptQuery.Where(d => d.DepartmentName.Contains(term) || (d.DepartmentNameLocal != null && d.DepartmentNameLocal.Contains(term)));
        }

        var dbDepts = await deptQuery.OrderBy(d => d.Id).ToListAsync(cancellationToken);
        if (dbDepts.Count == 0)
        {
            return new PublicDashboardResponseDto
            {
                Summary = new PublicDashboardStatsDto(),
                Departments = Array.Empty<DepartmentPerformanceDto>()
            };
        }

        // 2. Base query for grievances
        var deptIds = dbDepts.Select(d => d.Id).ToList();

        var appQuery = _applicationRepository.GetQueryable()
            .AsNoTracking()
            .Where(x => x.IsActive && !x.MarkedForDeletion && deptIds.Contains(x.GrievanceDepartmentId));

        if (queryParameters?.FromDate != null)
        {
            appQuery = appQuery.Where(x => x.SubmittedDate >= queryParameters.FromDate.Value);
        }

        if (queryParameters?.ToDate != null)
        {
            appQuery = appQuery.Where(x => x.SubmittedDate <= queryParameters.ToDate.Value);
        }

        if (queryParameters?.CitizenId != null)
        {
            appQuery = appQuery.Where(x => x.CitizenId == queryParameters.CitizenId.Value);
        }

        if (queryParameters?.ZoneId != null)
        {
            appQuery = appQuery.Where(x => x.ZoneId == queryParameters.ZoneId.Value);
        }

        if (queryParameters?.WardId != null)
        {
            appQuery = appQuery.Where(x => x.WardId == queryParameters.WardId.Value);
        }

        // 3. Aggregate grievance metrics grouped by department directly from database columns
        var deptMetrics = await appQuery
            .GroupBy(x => x.GrievanceDepartmentId)
            .Select(g => new
            {
                DeptId = g.Key,
                Total = g.Count(),
                Resolved = g.Count(x => x.ResolvedDate != null),
                InProgress = g.Count(x => x.ResolvedDate == null && (x.CurrentAssignedToUserId != null || (x.CurrentState != null && !x.CurrentState.IsInitial))),
                Pending = g.Count(x => x.ResolvedDate == null && x.CurrentAssignedToUserId == null && (x.CurrentState == null || x.CurrentState.IsInitial))
            })
            .ToDictionaryAsync(x => x.DeptId, cancellationToken);

        // 4. Sample resolved cases for average resolution days calculation
        var resolvedCases = await appQuery
            .Where(x => x.ResolvedDate != null && x.ResolvedDate >= x.SubmittedDate)
            .Select(x => new { x.GrievanceDepartmentId, x.SubmittedDate, ResolvedDate = x.ResolvedDate!.Value })
            .ToListAsync(cancellationToken);

        var deptAvgDaysMap = resolvedCases
            .GroupBy(x => x.GrievanceDepartmentId)
            .ToDictionary(
                g => g.Key,
                g => Math.Round(g.Average(x => (x.ResolvedDate - x.SubmittedDate).TotalDays), 1)
            );

        // 5. Project department performance list
        var departments = dbDepts.Select(dept =>
        {
            deptMetrics.TryGetValue(dept.Id, out var m);
            deptAvgDaysMap.TryGetValue(dept.Id, out var avgDays);

            return new DepartmentPerformanceDto
            {
                Id = dept.Id,
                DepartmentName = dept.DepartmentName,
                DepartmentNameLocal = dept.DepartmentNameLocal,
                TotalReceived = m?.Total,
                Resolved = m?.Resolved,
                InProgress = m?.InProgress,
                PendingWithinTime = m?.Pending,
                PendingOverdue = 0,
                ResolutionRate = m != null && m.Total > 0
                    ? Math.Round(((double)m.Resolved / m.Total) * 100.0, 2)
                    : null,
                AvgDays = m != null && m.Resolved > 0 && deptAvgDaysMap.ContainsKey(dept.Id)
                    ? avgDays
                    : null,
                Status = "Operational"
            };
        }).ToList();

        // 6. Apply sorting based on requested field
        if (!string.IsNullOrWhiteSpace(queryParameters?.SortBy))
        {
            var isDesc = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
            departments = queryParameters.SortBy.Trim().ToLowerInvariant() switch
            {
                "totalreceived" => isDesc ? departments.OrderByDescending(d => d.TotalReceived ?? 0).ToList() : departments.OrderBy(d => d.TotalReceived ?? 0).ToList(),
                "resolved" => isDesc ? departments.OrderByDescending(d => d.Resolved ?? 0).ToList() : departments.OrderBy(d => d.Resolved ?? 0).ToList(),
                "inprogress" => isDesc ? departments.OrderByDescending(d => d.InProgress ?? 0).ToList() : departments.OrderBy(d => d.InProgress ?? 0).ToList(),
                "pendingwithintime" => isDesc ? departments.OrderByDescending(d => d.PendingWithinTime ?? 0).ToList() : departments.OrderBy(d => d.PendingWithinTime ?? 0).ToList(),
                "resolutionrate" => isDesc ? departments.OrderByDescending(d => d.ResolutionRate ?? 0).ToList() : departments.OrderBy(d => d.ResolutionRate ?? 0).ToList(),
                "avgdays" => isDesc ? departments.OrderByDescending(d => d.AvgDays ?? 0).ToList() : departments.OrderBy(d => d.AvgDays ?? 0).ToList(),
                "departmentname" => isDesc ? departments.OrderByDescending(d => d.DepartmentName).ToList() : departments.OrderBy(d => d.DepartmentName).ToList(),
                _ => isDesc ? departments.OrderByDescending(d => d.Id).ToList() : departments.OrderBy(d => d.Id).ToList()
            };
        }
        else if (string.Equals(queryParameters?.SortOrder, "desc", StringComparison.OrdinalIgnoreCase))
        {
            departments = departments.OrderByDescending(d => d.Id).ToList();
        }

        // 7. Compute overall summary directly from aggregated metrics
        var totalReceived = deptMetrics.Values.Sum(m => m.Total);
        var totalResolved = deptMetrics.Values.Sum(m => m.Resolved);
        var inProgress = deptMetrics.Values.Sum(m => m.InProgress);
        var pendingWithinTime = deptMetrics.Values.Sum(m => m.Pending);

        if (totalReceived == 0)
        {
            return new PublicDashboardResponseDto
            {
                Summary = new PublicDashboardStatsDto(),
                Departments = departments
            };
        }

        var summary = new PublicDashboardStatsDto
        {
            TotalReceived = totalReceived,
            TotalResolved = totalResolved,
            InProgress = inProgress,
            PendingWithinTime = pendingWithinTime,
            PendingOverdue = 0,
            ResolutionRate = Math.Round(((double)totalResolved / totalReceived) * 100.0, 2),
            AvgResolutionDays = resolvedCases.Count > 0
                ? Math.Round(resolvedCases.Average(x => (x.ResolvedDate - x.SubmittedDate).TotalDays), 1)
                : null
        };

        return new PublicDashboardResponseDto
        {
            Summary = summary,
            Departments = departments
        };
    }
}
