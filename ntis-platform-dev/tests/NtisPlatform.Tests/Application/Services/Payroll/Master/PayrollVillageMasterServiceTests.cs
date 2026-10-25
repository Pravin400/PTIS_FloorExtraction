using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollVillageMasterServiceTests
{
    private readonly Mock<IRepository<PayrollVillageMasterEntity, int>> _villageRepoMock;
    private readonly Mock<IRepository<PayrollTalukaMasterEntity, int>> _talukaRepoMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollVillageMasterService _service;

    public PayrollVillageMasterServiceTests()
    {
        _villageRepoMock = new Mock<IRepository<PayrollVillageMasterEntity, int>>();
        _talukaRepoMock = new Mock<IRepository<PayrollTalukaMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(515);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollVillageMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollVillageMasterService(
            _villageRepoMock.Object,
            _talukaRepoMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentTaluka_ThrowsValidationException()
    {
        var talukas = new List<PayrollTalukaMasterEntity>().BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var createDto = new CreatePayrollVillageMasterDto { TalukaId = 999, VillageCode = "SHI", VillageName = "Shivane" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("Taluka with ID 999 does not exist", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithInactiveTaluka_ThrowsValidationException()
    {
        var talukas = new List<PayrollTalukaMasterEntity>
        {
            new() { Id = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = false }
        }.BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var createDto = new CreatePayrollVillageMasterDto { TalukaId = 1, VillageCode = "SHI", VillageName = "Shivane" };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto));
        Assert.Contains("is inactive", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser()
    {
        var talukas = new List<PayrollTalukaMasterEntity>
        {
            new() { Id = 1, TalukaCode = "HAV", TalukaName = "Haveli", IsActive = true }
        }.BuildMock();
        _talukaRepoMock.Setup(r => r.GetQueryable()).Returns(talukas);

        var createDto = new CreatePayrollVillageMasterDto { TalukaId = 1, VillageCode = "SHI", VillageName = "Shivane", CreatedBy = 999 };
        PayrollVillageMasterEntity? saved = null;

        _villageRepoMock.Setup(r => r.AddAsync(It.IsAny<PayrollVillageMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollVillageMasterEntity, CancellationToken>((e, _) => { e.Id = 30; saved = e; })
            .ReturnsAsync((PayrollVillageMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(30, result.Id);
        Assert.Equal(515, saved!.CreatedBy);
        Assert.Equal(515, createDto.CreatedBy);
    }

    [Fact]
    public async Task DeleteAsync_CallsHardDelete_ReturnsTrue()
    {
        var village = new PayrollVillageMasterEntity { Id = 30, TalukaId = 1, VillageCode = "SHI", VillageName = "Shivane", IsActive = true };
        _villageRepoMock.Setup(r => r.GetByIdAsync(30, It.IsAny<CancellationToken>())).ReturnsAsync(village);

        var result = await _service.DeleteAsync(30);

        Assert.True(result);
        _villageRepoMock.Verify(r => r.HardDeleteAsync(village, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
