using AutoMapper;
using FluentAssertions;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master.ChargeHeadMaster;

public class ChargeHeadMasterServiceTests
{
    private readonly Mock<IRepository<ChargeHeadMasterEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly ChargeHeadMasterService _service;

    public ChargeHeadMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<ChargeHeadMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();

        _mockCurrentUserService.Setup(u => u.GetCurrentUserId()).Returns(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ChargeHeadMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<ChargeHeadMasterEntity>().BuildMock());

        _service = new ChargeHeadMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = "Fixed",
            IsRefundable = false,
            IsActive = true
        };

        var entity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee" };
        var expectedDto = new ChargeHeadMasterDto { Id = 1, ChargeHeadCode = "CHG01", ChargeHeadName = "Water Connection Charge", ChargeType = "Fee" };

        _mockMapper.Setup(m => m.Map<ChargeHeadMasterEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<ChargeHeadMasterDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.ChargeHeadCode.Should().Be("CHG01");
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = "Fee"
        };

        var existingList = new List<ChargeHeadMasterEntity>
        {
            new() { Id = 2, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee" }
        };

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingList.BuildMock());
        _mockMapper.Setup(m => m.Map<ChargeHeadMasterEntity>(createDto)).Returns(new ChargeHeadMasterEntity { Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee" });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task CreateAsync_InvalidChargeType_ThrowsValidationException()
    {
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG02",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = "InvalidType"
        };

        _mockMapper.Setup(m => m.Map<ChargeHeadMasterEntity>(createDto)).Returns(new ChargeHeadMasterEntity { Code = "CHG02", Name = "Water Connection Charge", ChargeType = "InvalidType" });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task CreateAsync_BlankChargeType_ThrowsValidationException(string? chargeType)
    {
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG03",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = chargeType!
        };

        _mockMapper.Setup(m => m.Map<ChargeHeadMasterEntity>(createDto)).Returns(new ChargeHeadMasterEntity { Code = "CHG03", Name = "Water Connection Charge", ChargeType = chargeType! });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>();
    }

    [Theory]
    [InlineData("deposit")]
    [InlineData("FEE")]
    [InlineData("Tax")]
    [InlineData("cHaRgE")]
    [InlineData("PENALTY")]
    public async Task CreateAsync_CaseInsensitiveValidChargeType_Succeeds(string validChargeType)
    {
        var createDto = new CreateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG04",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = validChargeType,
            IsActive = true
        };

        var entity = new ChargeHeadMasterEntity { Id = 4, Code = "CHG04", Name = "Water Connection Charge", ChargeType = validChargeType };
        var expectedDto = new ChargeHeadMasterDto { Id = 4, ChargeHeadCode = "CHG04", ChargeHeadName = "Water Connection Charge", ChargeType = validChargeType };

        _mockMapper.Setup(m => m.Map<ChargeHeadMasterEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<ChargeHeadMasterDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.ChargeType.Should().Be(validChargeType);
    }

    [Fact]
    public async Task UpdateAsync_InvalidChargeType_ThrowsValidationException()
    {
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge Updated",
            ChargeType = "UnknownType",
            IsActive = true
        };

        var existingEntity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ChargeHeadMasterEntity>()))
            .Callback<UpdateChargeHeadMasterDto, ChargeHeadMasterEntity>((src, dest) =>
            {
                dest.Code = src.ChargeHeadCode;
                dest.Name = src.ChargeHeadName;
                dest.ChargeType = src.ChargeType;
            });

        var act = () => _service.UpdateAsync(1, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task UpdateAsync_ExistingId_UpdatesAndReturnsDto()
    {
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge Updated",
            ChargeType = "Fee",
            IsActive = true
        };

        var existingEntity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee", IsActive = true };
        var expectedDto = new ChargeHeadMasterDto { Id = 1, ChargeHeadCode = "CHG01", ChargeHeadName = "Water Connection Charge Updated", ChargeType = "Fee" };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockMapper.Setup(m => m.Map<ChargeHeadMasterDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        result!.ChargeHeadName.Should().Be("Water Connection Charge Updated");
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsNull()
    {
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge",
            ChargeType = "Fee"
        };

        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((ChargeHeadMasterEntity?)null);

        var result = await _service.UpdateAsync(999, updateDto, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_ReturnsTrue()
    {
        var entity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee" };
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockRepository.Setup(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_DeactivationWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateChargeHeadMasterDto
        {
            ChargeHeadCode = "CHG01",
            ChargeHeadName = "Water Connection Charge Updated",
            ChargeType = "Fee",
            IsActive = false
        };

        var existingEntity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge", ChargeType = "Fee", IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<ChargeHeadMasterEntity>()))
            .Callback<UpdateChargeHeadMasterDto, ChargeHeadMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.Code = src.ChargeHeadCode;
                dest.Name = src.ChargeHeadName;
                dest.ChargeType = src.ChargeType;
            });

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ChargeHeadMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate this ChargeHeadMaster because it is referenced."));

        var act = () => _service.UpdateAsync(1, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var entity = new ChargeHeadMasterEntity { Id = 1, Code = "CHG01", Name = "Water Connection Charge" };
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<ChargeHeadMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete this ChargeHeadMaster because it is referenced."));

        var act = () => _service.DeleteAsync(1, CancellationToken.None);

        await act.Should().ThrowAsync<NtisPlatform.Application.Exceptions.ValidationException>()
            .WithMessage("*referenced*");
    }
}
