using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollEmployeeClassMasterServiceTests
{
    private readonly Mock<IRepository<PayrollEmployeeClassMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollEmployeeClassMasterService _service;

    public PayrollEmployeeClassMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollEmployeeClassMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(504);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollEmployeeClassMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollEmployeeClassMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollEmployeeClassMasterEntity { Id = 1, ClassCode = "A", ClassName = "Class 1" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("A", result!.ClassCode);
        Assert.Equal("Class 1", result.ClassName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollEmployeeClassMasterDto 
        { 
            ClassCode = "B", 
            ClassName = "Class 2",
            CreatedBy = 999 // Spoofed
        };
        PayrollEmployeeClassMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollEmployeeClassMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollEmployeeClassMasterEntity, CancellationToken>((e, _) => { e.Id = 40; saved = e; })
            .ReturnsAsync((PayrollEmployeeClassMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(40, result.Id);
        Assert.Equal("B", result.ClassCode);
        Assert.NotNull(saved);
        Assert.Equal(504, saved!.CreatedBy);
        Assert.Equal(504, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollEmployeeClassMasterEntity { Id = 1, ClassCode = "A", ClassName = "Class 1", CreatedBy = 10 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollEmployeeClassMasterDto 
        { 
            ClassCode = "A", 
            ClassName = "Class 1 Updated",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Class 1 Updated", result!.ClassName);
        Assert.Equal(504, existing.UpdatedBy);
        Assert.Equal(504, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollEmployeeClassMasterEntity { Id = 1, ClassCode = "A", ClassName = "Class 1" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
