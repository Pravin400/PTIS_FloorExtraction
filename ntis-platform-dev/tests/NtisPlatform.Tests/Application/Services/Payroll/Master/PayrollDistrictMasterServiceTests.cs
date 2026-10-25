using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollDistrictMasterServiceTests
{
    private readonly Mock<IRepository<PayrollDistrictMasterEntity, int>> _districtRepoMock;
    private readonly Mock<IRepository<PayrollStateMasterEntity, int>> _stateRepoMock;
    private readonly Mock<IRepository<PayrollTalukaMasterEntity, int>> _talukaRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollDistrictMasterService _service;

    public PayrollDistrictMasterServiceTests()
    {
        _districtRepoMock = new Mock<IRepository<PayrollDistrictMasterEntity, int>>();
        _stateRepoMock = new Mock<IRepository<PayrollStateMasterEntity, int>>();
        _talukaRepoMock = new Mock<IRepository<PayrollTalukaMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(513);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollDistrictMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollDistrictMasterService(
            _districtRepoMock.Object,
            _stateRepoMock.Object,
            _talukaRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentState_ThrowsValidationException()
    {
        var states = new List<PayrollStateMasterEntity>().BuildMock();
        _stateRepoMock.Setup(r => r.GetQueryable()).Returns(states);

        var createDto = new CreatePayrollDistrictMasterDto { StateId = 999, DistrictCode = "PUN", DistrictName = "Pune" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("State with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithInactiveState_ThrowsValidationException()
    {
        var states = new List<PayrollStateMasterEntity>
        {
            new() { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = false }
        }.BuildMock();
        _stateRepoMock.Setup(r => r.GetQueryable()).Returns(states);

        var createDto = new CreatePayrollDistrictMasterDto { StateId = 1, DistrictCode = "PUN", DistrictName = "Pune" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("is inactive", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser()
    {
        var states = new List<PayrollStateMasterEntity>
        {
            new() { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true }
        }.BuildMock();
        _stateRepoMock.Setup(r => r.GetQueryable()).Returns(states);

        var createDto = new CreatePayrollDistrictMasterDto { StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", CreatedBy = 999 };
        PayrollDistrictMasterEntity? saved = null;

        _districtRepoMock.Setup(r => r.AddAsync(It.IsAny<PayrollDistrictMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollDistrictMasterEntity, CancellationToken>((e, _) => { e.Id = 10; saved = e; })
            .ReturnsAsync((PayrollDistrictMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal(513, saved!.CreatedBy);
        Assert.Equal(513, createDto.CreatedBy);
    }

    [Fact]
    public async Task UpdateAsync_Deactivate_WhenActiveTalukasExist_ThrowsValidationException()
    {
        var district = new PayrollDistrictMasterEntity { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true };
        _districtRepoMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(district);

        var states = new List<PayrollStateMasterEntity>
        {
            new() { Id = 1, StateCode = "MH", StateName = "Maharashtra", IsActive = true }
        }.BuildMock();
        _stateRepoMock.Setup(r => r.GetQueryable()).Returns(states);

        var talukas = new List<PayrollTalukaMasterEntity>
        {
            new() { Id = 101, DistrictId = 10, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = true }
        }.BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var updateDto = new UpdatePayrollDistrictMasterDto { StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = false };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(10, updateDto));
        Assert.Contains("This District cannot be deactivated because it has active Talukas.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenTalukasExist_ThrowsValidationException()
    {
        var district = new PayrollDistrictMasterEntity { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true };
        _districtRepoMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(district);

        var talukas = new List<PayrollTalukaMasterEntity>
        {
            new() { Id = 101, DistrictId = 10, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = false }
        }.BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(10));
        Assert.Contains("This District cannot be deleted because it has Talukas.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenNoTalukasExist_CallsHardDelete_ReturnsTrue()
    {
        var district = new PayrollDistrictMasterEntity { Id = 10, StateId = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true };
        _districtRepoMock.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(district);

        var talukas = new List<PayrollTalukaMasterEntity>().BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var result = await _service.DeleteAsync(10);

        Assert.True(result);
        _districtRepoMock.Verify(r => r.HardDeleteAsync(district, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
