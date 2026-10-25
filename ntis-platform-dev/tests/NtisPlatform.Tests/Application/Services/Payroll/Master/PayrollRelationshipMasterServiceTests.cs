using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Payroll;
using NtisPlatform.Application.Services.Payroll.Master;
using NtisPlatform.Core.Entities.Payroll.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.Payroll.Master;

public class PayrollRelationshipMasterServiceTests
{
    private readonly Mock<IRepository<PayrollRelationshipMasterEntity, int>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly IMapper _mapper;
    private readonly PayrollRelationshipMasterService _service;

    public PayrollRelationshipMasterServiceTests()
    {
        _repositoryMock = new Mock<IRepository<PayrollRelationshipMasterEntity, int>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _currentUserServiceMock.Setup(u => u.GetCurrentUserId()).Returns(510);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<PayrollRelationshipMasterProfile>();
        }, NullLoggerFactory.Instance);
        _mapper = mapperConfig.CreateMapper();

        _service = new PayrollRelationshipMasterService(
            _repositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapper,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsDto()
    {
        var entity = new PayrollRelationshipMasterEntity { Id = 1, RelationshipCode = "SPOUSE", RelationshipName = "Spouse" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("SPOUSE", result!.RelationshipCode);
        Assert.Equal("Spouse", result.RelationshipName);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_SavesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var createDto = new CreatePayrollRelationshipMasterDto 
        { 
            RelationshipCode = "CHILD", 
            RelationshipName = "Child",
            CreatedBy = 999 // Spoofed
        };
        PayrollRelationshipMasterEntity? saved = null;

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<PayrollRelationshipMasterEntity>(), It.IsAny<CancellationToken>()))
            .Callback<PayrollRelationshipMasterEntity, CancellationToken>((e, _) => { e.Id = 100; saved = e; })
            .ReturnsAsync((PayrollRelationshipMasterEntity e, CancellationToken _) => e);

        var result = await _service.CreateAsync(createDto);

        Assert.NotNull(result);
        Assert.Equal(100, result.Id);
        Assert.Equal("CHILD", result.RelationshipCode);
        Assert.NotNull(saved);
        Assert.Equal(510, saved!.CreatedBy);
        Assert.Equal(510, createDto.CreatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesAndSetsAuditUser_IgnoresSpoofedUser()
    {
        var existing = new PayrollRelationshipMasterEntity { Id = 1, RelationshipCode = "SPOUSE", RelationshipName = "Spouse", CreatedBy = 10 };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdatePayrollRelationshipMasterDto 
        { 
            RelationshipCode = "SPOUSE", 
            RelationshipName = "Spouse / Partner",
            UpdatedBy = 999 // Spoofed
        };

        var result = await _service.UpdateAsync(1, updateDto);

        Assert.NotNull(result);
        Assert.Equal("Spouse / Partner", result!.RelationshipName);
        Assert.Equal(510, existing.UpdatedBy);
        Assert.Equal(510, updateDto.UpdatedBy);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DirectlyDeletesFromDatabase()
    {
        var existing = new PayrollRelationshipMasterEntity { Id = 1, RelationshipCode = "SPOUSE", RelationshipName = "Spouse" };
        _repositoryMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repositoryMock.Verify(r => r.HardDeleteAsync(existing, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
