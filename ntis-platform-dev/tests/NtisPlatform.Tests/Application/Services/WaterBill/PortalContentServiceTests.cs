using AutoMapper;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.WaterBill;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.WaterBill;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.WaterBill;

public class PortalContentServiceTests
{
    private readonly Mock<IRepository<PortalContentEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly PortalContentService _service;

    public PortalContentServiceTests()
    {
        _mockRepository = new Mock<IRepository<PortalContentEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<PortalContentEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _service = new PortalContentService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);
    }

    [Fact]
    public async Task GetActivePortalContentAsync_FiltersByActiveAndDateAndType()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var entities = new List<PortalContentEntity>
        {
            new PortalContentEntity { Id = 1, IsActive = true, ContentType = "LATEST_UPDATE", PublishFromDate = now.AddDays(-1), PublishToDate = now.AddDays(1), DepartmentId = 4 },
            new PortalContentEntity { Id = 2, IsActive = false, ContentType = "LATEST_UPDATE", DepartmentId = 4 }, // inactive
            new PortalContentEntity { Id = 3, IsActive = true, ContentType = "ANNOUNCEMENT", DepartmentId = 4 }, // wrong type
            new PortalContentEntity { Id = 4, IsActive = true, ContentType = "LATEST_UPDATE", PublishToDate = now.AddDays(-1), DepartmentId = 4 }, // expired
            new PortalContentEntity { Id = 5, IsActive = true, ContentType = "LATEST_UPDATE", PublishFromDate = now.AddDays(1), DepartmentId = 4 }, // future
            new PortalContentEntity { Id = 6, IsActive = true, ContentType = "LATEST_UPDATE", DepartmentId = 4 } // no dates
        };

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(entities.BuildMock());

        var dtos = new List<PortalContentDto>
        {
            new PortalContentDto { Id = 1, ContentType = "LATEST_UPDATE" },
            new PortalContentDto { Id = 6, ContentType = "LATEST_UPDATE" }
        };

        _mockMapper
            .Setup(m => m.Map<IEnumerable<PortalContentDto>>(It.Is<IEnumerable<PortalContentEntity>>(e => e.Select(x => x.Id).OrderBy(id => id).SequenceEqual(new[] { 1, 6 }))))
            .Returns(dtos);

        // Act
        var result = await _service.GetActivePortalContentAsync(4, "LATEST_UPDATE");

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(2, resultList.Count);
        Assert.Contains(resultList, x => x.Id == 1);
        Assert.Contains(resultList, x => x.Id == 6);
    }

    [Fact]
    public async Task GetActivePortalContentAsync_FiltersByDepartmentId()
    {
        // Arrange
        var entities = new List<PortalContentEntity>
        {
            new PortalContentEntity { Id = 1, IsActive = true, ContentType = "LATEST_UPDATE", DepartmentId = 1 },
            new PortalContentEntity { Id = 2, IsActive = true, ContentType = "LATEST_UPDATE", DepartmentId = 2 }
        };

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(entities.BuildMock());

        var dtos = new List<PortalContentDto>
        {
            new PortalContentDto { Id = 1, ContentType = "LATEST_UPDATE" }
        };

        _mockMapper
            .Setup(m => m.Map<IEnumerable<PortalContentDto>>(It.Is<IEnumerable<PortalContentEntity>>(e => e.Select(x => x.Id).SequenceEqual(new[] { 1 }))))
            .Returns(dtos);

        // Act
        var result = await _service.GetActivePortalContentAsync(1, "LATEST_UPDATE");

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal(1, resultList.First().Id);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreatePortalContentDto
        {
            ContentType = "LATEST_UPDATE",
            Title = "Test Update"
        };
        var entity = new PortalContentEntity
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };
        var expectedDto = new PortalContentDto
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<PortalContentEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<PortalContentDto>(entity)).Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("LATEST_UPDATE", result.ContentType);
        Assert.Equal("Test Update", result.Title);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new PortalContentEntity
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };
        var expectedDto = new PortalContentDto
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<PortalContentDto>(entity)).Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("LATEST_UPDATE", result.ContentType);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdatePortalContentDto
        {
            ContentType = "LATEST_UPDATE",
            Title = "Updated Title",
            IsActive = true
        };
        var existingEntity = new PortalContentEntity
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };
        var expectedDto = new PortalContentDto
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Updated Title",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockMapper.Setup(m => m.Map(updateDto, existingEntity)).Returns(existingEntity);
        _mockMapper.Setup(m => m.Map<PortalContentDto>(existingEntity)).Returns(expectedDto);

        // Act
        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Updated Title", result.Title);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        var entity = new PortalContentEntity
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        // Act
        await _service.DeleteAsync(1, CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NonExistentDepartmentId_ThrowsValidationException()
    {
        // Arrange
        var mockDeptRepo = new Mock<IRepository<DepartmentMasterEntity, int>>();
        mockDeptRepo.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DepartmentMasterEntity?)null);

        var serviceWithDept = new PortalContentService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreatePortalContentDto
        {
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            DepartmentId = 999
        };
        var entity = new PortalContentEntity
        {
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            DepartmentId = 999
        };
        _mockMapper.Setup(m => m.Map<PortalContentEntity>(createDto)).Returns(entity);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => serviceWithDept.CreateAsync(createDto));
        Assert.Contains("Department with Id 999 does not exist.", ex.Errors["DepartmentId"]);
    }

    [Fact]
    public async Task CreateAsync_InactiveDepartmentId_ThrowsValidationException()
    {
        // Arrange
        var mockDeptRepo = new Mock<IRepository<DepartmentMasterEntity, int>>();
        mockDeptRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentMasterEntity { Id = 1, IsActive = false, DepartmentName = "Inactive Dept" });

        var serviceWithDept = new PortalContentService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreatePortalContentDto
        {
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            DepartmentId = 1
        };
        var entity = new PortalContentEntity
        {
            ContentType = "LATEST_UPDATE",
            Title = "Test Update",
            DepartmentId = 1
        };
        _mockMapper.Setup(m => m.Map<PortalContentEntity>(createDto)).Returns(entity);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => serviceWithDept.CreateAsync(createDto));
        Assert.Contains("Department with Id 1 is inactive", ex.Errors["DepartmentId"]);
    }

    [Fact]
    public async Task CreateAsync_NullDepartmentId_AllowedForGlobalContent()
    {
        // Arrange
        var mockDeptRepo = new Mock<IRepository<DepartmentMasterEntity, int>>();

        var serviceWithDept = new PortalContentService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreatePortalContentDto
        {
            ContentType = "LATEST_UPDATE",
            Title = "Global Update",
            DepartmentId = null
        };
        var entity = new PortalContentEntity
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Global Update",
            DepartmentId = null
        };
        var expectedDto = new PortalContentDto
        {
            Id = 1,
            ContentType = "LATEST_UPDATE",
            Title = "Global Update",
            DepartmentId = null
        };
        _mockMapper.Setup(m => m.Map<PortalContentEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<PortalContentDto>(entity)).Returns(expectedDto);

        // Act
        var result = await serviceWithDept.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Null(result.DepartmentId);
        mockDeptRepo.Verify(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
