using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollDesignationMasterServiceTests
{
    private readonly Mock<IRepository<PayrollDesignationMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollDesignationMasterService _service;

    public PayrollDesignationMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollDesignationMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(503);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollDesignationMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollDesignationMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollDesignationMasterEntity { Id = 1, DesignationCode = "CLK", DesignationName = "Clerk" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("CLK", result!.DesignationCode);
        Assert.Equal("Clerk", result.DesignationName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollDesignationMasterDto 
        { 
            DesignationCode = "MGR", 
            DesignationName = "Manager",
            CreatedBy = 999 // Spoofed
        };
        PayrollDesignationMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollDesignationMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollDesignationMasterEntity, CancellationToken>((e, _) => { e.Id = 30; saved = e; })
            .ReturnsAsync((PayrollDesignationMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(30, result.Id);
        Assert.Equal("MGR", result.DesignationCode);
        Assert.NotNull(saved);
        Assert.Equal(503, saved!.CreatedBy);
        Assert.Equal(503, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollDesignationMasterEntity { Id = 1, DesignationCode = "CLK", DesignationName = "Clerk", CreatedBy = 5 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollDesignationMasterDto 
        { 
            DesignationCode = "CLK", 
            DesignationName = "Senior Clerk",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Senior Clerk", result!.DesignationName);
        Assert.Equal(503, existing.UpdatedBy);
        Assert.Equal(503, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollDesignationMasterEntity { Id = 1, DesignationCode = "CLK", DesignationName = "Clerk" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
