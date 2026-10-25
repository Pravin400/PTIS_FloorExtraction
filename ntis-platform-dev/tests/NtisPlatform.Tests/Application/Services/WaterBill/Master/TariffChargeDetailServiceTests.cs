using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class TariffChargeDetailServiceTests
{
    private readonly Mock<IRepository<TariffChargeDetailEntity, long>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IRepository<TariffMasterEntity, long>> _mockTariffRepository;
    private readonly Mock<IRepository<ChargeHeadMasterEntity, int>> _mockChargeHeadRepository;
    private readonly Mock<IRepository<GeographyUnitEntity, int>> _mockGeoRepository;
    private readonly TariffChargeDetailService _service;

    public TariffChargeDetailServiceTests()
    {
        _mockRepository = new Mock<IRepository<TariffChargeDetailEntity, long>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockTariffRepository = new Mock<IRepository<TariffMasterEntity, long>>();
        _mockChargeHeadRepository = new Mock<IRepository<ChargeHeadMasterEntity, int>>();
        _mockGeoRepository = new Mock<IRepository<GeographyUnitEntity, int>>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TariffChargeDetailEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity>().BuildMock());

        _service = new TariffChargeDetailService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            _mockTariffRepository.Object,
            _mockChargeHeadRepository.Object,
            _mockGeoRepository.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 1
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var chargeHeadEntity = new ChargeHeadMasterEntity { Id = 2, Name = "Water Charge", IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 3, IsActive = true, MarkedForDeletion = false };

        var entity = new TariffChargeDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 1,
            IsActive = true
        };
        var expectedDto = new TariffChargeDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(chargeHeadEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<TariffChargeDetailEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(1L);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateActiveCharge_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 2
        };

        var existingCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 400.0m,
            SequenceNo = 1,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 2, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 3, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("An active charge for this Charge Head and Geography already exists")));
    }

    [Fact]
    public async Task CreateAsync_SpecificChargeWhenGlobalExists_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3, // specific geography
            Amount = 500.0m,
            SequenceNo = 2
        };

        var existingGlobalCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = null, // global
            Amount = 400.0m,
            SequenceNo = 1,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 2, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 3, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingGlobalCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("A global charge for this Charge Head already exists for this Tariff")));
    }

    [Fact]
    public async Task CreateAsync_GlobalChargeWhenSpecificExists_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = null, // global
            Amount = 500.0m,
            SequenceNo = 2
        };

        var existingSpecificCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3, // specific
            Amount = 400.0m,
            SequenceNo = 1,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = null,
            Amount = 500.0m,
            SequenceNo = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 2, IsActive = true });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingSpecificCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("Geography-specific charges for this Charge Head already exist for this Tariff")));
    }

    [Fact]
    public async Task CreateAsync_DuplicateSequenceNo_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 200m,
            SequenceNo = 1
        };

        var existingCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 1,
            Amount = 100m,
            SequenceNo = 1, // already has sequence 1
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 200m,
            SequenceNo = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("SequenceNo 1 already exists")));
    }

    [Fact]
    public async Task CreateAsync_DynamicWithNonZeroAmount_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            Amount = 150m, // Non-zero for dynamic!
            IsDynamic = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            Amount = 150m,
            IsDynamic = true,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 2, IsActive = true });

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("Dynamic charges must have Amount set to 0")));
    }

    [Fact]
    public async Task CreateAsync_InactiveChargeHead_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            Amount = 100m
        };

        var entity = new TariffChargeDetailEntity { TariffId = 1L, ChargeHeadId = 2, Amount = 100m, IsActive = true };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 2, Name = "Penalty", IsActive = false }); // Inactive!

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("Referenced Charge Head 'Penalty' is inactive")));
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        var updateDto = new UpdateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 600.0m,
            SequenceNo = 1
        };
        var existingEntity = new TariffChargeDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 500.0m,
            SequenceNo = 1,
            IsActive = true
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var chargeHeadEntity = new ChargeHeadMasterEntity { Id = 2, Name = "Water Charge", IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 3, IsActive = true, MarkedForDeletion = false };

        var expectedDto = new TariffChargeDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 3,
            Amount = 600.0m,
            SequenceNo = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(chargeHeadEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingEntity }.BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateTariffChargeDetailDto src, TariffChargeDetailEntity dest) =>
            {
                dest.Amount = src.Amount;
            });

        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        result!.Amount.Should().Be(600.0m);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_SequenceNoZero_AutomaticallyAllocatesNextSequenceNumber()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 0
        };

        var existingCharge1 = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 1,
            GeographyUnitId = 1,
            Amount = 100m,
            SequenceNo = 2,
            IsActive = true
        };
        var existingCharge2 = new TariffChargeDetailEntity
        {
            Id = 11L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 1,
            Amount = 150m,
            SequenceNo = 5,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 0, // Initialized without expected sequence
            IsActive = true
        };
        var expectedDto = new TariffChargeDetailDto
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 6,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });

        var existingList = new List<TariffChargeDetailEntity> { existingCharge1, existingCharge2 };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(existingList.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto))
            .Returns((CreateTariffChargeDetailDto dto) =>
            {
                entity.SequenceNo = dto.SequenceNo.GetValueOrDefault();
                return entity;
            });
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<TariffChargeDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffChargeDetailEntity e, CancellationToken _) => e);
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.SequenceNo.Should().Be(6);
        createDto.SequenceNo.Should().Be(6);
        entity.SequenceNo.Should().Be(6);
        _mockRepository.Verify(r => r.AddAsync(It.Is<TariffChargeDetailEntity>(e => e.SequenceNo == 6), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_SequenceNoOmitted_AutomaticallyAllocatesNextSequenceNumber()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m
            // SequenceNo is omitted (null)
        };

        var existingCharge1 = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 1,
            GeographyUnitId = 1,
            Amount = 100m,
            SequenceNo = 2,
            IsActive = true
        };
        var existingCharge2 = new TariffChargeDetailEntity
        {
            Id = 11L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 1,
            Amount = 150m,
            SequenceNo = 5,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 0, // Initialized without expected sequence
            IsActive = true
        };
        var expectedDto = new TariffChargeDetailDto
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 6,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });

        var existingList = new List<TariffChargeDetailEntity> { existingCharge1, existingCharge2 };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(existingList.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto))
            .Returns((CreateTariffChargeDetailDto dto) =>
            {
                entity.SequenceNo = dto.SequenceNo.GetValueOrDefault();
                return entity;
            });
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<TariffChargeDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffChargeDetailEntity e, CancellationToken _) => e);
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.SequenceNo.Should().Be(6);
        createDto.SequenceNo.Should().Be(6);
        entity.SequenceNo.Should().Be(6);
        _mockRepository.Verify(r => r.AddAsync(It.Is<TariffChargeDetailEntity>(e => e.SequenceNo == 6), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_SequenceNoOmitted_GlobalGeographyScope_AllocatesNextSequenceNumberForGlobalScope()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 4,
            GeographyUnitId = null, // Global scope
            Amount = 300m
            // SequenceNo is omitted (null)
        };

        var existingGlobalCharge1 = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 1,
            GeographyUnitId = null,
            Amount = 100m,
            SequenceNo = 3,
            IsActive = true
        };
        var existingSpecificCharge = new TariffChargeDetailEntity
        {
            Id = 11L,
            TariffId = 1L,
            ChargeHeadId = 2,
            GeographyUnitId = 1, // Specific geography with a higher sequence number
            Amount = 150m,
            SequenceNo = 10,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 4,
            GeographyUnitId = null,
            Amount = 300m,
            SequenceNo = 0, // Initialized without expected sequence
            IsActive = true
        };
        var expectedDto = new TariffChargeDetailDto
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 4,
            GeographyUnitId = null,
            Amount = 300m,
            SequenceNo = 4,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 4, IsActive = true });

        var existingList = new List<TariffChargeDetailEntity> { existingGlobalCharge1, existingSpecificCharge };
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(existingList.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto))
            .Returns((CreateTariffChargeDetailDto dto) =>
            {
                entity.SequenceNo = dto.SequenceNo.GetValueOrDefault();
                return entity;
            });
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<TariffChargeDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffChargeDetailEntity e, CancellationToken _) => e);
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.SequenceNo.Should().Be(4);
        createDto.SequenceNo.Should().Be(4);
        entity.SequenceNo.Should().Be(4);
        _mockRepository.Verify(r => r.AddAsync(It.Is<TariffChargeDetailEntity>(e => e.SequenceNo == 4 && e.GeographyUnitId == null), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_DuplicateSequenceNo_GlobalGeographyScope_ThrowsValidationException()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 4,
            GeographyUnitId = null, // Global scope
            Amount = 200m,
            SequenceNo = 2
        };

        var existingCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 1,
            GeographyUnitId = null,
            Amount = 100m,
            SequenceNo = 2, // already has sequence 2 in global scope
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 4,
            GeographyUnitId = null,
            Amount = 200m,
            SequenceNo = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 4, IsActive = true });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("SequenceNo 2 already exists for this Tariff and Geography scope")));
    }

    [Fact]
    public async Task CreateAsync_ExplicitDuplicateSequenceNo_OnConcurrentSave_ThrowsDbUpdateExceptionAndRollsBack()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 5 // Explicit manual sequence
        };

        var entity = new TariffChargeDetailEntity
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 5,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateException("Duplicate key violation on TariffChargeDetail SequenceNo index"));

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<DbUpdateException>();
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_ExplicitSequenceNo_WhenNoConflict_PreservesExplicitSequenceNumber()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 10 // Explicit sequence number
        };

        var existingCharge = new TariffChargeDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            ChargeHeadId = 1,
            GeographyUnitId = 1,
            Amount = 100m,
            SequenceNo = 2,
            IsActive = true
        };

        var entity = new TariffChargeDetailEntity
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 10,
            IsActive = true
        };
        var expectedDto = new TariffChargeDetailDto
        {
            Id = 12L,
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m,
            SequenceNo = 10,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });

        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffChargeDetailEntity> { existingCharge }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.SequenceNo.Should().Be(10);
        createDto.SequenceNo.Should().Be(10);
    }

    [Fact]
    public async Task CreateAsync_ConcurrentAutoSequence_RetriesOnDbUpdateExceptionAndSucceeds()
    {
        var createDto = new CreateTariffChargeDetailDto
        {
            TariffId = 1L,
            ChargeHeadId = 3,
            GeographyUnitId = 1,
            Amount = 250m
            // SequenceNo is omitted
        };

        var existingList = new List<TariffChargeDetailEntity>
        {
            new TariffChargeDetailEntity { Id = 10L, TariffId = 1L, ChargeHeadId = 1, GeographyUnitId = 1, SequenceNo = 2, IsActive = true }
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockChargeHeadRepository.Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ChargeHeadMasterEntity { Id = 3, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 1, IsActive = true, MarkedForDeletion = false });

        // First attempt reads existingList with max = 2 -> SequenceNo = 3.
        // SaveChanges throws DbUpdateException simulating concurrent insert of SequenceNo = 3.
        // In the catch/retry, existingList has SequenceNo = 3 added by the competing request, so next attempt reads max = 3 -> SequenceNo = 4 and succeeds.
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(() => existingList.BuildMock());

        var entityAttempt1 = new TariffChargeDetailEntity { Id = 12L, TariffId = 1L, ChargeHeadId = 3, GeographyUnitId = 1, Amount = 250m, SequenceNo = 0, IsActive = true };
        var entityAttempt2 = new TariffChargeDetailEntity { Id = 13L, TariffId = 1L, ChargeHeadId = 3, GeographyUnitId = 1, Amount = 250m, SequenceNo = 0, IsActive = true };
        var expectedDto = new TariffChargeDetailDto { Id = 13L, TariffId = 1L, ChargeHeadId = 3, GeographyUnitId = 1, Amount = 250m, SequenceNo = 4, IsActive = true };

        _mockMapper.Setup(m => m.Map<TariffChargeDetailEntity>(createDto))
            .Returns((CreateTariffChargeDetailDto dto) =>
            {
                if (dto.SequenceNo == 3)
                {
                    entityAttempt1.SequenceNo = dto.SequenceNo.GetValueOrDefault();
                    return entityAttempt1;
                }
                entityAttempt2.SequenceNo = dto.SequenceNo.GetValueOrDefault();
                return entityAttempt2;
            });
        _mockMapper.Setup(m => m.Map<TariffChargeDetailDto>(It.IsAny<TariffChargeDetailEntity>()))
            .Returns(expectedDto);

        var attempts = 0;
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                attempts++;
                if (attempts == 1)
                {
                    // Competing request inserted sequence 3 concurrently
                    existingList.Add(new TariffChargeDetailEntity { Id = 99L, TariffId = 1L, ChargeHeadId = 9, GeographyUnitId = 1, SequenceNo = 3, IsActive = true });
                    throw new DbUpdateException("Duplicate key violation on TariffChargeDetail SequenceNo index");
                }
                return Task.FromResult(1);
            });

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<TariffChargeDetailEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TariffChargeDetailEntity e, CancellationToken ct) => e);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.SequenceNo.Should().Be(4);
        createDto.SequenceNo.Should().Be(4);
        entityAttempt2.SequenceNo.Should().Be(4);
        _mockRepository.Verify(r => r.AddAsync(It.Is<TariffChargeDetailEntity>(e => e.SequenceNo == 4), It.IsAny<CancellationToken>()), Times.Once);
        attempts.Should().Be(2);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
