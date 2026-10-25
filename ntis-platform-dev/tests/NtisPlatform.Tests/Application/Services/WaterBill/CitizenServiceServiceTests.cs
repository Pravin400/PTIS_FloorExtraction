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

public class CitizenServiceServiceTests
{
    private readonly Mock<IRepository<CitizenServiceEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly CitizenServiceService _service;

    public CitizenServiceServiceTests()
    {
        _mockRepository = new Mock<IRepository<CitizenServiceEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<CitizenServiceEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _service = new CitizenServiceService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);
    }

    [Fact]
    public async Task GetActiveCitizenServicesAsync_FiltersByActiveAndDepartmentId()
    {
        // Arrange
        var entities = new List<CitizenServiceEntity>
        {
            new CitizenServiceEntity { Id = 1, IsActive = true, Title = "Pay Water Bill", DepartmentId = 1, DisplayOrder = 1 },
            new CitizenServiceEntity { Id = 2, IsActive = false, Title = "Inactive Service", DepartmentId = 1, DisplayOrder = 2 }, // inactive
            new CitizenServiceEntity { Id = 3, IsActive = true, Title = "New Connection", DepartmentId = 2, DisplayOrder = 3 } // wrong department
        };

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(entities.BuildMock());

        var dtos = new List<CitizenServiceDto>
        {
            new CitizenServiceDto { Id = 1, Title = "Pay Water Bill" }
        };

        _mockMapper
            .Setup(m => m.Map<IEnumerable<CitizenServiceDto>>(It.Is<IEnumerable<CitizenServiceEntity>>(e => e.Select(x => x.Id).SequenceEqual(new[] { 1 }))))
            .Returns(dtos);

        // Act
        var result = await _service.GetActiveCitizenServicesAsync(1);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal(1, resultList.First().Id);
    }

    [Fact]
    public async Task GetActiveCitizenServicesAsync_WithoutDepartmentId_ReturnsAllActive()
    {
        // Arrange
        var entities = new List<CitizenServiceEntity>
        {
            new CitizenServiceEntity { Id = 1, IsActive = true, Title = "Pay Water Bill", DepartmentId = 1, DisplayOrder = 2 },
            new CitizenServiceEntity { Id = 2, IsActive = false, Title = "Inactive Service", DepartmentId = 1, DisplayOrder = 3 },
            new CitizenServiceEntity { Id = 3, IsActive = true, Title = "New Connection", DepartmentId = 2, DisplayOrder = 1 }
        };

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(entities.BuildMock());

        var dtos = new List<CitizenServiceDto>
        {
            new CitizenServiceDto { Id = 3, Title = "New Connection" }, // Order 1
            new CitizenServiceDto { Id = 1, Title = "Pay Water Bill" }  // Order 2
        };

        // Note: Entities are ordered by DisplayOrder before mapping
        _mockMapper
            .Setup(m => m.Map<IEnumerable<CitizenServiceDto>>(It.Is<IEnumerable<CitizenServiceEntity>>(e => e.Select(x => x.Id).SequenceEqual(new[] { 3, 1 }))))
            .Returns(dtos);

        // Act
        var result = await _service.GetActiveCitizenServicesAsync(null);

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(2, resultList.Count);
        Assert.Equal(3, resultList[0].Id);
        Assert.Equal(1, resultList[1].Id);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        // Arrange
        var createDto = new CreateCitizenServiceDto
        {
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        var entity = new CitizenServiceEntity
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1,
            IsActive = true
        };
        var expectedDto = new CitizenServiceDto
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1,
            IsActive = true
        };

        _mockMapper.Setup(m => m.Map<CitizenServiceEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<CitizenServiceDto>(entity)).Returns(expectedDto);

        // Act
        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Pay Water Bill", result.Title);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var entity = new CitizenServiceEntity
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1,
            IsActive = true
        };
        var expectedDto = new CitizenServiceDto
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<CitizenServiceDto>(entity)).Returns(expectedDto);

        // Act
        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Pay Water Bill", result.Title);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        // Arrange
        var updateDto = new UpdateCitizenServiceDto
        {
            Title = "Updated Title",
            DepartmentId = 1,
            IsActive = true
        };
        var existingEntity = new CitizenServiceEntity
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1,
            IsActive = true
        };
        var expectedDto = new CitizenServiceDto
        {
            Id = 1,
            Title = "Updated Title",
            DepartmentId = 1,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockMapper.Setup(m => m.Map(updateDto, existingEntity)).Returns(existingEntity);
        _mockMapper.Setup(m => m.Map<CitizenServiceDto>(existingEntity)).Returns(expectedDto);

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
        var entity = new CitizenServiceEntity
        {
            Id = 1,
            Title = "Pay Water Bill",
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

        var serviceWithDept = new CitizenServiceService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreateCitizenServiceDto
        {
            Title = "Pay Water Bill",
            DepartmentId = 999
        };
        var entity = new CitizenServiceEntity
        {
            Title = "Pay Water Bill",
            DepartmentId = 999
        };
        _mockMapper.Setup(m => m.Map<CitizenServiceEntity>(createDto)).Returns(entity);

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

        var serviceWithDept = new CitizenServiceService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreateCitizenServiceDto
        {
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        var entity = new CitizenServiceEntity
        {
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        _mockMapper.Setup(m => m.Map<CitizenServiceEntity>(createDto)).Returns(entity);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(() => serviceWithDept.CreateAsync(createDto));
        Assert.Contains("Department with Id 1 is inactive", ex.Errors["DepartmentId"]);
    }

    [Fact]
    public async Task CreateAsync_ActiveDepartmentId_Succeeds()
    {
        // Arrange
        var mockDeptRepo = new Mock<IRepository<DepartmentMasterEntity, int>>();
        mockDeptRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepartmentMasterEntity { Id = 1, IsActive = true, DepartmentName = "Water Dept" });

        var serviceWithDept = new CitizenServiceService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            mockDeptRepo.Object);

        var createDto = new CreateCitizenServiceDto
        {
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        var entity = new CitizenServiceEntity
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        var expectedDto = new CitizenServiceDto
        {
            Id = 1,
            Title = "Pay Water Bill",
            DepartmentId = 1
        };
        _mockMapper.Setup(m => m.Map<CitizenServiceEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<CitizenServiceDto>(entity)).Returns(expectedDto);

        // Act
        var result = await serviceWithDept.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
    }
}
