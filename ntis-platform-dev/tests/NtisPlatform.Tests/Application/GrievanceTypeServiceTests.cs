using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Mappings.GrievanceMapping;
using NtisPlatform.Application.Services.GrievanceService;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class GrievanceTypeServiceTests
{
    private readonly Mock<IRepository<GrievanceTypeMasterEntity, int>> _mockRepository;
    private readonly Mock<IRepository<GrievanceDepartmentMasterEntity, int>> _mockDepartmentRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly IMapper _mapper;
    private readonly GrievanceTypeService _service;

    public GrievanceTypeServiceTests()
    {
        _mockRepository = new Mock<IRepository<GrievanceTypeMasterEntity, int>>();
        _mockDepartmentRepository = new Mock<IRepository<GrievanceDepartmentMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<GrievanceTypeMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        var defaultEntities = new List<GrievanceTypeMasterEntity>();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(defaultEntities.BuildMock());

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _service = new GrievanceTypeService(
            _mockRepository.Object,
            _mockDepartmentRepository.Object,
            _mockUnitOfWork.Object,
            _mapper);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = new GrievanceTypeMasterEntity
        {
            Id = 1,
            GrievanceDepartmentId = 2,
            GrievanceType = "Low pressure",
            IsActive = true,
            GrievanceDepartment = new GrievanceDepartmentMasterEntity { Id = 2, DepartmentName = "Water Supply Department" }
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Low pressure", result.GrievanceType);
        Assert.Equal("Water Supply Department", result.DepartmentName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_Succeeds()
    {
        var department = new GrievanceDepartmentMasterEntity { Id = 2, DepartmentName = "Water Supply Department" };
        _mockDepartmentRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(department);

        var dto = new CreateGrievanceTypeDto
        {
            GrievanceDepartmentId = 2,
            GrievanceType = "Pipeline Leakage",
            IsActive = true
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<GrievanceTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<GrievanceTypeMasterEntity, CancellationToken>((entity, _) => entity.Id = 15)
            .ReturnsAsync((GrievanceTypeMasterEntity entity, CancellationToken _) => entity);

        var result = await _service.CreateAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Pipeline Leakage", result.GrievanceType);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<GrievanceTypeMasterEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistingDepartment_ThrowsValidationException()
    {
        _mockDepartmentRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GrievanceDepartmentMasterEntity?)null);

        var dto = new CreateGrievanceTypeDto
        {
            GrievanceDepartmentId = 999,
            GrievanceType = "Pipeline Leakage",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_DuplicateTypeInSameDepartment_ThrowsValidationException()
    {
        var department = new GrievanceDepartmentMasterEntity { Id = 2, DepartmentName = "Water Supply Department" };
        _mockDepartmentRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(department);

        var existingList = new List<GrievanceTypeMasterEntity>
        {
            new GrievanceTypeMasterEntity { Id = 1, GrievanceDepartmentId = 2, GrievanceType = "Pipeline Leakage" }
        };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingList.BuildMock());

        var dto = new CreateGrievanceTypeDto
        {
            GrievanceDepartmentId = 2,
            GrievanceType = "Pipeline Leakage",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_Succeeds()
    {
        var entity = new GrievanceTypeMasterEntity
        {
            Id = 1,
            GrievanceDepartmentId = 2,
            GrievanceType = "Pipeline Leakage",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<GrievanceTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
