using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollBloodGroupMasterServiceTests
{
    private readonly Mock<IRepository<PayrollBloodGroupMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollBloodGroupMasterService _service;

    public PayrollBloodGroupMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollBloodGroupMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(501);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollBloodGroupMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollBloodGroupMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollBloodGroupMasterEntity { Id = 1, BloodGroupCode = "A+", BloodGroupName = "A+", IsActive = true };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result!.Id);
        Assert.Equal("A+", result.BloodGroupCode);
        Assert.Equal("A+", result.BloodGroupName);
    }

    [Fact]
    public async Task GetByIdAsync_WithInvalidId_ReturnsNull()
    {
        _repositoryMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((PayrollBloodGroupMasterEntity?)null);

        var result = await _service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollBloodGroupMasterDto 
        { 
            BloodGroupCode = "B+",
            BloodGroupName = "B+",
            CreatedBy = 999 // Spoofed
        };
        PayrollBloodGroupMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollBloodGroupMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollBloodGroupMasterEntity, CancellationToken>((e, _) => { e.Id = 10; saved = e; })
            .ReturnsAsync((PayrollBloodGroupMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal("B+", result.BloodGroupCode);
        Assert.Equal("B+", result.BloodGroupName);
        Assert.NotNull(saved);
        Assert.Equal(501, saved!.CreatedBy);
        Assert.Equal(501, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollBloodGroupMasterEntity { Id = 1, BloodGroupCode = "AB+", BloodGroupName = "AB+", CreatedBy = 100 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollBloodGroupMasterDto 
        { 
            BloodGroupCode = "AB-",
            BloodGroupName = "AB-",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("AB-", result!.BloodGroupCode);
        Assert.Equal("AB-", result!.BloodGroupName);
        Assert.Equal(501, existing.UpdatedBy);
        Assert.Equal(501, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollBloodGroupMasterEntity { Id = 1, BloodGroupCode = "O+", BloodGroupName = "O+" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
