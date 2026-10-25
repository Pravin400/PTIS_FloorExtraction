using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.PublicDashboard;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Grievance;

public class PublicDashboardServiceTests
{
    private readonly Mock<IRepository<GrievanceApplicationEntity, int>> _mockAppRepo;
    private readonly Mock<IRepository<GrievanceDepartmentMasterEntity, int>> _mockDeptRepo;
    private readonly PublicDashboardService _service;

    public PublicDashboardServiceTests()
    {
        _mockAppRepo = new Mock<IRepository<GrievanceApplicationEntity, int>>();
        _mockDeptRepo = new Mock<IRepository<GrievanceDepartmentMasterEntity, int>>();
        _service = new PublicDashboardService(_mockAppRepo.Object, _mockDeptRepo.Object);
    }

    [Fact]
    public async Task GetDashboardAsync_WhenNoDepartments_ReturnsEmptyResponse()
    {
        var emptyDepts = new List<GrievanceDepartmentMasterEntity>();
        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(emptyDepts.BuildMock());

        var result = await _service.GetDashboardAsync(new PublicDashboardQueryParameters(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result.Departments);
        Assert.Null(result.Summary.TotalReceived);
    }

    [Fact]
    public async Task GetDashboardAsync_CalculatesResolutionRateAndAvgResolutionDays()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Public Works Department", DepartmentNameLocal = "सार्वजनिक बांधकाम विभाग", IsActive = true },
            new() { Id = 2, DepartmentName = "Water Supply Department", DepartmentNameLocal = "पाणी पुरवठा विभाग", IsActive = true }
        };

        var now = DateTime.UtcNow;
        var apps = new List<GrievanceApplicationEntity>
        {
            // PWD: App 1 (Resolved in 1 day)
            new()
            {
                Id = 1, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = now.AddDays(-2), ResolvedDate = now.AddDays(-1)
            },
            // PWD: App 2 (Resolved in 3 days)
            new()
            {
                Id = 2, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = now.AddDays(-4), ResolvedDate = now.AddDays(-1)
            },
            // Water: App 3 (Resolved in 4 days)
            new()
            {
                Id = 3, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = now.AddDays(-5), ResolvedDate = now.AddDays(-1)
            },
            // Water: App 4 (In Progress, Unresolved)
            new()
            {
                Id = 4, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = now.AddDays(-1), ResolvedDate = null, CurrentStateId = 2, CurrentAssignedToUserId = 99
            }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var result = await _service.GetDashboardAsync(new PublicDashboardQueryParameters(), CancellationToken.None);

        // Overall Summary assertions
        Assert.NotNull(result);
        Assert.Equal(4, result.Summary.TotalReceived);
        Assert.Equal(3, result.Summary.TotalResolved);
        Assert.Equal(1, result.Summary.InProgress);
        Assert.Equal(75.0, result.Summary.ResolutionRate); // 3 / 4 * 100 = 75.0%
        Assert.Equal(2.7, result.Summary.AvgResolutionDays); // (1 + 3 + 4) / 3 = 2.666... -> 2.7

        // Department-level assertions
        Assert.Equal(2, result.Departments.Count);

        var pwd = result.Departments.First(d => d.Id == 1);
        Assert.Equal("Public Works Department", pwd.DepartmentName);
        Assert.Equal(2, pwd.TotalReceived);
        Assert.Equal(2, pwd.Resolved);
        Assert.Equal(100.0, pwd.ResolutionRate);
        Assert.Equal(2.0, pwd.AvgDays); // (1 + 3) / 2 = 2.0

        var water = result.Departments.First(d => d.Id == 2);
        Assert.Equal("Water Supply Department", water.DepartmentName);
        Assert.Equal(2, water.TotalReceived);
        Assert.Equal(1, water.Resolved);
        Assert.Equal(1, water.InProgress);
        Assert.Equal(50.0, water.ResolutionRate);
        Assert.Equal(4.0, water.AvgDays);
    }

    [Fact]
    public async Task GetDashboardAsync_FiltersByDepartmentId()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Public Works Department", IsActive = true },
            new() { Id = 2, DepartmentName = "Water Supply Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>
        {
            new() { Id = 1, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false, SubmittedDate = DateTime.UtcNow, ResolvedDate = DateTime.UtcNow },
            new() { Id = 2, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false, SubmittedDate = DateTime.UtcNow, ResolvedDate = DateTime.UtcNow }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var query = new PublicDashboardQueryParameters { DepartmentId = 1 };
        var result = await _service.GetDashboardAsync(query, CancellationToken.None);

        Assert.Single(result.Departments);
        Assert.Equal(1, result.Departments[0].Id);
        Assert.Equal(1, result.Summary.TotalReceived);
    }

    [Fact]
    public async Task GetDashboardAsync_FiltersBySearchTerm()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Public Works Department", DepartmentNameLocal = "सार्वजनिक बांधकाम विभाग", IsActive = true },
            new() { Id = 2, DepartmentName = "Water Supply Department", DepartmentNameLocal = "पाणी पुरवठा विभाग", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>();

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var query = new PublicDashboardQueryParameters { SearchTerm = "Water" };
        var result = await _service.GetDashboardAsync(query, CancellationToken.None);

        Assert.Single(result.Departments);
        Assert.Equal(2, result.Departments[0].Id);
    }

    [Fact]
    public async Task GetDashboardAsync_FiltersByDateRange()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Public Works Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>
        {
            // Inside September 2026
            new()
            {
                Id = 1, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = new DateTime(2026, 9, 15, 10, 0, 0, DateTimeKind.Utc),
                ResolvedDate = new DateTime(2026, 9, 17, 10, 0, 0, DateTimeKind.Utc)
            },
            // Outside (August 2026)
            new()
            {
                Id = 2, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false,
                SubmittedDate = new DateTime(2026, 8, 15, 10, 0, 0, DateTimeKind.Utc),
                ResolvedDate = new DateTime(2026, 8, 17, 10, 0, 0, DateTimeKind.Utc)
            }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var query = new PublicDashboardQueryParameters
        {
            FromDate = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            ToDate = new DateTime(2026, 9, 30, 23, 59, 59, DateTimeKind.Utc)
        };

        var result = await _service.GetDashboardAsync(query, CancellationToken.None);

        Assert.Equal(1, result.Summary.TotalReceived);
        Assert.Equal(1, result.Summary.TotalResolved);
    }

    [Fact]
    public async Task GetDashboardAsync_WhenZeroComplaints_ReturnsSafeDefaults()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Empty Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>();

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var result = await _service.GetDashboardAsync(new PublicDashboardQueryParameters(), CancellationToken.None);

        Assert.Single(result.Departments);
        Assert.Null(result.Summary.TotalReceived);
        Assert.Null(result.Summary.ResolutionRate);
        Assert.Null(result.Summary.AvgResolutionDays);
    }

    [Fact]
    public async Task GetDashboardAsync_FiltersByCitizenId()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Sanitation Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>
        {
            new()
            {
                Id = 1, GrievanceDepartmentId = 1, CitizenId = 10,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-2), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = 2, GrievanceDepartmentId = 1, CitizenId = 10,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-3), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = 3, GrievanceDepartmentId = 1, CitizenId = 20,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-4), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        var citizenResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { CitizenId = 10 }, CancellationToken.None);
        Assert.Equal(2, citizenResult.Summary.TotalReceived);
    }

    [Fact]
    public async Task GetDashboardAsync_SortsDepartmentsBySpecifiedFieldAndDesc()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Zebra Department", IsActive = true },
            new() { Id = 2, DepartmentName = "Alpha Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>
        {
            new() { Id = 1, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false, SubmittedDate = DateTime.UtcNow, ResolvedDate = DateTime.UtcNow },
            new() { Id = 2, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false, SubmittedDate = DateTime.UtcNow, ResolvedDate = DateTime.UtcNow },
            new() { Id = 3, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false, SubmittedDate = DateTime.UtcNow, ResolvedDate = DateTime.UtcNow }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        // 1. Sort by TotalReceived desc -> Alpha (2) should be first, Zebra (1) second
        var descReceivedResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters
        {
            SortBy = "TotalReceived",
            SortOrder = "desc"
        }, CancellationToken.None);

        Assert.Equal("Alpha Department", descReceivedResult.Departments[0].DepartmentName);
        Assert.Equal(2, descReceivedResult.Departments[0].TotalReceived);
        Assert.Equal("Zebra Department", descReceivedResult.Departments[1].DepartmentName);
        Assert.Equal(1, descReceivedResult.Departments[1].TotalReceived);

        // 2. Sort by DepartmentName desc -> Zebra first, Alpha second
        var descNameResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters
        {
            SortBy = "DepartmentName",
            SortOrder = "desc"
        }, CancellationToken.None);

        Assert.Equal("Zebra Department", descNameResult.Departments[0].DepartmentName);
        Assert.Equal("Alpha Department", descNameResult.Departments[1].DepartmentName);

        // 3. Sort by Id desc (only SortOrder=desc passed) -> Id 2 first, Id 1 second
        var descIdResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters
        {
            SortOrder = "desc"
        }, CancellationToken.None);

        Assert.Equal(2, descIdResult.Departments[0].Id);
        Assert.Equal(1, descIdResult.Departments[1].Id);
    }

    [Fact]
    public async Task GetDashboardAsync_FiltersByZoneIdAndWardId()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Sanitation Department", IsActive = true }
        };

        var apps = new List<GrievanceApplicationEntity>
        {
            new()
            {
                Id = 1, GrievanceDepartmentId = 1, ZoneId = 3, WardId = 4,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-2), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = 2, GrievanceDepartmentId = 1, ZoneId = 3, WardId = 5,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-3), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = 3, GrievanceDepartmentId = 1, ZoneId = 2, WardId = 4,
                IsActive = true, MarkedForDeletion = false,
                SubmittedDate = DateTime.UtcNow.AddDays(-4), ResolvedDate = DateTime.UtcNow.AddDays(-1)
            }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        // Filter ZoneId = 3 (should match Id 1 and Id 2)
        var zoneResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { ZoneId = 3 }, CancellationToken.None);
        Assert.Equal(2, zoneResult.Summary.TotalReceived);

        // Filter WardId = 4 (should match Id 1 and Id 3)
        var wardResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { WardId = 4 }, CancellationToken.None);
        Assert.Equal(2, wardResult.Summary.TotalReceived);

        // Filter ZoneId = 3 and WardId = 4 (should match only Id 1)
        var combinedResult = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { ZoneId = 3, WardId = 4 }, CancellationToken.None);
        Assert.Equal(1, combinedResult.Summary.TotalReceived);
    }

    [Fact]
    public async Task GetDashboardAsync_SortsByAllMetricColumns()
    {
        var depts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Dept A", IsActive = true },
            new() { Id = 2, DepartmentName = "Dept B", IsActive = true }
        };

        var now = DateTime.UtcNow;
        var apps = new List<GrievanceApplicationEntity>
        {
            // Dept A: 1 total, 1 resolved (1 day) -> 100% resolution rate
            new() { Id = 1, GrievanceDepartmentId = 1, IsActive = true, MarkedForDeletion = false, SubmittedDate = now.AddDays(-2), ResolvedDate = now.AddDays(-1) },
            // Dept B: 2 total, 1 resolved (5 days), 1 in progress -> 50% resolution rate
            new() { Id = 2, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false, SubmittedDate = now.AddDays(-6), ResolvedDate = now.AddDays(-1) },
            new() { Id = 3, GrievanceDepartmentId = 2, IsActive = true, MarkedForDeletion = false, SubmittedDate = now.AddDays(-1), ResolvedDate = null, CurrentAssignedToUserId = 99 }
        };

        _mockDeptRepo.Setup(r => r.GetQueryable()).Returns(depts.BuildMock());
        _mockAppRepo.Setup(r => r.GetQueryable()).Returns(apps.BuildMock());

        // Sort by ResolutionRate desc -> Dept A (100%) before Dept B (50%)
        var rateDesc = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { SortBy = "resolutionrate", SortOrder = "desc" }, CancellationToken.None);
        Assert.Equal(1, rateDesc.Departments[0].Id);
        Assert.Equal(2, rateDesc.Departments[1].Id);

        // Sort by ResolutionRate asc -> Dept B (50%) before Dept A (100%)
        var rateAsc = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { SortBy = "resolutionrate", SortOrder = "asc" }, CancellationToken.None);
        Assert.Equal(2, rateAsc.Departments[0].Id);
        Assert.Equal(1, rateAsc.Departments[1].Id);

        // Sort by InProgress desc -> Dept B (1) before Dept A (0)
        var progDesc = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { SortBy = "inprogress", SortOrder = "desc" }, CancellationToken.None);
        Assert.Equal(2, progDesc.Departments[0].Id);
        Assert.Equal(1, progDesc.Departments[1].Id);

        // Sort by AvgDays desc -> Dept B (5.0) before Dept A (1.0)
        var avgDesc = await _service.GetDashboardAsync(new PublicDashboardQueryParameters { SortBy = "avgdays", SortOrder = "desc" }, CancellationToken.None);
        Assert.Equal(2, avgDesc.Departments[0].Id);
        Assert.Equal(1, avgDesc.Departments[1].Id);
    }
}


