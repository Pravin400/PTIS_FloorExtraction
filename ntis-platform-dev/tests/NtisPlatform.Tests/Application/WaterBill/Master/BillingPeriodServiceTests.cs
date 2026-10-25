using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.WaterBill.Master;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;

namespace NtisPlatform.Tests.Application.WaterBill.Master;

public class BillingPeriodServiceTests
{
    private readonly Mock<IRepository<BillingPeriodEntity, int>> _mockRepository;
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockFinancialYearRepository;
    private readonly Mock<IRepository<BillingFrequencyMasterEntity, int>> _mockBillingFrequencyRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly BillingPeriodService _service;

    public BillingPeriodServiceTests()
    {
        _mockRepository = new Mock<IRepository<BillingPeriodEntity, int>>();
        _mockFinancialYearRepository = new Mock<IRepository<YearMasterEntity, int>>();
        _mockBillingFrequencyRepository = new Mock<IRepository<BillingFrequencyMasterEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        _mockUnitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<BillingPeriodEntity, BillingPeriodDto>()
                .ForMember(d => d.FinancialYear, opt => opt.MapFrom(s => s.FinancialYear != null ? s.FinancialYear.Year.ToString() : null))
                .ForMember(d => d.FinancialYearCode, opt => opt.MapFrom(s => s.FinancialYear != null ? s.FinancialYear.YearCode : null))
                .ForMember(d => d.BillingFrequency, opt => opt.MapFrom(s => s.BillingFrequency != null ? s.BillingFrequency.BillingFrequency : null));
            cfg.CreateMap<CreateBillingPeriodDto, BillingPeriodEntity>();
            cfg.CreateMap<UpdateBillingPeriodDto, BillingPeriodEntity>()
                .ForMember(d => d.SequenceNo, opt =>
                {
                    opt.Condition(src => src.SequenceNo.HasValue && src.SequenceNo.Value > 0);
                    opt.MapFrom(src => src.SequenceNo!.Value);
                });
        }, NullLoggerFactory.Instance);

        _mapper = mapperConfig.CreateMapper();

        // Default: Mock empty queryable on billing period repo
        var emptyBillingPeriods = new List<BillingPeriodEntity>().BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(emptyBillingPeriods);

        // Default active FY
        var activeFy = new YearMasterEntity
        {
            Id = 1,
            Year = 2026,
            YearCode = "FY2026",
            StartDate = new DateTime(2026, 4, 1),
            EndDate = new DateTime(2027, 3, 31),
            Status = "Active"
        };
        _mockFinancialYearRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(activeFy);

        // Default active Frequency
        var activeFreq = new BillingFrequencyMasterEntity
        {
            Id = 1,
            BillingFrequency = "Monthly",
            BillingFrequencyCode = "MON",
            PeriodsPerYear = 12,
            IsActive = true
        };
        _mockBillingFrequencyRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(activeFreq);

        _service = new BillingPeriodService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object,
            _mockFinancialYearRepository.Object,
            _mockBillingFrequencyRepository.Object);
    }

    #region GetByIdAsync Tests

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDto()
    {
        var financialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026" };
        var frequency = new BillingFrequencyMasterEntity { Id = 1, BillingFrequency = "Monthly", BillingFrequencyCode = "MON" };

        var entity = new BillingPeriodEntity
        {
            Id = 1,
            FinancialYearId = 1,
            FinancialYear = financialYear,
            BillingFrequencyId = 1,
            BillingFrequency = frequency,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30)
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(entity);

        var result = await _service.GetByIdAsync(1, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("BP2026-01", result.BillingPeriodCode);
        Assert.Equal("2026", result.FinancialYear);
        Assert.Equal("Monthly", result.BillingFrequency);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingId_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((BillingPeriodEntity?)null);

        var result = await _service.GetByIdAsync(999, CancellationToken.None);

        Assert.Null(result);
    }

    #endregion

    #region GetAllAsync Tests

    [Fact]
    public async Task GetAllAsync_ReturnsAllEntitiesWithPagination()
    {
        var financialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026" };
        var frequency = new BillingFrequencyMasterEntity { Id = 1, BillingFrequency = "Monthly", BillingFrequencyCode = "MON" };

        var entities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-01", PeriodFromDate = new DateTime(2026, 4, 1), PeriodToDate = new DateTime(2026, 4, 30) },
            new() { Id = 2, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-02", PeriodFromDate = new DateTime(2026, 5, 1), PeriodToDate = new DateTime(2026, 5, 31) }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingPeriodQueryParameters
        {
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count());
    }

    [Theory]
    [InlineData("BP2026-01", 1)]
    [InlineData("FY2026", 2)]
    [InlineData("Monthly", 2)]
    [InlineData("NonExistent", 0)]
    public async Task GetAllAsync_SearchTerm_FiltersAcrossAllFields(string searchTerm, int expectedCount)
    {
        var financialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "FY2026" };
        var frequency = new BillingFrequencyMasterEntity { Id = 1, BillingFrequency = "Monthly", BillingFrequencyCode = "MON" };

        var entities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-01" },
            new() { Id = 2, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-02" }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingPeriodQueryParameters
        {
            SearchTerm = searchTerm,
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(expectedCount, result.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_SortByBillingPeriodCodeDesc_SortsCorrectly()
    {
        var financialYear = new YearMasterEntity { Id = 1, Year = 2026, YearCode = "2026" };
        var frequency = new BillingFrequencyMasterEntity { Id = 1, BillingFrequency = "Monthly", BillingFrequencyCode = "MON" };

        var entities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-01" },
            new() { Id = 2, FinancialYearId = 1, FinancialYear = financialYear, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-02" }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingPeriodQueryParameters
        {
            SortBy = "billingperiodcode",
            SortOrder = "desc",
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("BP2026-02", result.Items.First().BillingPeriodCode);
        Assert.Equal("BP2026-01", result.Items.Last().BillingPeriodCode);
    }

    [Fact]
    public async Task GetAllAsync_FinancialYearWithNullYearCode_SearchesAndSortsSuccessfully()
    {
        var fyWithoutYearCode = new YearMasterEntity { Id = 1, Year = 2026, YearCode = null };
        var frequency = new BillingFrequencyMasterEntity { Id = 1, BillingFrequency = "Monthly", BillingFrequencyCode = "MON" };

        var entities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, FinancialYear = fyWithoutYearCode, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-01", SequenceNo = 1 },
            new() { Id = 2, FinancialYearId = 1, FinancialYear = fyWithoutYearCode, BillingFrequencyId = 1, BillingFrequency = frequency, BillingPeriodCode = "BP2026-02", SequenceNo = 2 }
        };

        var mockQuery = entities.BuildMock();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery);

        var queryParams = new BillingPeriodQueryParameters
        {
            SearchTerm = "2026",
            SortBy = "financialyear",
            SortOrder = "asc",
            PageNumber = 1,
            PageSize = 10
        };

        var result = await _service.GetAllAsync(queryParams, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
    }

    #endregion

    #region CreateAsync Validation Tests

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndReturnsDto()
    {
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30)
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingPeriodEntity entity, CancellationToken _) =>
            {
                entity.Id = 1;
                return entity;
            });

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("BP2026-01", result.BillingPeriodCode);
    }

    [Fact]
    public async Task CreateAsync_InvalidDateRange_ThrowsValidationException()
    {
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 5, 1),
            PeriodToDate = new DateTime(2026, 4, 1) // Invalid: To < From
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InvalidPenaltyDates_ThrowsValidationException()
    {
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30),
            CurrentPenaltyStartDate = new DateTime(2026, 6, 1),
            CurrentPenaltyEndDate = new DateTime(2026, 5, 1) // Invalid
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_InactiveFinancialYear_Succeeds()
    {
        var inactiveFy = new YearMasterEntity
        {
            Id = 2,
            Year = 2025,
            YearCode = "FY2025",
            StartDate = new DateTime(2025, 4, 1),
            EndDate = new DateTime(2026, 3, 31),
            IsActive = false,
            Status = "Inactive"
        };
        _mockFinancialYearRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveFy);

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingPeriodEntity entity, CancellationToken _) =>
            {
                entity.Id = 99;
                return entity;
            });

        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 2,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2025-01",
            PeriodFromDate = new DateTime(2025, 4, 1),
            PeriodToDate = new DateTime(2025, 4, 30)
        };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(99, result.Id);
        Assert.Equal("BP2025-01", result.BillingPeriodCode);
    }

    [Fact]
    public async Task CreateAsync_SequentialPeriods_AssignsIncrementalSequenceNo()
    {
        // Existing periods M1 and M2 with SequenceNo 1 and 2
        var existingEntities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, BillingFrequencyId = 1, SequenceNo = 1, BillingPeriodCode = "BP2026-M1", PeriodFromDate = new DateTime(2026, 4, 1), PeriodToDate = new DateTime(2026, 4, 30) },
            new() { Id = 2, FinancialYearId = 1, BillingFrequencyId = 1, SequenceNo = 2, BillingPeriodCode = "BP2026-M2", PeriodFromDate = new DateTime(2026, 5, 1), PeriodToDate = new DateTime(2026, 5, 31) }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities);

        BillingPeriodEntity? capturedEntity = null;
        _mockRepository.Setup(r => r.AddAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>()))
            .Callback<BillingPeriodEntity, CancellationToken>((e, _) => capturedEntity = e)
            .ReturnsAsync((BillingPeriodEntity e, CancellationToken _) =>
            {
                e.Id = 3;
                return e;
            });

        // Creating M3 without explicit SequenceNo
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-M3",
            PeriodFromDate = new DateTime(2026, 6, 1),
            PeriodToDate = new DateTime(2026, 6, 30)
        };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(capturedEntity);
        Assert.Equal(3, capturedEntity.SequenceNo);
        Assert.Equal(3, result.SequenceNo);
    }

    [Fact]
    public async Task CreateAsync_SequenceNoGreaterThanPeriodsPerYear_ThrowsValidationException()
    {
        // Monthly frequency allows up to 12 periods per year
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-M13",
            SequenceNo = 13, // Invalid: exceeds 12
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30)
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        var allErrors = string.Join(" ", (ex.Errors != null ? ex.Errors.Values : Enumerable.Empty<string>()).Concat(new[] { ex.Message }));
        Assert.Contains("SequenceNo must be between 1 and 12", allErrors);
    }

    [Fact]
    public async Task CreateAsync_DuplicateSequenceNo_ThrowsValidationException()
    {
        var existingEntities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, BillingFrequencyId = 1, SequenceNo = 1, BillingPeriodCode = "BP2026-M1", PeriodFromDate = new DateTime(2026, 4, 1), PeriodToDate = new DateTime(2026, 4, 30) }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities);

        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-M2",
            SequenceNo = 1, // Duplicate SequenceNo 1
            PeriodFromDate = new DateTime(2026, 5, 1),
            PeriodToDate = new DateTime(2026, 5, 31)
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        var allErrors = string.Join(" ", (ex.Errors != null ? ex.Errors.Values : Enumerable.Empty<string>()).Concat(new[] { ex.Message }));
        Assert.Contains("Sequence No 1 already exists", allErrors);
    }

    [Fact]
    public async Task CreateAsync_DatesOutsideFinancialYear_ThrowsValidationException()
    {
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1, // FY is 2026-04-01 to 2027-03-31
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 1, 1), // Outside FY
            PeriodToDate = new DateTime(2026, 1, 31)
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ThrowsValidationException()
    {
        var existingEntities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, BillingPeriodCode = "BP2026-01", FinancialYearId = 1, BillingFrequencyId = 1, SequenceNo = 1 }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities);

        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "bp2026-01", // Duplicate code
            PeriodFromDate = new DateTime(2026, 5, 1),
            PeriodToDate = new DateTime(2026, 5, 31)
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_OverlappingDates_ThrowsValidationException()
    {
        var existingEntities = new List<BillingPeriodEntity>
        {
            new()
            {
                Id = 1,
                BillingPeriodCode = "BP2026-01",
                FinancialYearId = 1,
                BillingFrequencyId = 1,
                SequenceNo = 1,
                PeriodFromDate = new DateTime(2026, 4, 1),
                PeriodToDate = new DateTime(2026, 4, 30)
            }
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities);

        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-02",
            PeriodFromDate = new DateTime(2026, 4, 15), // Overlaps with 2026-04-01 to 2026-04-30
            PeriodToDate = new DateTime(2026, 5, 15)
        };

        await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_TotalPeriodsExceedPeriodsPerYear_ThrowsValidationException()
    {
        // Frequency is Quarterly (PeriodsPerYear = 4)
        var quarterlyFreq = new BillingFrequencyMasterEntity
        {
            Id = 2,
            BillingFrequency = "Quarterly",
            BillingFrequencyCode = "QTR",
            PeriodsPerYear = 4,
            IsActive = true
        };
        _mockBillingFrequencyRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(quarterlyFreq);

        var existingEntities = new List<BillingPeriodEntity>
        {
            new() { Id = 1, FinancialYearId = 1, BillingFrequencyId = 2, SequenceNo = 1, BillingPeriodCode = "2026-Q1", PeriodFromDate = new DateTime(2026, 4, 1), PeriodToDate = new DateTime(2026, 6, 30) },
            new() { Id = 2, FinancialYearId = 1, BillingFrequencyId = 2, SequenceNo = 2, BillingPeriodCode = "2026-Q2", PeriodFromDate = new DateTime(2026, 7, 1), PeriodToDate = new DateTime(2026, 9, 30) },
            new() { Id = 3, FinancialYearId = 1, BillingFrequencyId = 2, SequenceNo = 3, BillingPeriodCode = "2026-Q3", PeriodFromDate = new DateTime(2026, 10, 1), PeriodToDate = new DateTime(2026, 12, 31) },
            new() { Id = 4, FinancialYearId = 1, BillingFrequencyId = 2, SequenceNo = 4, BillingPeriodCode = "2026-Q4", PeriodFromDate = new DateTime(2027, 1, 1), PeriodToDate = new DateTime(2027, 3, 31) },
        }.BuildMock();

        _mockRepository.Setup(r => r.GetQueryable()).Returns(existingEntities);

        // Attempting to create a 5th quarterly period
        var createDto = new CreateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 2,
            BillingPeriodCode = "2026-Q5",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 6, 30)
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAsync(createDto, CancellationToken.None));
        var allErrors = string.Join(" ", (ex.Errors != null ? ex.Errors.Values : Enumerable.Empty<string>()).Concat(new[] { ex.Message }));
        Assert.Contains("Cannot create more than 4 billing period(s)", allErrors);
    }

    #endregion

    #region UpdateAsync Tests

    [Fact]
    public async Task UpdateAsync_ValidUpdate_UpdatesSuccessfully()
    {
        var existingEntity = new BillingPeriodEntity
        {
            Id = 1,
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30),
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateBillingPeriodDto
        {
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01-UPDATED",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30),
            IsActive = true
        };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_InactiveFinancialYear_Succeeds()
    {
        var inactiveFy = new YearMasterEntity
        {
            Id = 2,
            Year = 2025,
            YearCode = "FY2025",
            StartDate = new DateTime(2025, 4, 1),
            EndDate = new DateTime(2026, 3, 31),
            IsActive = false,
            Status = "Inactive"
        };
        _mockFinancialYearRepository.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveFy);

        var existingEntity = new BillingPeriodEntity
        {
            Id = 1,
            FinancialYearId = 1,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2026-01",
            PeriodFromDate = new DateTime(2026, 4, 1),
            PeriodToDate = new DateTime(2026, 4, 30),
            IsActive = true
        };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var updateDto = new UpdateBillingPeriodDto
        {
            FinancialYearId = 2,
            BillingFrequencyId = 1,
            BillingPeriodCode = "BP2025-01",
            PeriodFromDate = new DateTime(2025, 4, 1),
            PeriodToDate = new DateTime(2025, 4, 30),
            IsActive = true
        };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.UpdateAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region DeleteAsync Tests

    [Fact]
    public async Task DeleteAsync_ExistingEntity_DeletesSuccessfully()
    {
        var existingEntity = new BillingPeriodEntity { Id = 1, BillingPeriodCode = "BP2026-01" };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<BillingPeriodEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var result = await _service.DeleteAsync(1, CancellationToken.None);

        Assert.True(result);
        _mockRepository.Verify(r => r.DeleteAsync(existingEntity, It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithReferences_ThrowsValidationException()
    {
        var existingEntity = new BillingPeriodEntity { Id = 1, BillingPeriodCode = "BP2026-01" };

        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existingEntity);
        _mockReferenceValidator.Setup(r => r.ValidateReferencesAsync<BillingPeriodEntity>(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Cannot delete: referenced elsewhere"));

        await Assert.ThrowsAsync<ValidationException>(() => _service.DeleteAsync(1, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_NonExistingEntity_ReturnsFalse()
    {
        _mockRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((BillingPeriodEntity?)null);

        var result = await _service.DeleteAsync(999, CancellationToken.None);

        Assert.False(result);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<BillingPeriodEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
