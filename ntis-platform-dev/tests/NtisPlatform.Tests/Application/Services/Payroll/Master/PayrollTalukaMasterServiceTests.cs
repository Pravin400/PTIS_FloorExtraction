using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollTalukaMasterServiceTests
{
    private readonly Mock<IRepository<PayrollTalukaMasterEntity, int>> _talukaRepoMock;
    private readonly Mock<IRepository<PayrollDistrictMasterEntity, int>> _districtRepoMock;
    private readonly Mock<IRepository<PayrollVillageMasterEntity, int>> _villageRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollTalukaMasterService _service;

    public PayrollTalukaMasterServiceTests()
    {
        _talukaRepoMock = new Mock<IRepository<PayrollTalukaMasterEntity, int>>();
        _districtRepoMock = new Mock<IRepository<PayrollDistrictMasterEntity, int>>();
        _villageRepoMock = new Mock<IRepository<PayrollVillageMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(514);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollTalukaMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollTalukaMasterService(
            _talukaRepoMock.Object,
            _districtRepoMock.Object,
            _villageRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentDistrict_ThrowsValidationException()
    {
        var districts = new List<PayrollDistrictMasterEntity>().BuildMock();
        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var createDto = new CreatePayrollTalukaMasterDto { DistrictId = 999, TalukaCode = "HAV", TalukaName = "Haveli" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("District with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithInactiveDistrict_ThrowsValidationException()
    {
        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = false }
        }.BuildMock();
        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var createDto = new CreatePayrollTalukaMasterDto { DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("is inactive", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser()
    {
        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true }
        }.BuildMock();
        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var createDto = new CreatePayrollTalukaMasterDto { DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli", CreatedBy = 999 };
        PayrollTalukaMasterEntity? saved = null;

        _talukaRepoMock.Setup(r => r.AddAsync(It.IsAny<PayrollTalukaMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollTalukaMasterEntity, CancellationToken>((e, _) => { e.Id = 20; saved = e; })
            .ReturnsAsync((PayrollTalukaMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(20, result.Id);
        Assert.Equal(514, saved!.CreatedBy);
        Assert.Equal(514, createDto.CreatedBy);
    }

    [Fact]
    public async Task UpdateAsync_Deactivate_WhenActiveVillagesExist_ThrowsValidationException()
    {
        var taluka = new PayrollTalukaMasterEntity { Id = 20, DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = true };
        _talukaRepoMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(taluka);

        var districts = new List<PayrollDistrictMasterEntity>
        {
            new() { Id = 1, DistrictCode = "PUN", DistrictName = "Pune", IsActive = true }
        }.BuildMock();
        _districtRepoMock.Setup(r => r.GetQueryable()).Returns(districts);

        var villages = new List<PayrollVillageMasterEntity>
        {
            new() { Id = 201, TalukaId = 20, VillageCode = "SHI", VillageName = "Shivane", IsActive = true }
        }.BuildMock();
        _villageRepoMock.Setup(r => r.GetQueryable()).Returns(villages);

        var updateDto = new UpdatePayrollTalukaMasterDto { DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = false };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(20, updateDto));
        Assert.Contains("This Taluka cannot be deactivated because it has active Villages.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenVillagesExist_ThrowsValidationException()
    {
        var taluka = new PayrollTalukaMasterEntity { Id = 20, DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = true };
        _talukaRepoMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(taluka);

        var villages = new List<PayrollVillageMasterEntity>
        {
            new() { Id = 201, TalukaId = 20, VillageCode = "SHI", VillageName = "Shivane", IsActive = false }
        }.BuildMock();
        _villageRepoMock.Setup(r => r.GetQueryable()).Returns(villages);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(20));
        Assert.Contains("This Taluka cannot be deleted because it has Villages.", ex.Message);
    }

    [Fact]
    public async Task DeleteAsync_WhenNoVillagesExist_CallsHardDelete_ReturnsTrue()
    {
        var taluka = new PayrollTalukaMasterEntity { Id = 20, DistrictId = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = true };
        _talukaRepoMock.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>())).ReturnsAsync(taluka);

        var villages = new List<PayrollVillageMasterEntity>().BuildMock();
        _villageRepoMock.Setup(r => r.GetQueryable()).Returns(villages);

        var result = await _service.DeleteAsync(20);

        Assert.True(result);
        _talukaRepoMock.Verify(r => r.HardDeleteAsync(taluka, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
