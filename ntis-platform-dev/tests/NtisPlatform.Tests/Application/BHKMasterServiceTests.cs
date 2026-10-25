using AutoMapper;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Master.BHKMaster;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using ValidationResult = NtisPlatform.Application.Models.ValidationResult;

namespace NtisPlatform.Tests.Application;

public class BHKMasterServiceTests
{
    private readonly Mock<IRepository<BHKMasterEntity, int>> _mockRepository = new();
    private readonly Mock<IUnitOfWork> _mockUnitOfWork = new();
    private readonly Mock<IMapper> _mockMapper = new();
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator = new();
    private readonly BHKMasterService _service;

    public BHKMasterServiceTests()
    {
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new BHKMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockReferenceValidator.Object);
    }

    private static BHKMasterEntity Entity(int id, string code, bool active = true) => new()
    {
        Id = id,
        BHKCode = code,
        BHKName = code,
        IsActive = active
    };

    private void SetupQueryable(params BHKMasterEntity[] entities)
        => _mockRepository.Setup(r => r.GetQueryable()).Returns(entities.BuildMock());

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var entity = Entity(1, "1BHK");
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<BHKMasterDto>(entity)).Returns(new BHKMasterDto { Id = 1, BHKCode = "1BHK" });

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("1BHK", result!.BHKCode);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((BHKMasterEntity?)null);

        Assert.Null(await _service.GetByIdAsync(99));
    }

    [Fact]
    public async Task CreateAsync_UniqueCode_Succeeds()
    {
        SetupQueryable(Entity(1, "1BHK"));
        var dto = new CreateBHKMasterDto { BHKCode = "2BHK", BHKName = "2 BHK" };
        var entity = Entity(0, "2BHK");
        _mockMapper.Setup(m => m.Map<BHKMasterEntity>(dto)).Returns(entity);
        _mockMapper.Setup(m => m.Map<BHKMasterDto>(entity)).Returns(new BHKMasterDto { BHKCode = "2BHK" });

        var result = await _service.CreateAsync(dto);

        Assert.Equal("2BHK", result.BHKCode);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateActiveCode_ThrowsValidationException()
    {
        SetupQueryable(Entity(1, "1BHK"));
        var dto = new CreateBHKMasterDto { BHKCode = "1BHK", BHKName = "1 BHK" };
        _mockMapper.Setup(m => m.Map<BHKMasterEntity>(dto)).Returns(Entity(0, "1BHK"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<BHKMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCodeOfInactiveRow_ThrowsValidationException()
    {
        // UX_BHKMaster_BHKCode is not filtered, so an inactive row still owns its code.
        SetupQueryable(Entity(1, "1BHK", active: false));
        var dto = new CreateBHKMasterDto { BHKCode = "1BHK", BHKName = "1 BHK" };
        _mockMapper.Setup(m => m.Map<BHKMasterEntity>(dto)).Returns(Entity(0, "1BHK"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(dto));
    }

    [Fact]
    public async Task UpdateAsync_ChangingCodeToExistingOne_ThrowsValidationException()
    {
        var existing = Entity(2, "2BHK");
        SetupQueryable(Entity(1, "1BHK"), existing);
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockMapper.Setup(m => m.Map(It.IsAny<UpdateBHKMasterDto>(), existing))
            .Callback<UpdateBHKMasterDto, BHKMasterEntity>((d, e) => e.BHKCode = d.BHKCode)
            .Returns(existing);

        var dto = new UpdateBHKMasterDto { BHKCode = "1BHK", BHKName = "2 BHK", IsActive = true };

        await Assert.ThrowsAsync<ValidationException>(() => _service.UpdateAsync(2, dto));
    }

    [Fact]
    public async Task UpdateAsync_KeepingOwnCode_Succeeds()
    {
        var existing = Entity(2, "2BHK");
        SetupQueryable(Entity(1, "1BHK"), existing);
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockMapper.Setup(m => m.Map(It.IsAny<UpdateBHKMasterDto>(), existing)).Returns(existing);
        _mockMapper.Setup(m => m.Map<BHKMasterDto>(existing)).Returns(new BHKMasterDto { Id = 2, BHKCode = "2BHK" });

        var result = await _service.UpdateAsync(2, new UpdateBHKMasterDto { BHKCode = "2BHK", BHKName = "2 BHK", IsActive = true });

        Assert.NotNull(result);
        _mockReferenceValidator.Verify(v => v.ValidateReferencesAsync<BHKMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingReferencedBHK_ThrowsValidationException()
    {
        var existing = Entity(2, "2BHK");
        SetupQueryable(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockMapper.Setup(m => m.Map(It.IsAny<UpdateBHKMasterDto>(), existing))
            .Callback<UpdateBHKMasterDto, BHKMasterEntity>((d, e) => e.IsActive = d.IsActive)
            .Returns(existing);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<BHKMasterEntity>(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate: referenced by Property Details."));

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(2, new UpdateBHKMasterDto { BHKCode = "2BHK", BHKName = "2 BHK", IsActive = false }));
    }

    [Fact]
    public async Task DeleteAsync_ReferencedBHK_ThrowsValidationException()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(Entity(2, "2BHK"));
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<BHKMasterEntity>(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced by Property Details."));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(2));
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<BHKMasterEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_UnreferencedBHK_Succeeds()
    {
        var entity = Entity(2, "2BHK");
        _mockRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<BHKMasterEntity>(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        Assert.True(await _service.DeleteAsync(2));
    }
}
