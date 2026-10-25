using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Mappings.GrievanceMapping;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class GrievanceDepartmentServiceTests
{
    private readonly Mock<IRepository<GrievanceDepartmentMasterEntity, int>> _mockRepository;
    private readonly Mock<IRepository<DepartmentMasterEntity, int>> _mockCoreDepartmentRepository;
    private readonly Mock<IRepository<UserDepartmentAllocationEntity, int>> _mockUserDepartmentAllocationRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly IMapper _mapper;
    private readonly GrievanceDepartmentService _service;

    public GrievanceDepartmentServiceTests()
    {
        _mockRepository = new Mock<IRepository<GrievanceDepartmentMasterEntity, int>>();
        _mockCoreDepartmentRepository = new Mock<IRepository<DepartmentMasterEntity, int>>();
        _mockUserDepartmentAllocationRepository = new Mock<IRepository<UserDepartmentAllocationEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<GrievanceDepartmentMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        var defaultEntities = new List<GrievanceDepartmentMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(defaultEntities.BuildMock());

        var defaultCoreEntities = new List<DepartmentMasterEntity>();
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(defaultCoreEntities.BuildMock());

        var defaultUserAllocations = new List<UserDepartmentAllocationEntity>();
        _mockUserDepartmentAllocationRepository.Setup(r => r.GetQueryable()).Returns(defaultUserAllocations.BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new GrievanceDepartmentService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockCoreDepartmentRepository.Object,
            _mockUserDepartmentAllocationRepository.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new GrievanceDepartmentMasterEntity
        {
            Id = 1,
            DepartmentName = "Water Supply Department",
            DepartmentNameLocal = "पाणी पुरवठा विभाग",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Water Supply Department", result.DepartmentName);
        Assert.Equal("पाणी पुरवठा विभाग", result.DepartmentNameLocal);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceDepartmentMasterEntity?)null);

        var result = await _service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_Succeeds()
    {
        var dto = new CreateGrievanceDepartmentDto
        {
            DepartmentName = "Health Department",
            DepartmentNameLocal = "आरोग्य विभाग",
            IsActive = true
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceDepartmentMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceDepartmentMasterEntity, CancellationToken>((entity, _) => entity.Id = 10)
            .ReturnsAsync((GrievanceDepartmentMasterEntity entity, CancellationToken _) => entity);

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Health Department", result.DepartmentName);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GrievanceDepartmentMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateDepartmentName_ThrowsValidationException()
    {
        var existingEntities = new List<GrievanceDepartmentMasterEntity>
        {
            new GrievanceDepartmentMasterEntity { Id = 1, DepartmentName = "Water Supply Department" }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities.BuildMock());

        var dto = new CreateGrievanceDepartmentDto
        {
            DepartmentName = "Water Supply Department",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_Succeeds()
    {
        var entity = new GrievanceDepartmentMasterEntity
        {
            Id = 1,
            DepartmentName = "Drainage Department",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<GrievanceDepartmentMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAvailableCoreDepartmentsAsync_ReturnsUnlinkedActiveDepartments()
    {
        var existingGrvDepts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Water Dept", CoreDepartmentId = 10, IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingGrvDepts.BuildMock());

        var coreDepts = new List<DepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentCode = "WAT", DepartmentName = "Water", IsActive = true },
            new() { Id = 20, DepartmentCode = "ENG", DepartmentName = "Engineering", IsActive = true },
            new() { Id = 30, DepartmentCode = "INACT", DepartmentName = "Old Inactive", IsActive = false }
        };
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(coreDepts.BuildMock());

        var result = await _service.GetAvailableCoreDepartmentsAsync();

        Assert.Single(result);
        Assert.Equal(20, result[0].Id);
        Assert.Equal("Engineering", result[0].DepartmentName);
    }

    [Fact]
    public async Task ProvisionFromCoreDepartmentAsync_ValidCoreDept_CreatesAndReturnsDto()
    {
        var coreDepts = new List<DepartmentMasterEntity>
        {
            new() { Id = 20, DepartmentCode = "ENG", DepartmentName = "Engineering Department", DepartmentNameLocal = "अभियांत्रिकी विभाग", IsActive = true }
        };
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(coreDepts.BuildMock());

        var existingGrvDepts = new List<GrievanceDepartmentMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingGrvDepts.BuildMock());

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceDepartmentMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceDepartmentMasterEntity, CancellationToken>((entity, _) => entity.Id = 2)
            .ReturnsAsync((GrievanceDepartmentMasterEntity entity, CancellationToken _) => entity);

        var result = await _service.ProvisionFromCoreDepartmentAsync(20, 101);

        Assert.NotNull(result);
        Assert.Equal(20, result.CoreDepartmentId);
        Assert.Equal("Engineering Department", result.DepartmentName);
        Assert.Equal("अभियांत्रिकी विभाग", result.DepartmentNameLocal);
        _mockRepository.Verify(r => r.AddAsync(It.Is<GrievanceDepartmentMasterEntity>(e => e.CoreDepartmentId == 20 && e.CreatedBy == 101), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProvisionFromCoreDepartmentAsync_AlreadyLinked_ThrowsInvalidOperationException()
    {
        var coreDepts = new List<DepartmentMasterEntity>
        {
            new() { Id = 10, DepartmentCode = "WAT", DepartmentName = "Water", IsActive = true }
        };
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(coreDepts.BuildMock());

        var existingGrvDepts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 1, DepartmentName = "Water Dept", CoreDepartmentId = 10, IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingGrvDepts.BuildMock());

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ProvisionFromCoreDepartmentAsync(10, 101));
    }

    [Fact]
    public async Task CreateAsync_WithValidCoreDepartmentId_Succeeds()
    {
        var coreDepts = new List<DepartmentMasterEntity>
        {
            new() { Id = 5, DepartmentCode = "HLT", DepartmentName = "Health", IsActive = true }
        };
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(coreDepts.BuildMock());

        var existingGrvDepts = new List<GrievanceDepartmentMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingGrvDepts.BuildMock());

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceDepartmentMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceDepartmentMasterEntity, CancellationToken>((entity, _) => entity.Id = 5)
            .ReturnsAsync((GrievanceDepartmentMasterEntity entity, CancellationToken _) => entity);

        var dto = new CreateGrievanceDepartmentDto
        {
            DepartmentName = "Health & Sanitation",
            CoreDepartmentId = 5,
            IsActive = true
        };

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal(5, result.CoreDepartmentId);
        _mockRepository.Verify(r => r.AddAsync(It.Is<GrievanceDepartmentMasterEntity>(e => e.CoreDepartmentId == 5), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentCoreDepartmentId_ThrowsValidationException()
    {
        var coreDepts = new List<DepartmentMasterEntity>();
        _mockCoreDepartmentRepository.Setup(r => r.GetQueryable()).Returns(coreDepts.BuildMock());

        var dto = new CreateGrievanceDepartmentDto
        {
            DepartmentName = "Unknown Dept",
            CoreDepartmentId = 999,
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task GetGrievanceDepartmentsByUserIdAsync_UserHasAllocatedDepartments_ReturnsMappedGrievanceDepartments()
    {
        int userId = 42;
        var userAllocations = new List<UserDepartmentAllocationEntity>
        {
            new() { Id = 1, UserId = userId, DepartmentId = 10, IsActive = true },
            new() { Id = 2, UserId = userId, DepartmentId = 20, IsActive = true },
            new() { Id = 3, UserId = userId, DepartmentId = 30, IsActive = false }, // inactive allocation, should be skipped
            new() { Id = 4, UserId = 999, DepartmentId = 40, IsActive = true } // other user
        };
        _mockUserDepartmentAllocationRepository.Setup(r => r.GetQueryable()).Returns(userAllocations.BuildMock());

        var grvDepts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = 101, DepartmentName = "Water Works", CoreDepartmentId = 10, IsActive = true },
            new() { Id = 102, DepartmentName = "Public Engineering", CoreDepartmentId = 20, IsActive = true },
            new() { Id = 103, DepartmentName = "Solid Waste", CoreDepartmentId = 50, IsActive = true }, // not allocated to user
            new() { Id = 104, DepartmentName = "Old Health", CoreDepartmentId = 10, IsActive = false } // inactive grv department
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(grvDepts.BuildMock());

        var result = await _service.GetGrievanceDepartmentsByUserIdAsync(userId);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, d => d.Id == 101 && d.CoreDepartmentId == 10);
        Assert.Contains(result, d => d.Id == 102 && d.CoreDepartmentId == 20);
    }

    [Fact]
    public async Task GetGrievanceDepartmentsByUserIdAsync_UserHasNoAllocatedDepartments_ReturnsEmptyList()
    {
        int userId = 42;
        var userAllocations = new List<UserDepartmentAllocationEntity>();
        _mockUserDepartmentAllocationRepository.Setup(r => r.GetQueryable()).Returns(userAllocations.BuildMock());

        var result = await _service.GetGrievanceDepartmentsByUserIdAsync(userId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllocatedUsersByGrievanceDepartmentIdAsync_ValidGrievanceDept_ReturnsActiveAllocatedUsers()
    {
        int grvDeptId = 5;
        int coreDeptId = 20;

        var grvDepts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = grvDeptId, DepartmentName = "Water Department", CoreDepartmentId = coreDeptId, IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(grvDepts.BuildMock());

        var activeOfficer = new UserEntity
        {
            Id = 101,
            UserName = "officer1",
            FirstName = "Rajesh",
            LastName = "Sharma",
            Email = "rajesh@example.com",
            MobileNo = "9876543210",
            IsActive = true,
            MarkedForDeletion = false
        };

        var deletedOfficer = new UserEntity
        {
            Id = 102,
            UserName = "officer2",
            FirstName = "Suresh",
            LastName = "Patil",
            IsActive = true,
            MarkedForDeletion = true // marked for deletion, should be ignored
        };

        var inactiveOfficer = new UserEntity
        {
            Id = 103,
            UserName = "officer3",
            FirstName = "Anil",
            LastName = "Deshmukh",
            IsActive = false,
            MarkedForDeletion = false // inactive, should be ignored
        };

        var userAllocations = new List<UserDepartmentAllocationEntity>
        {
            new() { Id = 1, UserId = activeOfficer.Id, DepartmentId = coreDeptId, IsActive = true, User = activeOfficer },
            new() { Id = 2, UserId = deletedOfficer.Id, DepartmentId = coreDeptId, IsActive = true, User = deletedOfficer },
            new() { Id = 3, UserId = inactiveOfficer.Id, DepartmentId = coreDeptId, IsActive = true, User = inactiveOfficer },
            new() { Id = 4, UserId = activeOfficer.Id, DepartmentId = 999, IsActive = true, User = activeOfficer } // different dept
        };
        _mockUserDepartmentAllocationRepository.Setup(r => r.GetQueryable()).Returns(userAllocations.BuildMock());

        var result = await _service.GetAllocatedUsersByGrievanceDepartmentIdAsync(grvDeptId);

        Assert.Single(result);
        Assert.Equal(101, result[0].UserId);
        Assert.Equal("officer1", result[0].UserName);
        Assert.Equal("Rajesh Sharma", result[0].FullName);
    }

    [Fact]
    public async Task GetAllocatedUsersByGrievanceDepartmentIdAsync_StandaloneGrievanceDeptNoCoreDept_ReturnsEmptyList()
    {
        int grvDeptId = 7;
        var grvDepts = new List<GrievanceDepartmentMasterEntity>
        {
            new() { Id = grvDeptId, DepartmentName = "Standalone Dept", CoreDepartmentId = null, IsActive = true }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(grvDepts.BuildMock());

        var result = await _service.GetAllocatedUsersByGrievanceDepartmentIdAsync(grvDeptId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllocatedUsersByGrievanceDepartmentIdAsync_NonExistentDept_ReturnsEmptyList()
    {
        var grvDepts = new List<GrievanceDepartmentMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(grvDepts.BuildMock());

        var result = await _service.GetAllocatedUsersByGrievanceDepartmentIdAsync(999);

        Assert.Empty(result);
    }
}
