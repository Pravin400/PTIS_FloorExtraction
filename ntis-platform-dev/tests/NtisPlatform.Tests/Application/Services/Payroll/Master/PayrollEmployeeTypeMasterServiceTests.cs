using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollEmployeeTypeMasterServiceTests
{
    private readonly Mock<IRepository<PayrollEmployeeTypeMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollEmployeeTypeMasterService _service;

    public PayrollEmployeeTypeMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollEmployeeTypeMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(506);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollEmployeeTypeMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollEmployeeTypeMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollEmployeeTypeMasterEntity { Id = 1, EmployeeTypeCode = "PERM", EmployeeTypeName = "Permanent" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("PERM", result!.EmployeeTypeCode);
        Assert.Equal("Permanent", result.EmployeeTypeName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollEmployeeTypeMasterDto 
        { 
            EmployeeTypeCode = "TEMP", 
            EmployeeTypeName = "Temporary",
            CreatedBy = 999 // Spoofed
        };
        PayrollEmployeeTypeMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollEmployeeTypeMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollEmployeeTypeMasterEntity, CancellationToken>((e, _) => { e.Id = 60; saved = e; })
            .ReturnsAsync((PayrollEmployeeTypeMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(60, result.Id);
        Assert.Equal("TEMP", result.EmployeeTypeCode);
        Assert.NotNull(saved);
        Assert.Equal(506, saved!.CreatedBy);
        Assert.Equal(506, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollEmployeeTypeMasterEntity { Id = 1, EmployeeTypeCode = "PERM", EmployeeTypeName = "Permanent", CreatedBy = 10 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollEmployeeTypeMasterDto 
        { 
            EmployeeTypeCode = "PERM", 
            EmployeeTypeName = "Permanent Full Time",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Permanent Full Time", result!.EmployeeTypeName);
        Assert.Equal(506, existing.UpdatedBy);
        Assert.Equal(506, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollEmployeeTypeMasterEntity { Id = 1, EmployeeTypeCode = "PERM", EmployeeTypeName = "Permanent" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
