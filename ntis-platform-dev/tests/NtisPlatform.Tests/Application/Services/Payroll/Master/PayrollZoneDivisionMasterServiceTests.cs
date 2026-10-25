using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollZoneDivisionMasterServiceTests
{
    private readonly Mock<IRepository<PayrollZoneDivisionMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollZoneDivisionMasterService _service;

    public PayrollZoneDivisionMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollZoneDivisionMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(511);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollZoneDivisionMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollZoneDivisionMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollZoneDivisionMasterEntity { Id = 1, ZoneDivisionCode = "HQ", ZoneDivisionName = "Headquarters" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("HQ", result!.ZoneDivisionCode);
        Assert.Equal("Headquarters", result.ZoneDivisionName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollZoneDivisionMasterDto 
        { 
            ZoneDivisionCode = "HQ", 
            ZoneDivisionName = "Headquarters",
            CreatedBy = 999
        };
        PayrollZoneDivisionMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollZoneDivisionMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollZoneDivisionMasterEntity, CancellationToken>((e, _) => { e.Id = 40; saved = e; })
            .ReturnsAsync((PayrollZoneDivisionMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(40, result.Id);
        Assert.Equal("HQ", result.ZoneDivisionCode);
        Assert.NotNull(saved);
        Assert.Equal(511, saved!.CreatedBy);
        Assert.Equal(511, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollZoneDivisionMasterEntity { Id = 1, ZoneDivisionCode = "HQ", ZoneDivisionName = "Headquarters", CreatedBy = 5 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollZoneDivisionMasterDto 
        { 
            ZoneDivisionCode = "HQ", 
            ZoneDivisionName = "Headquarters Main",
            UpdatedBy = 999
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Headquarters Main", result!.ZoneDivisionName);
        Assert.Equal(511, existing.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_CallsHardDelete_ReturnsTrue()
    {
        var entity = new PayrollZoneDivisionMasterEntity { Id = 1, ZoneDivisionCode = "HQ", ZoneDivisionName = "Headquarters" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
