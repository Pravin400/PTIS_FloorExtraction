using AutoMapper;
using FluentAssertions;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Master.WaterBill;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.Services.WaterBill.Master.TariffMaster;

public class TariffMasterServiceTests
{
    private readonly Mock<IRepository<TariffMasterEntity, long>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IReferenceValidationService> _mockRefValidationService;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockYearRepository;
    private readonly Mock<IRepository<ConnectionTypeMasterEntity, int>> _mockConnectionTypeRepository;
    private readonly Mock<IRepository<ConnectionCategoryMasterEntity, int>> _mockConnectionCategoryRepository;
    private readonly Mock<IRepository<TapSizeMasterEntity, int>> _mockTapSizeRepository;
    private readonly TariffMasterService _service;

    public TariffMasterServiceTests()
    {
        _mockRepository = new Mock<IRepository<TariffMasterEntity, long>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockMapper = new Mock<IMapper>();
        _mockRefValidationService = new Mock<IReferenceValidationService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockYearRepository = new Mock<IRepository<YearMasterEntity, int>>();
        _mockConnectionTypeRepository = new Mock<IRepository<ConnectionTypeMasterEntity, int>>();
        _mockConnectionCategoryRepository = new Mock<IRepository<ConnectionCategoryMasterEntity, int>>();
        _mockTapSizeRepository = new Mock<IRepository<TapSizeMasterEntity, int>>();

        _mockCurrentUserService.Setup(u => u.GetCurrentUserId()).Returns(1);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TariffMasterEntity>(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        _mockRepository
            .Setup(r => r.GetQueryable())
            .Returns(new List<TariffMasterEntity>().BuildMock());

        _mockYearRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new YearMasterEntity { Id = 1, YearCode = "FY2025-26", Year = 2025, IsActive = true });

        _mockConnectionTypeRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ConnectionTypeMasterEntity { Id = 1, ConnectionTypeCode = "RES", ConnectionType = "Residential", IsActive = true });

        _mockConnectionCategoryRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ConnectionCategoryMasterEntity { Id = 1, ConnectionCategoryCode = "CAT1", ConnectionCategory = "Domestic Category", IsActive = true });

        _mockTapSizeRepository
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TapSizeMasterEntity { Id = 1, TapSizeCode = "15MM", TapSize = "15 mm", IsActive = true });

        _service = new TariffMasterService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mockMapper.Object,
            _mockRefValidationService.Object,
            _mockCurrentUserService.Object,
            _mockYearRepository.Object,
            _mockConnectionTypeRepository.Object,
            _mockConnectionCategoryRepository.Object,
            _mockTapSizeRepository.Object);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        var entity = new TariffMasterEntity
        {
            Id = 1,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };
        var expectedDto = new TariffMasterDto { Id = 1, TariffCode = "TRF01" };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffMasterDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.TariffCode.Should().Be("TRF01");
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_InvalidYearIdZero_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 0,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 0, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("YearId must be greater than 0")));
    }

    [Fact]
    public async Task CreateAsync_NonExistingYear_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 999,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        _mockYearRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterEntity?)null);

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 999, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("Year with ID 999 does not exist")));
    }

    [Fact]
    public async Task CreateAsync_InactiveYear_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 2,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        _mockYearRepository
            .Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new YearMasterEntity { Id = 2, YearCode = "FY2024-25", Year = 2024, IsActive = false });

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 2, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("inactive")));
    }

    [Fact]
    public async Task CreateAsync_InvalidConnectionTypeId_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 999,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        _mockConnectionTypeRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionTypeMasterEntity?)null);

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 1, ConnectionTypeId = 999, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("Connection Type with ID 999 does not exist")));
    }

    [Fact]
    public async Task CreateAsync_InvalidConnectionCategoryId_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 999,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today
        };

        _mockConnectionCategoryRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConnectionCategoryMasterEntity?)null);

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 1, ConnectionTypeId = 1, ConnectionCategoryId = 999, TapSizeId = 1, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("Connection Category with ID 999 does not exist")));
    }

    [Fact]
    public async Task CreateAsync_InvalidTapSizeId_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 999,
            EffectiveFrom = DateTime.Today
        };

        _mockTapSizeRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TapSizeMasterEntity?)null);

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity { TariffCode = "TRF01", TariffName = "Residential", YearId = 1, ConnectionTypeId = 1, ConnectionCategoryId = 1, TapSizeId = 999, EffectiveFrom = DateTime.Today });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("Tap Size with ID 999 does not exist")));
    }

    [Fact]
    public async Task CreateAsync_EffectiveToBeforeEffectiveFrom_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = DateTime.Today.AddDays(-1)
        };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = DateTime.Today.AddDays(-1)
        });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveTo cannot be earlier than EffectiveFrom")));
    }

    [Fact]
    public async Task CreateAsync_EffectiveFromBefore1900_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1899, 12, 31),
            EffectiveTo = new DateTime(1905, 1, 1)
        };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1899, 12, 31),
            EffectiveTo = new DateTime(1905, 1, 1)
        });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveFrom must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task CreateAsync_EffectiveFromAfter2100_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2101, 1, 1),
            EffectiveTo = new DateTime(2105, 1, 1)
        };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2101, 1, 1),
            EffectiveTo = new DateTime(2105, 1, 1)
        });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveFrom must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task CreateAsync_EffectiveToAfter2100_ThrowsValidationException()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2025, 1, 1),
            EffectiveTo = new DateTime(2101, 1, 1)
        };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(new TariffMasterEntity
        {
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2025, 1, 1),
            EffectiveTo = new DateTime(2101, 1, 1)
        });

        var act = () => _service.CreateAsync(createDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveTo must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task CreateAsync_AcceptedBoundaryDates_Success()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF_BOUND",
            TariffName = "Residential Boundary",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1900, 1, 1),
            EffectiveTo = new DateTime(2100, 12, 31),
            IsActive = true
        };

        var entity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF_BOUND",
            TariffName = "Residential Boundary",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1900, 1, 1),
            EffectiveTo = new DateTime(2100, 12, 31),
            IsActive = true
        };
        var expectedDto = new TariffMasterDto { Id = 1L, TariffCode = "TRF_BOUND" };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffMasterDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.TariffCode.Should().Be("TRF_BOUND");
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_NullEffectiveTo_Success()
    {
        var createDto = new CreateTariffMasterDto
        {
            TariffCode = "TRF_OPEN",
            TariffName = "Residential Open Ended",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = null,
            IsActive = true
        };

        var entity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF_OPEN",
            TariffName = "Residential Open Ended",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = null,
            IsActive = true
        };
        var expectedDto = new TariffMasterDto { Id = 1L, TariffCode = "TRF_OPEN" };

        _mockMapper.Setup(m => m.Map<TariffMasterEntity>(createDto)).Returns(entity);
        _mockRepository.Setup(r => r.AddAsync(entity, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        _mockMapper.Setup(m => m.Map<TariffMasterDto>(entity)).Returns(expectedDto);

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        result.Should().NotBeNull();
        result.TariffCode.Should().Be("TRF_OPEN");
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_EffectiveFromBefore1900_ThrowsValidationException()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1899, 12, 31),
            EffectiveTo = new DateTime(1905, 1, 1),
            IsActive = true
        };

        var existingEntity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
                dest.EffectiveTo = src.EffectiveTo;
            });

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveFrom must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task UpdateAsync_EffectiveFromAfter2100_ThrowsValidationException()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2101, 1, 1),
            EffectiveTo = new DateTime(2105, 1, 1),
            IsActive = true
        };

        var existingEntity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
                dest.EffectiveTo = src.EffectiveTo;
            });

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveFrom must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task UpdateAsync_EffectiveToAfter2100_ThrowsValidationException()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(2025, 1, 1),
            EffectiveTo = new DateTime(2101, 1, 1),
            IsActive = true
        };

        var existingEntity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
                dest.EffectiveTo = src.EffectiveTo;
            });

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .Where(ex => ex.Errors.Values.Any(msg => msg.Contains("EffectiveTo must be between 01 Jan 1900 and 31 Dec 2100")));
    }

    [Fact]
    public async Task UpdateAsync_AcceptedBoundaryDates_Success()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Boundary Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = new DateTime(1900, 1, 1),
            EffectiveTo = new DateTime(2100, 12, 31),
            IsActive = true
        };

        var existingEntity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
                dest.EffectiveTo = src.EffectiveTo;
            });

        var expectedDto = new TariffMasterDto { Id = 1L, TariffCode = "TRF01" };
        _mockMapper.Setup(m => m.Map<TariffMasterDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NullEffectiveTo_Success()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Open Ended Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = null,
            IsActive = true
        };

        var existingEntity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF01",
            TariffName = "Residential",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            EffectiveTo = DateTime.Today.AddYears(1),
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
                dest.EffectiveTo = src.EffectiveTo;
            });

        var expectedDto = new TariffMasterDto { Id = 1L, TariffCode = "TRF01" };
        _mockMapper.Setup(m => m.Map<TariffMasterDto>(existingEntity)).Returns(expectedDto);

        var result = await _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        result.Should().NotBeNull();
        existingEntity.EffectiveTo.Should().BeNull();
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_LoadsNavigations_ReturnsDtoWithAllRelatedNames()
    {
        var year = new YearMasterEntity { Id = 1, YearCode = "FY2025-26", Year = 2025 };
        var connType = new ConnectionTypeMasterEntity { Id = 1, ConnectionTypeCode = "RES", ConnectionType = "Residential" };
        var connCategory = new ConnectionCategoryMasterEntity { Id = 1, ConnectionCategoryCode = "CAT1", ConnectionCategory = "Domestic Category" };
        var tapSize = new TapSizeMasterEntity { Id = 1, TapSizeCode = "15MM", TapSize = "15 mm" };

        var entity = new TariffMasterEntity
        {
            Id = 10,
            TariffCode = "TRF10",
            TariffName = "Test Tariff",
            YearId = 1,
            Year = year,
            ConnectionTypeId = 1,
            ConnectionType = connType,
            ConnectionCategoryId = 1,
            ConnectionCategory = connCategory,
            TapSizeId = 1,
            TapSize = tapSize
        };

        var queryList = new List<TariffMasterEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(queryList.BuildMock());

        var expectedDto = new TariffMasterDto
        {
            Id = 10,
            TariffCode = "TRF10",
            FinancialYear = "FY2025-26",
            ConnectionTypeName = "Residential",
            ConnectionCategoryName = "Domestic Category",
            TapSizeName = "15 mm"
        };

        _mockMapper.Setup(m => m.Map<TariffMasterDto>(It.IsAny<TariffMasterEntity>())).Returns(expectedDto);

        var result = await _service.GetByIdAsync(10, CancellationToken.None);

        result.Should().NotBeNull();
        result!.FinancialYear.Should().Be("FY2025-26");
        result.ConnectionTypeName.Should().Be("Residential");
        result.ConnectionCategoryName.Should().Be("Domestic Category");
        result.TapSizeName.Should().Be("15 mm");
    }

    [Fact]
    public async Task UpdateAsync_DeactivationWithReferences_ThrowsValidationException()
    {
        var updateDto = new UpdateTariffMasterDto
        {
            TariffCode = "TRF01",
            TariffName = "Residential Updated",
            FinancialYearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            IsActive = false
        };

        var existingEntity = new TariffMasterEntity { Id = 1L, TariffCode = "TRF01", TariffName = "Residential", YearId = 1, ConnectionTypeId = 1, ConnectionCategoryId = 1, TapSizeId = 1, EffectiveFrom = DateTime.Today, IsActive = true };

        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);

        _mockMapper.Setup(m => m.Map(updateDto, It.IsAny<TariffMasterEntity>()))
            .Callback<UpdateTariffMasterDto, TariffMasterEntity>((src, dest) =>
            {
                dest.IsActive = src.IsActive;
                dest.TariffCode = src.TariffCode;
                dest.TariffName = src.TariffName;
                dest.YearId = src.FinancialYearId;
                dest.ConnectionTypeId = src.ConnectionTypeId;
                dest.ConnectionCategoryId = src.ConnectionCategoryId;
                dest.TapSizeId = src.TapSizeId;
                dest.EffectiveFrom = src.EffectiveFrom;
            });

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TariffMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot deactivate this TariffMaster because it is referenced."));

        var act = () => _service.UpdateAsync(1L, updateDto, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*referenced*");
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var entity = new TariffMasterEntity { Id = 1L, TariffCode = "TRF01", TariffName = "Residential" };
        _mockRepository.Setup(r => r.GetByIdAsync(1L, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        _mockRefValidationService
            .Setup(r => r.ValidateReferencesAsync<TariffMasterEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete this TariffMaster because it is referenced."));

        var act = () => _service.DeleteAsync(1L, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*referenced*");
    }

    [Fact]
    public async Task GetAllAsync_WithMultipleSlabs_MapsSlabsCountAccurately()
    {
        var entity = new TariffMasterEntity
        {
            Id = 1L,
            TariffCode = "TRF_MULTI",
            TariffName = "Multi Slab Tariff",
            YearId = 1,
            ConnectionTypeId = 1,
            ConnectionCategoryId = 1,
            TapSizeId = 1,
            EffectiveFrom = DateTime.Today,
            Slabs = new List<TariffSlabDetailEntity>
            {
                new() { Id = 1L, TariffId = 1L, FromUnit = 0, ToUnit = 100, UnitRate = 10, IsActive = true },
                new() { Id = 2L, TariffId = 1L, FromUnit = 100, ToUnit = 200, UnitRate = 20, IsActive = true },
                new() { Id = 3L, TariffId = 1L, FromUnit = 200, ToUnit = 300, UnitRate = 30, IsActive = false } // inactive
            }
        };

        var queryList = new List<TariffMasterEntity> { entity };
        _mockRepository.Setup(r => r.GetQueryable()).Returns(queryList.BuildMock());

        var expectedDto = new TariffMasterDto
        {
            Id = 1L,
            TariffCode = "TRF_MULTI",
            TariffName = "Multi Slab Tariff",
            SlabsCount = 2 // only active slabs
        };

        _mockMapper.Setup(m => m.Map<List<TariffMasterDto>>(It.IsAny<List<TariffMasterEntity>>()))
            .Returns(new List<TariffMasterDto> { expectedDto });

        var result = await _service.GetAllAsync(new TariffMasterQueryParameters(), CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.Items.First().SlabsCount.Should().Be(2);
    }
}

