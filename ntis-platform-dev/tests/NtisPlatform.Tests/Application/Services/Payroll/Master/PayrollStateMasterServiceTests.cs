using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollStateMasterServiceTests
{
    private readonly Mock<IRepository<PayrollStateMasterEntity, int>> _stateRepoMock;
    private readonly Mock<IRepository<PayrollDistrictMasterEntity, int>> _districtRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollStateMasterService _service;

    public PayrollStateMasterServiceTests()
    {
        _stateRepoMock = new Mock<IRepository<PayrollStateMasterEntity, int>>();
        _districtRepoMock = new Mock<IRepository<PayrollDistrictMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(512);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollStateMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollStateMasterService(
            _stateRepoMock.Object,
            _districtRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("MH", result!.StateCode);
        Assert.Equal("Maharashtra", result.StateName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollStateMasterDto 
        { 
            StateCode = "GJ", 
            StateName = "Gujarat",
            CreatedBy = 999 // Spoofed user id
        };
        PayrollStateMasterEntity? saved = null;

        _stateRepoMock.Setup(r => r.AddAsync(It.IsAny<PayrollStateMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollStateMasterEntity, CancellationToken>((e, _) => { e.Id = 120; saved = e; })
            .ReturnsAsync((PayrollStateMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(120, result.Id);
        Assert.Equal("GJ", result.StateCode);
        Assert.NotNull(saved);
        Assert.Equal(512, saved!.CreatedBy);
        Assert.Equal(512, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true, CreatedBy = 100 };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollStateMasterDto
        {
            StateCode = "MH",
            StateName = "Maharashtra Updated",
            IsActive = true,
            UpdatedBy = 999 // Spoofed user id
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Maharashtra Updated", result!.StateName);
        Assert.Equal(512, existing.UpdatedBy);
        Assert.Equal(512, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_Deactivate_WhenActiveDistrictsExist_ThrowsValidationException()
    {
        var state = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true }
        }.BuildMock();

        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var updateDto = new UpdatePayrollStateMasterDto { StateCode = "MH", StateName = "Maharashtra", IsActive = false };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(1, updateDto));
        Assert.Contains("This State cannot be deactivated because it has active Districts. Please deactivate all active Districts for this State first.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_Deactivate_WhenOnlyInactiveDistrictsExist_Succeeds()
    {
        var state = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = false }
        }.BuildMock();

        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var updateDto = new UpdatePayrollStateMasterDto { StateCode = "MH", StateName = "Maharashtra", IsActive = false };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.False(state.IsActive);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenDistrictsExist_ThrowsValidationException()
    {
        var state = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = false }
        }.BuildMock();

        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1));
        Assert.Contains("This State cannot be deleted because it has Districts. Please delete all Districts for this State first.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenNoDistrictsExist_CallsHardDelete_ReturnsTrue()
    {
        var state = new PayrollStateMasterEntity { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true };
        _stateRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(state);

        var districts = new List<PayrollDistrictMasterEntity>().BuildMock();
        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _stateRepoMock.Verify(r => r.HardDeleteAsync(state, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        _stateRepoMock.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((PayrollStateMasterEntity?)null);

        var result = await _service.DeleteAsync(99);

        Assert.False(result);
    }
}
