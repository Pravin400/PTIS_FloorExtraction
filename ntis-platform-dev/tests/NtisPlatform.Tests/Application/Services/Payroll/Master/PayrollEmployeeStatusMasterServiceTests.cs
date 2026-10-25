using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollEmployeeStatusMasterServiceTests
{
    private readonly Mock<IRepository<PayrollEmployeeStatusMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollEmployeeStatusMasterService _service;

    public PayrollEmployeeStatusMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollEmployeeStatusMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(505);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollEmployeeStatusMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollEmployeeStatusMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollEmployeeStatusMasterEntity { Id = 1, EmployeeStatusCode = "ACT", EmployeeStatus = "Active" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("ACT", result!.EmployeeStatusCode);
        Assert.Equal("Active", result.EmployeeStatus);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollEmployeeStatusMasterDto 
        { 
            EmployeeStatusCode = "INA", 
            EmployeeStatus = "Inactive",
            CreatedBy = 999 // Spoofed
        };
        PayrollEmployeeStatusMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollEmployeeStatusMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollEmployeeStatusMasterEntity, CancellationToken>((e, _) => { e.Id = 50; saved = e; })
            .ReturnsAsync((PayrollEmployeeStatusMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(50, result.Id);
        Assert.Equal("INA", result.EmployeeStatusCode);
        Assert.NotNull(saved);
        Assert.Equal(505, saved!.CreatedBy);
        Assert.Equal(505, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollEmployeeStatusMasterEntity { Id = 1, EmployeeStatusCode = "ACT", EmployeeStatus = "Active", CreatedBy = 10 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollEmployeeStatusMasterDto 
        { 
            EmployeeStatusCode = "ACT", 
            EmployeeStatus = "Active Updated",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Active Updated", result!.EmployeeStatus);
        Assert.Equal(505, existing.UpdatedBy);
        Assert.Equal(505, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollEmployeeStatusMasterEntity { Id = 1, EmployeeStatusCode = "ACT", EmployeeStatus = "Active" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
