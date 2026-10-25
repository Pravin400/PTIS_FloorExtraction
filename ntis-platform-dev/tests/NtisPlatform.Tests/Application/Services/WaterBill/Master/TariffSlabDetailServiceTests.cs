using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.WaterBill.Master;
using NtisPlatform.Application.Services.WaterBill.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class TariffSlabDetailServiceTests
{
    private readonly Mock<IRepository<TariffSlabDetailEntity, long>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IRepository<TariffMasterEntity, long>> _mockTariffRepository;
    private readonly Mock<IRepository<GeographyUnitEntity, int>> _mockGeoRepository;
    private readonly TariffSlabDetailService _service;

    public TariffSlabDetailServiceTests()
    {
        _mockRepository = new Mock<IRepository<TariffSlabDetailEntity, long>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockTariffRepository = new Mock<IRepository<TariffMasterEntity, long>>();
        _mockGeoRepository = new Mock<IRepository<GeographyUnitEntity, int>>();

        _mockCurrentUserService.Setup(c => c.GetCurrentUserId()).Returns(1);

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TariffSlabDetailEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NtisPlatform.Application.Models.ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());

        _service = new TariffSlabDetailService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            _mockTariffRepository.Object,
            _mockGeoRepository.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesSuccessfully()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            FormulaCode = "UNIT_RATE"
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false };
        var entity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            FormulaCode = "UNIT_RATE",
            IsActive = true
        };
        var expectedDto = new TariffSlabDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            FormulaCode = "UNIT_RATE",
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<TariffSlabDetailEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(1L);
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_FlatRateFormulaCode_MapsToFixed()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 0,
            FixedCharge = 150m,
            FormulaCode = "FLAT_RATE"
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var entity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            FromUnit = 0,
            FixedCharge = 150m,
            FormulaCode = "FLAT_RATE",
            IsActive = true
        };
        var expectedDto = new TariffSlabDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            FromUnit = 0,
            FixedCharge = 150m,
            FormulaCode = "FIXED",
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockRepository.Setup(r => r.GetQueryable()).Returns(new List<TariffSlabDetailEntity>().BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        entity.FormulaCode.Should().Be("FIXED");
        _mockRepository.Verify(r => r.AddAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_OverlappingRange_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 50,
            ToUnit = 150,
            UnitRate = 20m,
            SortOrder = 2
        };

        var existingSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 10m,
            SortOrder = 1,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 50,
            ToUnit = 150,
            UnitRate = 20m,
            SortOrder = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("overlaps")));
    }

    [Fact]
    public async Task CreateAsync_AdjacentRange_AcceptsBoundary()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 100,
            ToUnit = 200,
            UnitRate = 25m,
            SortOrder = 2
        };

        var existingSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 10m,
            SortOrder = 1,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            Id = 20L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 100,
            ToUnit = 200,
            UnitRate = 25m,
            SortOrder = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(entity)).Returns(new TariffSlabDetailDto { Id = 20L });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(20L);
    }

    [Fact]
    public async Task CreateAsync_DuplicateSortOrder_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 100,
            ToUnit = 200,
            UnitRate = 20m,
            SortOrder = 1
        };

        var existingSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            SortOrder = 1,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 100,
            ToUnit = 200,
            UnitRate = 20m,
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("SortOrder 1 already exists")));
    }

    [Fact]
    public async Task CreateAsync_NullFromUnit_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = null,
            ToUnit = 100,
            UnitRate = 10m
        };

        var entity = new TariffSlabDetailEntity { TariffId = 1L, FromUnit = null, ToUnit = 100, UnitRate = 10m, IsActive = true };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("FromUnit is required")));
    }

    [Fact]
    public async Task CreateAsync_ToUnitLessThanFromUnit_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 100,
            ToUnit = 50,
            UnitRate = 10m
        };

        var entity = new TariffSlabDetailEntity { TariffId = 1L, FromUnit = 100, ToUnit = 50, UnitRate = 10m, IsActive = true };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("ToUnit cannot be less than FromUnit")));
    }

    [Fact]
    public async Task CreateAsync_OpenEndedSlabAllowedIfOnlyOne()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 100,
            ToUnit = null, // open-ended
            UnitRate = 30m,
            SortOrder = 2
        };

        var existingSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = null,
            FromUnit = 0,
            ToUnit = 100,
            SortOrder = 1,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            Id = 20L,
            TariffId = 1L,
            GeographyUnitId = null,
            FromUnit = 100,
            ToUnit = null,
            UnitRate = 30m,
            SortOrder = 2,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(entity)).Returns(new TariffSlabDetailDto { Id = 20L });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(20L);
    }

    [Fact]
    public async Task CreateAsync_MultipleOpenEndedSlabs_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 200,
            ToUnit = null,
            UnitRate = 40m,
            SortOrder = 3
        };

        var existingOpenSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = null,
            FromUnit = 100,
            ToUnit = null, // already open-ended
            SortOrder = 2,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = null,
            FromUnit = 200,
            ToUnit = null,
            UnitRate = 40m,
            SortOrder = 3,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingOpenSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("An open-ended slab (ToUnit = null) already exists")));
    }

    [Fact]
    public async Task CreateAsync_MixingGlobalAndSpecificGeography_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2, // Specific geography
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15m
        };

        var existingGlobalSlab = new TariffSlabDetailEntity
        {
            Id = 10L,
            TariffId = 1L,
            GeographyUnitId = null, // Global
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 10m,
            IsActive = true
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15m,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingGlobalSlab }.BuildMock());

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("Cannot mix geography-specific slabs with existing global slabs")));
    }

    [Fact]
    public async Task CreateAsync_InactiveTariff_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 10m
        };

        var entity = new TariffSlabDetailEntity { TariffId = 1L, FromUnit = 0, ToUnit = 100, UnitRate = 10m, IsActive = true };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, TariffCode = "TRF01", IsActive = false }); // Inactive!

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("Referenced Tariff 'TRF01' is inactive")));
    }

    [Fact]
    public async Task CreateAsync_DeletedGeographyUnit_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 5,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 10m
        };

        var entity = new TariffSlabDetailEntity { TariffId = 1L, GeographyUnitId = 5, FromUnit = 0, ToUnit = 100, UnitRate = 10m, IsActive = true };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 5, GeographyUnitName = "Sector 1", IsActive = true, MarkedForDeletion = true }); // Soft deleted!

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("marked for deletion")));
    }

    [Fact]
    public async Task CreateAsync_ZeroPricing_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 0m,
            FixedCharge = 0m,
            MinimumCharge = 0m,
            PerConnectionAmount = 0m
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 0m,
            FixedCharge = 0m,
            MinimumCharge = 0m,
            PerConnectionAmount = 0m,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });

        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(m => m.Contains("At least one pricing element")));
    }

    [Fact]
    public async Task UpdateAsync_ValidDto_UpdatesSuccessfully()
    {
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 1
        };
        var existingEntity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            SortOrder = 1,
            IsActive = true
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false };
        
        var expectedDto = new TariffSlabDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingEntity }.BuildMock());
        
        _mockMapper.Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateTariffSlabDetailDto src, TariffSlabDetailEntity dest) =>
            {
                dest.UnitRate = src.UnitRate.GetValueOrDefault();
            });
        
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        result!.UnitRate.Should().Be(20.0m);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_PreservesExistingSortOrder_WhenSortOrderIsZeroOrOmitted()
    {
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 0 // omitted / zero
        };
        var existingEntity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            SortOrder = 5, // existing sort order
            IsActive = true
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false };
        
        var expectedDto = new TariffSlabDetailDto
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 5,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingEntity }.BuildMock());
        
        _mockMapper.Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateTariffSlabDetailDto src, TariffSlabDetailEntity dest) =>
            {
                dest.UnitRate = src.UnitRate.GetValueOrDefault();
                dest.SortOrder = src.SortOrder;
            });
        
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        updateDto.SortOrder.Should().Be(5);
        result!.SortOrder.Should().Be(5);
    }

    [Fact]
    public async Task UpdateAsync_WhenTariffIdMismatch_ThrowsValidationExceptionAndRollsBack()
    {
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 2L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 1
        };
        var existingEntity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            SortOrder = 1,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey(nameof(UpdateTariffSlabDetailDto.TariffId)));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenDbUpdateConcurrencyExceptionOccurs_ThrowsValidationExceptionAndRollsBack()
    {
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 20.0m,
            SortOrder = 1
        };
        var existingEntity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 100,
            UnitRate = 15.5m,
            SortOrder = 1,
            IsActive = true
        };
        var tariffEntity = new TariffMasterEntity { Id = 1L, IsActive = true };
        var geoEntity = new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(tariffEntity);
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(geoEntity);
        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity> { existingEntity }.BuildMock());

        _mockMapper.Setup(m => m.Map(updateDto, existingEntity))
            .Callback((UpdateTariffSlabDetailDto src, TariffSlabDetailEntity dest) =>
            {
                dest.UnitRate = src.UnitRate.GetValueOrDefault();
            });

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException("Simulated concurrency conflict"));

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey(nameof(UpdateTariffSlabDetailDto.SortOrder)) &&
                         ex.Errors[nameof(UpdateTariffSlabDetailDto.SortOrder)].Contains("modified concurrently"));
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_UnsupportedFormulaCode_ThrowsValidationException()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            UnitRate = 10m,
            FormulaCode = "UNKNOWN_FORMULA",
            SortOrder = 1
        };
        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            UnitRate = 10m,
            FormulaCode = "UNKNOWN_FORMULA",
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey("FormulaCode") && ex.Errors["FormulaCode"].Contains("Invalid FormulaCode"));
    }

    [Theory]
    // UNIT_RATE: standard bounded slab, boundary min unit rate, open-ended slab (toUnitVal = -1.0), with optional min/max charges
    [InlineData("UNIT_RATE", 0.0, 50.0, 10.0, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE", 0.0, 50.0, 0.01, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE", 51.0, -1.0, 15.0, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE", 0.0, 50.0, 10.0, 0.0, 20.0, 100.0, 0.0)]
    // FIXED: standard bounded slab, boundary min fixed charge, open-ended slab, single-unit boundary range
    [InlineData("FIXED", 0.0, 100.0, 0.0, 100.0, 0.0, 0.0, 0.0)]
    [InlineData("FIXED", 0.0, 50.0, 0.0, 0.01, 0.0, 0.0, 0.0)]
    [InlineData("FIXED", 0.0, -1.0, 0.0, 50.0, 0.0, 0.0, 0.0)]
    [InlineData("FIXED", 10.0, 10.0, 0.0, 75.0, 0.0, 0.0, 0.0)]
    // UNIT_RATE_FIXED: standard bounded, boundary minimum values, open-ended slab, with min/max charges
    [InlineData("UNIT_RATE_FIXED", 0.0, 50.0, 10.0, 50.0, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE_FIXED", 0.0, 50.0, 0.01, 0.01, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE_FIXED", 51.0, -1.0, 8.5, 25.0, 0.0, 0.0, 0.0)]
    [InlineData("UNIT_RATE_FIXED", 0.0, 50.0, 5.0, 20.0, 30.0, 150.0, 0.0)]
    // SLAB_RATE: standard bounded, boundary min rate, single-unit boundary range, open-ended slab
    [InlineData("SLAB_RATE", 0.0, 50.0, 12.5, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("SLAB_RATE", 0.0, 50.0, 0.01, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("SLAB_RATE", 25.0, 25.0, 15.0, 0.0, 0.0, 0.0, 0.0)]
    [InlineData("SLAB_RATE", 100.0, -1.0, 20.0, 0.0, 0.0, 0.0, 0.0)]
    // PER_CONNECTION: standard bounded, boundary min amount, open-ended slab
    [InlineData("PER_CONNECTION", 0.0, 50.0, 0.0, 0.0, 0.0, 0.0, 25.0)]
    [InlineData("PER_CONNECTION", 0.0, 50.0, 0.0, 0.0, 0.0, 0.0, 0.01)]
    [InlineData("PER_CONNECTION", 0.0, -1.0, 0.0, 0.0, 0.0, 0.0, 15.0)]
    // MINIMUM_CHARGE: standard bounded, boundary min charge, boundary MaximumCharge == MinimumCharge, boundary MaximumCharge > MinimumCharge, open-ended
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, 75.0, 0.0, 0.0)]
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, 0.01, 0.0, 0.0)]
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, 50.0, 50.0, 0.0)]
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, 50.0, 150.0, 0.0)]
    [InlineData("MINIMUM_CHARGE", 0.0, -1.0, 0.0, 0.0, 60.0, 0.0, 0.0)]
    public async Task CreateAsync_SupportedFormulaCode_AcceptsAllSupportedFormulas(
        string formulaCode,
        double fromUnit,
        double toUnitVal,
        double unitRate,
        double fixedCharge,
        double minimumCharge,
        double maximumCharge,
        double perConnection)
    {
        decimal? toUnit = toUnitVal >= 0 ? (decimal)toUnitVal : null;
        decimal? unitRateDecimal = unitRate > 0 ? (decimal)unitRate : null;
        decimal? maxChargeDecimal = maximumCharge > 0 ? (decimal)maximumCharge : null;
        decimal? perConnDecimal = perConnection > 0 ? (decimal)perConnection : null;

        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = (decimal)fromUnit,
            ToUnit = toUnit,
            UnitRate = unitRateDecimal,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maxChargeDecimal,
            PerConnectionAmount = perConnDecimal,
            FormulaCode = formulaCode,
            SortOrder = 1
        };
        var entity = new TariffSlabDetailEntity
        {
            Id = 100L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = (decimal)fromUnit,
            ToUnit = toUnit,
            UnitRate = unitRateDecimal,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maxChargeDecimal,
            PerConnectionAmount = perConnDecimal,
            FormulaCode = formulaCode,
            SortOrder = 1,
            IsActive = true
        };
        var expectedDto = new TariffSlabDetailDto
        {
            Id = 100L,
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = (decimal)fromUnit,
            ToUnit = toUnit,
            UnitRate = unitRateDecimal,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maxChargeDecimal,
            PerConnectionAmount = perConnDecimal,
            FormulaCode = formulaCode.ToUpperInvariant(),
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffSlabDetailDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.FormulaCode.Should().Be(formulaCode.ToUpperInvariant());
        entity.FormulaCode.Should().Be(formulaCode.ToUpperInvariant());

        _mockRepository.Verify(r => r.AddAsync(
            It.Is<TariffSlabDetailEntity>(e =>
                e.TariffId == 1L &&
                e.FormulaCode == formulaCode.ToUpperInvariant() &&
                e.FromUnit == (decimal)fromUnit &&
                e.ToUnit == toUnit &&
                e.UnitRate == unitRateDecimal &&
                e.FixedCharge == (decimal)fixedCharge &&
                e.MinimumCharge == (decimal)minimumCharge &&
                e.MaximumCharge == maxChargeDecimal &&
                e.PerConnectionAmount == perConnDecimal),
            It.IsAny<CancellationToken>()),
            Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    // Missing mandatory fields:
    [InlineData("FIXED", 0.0, 0.0, 0.0, 0.0, 0.0, "FixedCharge")] // missing mandatory fixed charge
    [InlineData("UNIT_RATE", 0.0, 0.0, 0.0, 0.0, 0.0, "UnitRate")] // missing mandatory unit rate
    [InlineData("UNIT_RATE_FIXED", 10.0, 0.0, 0.0, 0.0, 0.0, "FixedCharge")] // missing mandatory fixed charge
    [InlineData("UNIT_RATE_FIXED", 0.0, 50.0, 0.0, 0.0, 0.0, "UnitRate")] // missing mandatory unit rate
    [InlineData("SLAB_RATE", 0.0, 0.0, 0.0, 0.0, 0.0, "UnitRate")] // missing mandatory unit rate
    [InlineData("PER_CONNECTION", 0.0, 0.0, 0.0, 0.0, 0.0, "PerConnectionAmount")] // missing mandatory per connection amount
    [InlineData("MINIMUM_CHARGE", 0.0, 0.0, 0.0, 0.0, 0.0, "MinimumCharge")] // missing mandatory minimum charge
    // Incompatible combinations:
    // FIXED rejects UnitRate, PerConnectionAmount, MinimumCharge, and MaximumCharge
    [InlineData("FIXED", 10.0, 100.0, 0.0, 0.0, 0.0, "UnitRate")]
    [InlineData("FIXED", 0.0, 100.0, 0.0, 0.0, 20.0, "PerConnectionAmount")]
    [InlineData("FIXED", 0.0, 100.0, 50.0, 0.0, 0.0, "MinimumCharge")]
    [InlineData("FIXED", 0.0, 100.0, 0.0, 50.0, 0.0, "MaximumCharge")]
    // UNIT_RATE rejects FixedCharge and PerConnectionAmount
    [InlineData("UNIT_RATE", 10.0, 50.0, 0.0, 0.0, 0.0, "FixedCharge")]
    [InlineData("UNIT_RATE", 10.0, 0.0, 0.0, 0.0, 25.0, "PerConnectionAmount")]
    // UNIT_RATE_FIXED rejects PerConnectionAmount
    [InlineData("UNIT_RATE_FIXED", 10.0, 50.0, 0.0, 0.0, 25.0, "PerConnectionAmount")]
    // SLAB_RATE rejects FixedCharge and PerConnectionAmount
    [InlineData("SLAB_RATE", 10.0, 50.0, 0.0, 0.0, 0.0, "FixedCharge")]
    [InlineData("SLAB_RATE", 10.0, 0.0, 0.0, 0.0, 20.0, "PerConnectionAmount")]
    // PER_CONNECTION rejects UnitRate, FixedCharge, MinimumCharge, and MaximumCharge
    [InlineData("PER_CONNECTION", 10.0, 0.0, 0.0, 0.0, 25.0, "UnitRate")]
    [InlineData("PER_CONNECTION", 0.0, 50.0, 0.0, 0.0, 25.0, "FixedCharge")]
    [InlineData("PER_CONNECTION", 0.0, 0.0, 50.0, 0.0, 25.0, "MinimumCharge")]
    [InlineData("PER_CONNECTION", 0.0, 0.0, 0.0, 50.0, 25.0, "MaximumCharge")]
    // MINIMUM_CHARGE rejects UnitRate, FixedCharge, and PerConnectionAmount
    [InlineData("MINIMUM_CHARGE", 10.0, 0.0, 50.0, 0.0, 0.0, "UnitRate")]
    [InlineData("MINIMUM_CHARGE", 0.0, 25.0, 50.0, 0.0, 0.0, "FixedCharge")]
    [InlineData("MINIMUM_CHARGE", 0.0, 0.0, 50.0, 0.0, 20.0, "PerConnectionAmount")]
    public async Task CreateAsync_IncompatibleOrMissingPricingForFormula_ThrowsValidationException(
        string formulaCode,
        double unitRate,
        double fixedCharge,
        double minimumCharge,
        double maximumCharge,
        double perConnection,
        string expectedErrorKey)
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            UnitRate = unitRate > 0 ? (decimal)unitRate : null,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maximumCharge > 0 ? (decimal)maximumCharge : null,
            PerConnectionAmount = perConnection > 0 ? (decimal)perConnection : null,
            FormulaCode = formulaCode,
            SortOrder = 1
        };
        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            UnitRate = unitRate > 0 ? (decimal)unitRate : null,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maximumCharge > 0 ? (decimal)maximumCharge : null,
            PerConnectionAmount = perConnection > 0 ? (decimal)perConnection : null,
            FormulaCode = formulaCode,
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey(expectedErrorKey));
    }

    [Theory]
    // Unit range boundary violations:
    [InlineData("UNIT_RATE", -1.0, 50.0, 10.0, 0.0, 0.0, 0.0, 0.0, "FromUnit")] // negative FromUnit
    [InlineData("UNIT_RATE", 0.0, -1.0, 10.0, 0.0, 0.0, 0.0, 0.0, "ToUnit")] // negative ToUnit
    [InlineData("UNIT_RATE", 50.0, 49.0, 10.0, 0.0, 0.0, 0.0, 0.0, "ToUnit")] // ToUnit < FromUnit boundary
    // Pricing amount boundary violations (negative values):
    [InlineData("UNIT_RATE", 0.0, 50.0, -5.0, 0.0, 0.0, 0.0, 0.0, "UnitRate")] // negative UnitRate
    [InlineData("FIXED", 0.0, 50.0, 0.0, -10.0, 0.0, 0.0, 0.0, "FixedCharge")] // negative FixedCharge
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, -5.0, 0.0, 0.0, "MinimumCharge")] // negative MinimumCharge
    [InlineData("PER_CONNECTION", 0.0, 50.0, 0.0, 0.0, 0.0, 0.0, -10.0, "PerConnectionAmount")] // negative PerConnectionAmount
    // Boundary condition: MaximumCharge < MinimumCharge
    [InlineData("MINIMUM_CHARGE", 0.0, 50.0, 0.0, 0.0, 50.0, 49.0, 0.0, "MaximumCharge")]
    [InlineData("UNIT_RATE", 0.0, 50.0, 10.0, 0.0, 50.0, 49.0, 0.0, "MaximumCharge")]
    public async Task CreateAsync_PricingAndUnitRangeBoundaryViolations_ThrowsValidationException(
        string formulaCode,
        double fromUnit,
        double toUnit,
        double unitRate,
        double fixedCharge,
        double minimumCharge,
        double maximumCharge,
        double perConnection,
        string expectedErrorKey)
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = (decimal)fromUnit,
            ToUnit = (decimal)toUnit,
            UnitRate = unitRate != 0.0 ? (decimal)unitRate : null,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maximumCharge > 0 ? (decimal)maximumCharge : null,
            PerConnectionAmount = perConnection != 0.0 ? (decimal)perConnection : null,
            FormulaCode = formulaCode,
            SortOrder = 1
        };
        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = (decimal)fromUnit,
            ToUnit = (decimal)toUnit,
            UnitRate = unitRate != 0.0 ? (decimal)unitRate : null,
            FixedCharge = (decimal)fixedCharge,
            MinimumCharge = (decimal)minimumCharge,
            MaximumCharge = maximumCharge > 0 ? (decimal)maximumCharge : null,
            PerConnectionAmount = perConnection != 0.0 ? (decimal)perConnection : null,
            FormulaCode = formulaCode,
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey(expectedErrorKey));
    }

    [Fact]
    public async Task GetAllAsync_SearchTermFixed_MatchesLegacyFlatRateRecords()
    {
        var legacySlab = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            FormulaCode = "FLAT_RATE",
            FromUnit = 0,
            FixedCharge = 100m,
            SortOrder = 1,
            IsActive = true
        };

        var slabList = new List<TariffSlabDetailEntity> { legacySlab };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(slabList.BuildMock());
        _mockMapper.Setup(m => m.Map<List<TariffSlabDetailDto>>(It.IsAny<List<TariffSlabDetailEntity>>()))
            .Returns((List<TariffSlabDetailEntity> src) => src.Select(s => new TariffSlabDetailDto
            {
                Id = s.Id,
                TariffId = s.TariffId,
                FormulaCode = "FIXED"
            }).ToList());

        var query = new TariffSlabDetailQueryParameters
        {
            SearchTerm = "fixed"
        };

        var result = await _service.GetAllAsync(query, CancellationToken.None);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle();
        result.Items.First().Id.Should().Be(1L);
    }

    [Fact]
    public async Task GetAllAsync_SearchTermFlat_MatchesFixedRecords()
    {
        var fixedSlab = new TariffSlabDetailEntity
        {
            Id = 2L,
            TariffId = 1L,
            FormulaCode = "FIXED",
            FromUnit = 0,
            FixedCharge = 100m,
            SortOrder = 1,
            IsActive = true
        };

        var slabList = new List<TariffSlabDetailEntity> { fixedSlab };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(slabList.BuildMock());
        _mockMapper.Setup(m => m.Map<List<TariffSlabDetailDto>>(It.IsAny<List<TariffSlabDetailEntity>>()))
            .Returns((List<TariffSlabDetailEntity> src) => src.Select(s => new TariffSlabDetailDto
            {
                Id = s.Id,
                TariffId = s.TariffId,
                FormulaCode = s.FormulaCode
            }).ToList());

        var query = new TariffSlabDetailQueryParameters
        {
            SearchTerm = "flat"
        };

        var result = await _service.GetAllAsync(query, CancellationToken.None);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle();
        result.Items.First().Id.Should().Be(2L);
    }

    [Theory]
    [InlineData("flatland")]
    [InlineData("deflation")]
    [InlineData("prefixed")]
    [InlineData("apartment_flat_102")]
    public async Task GetAllAsync_SearchTermWithUnrelatedCharacters_DoesNotMatchFixedOrFlatRate(string searchTerm)
    {
        var fixedSlab = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 10L,
            FormulaCode = "FIXED",
            FromUnit = 0,
            FixedCharge = 100m,
            SortOrder = 1,
            IsActive = true
        };
        var legacyFlatSlab = new TariffSlabDetailEntity
        {
            Id = 2L,
            TariffId = 10L,
            FormulaCode = "FLAT_RATE",
            FromUnit = 0,
            FixedCharge = 100m,
            SortOrder = 2,
            IsActive = true
        };

        var slabList = new List<TariffSlabDetailEntity> { fixedSlab, legacyFlatSlab };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(slabList.BuildMock());
        _mockMapper.Setup(m => m.Map<List<TariffSlabDetailDto>>(It.IsAny<List<TariffSlabDetailEntity>>()))
            .Returns((List<TariffSlabDetailEntity> src) => src.Select(s => new TariffSlabDetailDto
            {
                Id = s.Id,
                TariffId = s.TariffId,
                FormulaCode = s.FormulaCode
            }).ToList());

        var query = new TariffSlabDetailQueryParameters
        {
            SearchTerm = searchTerm
        };

        var result = await _service.GetAllAsync(query, CancellationToken.None);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(0);
        result.Items.Should().BeEmpty();
    }

    [Fact]
    public void WaterBillMappingProfile_MapsLegacyFlatRateToFixed()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<WaterBillMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var mapper = config.CreateMapper();

        // 1. Entity to Dto
        var entity = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 10L,
            FormulaCode = "FLAT_RATE"
        };
        var dto = mapper.Map<TariffSlabDetailDto>(entity);
        dto.FormulaCode.Should().Be("FIXED");

        // 2. CreateDto to Entity
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 10L,
            FormulaCode = "FLAT_RATE"
        };
        var createEntity = mapper.Map<TariffSlabDetailEntity>(createDto);
        createEntity.FormulaCode.Should().Be("FIXED");

        // 3. UpdateDto to Entity
        var updateDto = new UpdateTariffSlabDetailDto
        {
            TariffId = 10L,
            FormulaCode = "flat_rate"
        };
        var updateEntity = mapper.Map<TariffSlabDetailEntity>(updateDto);
        updateEntity.FormulaCode.Should().Be("FIXED");
    }

    #region Calculation-Level Regression Tests: FLAT_RATE vs FIXED

    [Theory]
    [InlineData(0.0, 50.0, 1)]
    [InlineData(1.0, 50.0, 1)]
    [InlineData(10.0, 50.0, 1)]
    [InlineData(25.5, 125.75, 2)]
    [InlineData(50.0, 500.0, 5)]
    [InlineData(100.0, 1500.0, 10)]
    [InlineData(1000.0, 0.01, 1)]
    [InlineData(50000.0, 99999.99, 20)]
    public void CalculateBillingAmount_LegacyFlatRateAndCanonicalFixed_ProduceIdenticalCalculationsAcrossConsumptionMatrix(
        double consumptionUnitsDbl,
        double fixedChargeDbl,
        int connectionCount)
    {
        var consumptionUnits = (decimal)consumptionUnitsDbl;
        var fixedCharge = (decimal)fixedChargeDbl;

        var legacyEntity = new TariffSlabDetailEntity
        {
            Id = 101L,
            TariffId = 1L,
            FormulaCode = "FLAT_RATE",
            FixedCharge = fixedCharge,
            FromUnit = 0,
            ToUnit = null,
            SortOrder = 1,
            IsActive = true
        };

        var canonicalEntity = new TariffSlabDetailEntity
        {
            Id = 102L,
            TariffId = 1L,
            FormulaCode = "FIXED",
            FixedCharge = fixedCharge,
            FromUnit = 0,
            ToUnit = null,
            SortOrder = 1,
            IsActive = true
        };

        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<WaterBillMappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        var mapper = config.CreateMapper();
        var mappedDto = mapper.Map<TariffSlabDetailDto>(legacyEntity);

        // Verify mapping canonicalizes legacy entity formula to FIXED
        mappedDto.FormulaCode.Should().Be("FIXED");

        // 1. Instance service calculations
        var legacyCalc = _service.CalculateBillingAmount(legacyEntity, consumptionUnits, connectionCount);
        var canonicalCalc = _service.CalculateBillingAmount(canonicalEntity, consumptionUnits, connectionCount);
        var mappedDtoCalc = _service.CalculateBillingAmount(mappedDto, consumptionUnits, connectionCount);

        // 2. Static calculations directly using formula strings
        var legacyStaticCalc = TariffSlabDetailService.CalculateBillingAmount(
            "FLAT_RATE", consumptionUnits, null, fixedCharge, null, connectionCount);
        var canonicalStaticCalc = TariffSlabDetailService.CalculateBillingAmount(
            "FIXED", consumptionUnits, null, fixedCharge, null, connectionCount);

        // Verification: Legacy FLAT_RATE and canonical FIXED yield EXACT same billing amount
        legacyCalc.Should().Be(fixedCharge);
        canonicalCalc.Should().Be(fixedCharge);
        mappedDtoCalc.Should().Be(fixedCharge);
        legacyStaticCalc.Should().Be(fixedCharge);
        canonicalStaticCalc.Should().Be(fixedCharge);

        legacyCalc.Should().Be(canonicalCalc);
        legacyCalc.Should().Be(mappedDtoCalc);
        legacyStaticCalc.Should().Be(canonicalStaticCalc);
    }

    [Fact]
    public void CalculateBillingAmount_LegacyFlatRate_IsInvariantUnderConsumptionChanges()
    {
        var slab = new TariffSlabDetailEntity
        {
            Id = 1L,
            TariffId = 1L,
            FormulaCode = "FLAT_RATE",
            FixedCharge = 250m,
            FromUnit = 0,
            ToUnit = null,
            IsActive = true
        };

        var consumptionLevels = new decimal[] { 0m, 1m, 15m, 50m, 100m, 500m, 1000m, 50000m, 1000000m };

        foreach (var units in consumptionLevels)
        {
            var calculatedAmount = _service.CalculateBillingAmount(slab, units);
            calculatedAmount.Should().Be(250m, "FLAT_RATE must never vary with consumption volume");
        }
    }

    [Fact]
    public void CalculateBillingAmount_CanonicalFixed_IsInvariantUnderConsumptionChanges()
    {
        var slab = new TariffSlabDetailEntity
        {
            Id = 2L,
            TariffId = 1L,
            FormulaCode = "FIXED",
            FixedCharge = 250m,
            FromUnit = 0,
            ToUnit = null,
            IsActive = true
        };

        var consumptionLevels = new decimal[] { 0m, 1m, 15m, 50m, 100m, 500m, 1000m, 50000m, 1000000m };

        foreach (var units in consumptionLevels)
        {
            var calculatedAmount = _service.CalculateBillingAmount(slab, units);
            calculatedAmount.Should().Be(250m, "FIXED must never vary with consumption volume");
        }
    }

    [Theory]
    [InlineData("FLAT_RATE")]
    [InlineData("flat_rate")]
    [InlineData("  FLAT_RATE  ")]
    [InlineData("FIXED")]
    [InlineData("fixed")]
    [InlineData("  fixed  ")]
    [InlineData("")]
    [InlineData(null)]
    public void CalculateBillingAmount_LegacyFlatRateCaseAndWhitespaceVariants_EvaluateIdenticallyToFixed(string? formulaCode)
    {
        const decimal fixedCharge = 175.50m;
        var amount = TariffSlabDetailService.CalculateBillingAmount(
            formulaCode,
            consumptionUnits: 150m,
            unitRate: null,
            fixedCharge: fixedCharge,
            perConnectionAmount: null,
            connectionCount: 3);

        amount.Should().Be(fixedCharge);
    }

    [Fact]
    public void CalculateBillingAmount_AllFormulas_CalculatesExpectedAmounts()
    {
        // 1. UNIT_RATE: 10 units @ 12.50 = 125.00
        TariffSlabDetailService.CalculateBillingAmount(
            "UNIT_RATE", consumptionUnits: 10m, unitRate: 12.50m, fixedCharge: 0m)
            .Should().Be(125.00m);

        // 1b. UNIT_RATE with minimum charge clamping: 2 units @ 10 = 20, min charge = 50 -> 50.00
        TariffSlabDetailService.CalculateBillingAmount(
            "UNIT_RATE", consumptionUnits: 2m, unitRate: 10m, fixedCharge: 0m, minimumCharge: 50m)
            .Should().Be(50.00m);

        // 1c. UNIT_RATE with maximum charge clamping: 20 units @ 10 = 200, max charge = 150 -> 150.00
        TariffSlabDetailService.CalculateBillingAmount(
            "UNIT_RATE", consumptionUnits: 20m, unitRate: 10m, fixedCharge: 0m, maximumCharge: 150m)
            .Should().Be(150.00m);

        // 2. FIXED: ignores 200 units, returns fixedCharge = 75.00
        TariffSlabDetailService.CalculateBillingAmount(
            "FIXED", consumptionUnits: 200m, unitRate: null, fixedCharge: 75m)
            .Should().Be(75.00m);

        // 2b. FLAT_RATE: ignores 200 units, returns fixedCharge = 75.00 (identical to FIXED)
        TariffSlabDetailService.CalculateBillingAmount(
            "FLAT_RATE", consumptionUnits: 200m, unitRate: null, fixedCharge: 75m)
            .Should().Be(75.00m);

        // 3. UNIT_RATE_FIXED: 10 units @ 10 + 40 fixed = 140.00
        TariffSlabDetailService.CalculateBillingAmount(
            "UNIT_RATE_FIXED", consumptionUnits: 10m, unitRate: 10m, fixedCharge: 40m)
            .Should().Be(140.00m);

        // 4. PER_CONNECTION: 4 connections @ 60 = 240.00
        TariffSlabDetailService.CalculateBillingAmount(
            "PER_CONNECTION", consumptionUnits: 50m, unitRate: null, fixedCharge: 0m, perConnectionAmount: 60m, connectionCount: 4)
            .Should().Be(240.00m);

        // 5. MINIMUM_CHARGE: max(3 * 10 = 30, min charge = 80) = 80.00
        TariffSlabDetailService.CalculateBillingAmount(
            "MINIMUM_CHARGE", consumptionUnits: 3m, unitRate: 10m, fixedCharge: 0m, minimumCharge: 80m)
            .Should().Be(80.00m);

        // 6. SLAB_RATE: 15 units @ 8 = 120.00
        TariffSlabDetailService.CalculateBillingAmount(
            "SLAB_RATE", consumptionUnits: 15m, unitRate: 8m, fixedCharge: 0m)
            .Should().Be(120.00m);
    }

    [Theory]
    [InlineData("FLAT_RATE", 10.0, 0.0, 0.0, 0.0, "UnitRate")]             // rejects UnitRate
    [InlineData("FLAT_RATE", 0.0, 25.0, 0.0, 0.0, "PerConnectionAmount")]  // rejects PerConnectionAmount
    [InlineData("FLAT_RATE", 0.0, 0.0, 15.0, 0.0, "MinimumCharge")]        // rejects MinimumCharge
    [InlineData("FLAT_RATE", 0.0, 0.0, 0.0, 50.0, "MaximumCharge")]        // rejects MaximumCharge
    public async Task CreateAsync_FlatRateFormulaCode_RejectsIncompatiblePricingCombinationsIdenticallyToFixed(
        string formulaCode,
        double unitRateDbl,
        double perConnectionDbl,
        double minimumChargeDbl,
        double maximumChargeDbl,
        string expectedErrorField)
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            FixedCharge = 100m,
            UnitRate = unitRateDbl > 0 ? (decimal)unitRateDbl : null,
            PerConnectionAmount = perConnectionDbl > 0 ? (decimal)perConnectionDbl : null,
            MinimumCharge = (decimal)minimumChargeDbl,
            MaximumCharge = maximumChargeDbl > 0 ? (decimal)maximumChargeDbl : null,
            FormulaCode = formulaCode,
            SortOrder = 1
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            FixedCharge = 100m,
            UnitRate = unitRateDbl > 0 ? (decimal)unitRateDbl : null,
            PerConnectionAmount = perConnectionDbl > 0 ? (decimal)perConnectionDbl : null,
            MinimumCharge = (decimal)minimumChargeDbl,
            MaximumCharge = maximumChargeDbl > 0 ? (decimal)maximumChargeDbl : null,
            FormulaCode = formulaCode,
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey(expectedErrorField));
    }

    [Fact]
    public async Task CreateAsync_FlatRateFormulaCode_MissingFixedCharge_ThrowsValidationExceptionIdenticallyToFixed()
    {
        var createDto = new CreateTariffSlabDetailDto
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            FixedCharge = 0m, // Invalid for FIXED / FLAT_RATE
            FormulaCode = "FLAT_RATE",
            SortOrder = 1
        };

        var entity = new TariffSlabDetailEntity
        {
            TariffId = 1L,
            GeographyUnitId = 2,
            FromUnit = 0,
            ToUnit = 50,
            FixedCharge = 0m,
            FormulaCode = "FLAT_RATE",
            SortOrder = 1,
            IsActive = true
        };

        _mockTariffRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TariffMasterEntity { Id = 1L, IsActive = true });
        _mockGeoRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GeographyUnitEntity { Id = 2, IsActive = true, MarkedForDeletion = false });
        _mockRepository.Setup(r => r.GetQueryable())
            .Returns(new List<TariffSlabDetailEntity>().BuildMock());
        _mockMapper.Setup(m => m.Map<TariffSlabDetailEntity>(createDto)).Returns(entity);

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.ContainsKey("FixedCharge"));
    }

    #endregion
}
