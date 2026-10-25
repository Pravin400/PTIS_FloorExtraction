using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.PropertyTaxOperations;
using NtisPlatform.Application.DTOs.CapitalValue;
using NtisPlatform.Application.DTOs.RetrospectiveTax;
using NtisPlatform.Application.DTOs.UserScreenAccess;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.ICapitalValueService.ICapitalValueService;
using NtisPlatform.Application.Interfaces.RetrospectiveTax;
using NtisPlatform.Application.Services.PropertyTaxOperations;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace NtisPlatform.Tests.Application;

public class PropertyTaxOperationsServiceTests
{
    private readonly Mock<ICapitalValueService> _cv = new();
    private readonly Mock<IPolicyConfigurationService> _policyConfig = new();
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepo = new();
    private readonly Mock<IRepository<PropertyTaxJobEntity, long>> _jobRepo = new();
    private readonly Mock<IRepository<PropertyTaxJobDetailEntity, long>> _jobDetailRepo = new();
    private readonly Mock<IRepository<PolicyTaxDetailsEntity, int>> _policyRepo = new();
    private readonly Mock<IRepository<PropertyScreenLockEntity, int>> _lockRepo = new();
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _detailsRepo = new();
    private readonly Mock<IRepository<YearMasterEntity, int>> _yearMasterRepo = new();
    private readonly Mock<IRepository<WardEntity, int>> _wardRepo = new();
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepo = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _propertyTypeRepo = new();
    private readonly Mock<IRepository<PropertyAssessmentStatusEntity, int>> _propertyAssessmentStatusRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IUserScreenAccessService> _screenAccessService = new();
    private readonly Mock<IConfiguration> _config = new();
    private readonly Mock<IRetrospectiveTaxRefresher> _retroRefresher = new();

    public PropertyTaxOperationsServiceTests()
    {
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity>().BuildMock());
        _recalcFlagRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxRecalcFlagEntity>().BuildMock());
        _assessmentYearRangeRepo.Setup(r => r.GetQueryable()).Returns(new List<AssessmentYearRangeEntity> { new() { Id = 100, FromYear = 2000, ToYear = 2050, IsActive = true } }.BuildMock());
        _rateSectionDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<RateSectionDetailsEntity> { new() { WardId = 1, RateSectionId = 1, IsActive = true } }.BuildMock());
        _rateRepo.Setup(r => r.GetQueryable()).Returns(new List<RateEntity> { new() { RateSectionId = 1, TaxZoneId = 1, ConstructionTypeId = 1, TypeOfUseGroupId = 1, YearRangeRVId = 100, IsActive = true } }.BuildMock());
        _taxMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity> { new() { Id = 1, IsActive = true, TaxCode = "GeneralTax", TaxName = "General Tax" } }.BuildMock());
        _taxPercentageMasterRVRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxPercentageMasterRVEntity> { new() { TaxId = 1, TypeOfUseId = 1, YearRangeRVId = 100, IsActive = true } }.BuildMock());
        _typeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<TypeOfUseEntity> { new() { Id = 1, TypeOfUseGroupId = 1, IsActive = true } }.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _csnDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<CSNDetailsEntity>().BuildMock());
        _rateMasterForCVRepo.Setup(r => r.GetQueryable()).Returns(new List<RateMasterForCVEntity>().BuildMock());
        _taxPercentageMasterCVRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxPercentageMasterCVEntity>().BuildMock());
        _assessmentYearRangeCVRepo.Setup(r => r.GetQueryable()).Returns(new List<AssessmentYearRangeCVEntity>().BuildMock());
        _policyConfig.Setup(p => p.GetPolicyValueAsync("CapitalValueAreaType", It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync("BUA");
        _policyConfig.Setup(p => p.GetPolicyValueAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string code, string def, CancellationToken ct) => def);

        _wardRepo.Setup(r => r.GetQueryable()).Returns(new List<WardEntity>().BuildMock());
        _zoneRepo.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity>().BuildMock());
        _propertyTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>().BuildMock());
        _propertyAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentStatusEntity>().BuildMock());
        
        var mockYears = new List<YearMasterEntity>
        {
            new() { Id = 1, Year = 2025, YearCode = "2025-26", IsActive = true, StartDate = new DateTime(2025, 4, 1), EndDate = new DateTime(2026, 3, 31) },
            new() { Id = 2, Year = 2026, YearCode = "2026-27", IsActive = false, StartDate = new DateTime(2026, 4, 1), EndDate = new DateTime(2027, 3, 31) }
        };
        _yearMasterRepo.Setup(r => r.GetQueryable()).Returns(mockYears.BuildMock());

        _yearMasterRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((int id, CancellationToken ct) => mockYears.FirstOrDefault(y => y.Id == id) ?? new YearMasterEntity { Id = id, Year = 2026, YearCode = "2026-27", IsActive = false, StartDate = new DateTime(2026, 4, 1), EndDate = new DateTime(2027, 3, 31) });
        
        var mockSection = new Mock<IConfigurationSection>();
        mockSection.Setup(s => s.Value).Returns((string?)null);
        _config.Setup(c => c.GetSection(It.IsAny<string>())).Returns(mockSection.Object);

        _screenAccessService.Setup(s => s.GetUserScreensByUserIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserScreenAccessDto>());
        _jobRepo.Setup(r => r.GetQueryable())
            .Returns(new List<PropertyTaxJobEntity>().BuildMock());
    }

    /// <summary>What the refresher returns for a property: the RV result the job reads its amounts and message from.</summary>
    private static RetrospectiveTaxRefreshResult Refreshed(NtisPlatform.Application.DTOs.RateableValue.RateableValueResponseDto rv)
        => new(rv, null);

    /// <summary>Every property of the job gets this RV result from the refresher (the engine ran).</summary>
    private void ArrangeRefresher(NtisPlatform.Application.DTOs.RateableValue.RateableValueResponseDto rv)
        => _retroRefresher
            .Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Refreshed(rv));

    // Extra mock repositories required by the full constructor but not by most tests
    private readonly Mock<IRepository<RateEntity, int>> _rateRepo = new();
    private readonly Mock<IRepository<TaxPercentageMasterRVEntity, int>> _taxPercentageMasterRVRepo = new();
    private readonly Mock<IRepository<TaxMasterEntity, int>> _taxMasterRepo = new();
    private readonly Mock<IRepository<TransMastEntity, int>> _transMastRepo = new();
    private readonly Mock<IRepository<AssessmentYearRangeEntity, int>> _assessmentYearRangeRepo = new();
    private readonly Mock<IRepository<TypeOfUseEntity, int>> _typeOfUseRepo = new();
    private readonly Mock<IRepository<RateSectionDetailsEntity, int>> _rateSectionDetailsRepo = new();
    private readonly Mock<IRepository<CSNDetailsEntity, int>> _csnDetailsRepo = new();
    private readonly Mock<IRepository<RateMasterForCVEntity, int>> _rateMasterForCVRepo = new();
    private readonly Mock<IRepository<TaxPercentageMasterCVEntity, int>> _taxPercentageMasterCVRepo = new();
    private readonly Mock<IRepository<AssessmentYearRangeCVEntity, int>> _assessmentYearRangeCVRepo = new();
    private readonly Mock<IRepository<PropertyTaxRecalcFlagEntity, long>> _recalcFlagRepo = new();
    private readonly Mock<IRepository<MasterDataChangeBatchEntity, long>> _changeBatchRepo = new();
    private readonly Mock<IRepository<MasterDataChangeEventEntity, long>> _changeEventRepo = new();
    private readonly Mock<IRepository<DepreciationMasterEntity, int>> _depreciationRepo = new();

    private PropertyTaxOperationsService CreateService()
        => new(
            _cv.Object,
            _policyConfig.Object,
            _propertyRepo.Object,
            _jobRepo.Object,
            _jobDetailRepo.Object,
            _lockRepo.Object,
            _detailsRepo.Object,
            _yearMasterRepo.Object,
            _wardRepo.Object,
            _zoneRepo.Object,
            _propertyTypeRepo.Object,
            _propertyAssessmentStatusRepo.Object,
            _rateRepo.Object,
            _taxPercentageMasterRVRepo.Object,
            _taxMasterRepo.Object,
            _transMastRepo.Object,
            _assessmentYearRangeRepo.Object,
            _typeOfUseRepo.Object,
            _rateSectionDetailsRepo.Object,
            _csnDetailsRepo.Object,
            _rateMasterForCVRepo.Object,
            _taxPercentageMasterCVRepo.Object,
            _assessmentYearRangeCVRepo.Object,
            _recalcFlagRepo.Object,
            _changeBatchRepo.Object,
            _changeEventRepo.Object,
            _depreciationRepo.Object,
            _uow.Object,
            NullLogger<PropertyTaxOperationsService>.Instance,
            _screenAccessService.Object,
            _config.Object,
            _retroRefresher.Object);

    private static PropertyEntity Property(int id) => new() { TaxZoneId = 1, WardId = 1,
        Id = id,
        IsActive = true,
        MarkedForDeletion = false,
        PropertyNo = $"PROP-{id:D8}",
        OwnerName = $"Owner {id}",
        CreatedDate = new DateTime(2025, 5, 1)
    };

    [Fact]
    public async Task GetEligibleCountAsync_ExcludesLocked()
    {
        // 3 properties, all with details: #1 locked, #2 already processed for FY -> only #1 skipped, #2 and #3 eligible.
        var properties = new List<PropertyEntity> { Property(1), Property(2), Property(3) };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();
        var locks = new List<PropertyScreenLockEntity>
        {
            new() { Id = 1, PropertyId = 1, IsLocked = true, IsActive = true, MarkedForDeletion = false }
        };
        var policies = new List<PolicyTaxDetailsEntity>
        {
            new() { Id = 1, PropertyId = 2, IsActive = true, MarkedForDeletion = false }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(locks.BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(policies.BuildMock());

        var service = CreateService();

        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Property",
                Operation = "AddTax",
                Scope = new OperationScopeDto { PropertyIds = new List<int> { 1, 2, 3 } }
            },
            actingUserId: 7);

        result.Total.Should().Be(3);
        result.Eligible.Should().Be(2);
        result.Skipped.Should().Be(1);
    }

    [Fact]
    public async Task GetEligibleCountAsync_IgnoresNonTaxableDetailsWhenCheckingRates()
    {
        // Property 1 has two details:
        // Detail 1: Taxable with valid configured rate (ConstructionTypeId = 1, TypeOfUseId = 1).
        // Detail 2: Non-taxable (IsTaxable = false) with unknown rate (ConstructionTypeId = 99, TypeOfUseId = 99).
        // The property must be marked Eligible, NOT Skipped with RateNotFound.
        var properties = new List<PropertyEntity> { Property(1) };
        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 10, PropertyId = 1, IsActive = true, IsTaxable = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 11, PropertyId = 1, IsActive = true, IsTaxable = false, ConstructionTypeId = 99, TypeOfUseId = 99, AssessmentYear = "2025-26" }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var service = CreateService();

        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Property",
                Operation = "AddTax",
                Scope = new OperationScopeDto { PropertyIds = new List<int> { 1 } }
            },
            actingUserId: 7);

        result.Total.Should().Be(1);
        result.Eligible.Should().Be(1);
        result.Skipped.Should().Be(0);
    }

    [Fact]
    public async Task ExecuteAsync_WithNonAddTaxOperation_Throws()
    {
        var service = CreateService();

        var act = async () => await service.ExecuteAsync(
            new ExecuteOperationRequestDto
            {
                FinanceYearId = 1,
                Operation = "RemoveTax",
                ScopeType = "Property",
                Scope = new OperationScopeDto { PropertyIds = new List<int> { 1 } }
            },
            new OperationContext(ActingUserId: 7));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ExecuteAsync_WithNoEligibleRecords_Throws()
    {
        // One property but it is locked -> zero eligible.
        var properties = new List<PropertyEntity> { Property(1) };
        var details = new List<PropertyDetailsEntity> { new() { Id = 1, PropertyId = 1, IsActive = true } };
        var locks = new List<PropertyScreenLockEntity>
        {
            new() { Id = 1, PropertyId = 1, IsLocked = true, IsActive = true, MarkedForDeletion = false }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(locks.BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());

        var service = CreateService();

        var act = async () => await service.ExecuteAsync(
            new ExecuteOperationRequestDto
            {
                FinanceYearId = 1,
                Operation = "AddTax",
                ScopeType = "Property",
                Scope = new OperationScopeDto { PropertyIds = new List<int> { 1 } }
            },
            new OperationContext(ActingUserId: 7));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ExecuteAsync_WithOverlappingActiveJob_Throws()
    {
        // 2 properties
        var properties = new List<PropertyEntity> { Property(1), Property(2) };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();
        
        var activeJobs = new List<PropertyTaxJobEntity>
        {
            new()
            {
                Id = 1,
                JobCode = "JOB-ADD-2025-0001",
                Operation = "AddTax",
                FinanceYearId = 1,
                FinanceYear = new YearMasterEntity { Id = 1, Year = 2025, YearCode = "2025-26" },
                ScopeType = "Property",
                ScopeParamsJson = "{\"PropertyIds\":[1,2]}",
                Status = "InProgress",
                MarkedForDeletion = false,
                StartedByUserName = "Tester"
            }
        };

        var activeDetails = new List<PropertyTaxJobDetailEntity>
        {
            new() { Id = 101, JobId = 1, PropertyId = 1, Status = "Pending", IsActive = true, MarkedForDeletion = false }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _jobRepo.Setup(r => r.GetQueryable()).Returns(activeJobs.BuildMock());
        _jobDetailRepo.Setup(r => r.GetQueryable()).Returns(activeDetails.BuildMock());

        var service = CreateService();

        var act = async () => await service.ExecuteAsync(
            new ExecuteOperationRequestDto
            {
                FinanceYearId = 1,
                Operation = "AddTax",
                ScopeType = "Property",
                Scope = new OperationScopeDto { PropertyIds = new List<int> { 1, 2 } }
            },
            new OperationContext(ActingUserId: 7));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*overlap with*");
    }

    [Fact]
    public async Task ProcessJobAsync_Success_ProcessesAllPropertiesAndSaves()
    {
        // 2 target properties
        var properties = new List<PropertyEntity> { Property(1), Property(2) };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();
        
        var job = new PropertyTaxJobEntity
        {
            Id = 123,
            JobCode = "JOB-ADD-2025-0123",
            Operation = "AddTax",
            FinanceYearId = 1,
            FinanceYear = new YearMasterEntity { Id = 1, Year = 2025, YearCode = "2025-26" },
            ScopeType = "Property",
            ScopeParamsJson = "{\"PropertyIds\":[1,2]}",
            Status = "InProgress",
            MarkedForDeletion = false,
            StartedByUserId = 7
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _jobRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobEntity> { job }.BuildMock());
        _jobDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobDetailEntity>().BuildMock());

        var rvResult = new NtisPlatform.Application.DTOs.RateableValue.RateableValueResponseDto
        {
            Policy = new NtisPlatform.Application.DTOs.RateableValue.PolicyTaxDto
            {
                Taxes = new Dictionary<string, decimal>
                {
                    { "GeneralTax", 100m }
                }
            }
        };
        ArrangeRefresher(rvResult);

        var service = CreateService();

        await service.ProcessJobAsync(123L, CancellationToken.None);

        // Verify that the refresher (RV recalculation + retrospective engine) was called for both property IDs
        _retroRefresher.Verify(r => r.RefreshAsync(1, 7, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);
        _retroRefresher.Verify(r => r.RefreshAsync(2, 7, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);

        // Verify that detail records were added in bulk
        _jobDetailRepo.Verify(r => r.AddRangeAsync(It.Is<IEnumerable<PropertyTaxJobDetailEntity>>(list => list.Count() == 2), It.IsAny<CancellationToken>()), Times.Once);

        // Verify job properties updated to Completed
        job.Status.Should().Be("Completed");
        job.SuccessCount.Should().Be(2);
        job.FailedCount.Should().Be(0);
        job.SkippedCount.Should().Be(0);
        job.RecordsProcessed.Should().Be(2);
    }

    /// <summary>A two-property RV "Add Tax" job (properties 1 and 2, started by user 7); the created job details are collected in <paramref name="addedDetails"/>.</summary>
    private PropertyTaxJobEntity ArrangeTwoPropertyRvJob(List<PropertyTaxJobDetailEntity>? addedDetails = null, string scopeParamsJson = "{\"PropertyIds\":[1,2]}")
    {
        var properties = new List<PropertyEntity> { Property(1), Property(2) };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();
        var job = new PropertyTaxJobEntity
        {
            Id = 123,
            JobCode = "JOB-ADD-2025-0123",
            Operation = "AddTax",
            FinanceYearId = 1,
            FinanceYear = new YearMasterEntity { Id = 1, Year = 2025, YearCode = "2025-26" },
            ScopeType = "Property",
            ScopeParamsJson = scopeParamsJson,
            Status = "InProgress",
            MarkedForDeletion = false,
            StartedByUserId = 7
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _jobRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobEntity> { job }.BuildMock());
        _jobDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobDetailEntity>().BuildMock());
        if (addedDetails is not null)
        {
            _jobDetailRepo
                .Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<PropertyTaxJobDetailEntity>>(), It.IsAny<CancellationToken>()))
                .Callback<IEnumerable<PropertyTaxJobDetailEntity>, CancellationToken>((list, _) => addedDetails.AddRange(list))
                .Returns(Task.CompletedTask);
        }

        return job;
    }

    private static NtisPlatform.Application.DTOs.RateableValue.RateableValueResponseDto RvResultWithTax() => new()
    {
        Policy = new NtisPlatform.Application.DTOs.RateableValue.PolicyTaxDto
        {
            Taxes = new Dictionary<string, decimal> { { "GeneralTax", 100m } }
        }
    };

    [Fact]
    public async Task ProcessJobAsync_RvJob_RefreshesEveryPropertyInOrder_AsTheUserWhoStartedTheJob()
    {
        var job = ArrangeTwoPropertyRvJob();
        var calls = new List<string>();
        _retroRefresher.Setup(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .Returns((int id, int? user, RetrospectiveTaxRefreshOptions? _, CancellationToken _) =>
            {
                calls.Add($"refresh:{id}:{user}");
                return Task.FromResult(Refreshed(RvResultWithTax()));
            });

        await CreateService().ProcessJobAsync(123L, CancellationToken.None);

        // the refresher recalculates RV and then runs the engine (under the property's lock), one property after the other,
        // as the user who started the job: the service itself no longer recalculates RV, so nothing can run between the two
        calls.Should().Equal("refresh:1:7", "refresh:2:7");
        job.Status.Should().Be("Completed");
        job.SuccessCount.Should().Be(2);
        job.FailedCount.Should().Be(0);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ProcessJobAsync_RvJob_PassesTheForceFlagOfTheScope(bool forceRecalculate)
    {
        ArrangeTwoPropertyRvJob(scopeParamsJson: forceRecalculate
            ? "{\"PropertyIds\":[1,2],\"ForceRecalculate\":true}"
            : "{\"PropertyIds\":[1,2]}");
        ArrangeRefresher(RvResultWithTax());

        await CreateService().ProcessJobAsync(123L, CancellationToken.None);

        _retroRefresher.Verify(r => r.RefreshAsync(
                It.IsAny<int>(), 7,
                It.Is<RetrospectiveTaxRefreshOptions?>(o => o != null && o.ForceRecalculate == forceRecalculate),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task ProcessJobAsync_RvJob_PassesTheCancellationTokenOfTheJobOnToTheRefresher()
    {
        ArrangeTwoPropertyRvJob();
        ArrangeRefresher(RvResultWithTax());
        using var cts = new CancellationTokenSource();

        await CreateService().ProcessJobAsync(123L, cts.Token);

        _retroRefresher.Verify(r => r.RefreshAsync(It.IsAny<int>(), 7, It.IsAny<RetrospectiveTaxRefreshOptions?>(), cts.Token), Times.Exactly(2));
    }

    [Fact]
    public async Task ProcessJobAsync_RvJob_WhenTheEngineFails_ThatPropertyFailsWithTheRefreshersMessage_AndTheNextOneIsStillProcessed()
    {
        // The RV result of property 1 is saved, but the engine that puts its certificate's demand back failed: the property
        // is not listed as taxed (that would present a ledger known to need repair as done), the detail row says what
        // happened in words that are safe to show, and its recalculation flag stays open for the next Add Tax run.
        var added = new List<PropertyTaxJobDetailEntity>();
        var job = ArrangeTwoPropertyRvJob(added);
        ArrangeRefresher(RvResultWithTax());
        _retroRefresher.Setup(r => r.RefreshAsync(1, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RetrospectiveRefreshFailedException(1, "ab12cd34", null, new InvalidOperationException("Login failed for user 'ntis_app'")));
        _recalcFlagRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxRecalcFlagEntity>
        {
            new() { PropertyId = 1, FinanceYearId = 1, CalculationType = "BOTH", IsActive = true },
            new() { PropertyId = 2, FinanceYearId = 1, CalculationType = "BOTH", IsActive = true },
        }.BuildMock());

        await CreateService().ProcessJobAsync(123L, CancellationToken.None);

        job.FailedCount.Should().Be(1);
        job.SuccessCount.Should().Be(1);
        var failed = added.Single(d => d.PropertyId == 1);
        failed.Status.Should().Be("Failed");
        failed.Message.Should().Contain("could not be refreshed").And.Contain("Calculate the property again");
        failed.Message.Should().NotContain("Login failed").And.NotContain("ntis_app");
        added.Single(d => d.PropertyId == 2).Status.Should().Be("Added");
        _retroRefresher.Verify(r => r.RefreshAsync(2, 7, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);
        // the open master-data-change flag is only resolved for a property that was taxed
        _recalcFlagRepo.Verify(r => r.UpdateAsync(It.Is<PropertyTaxRecalcFlagEntity>(f => f.PropertyId == 1), It.IsAny<CancellationToken>()), Times.Never);
        _recalcFlagRepo.Verify(r => r.UpdateAsync(It.Is<PropertyTaxRecalcFlagEntity>(f => f.PropertyId == 2), It.IsAny<CancellationToken>()), Times.Once);
    }
    [Fact]
    public async Task ProcessJobAsync_RvJob_WhenTheRefresherFails_ThatPropertyFailsAndTheNextOneIsStillProcessed()
    {
        var job = ArrangeTwoPropertyRvJob();
        ArrangeRefresher(RvResultWithTax());
        // the RV recalculation failed (the refresher always lets that propagate) or the lock was not granted in time
        _retroRefresher.Setup(r => r.RefreshAsync(1, It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("rv failed"));

        await CreateService().ProcessJobAsync(123L, CancellationToken.None);

        _retroRefresher.Verify(r => r.RefreshAsync(2, 7, It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Once);
        job.FailedCount.Should().Be(1);
        job.SuccessCount.Should().Be(1);
    }
    [Fact]
    public async Task ProcessJobAsync_WithCalculationMethodCV_ExecutesCapitalValueCalculation()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            Property(1)
        };

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 10, PropertyId = 1, IsActive = true, MarkedForDeletion = false }
        };

        var job = new PropertyTaxJobEntity
        {
            Id = 123,
            JobCode = "JOB-123",
            Operation = "AddTax",
            FinanceYearId = 2,
            FinanceYear = new YearMasterEntity { Id = 2, Year = 2026, YearCode = "2026-27" },
            ScopeType = "Property",
            ScopeParamsJson = "{\"PropertyIds\":[1]}",
            Status = "Pending",
            IsActive = true,
            MarkedForDeletion = false,
            StartedByUserId = 7
        };

        var activeDetails = new List<PropertyTaxJobDetailEntity>
        {
            new() { Id = 101, JobId = 123, PropertyId = 1, Status = "Pending", IsActive = true, MarkedForDeletion = false }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _policyRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _jobRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobEntity> { job }.BuildMock());
        _jobDetailRepo.Setup(r => r.GetQueryable()).Returns(activeDetails.BuildMock());

        _policyConfig.Setup(p => p.GetPolicyValueAsync("TaxCalculationMethod", "RV", It.IsAny<CancellationToken>()))
            .ReturnsAsync("CV");
        _policyConfig.Setup(p => p.GetPolicyValueAsync("CapitalValueAreaType", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("BUA");

        var cvResults = new List<CapitalValueDto>
        {
            new()
            {
                PropertyId = 1,
                PropertyDetailsId = 10,
                Taxes = new List<TaxHeadDto>
                {
                    new() { TaxName = "WaterTax", Amount = 150m }
                }
            }
        };

        _cv.Setup(s => s.CreateAsync(It.IsAny<CreateCapitalValueDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cvResults);

        var service = CreateService();

        // Act
        await service.ProcessJobAsync(123L, CancellationToken.None);

        // Assert
        _cv.Verify(s => s.CreateAsync(It.Is<CreateCapitalValueDto>(dto => dto.PropertyId == 1), It.IsAny<CancellationToken>()), Times.Once);
        // the capital value job replaces no retro row, so the retrospective engine has nothing to put back
        _retroRefresher.Verify(r => r.RefreshAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<RetrospectiveTaxRefreshOptions?>(), It.IsAny<CancellationToken>()), Times.Never);

        job.Status.Should().Be("Completed");
        job.SuccessCount.Should().Be(1);
        job.SkippedCount.Should().Be(0);
        job.RecordsProcessed.Should().Be(1);
    }

    [Fact]
    public async Task WritePropertiesCsvToStreamAsync_WritesCorrectEncodingAndBom()
    {
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, PropertyNo = "P1", OwnerName = "Owner1", IsActive = true, MarkedForDeletion = false, WardId = 1, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var zones = new List<ZoneEntity>
        {
            new() { Id = 1, ZoneNo = "Z1", Description = "उथळसर" }
        };
        var wards = new List<WardEntity>
        {
            new() { Id = 1, ZoneId = 1, Description = "Ward1" }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _zoneRepo.Setup(r => r.GetQueryable()).Returns(zones.BuildMock());
        _wardRepo.Setup(r => r.GetQueryable()).Returns(wards.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());

        var service = CreateService();
        using var ms = new System.IO.MemoryStream();
        await service.WritePropertiesCsvToStreamAsync(ms, "all", null, CancellationToken.None);

        var bytes = ms.ToArray();
        // The first 3 bytes should be the UTF-8 BOM
        bytes[0].Should().Be(0xEF);
        bytes[1].Should().Be(0xBB);
        bytes[2].Should().Be(0xBF);

        var text = System.Text.Encoding.UTF8.GetString(bytes, 3, bytes.Length - 3);
        text.Should().Contain("उथळसर");
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithSearchText_PerformsExactMatch()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyNo = "P1", MobileNo = "1234567890", UPICId = "UPIC1", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyNo = "P2", MobileNo = "12345", UPICId = "UPIC2", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyNo = "P3", MobileNo = "98765", UPICId = "UPIC123", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());

        var service = CreateService();

        // Act: Search for exact MobileNo "12345"
        var result1 = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Property",
                Operation = "AddTax",
                Scope = new OperationScopeDto { SearchText = "12345" }
            },
            actingUserId: 7);

        // Assert: Only Property 2 matches (not Property 1)
        result1.Eligible.Should().Be(1);

        // Act: Search for exact UPICId "UPIC1"
        var result2 = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Property",
                Operation = "AddTax",
                Scope = new OperationScopeDto { SearchText = "UPIC1" }
            },
            actingUserId: 7);

        // Assert: Only Property 1 matches (not Property 2 or 3)
        result2.Eligible.Should().Be(1);
    }

    [Fact]
    public async Task GetAuditListAsync_WithJobCodeFilter_ReturnsOnlyMatchingJob()
    {
        // Arrange
        var mockJobs = new List<PropertyTaxJobEntity>
        {
            new() { Id = 101, JobCode = "JOB-101", Operation = "AddTax", FinanceYearId = 1, Status = "Completed", MarkedForDeletion = false, StartTime = new DateTime(2025, 5, 1) },
            new() { Id = 102, JobCode = "JOB-102", Operation = "AddTax", FinanceYearId = 1, Status = "Completed", MarkedForDeletion = false, StartTime = new DateTime(2025, 5, 2) }
        };

        _jobRepo.Setup(r => r.GetQueryable()).Returns(mockJobs.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetAuditListAsync(
            new OperationAuditQueryParameters
            {
                JobCode = "JOB-102"
            },
            actingUserId: 7);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.First().JobId.Should().Be("JOB-102");
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithRangeScopeType_FiltersNumerically()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyNo = "2", PartitionNo = "S1", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyNo = "2", PartitionNo = "S2", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyNo = "2", PartitionNo = "S10", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 4, TaxZoneId = 1, WardId = 1, PropertyNo = "2", PartitionNo = "S11", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Range",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    FromPropertyNo = "2-S1",
                    ToPropertyNo = "2-S10"
                }
            },
            actingUserId: 7);

        // Assert: S1, S2, and S10 match (not S11)
        result.Eligible.Should().Be(3);
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithAllPropertyTypesSelected_IncludesNullPropertyTypeProperties()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyTypeId = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        var activePtOptions = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 1, IsActive = true },
            new() { Id = 2, IsActive = true }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _propertyTypeRepo.Setup(r => r.GetQueryable()).Returns(activePtOptions.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Ward",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    PropertyTypeIds = new List<int> { 1, 2 }
                }
            },
            actingUserId: 7);

        // Assert: all 3 properties should be eligible (ID 1, ID 2 which is null, and ID 3)
        result.Eligible.Should().Be(3);
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithSubsetPropertyTypesSelected_ExcludesNullPropertyTypeProperties()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyTypeId = 1, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyTypeId = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyTypeId = 2, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        var activePtOptions = new List<PropertyTypeMasterEntity>
        {
            new() { Id = 1, IsActive = true },
            new() { Id = 2, IsActive = true }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _propertyTypeRepo.Setup(r => r.GetQueryable()).Returns(activePtOptions.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Ward",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    PropertyTypeIds = new List<int> { 1 }
                }
            },
            actingUserId: 7);

        // Assert: only Property 1 matches (Property 2 has null, Property 3 has ID 2)
        result.Eligible.Should().Be(1);
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithAllAssessmentStatusesSelected_IncludesNullAssessmentStatusProperties()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = 1, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = 2, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        var activeAsOptions = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = 1, IsActive = true },
            new() { Id = 2, IsActive = true }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _propertyAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(activeAsOptions.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Ward",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    AssessmentStatusIds = new List<int> { 1, 2 }
                }
            },
            actingUserId: 7);

        // Assert: all 3 properties should be eligible (ID 1, ID 2 which is null, and ID 3)
        result.Eligible.Should().Be(3);
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithSubsetAssessmentStatusesSelected_ExcludesNullAssessmentStatusProperties()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = 1, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyAssessmentStatusId = 2, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        var activeAsOptions = new List<PropertyAssessmentStatusEntity>
        {
            new() { Id = 1, IsActive = true },
            new() { Id = 2, IsActive = true }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _propertyAssessmentStatusRepo.Setup(r => r.GetQueryable()).Returns(activeAsOptions.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Ward",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    AssessmentStatusIds = new List<int> { 1 }
                }
            },
            actingUserId: 7);

        // Assert: only Property 1 matches (Property 2 has null, Property 3 has ID 2)
        result.Eligible.Should().Be(1);
    }

    [Fact]
    public async Task GetEligibleCountAsync_WithCompoundBuildingKeys_MatchesPrecisePairsWithoutCrossProduct()
    {
        // Arrange
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, TaxZoneId = 1, WardId = 1, PropertyNo = "100", PartitionNo = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, TaxZoneId = 1, WardId = 2, PropertyNo = "200", PartitionNo = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 3, TaxZoneId = 1, WardId = 1, PropertyNo = "200", PartitionNo = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }, // Cross-product (should not match)
            new() { Id = 4, TaxZoneId = 1, WardId = 2, PropertyNo = "100", PartitionNo = null, IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }  // Cross-product (should not match)
        };
        var details = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();

        var rateSections = new List<RateSectionDetailsEntity>
        {
            new() { WardId = 1, RateSectionId = 1, IsActive = true },
            new() { WardId = 2, RateSectionId = 1, IsActive = true }
        };

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());
        _rateSectionDetailsRepo.Setup(r => r.GetQueryable()).Returns(rateSections.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Building",
                Operation = "AddTax",
                Scope = new OperationScopeDto
                {
                    Building = new List<string> { "1:100", "2:200" }
                }
            },
            actingUserId: 7);

        // Assert: only Prop 1 and Prop 2 match (no cross-product)
        result.Eligible.Should().Be(2);
    }

    [Fact]
    public async Task ProcessJobAsync_WithRetriedFailedDetails_CalculatesSuccessAndFailedCountsDynamically()
    {
        // Arrange
        var job = new PropertyTaxJobEntity
        {
            Id = 42,
            JobCode = "JOB-42",
            Operation = "AddTax",
            ScopeType = "Ward",
            Status = "InProgress",
            RecordsSelected = 2,
            StartedByUserId = 7,
            FinanceYearId = 1,
            FinanceYear = new YearMasterEntity { Id = 1, Year = 2025, YearCode = "2025-26", IsActive = true }
        };

        var details = new List<PropertyTaxJobDetailEntity>
        {
            new() { Id = 10, JobId = 42, PropertyId = 1, PropertyNo = "P1", Status = "Failed", MarkedForDeletion = false },
            new() { Id = 20, JobId = 42, PropertyId = 2, PropertyNo = "P2", Status = "Added", MarkedForDeletion = false }
        };

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, PropertyNo = "P1", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) },
            new() { Id = 2, PropertyNo = "P2", IsActive = true, MarkedForDeletion = false, CreatedDate = new DateTime(2025, 5, 1) }
        };

        var propDetails = properties.Select(p => new PropertyDetailsEntity { Id = p.Id, PropertyId = p.Id, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }).ToList();
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(propDetails.BuildMock());
        _lockRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyScreenLockEntity>().BuildMock());

        _jobRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxJobEntity> { job }.BuildMock());
        _jobDetailRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());
        
        // Mock the refresher (RV recalculation + engine) to succeed
        ArrangeRefresher(new NtisPlatform.Application.DTOs.RateableValue.RateableValueResponseDto { Policy = new NtisPlatform.Application.DTOs.RateableValue.PolicyTaxDto { Taxes = new Dictionary<string, decimal> { { "TaxTotal", 1500m } } } });

        var service = CreateService();

        // Act
        await service.ProcessJobAsync(42L);

        // Assert
        job.SuccessCount.Should().Be(2); // Retried one succeeded, plus the already successful one
        job.FailedCount.Should().Be(0);
        job.RecordsProcessed.Should().Be(2);
    }

    [Fact]
    public async Task ResolveMasterDataChangeBatchAsync_ResolvesAffectedProperties_AndFlagsRecalc()
    {
        // Arrange
        var batch = new MasterDataChangeBatchEntity
        {
            Id = 100L,
            Status = "Pending",
            CalculationType = "RateableValue"
        };

        var events = new List<MasterDataChangeEventEntity>
        {
            new() { Id = 1L, BatchId = 100L, SourceTable = "RateSectionDetails", SourceRecordId = 10, FieldChanges = "[{\"Field\":\"WardId\",\"OldValue\":\"1\",\"NewValue\":\"2\"}]" },
            new() { Id = 2L, BatchId = 100L, SourceTable = "DepreciationMaster", SourceRecordId = 20 }
        };

        _changeBatchRepo.Setup(r => r.GetByIdAsync(100L, It.IsAny<CancellationToken>())).ReturnsAsync(batch);
        _changeEventRepo.Setup(r => r.GetQueryable()).Returns(events.BuildMock());

        _rateSectionDetailsRepo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RateSectionDetailsEntity { Id = 10, WardId = 2 });

        _depreciationRepo.Setup(r => r.GetByIdAsync(20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DepreciationMasterEntity { Id = 20, ConstructionTypeId = 1, MinYear = 0, MaxYear = 10 });

        var properties = new List<PropertyEntity>
        {
            new() { Id = 101, WardId = 1, PropertyNo = "P101", IsActive = true, MarkedForDeletion = false },
            new() { Id = 102, WardId = 2, PropertyNo = "P102", IsActive = true, MarkedForDeletion = false }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var propDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 102, ConstructionTypeId = 1, ConstructionYear = "2020", AssessmentYear = "2025-26", IsActive = true, MarkedForDeletion = false }
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(propDetails.BuildMock());

        _recalcFlagRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTaxRecalcFlagEntity>().BuildMock());
        _recalcFlagRepo.Setup(r => r.AddAsync(It.IsAny<PropertyTaxRecalcFlagEntity>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyTaxRecalcFlagEntity entity, CancellationToken ct) => entity);

        var service = CreateService();

        // Act
        await service.ResolveMasterDataChangeBatchAsync(100L);

        // Assert
        batch.Status.Should().Be("COMPLETED");
    }

    [Fact]
    public async Task GetInitAsync_ReturnsAuthoritativeCounts_ForRV_WithMasterDataAndFlags()
    {
        // Arrange: 4 active properties:
        // 1: Taxed in TransMast
        // 2: Locked (has details, but locked -> Skipped)
        // 3: Fully configured (details, rate, tax %) -> Eligible
        // 4: Missing details -> Skipped (DetailsMissing)
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 },
            new() { Id = 2, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 },
            new() { Id = 3, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 },
            new() { Id = 4, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var taxed = new List<TransMastEntity>
        {
            new() { Id = 10, PropertyId = 1, FinanceYearId = 1, CalculationType = "RV", IsActive = true, MarkedForDeletion = false }
        };
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(taxed.BuildMock());

        var locked = new List<PropertyScreenLockEntity>
        {
            new() { Id = 20, PropertyId = 2, IsLocked = true, IsActive = true, MarkedForDeletion = false }
        };
        _lockRepo.Setup(r => r.GetQueryable()).Returns(locked.BuildMock());

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 1, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 2, PropertyId = 2, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 3, PropertyId = 3, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }
            // Property 4 has NO details -> DetailsMissing
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetInitAsync(actingUserId: 1, financeYearId: 1);

        // Assert: Authoritative counts
        result.Should().NotBeNull();
        result.Summary.TotalProperties.Should().Be(4);
        result.Summary.TransmastProperties.Should().Be(1);
        result.Summary.EligibleRecords.Should().Be(1); // Only Property 3 is Eligible
        result.Summary.SkippedRecords.Should().Be(2);  // Property 2 (Locked) + Property 4 (DetailsMissing)
    }

    [Fact]
    public async Task GetInitAsync_ExcludesRecalculationFlaggedProperties_AndReevaluatesEligibility()
    {
        // Arrange: 2 active properties. Property 1 is in TransMast, but also has an active recalculation flag.
        // It has valid details and master data, so upon exclusion from TransMast it is authoritatively re-evaluated as Eligible.
        // Property 2 has no details -> Skipped (DetailsMissing).
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 },
            new() { Id = 2, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var taxed = new List<TransMastEntity>
        {
            new() { Id = 10, PropertyId = 1, FinanceYearId = 1, CalculationType = "RV", IsActive = true, MarkedForDeletion = false }
        };
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(taxed.BuildMock());

        var recalcFlags = new List<PropertyTaxRecalcFlagEntity>
        {
            new() { Id = 100, PropertyId = 1, FinanceYearId = 1, CalculationType = "RV", ResolvedAt = null, IsActive = true }
        };
        _recalcFlagRepo.Setup(r => r.GetQueryable()).Returns(recalcFlags.BuildMock());

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 1, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetInitAsync(actingUserId: 1, financeYearId: 1);

        // Assert
        result.Should().NotBeNull();
        result.Summary.TotalProperties.Should().Be(2);
        result.Summary.TransmastProperties.Should().Be(0); // Flagged property removed from TransMast
        result.Summary.EligibleRecords.Should().Be(1);    // Property 1 re-evaluated and found Eligible
        result.Summary.SkippedRecords.Should().Be(1);     // Property 2 has no details -> Skipped
    }

    [Fact]
    public async Task GetInitAsync_MatchesEligibilityApi_ForSameDataset()
    {
        // Arrange: 3 properties:
        // 1: Taxed
        // 2: Locked
        // 3: Eligible
        var ward = new WardEntity { Id = 1, ZoneId = 1, IsActive = true };
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false, WardId = 1, Ward = ward, TaxZoneId = 1 },
            new() { Id = 2, IsActive = true, MarkedForDeletion = false, WardId = 1, Ward = ward, TaxZoneId = 1 },
            new() { Id = 3, IsActive = true, MarkedForDeletion = false, WardId = 1, Ward = ward, TaxZoneId = 1 }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var taxed = new List<TransMastEntity>
        {
            new() { Id = 10, PropertyId = 1, FinanceYearId = 1, CalculationType = "RV", IsActive = true, MarkedForDeletion = false }
        };
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(taxed.BuildMock());

        var locked = new List<PropertyScreenLockEntity>
        {
            new() { Id = 20, PropertyId = 2, IsLocked = true, IsActive = true, MarkedForDeletion = false }
        };
        _lockRepo.Setup(r => r.GetQueryable()).Returns(locked.BuildMock());

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 1, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 2, PropertyId = 2, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 3, PropertyId = 3, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var service = CreateService();

        // Act: Get Dashboard Init summary
        var initResult = await service.GetInitAsync(actingUserId: 1, financeYearId: 1);

        // Act: Get Eligibility API count for the same dataset
        var eligibleCountResult = await service.GetEligibleCountAsync(
            new EligibleCountRequestDto
            {
                FinanceYearId = 1,
                ScopeType = "Zone",
                Operation = "AddTax",
                Scope = new OperationScopeDto { ZoneIds = new List<int> { 1 } }
            },
            actingUserId: 1);

        // Assert: Dashboard authoritative counts match the eligibility API counts exactly
        initResult.Summary.TotalProperties.Should().Be(eligibleCountResult.Total);
        initResult.Summary.EligibleRecords.Should().Be(eligibleCountResult.Eligible);
        initResult.Summary.SkippedRecords.Should().Be(eligibleCountResult.Skipped);
        initResult.Summary.TransmastProperties.Should().Be(eligibleCountResult.AlreadyTaxed);
    }

    [Fact]
    public async Task GetInitAsync_ReturnsAuthoritativeCounts_ForCV_WithMasterData()
    {
        // Arrange: CV mode
        _policyConfig.Setup(p => p.GetPolicyValueAsync("TaxCalculationMethod", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("CV");
        _policyConfig.Setup(p => p.GetPolicyValueAsync("CapitalValueAreaType", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("BUA");

        _typeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<TypeOfUseEntity>
        {
            new()
            {
                Id = 1,
                TypeOfUseGroupId = 1,
                TypeOfUseGroupCVId = 1,
                TypeOfUseGroupCV = new TypeOfUseGroupCVEntity { TypeOfUseGroupCVCode = "R", IsFloorWiseRateApplicable = false },
                IsActive = true
            }
        }.BuildMock());

        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1, MoujaId = 1, CSN = "CSN1" },
            new() { Id = 2, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1, MoujaId = 1, CSN = "CSN1" },
            new() { Id = 3, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1, MoujaId = 2, CSN = "CSN2" } // Unknown CSN -> CVRateMappingNotFound
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var taxed = new List<TransMastEntity>
        {
            new() { Id = 10, PropertyId = 1, FinanceYearId = 1, CalculationType = "CV", IsActive = true, MarkedForDeletion = false }
        };
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(taxed.BuildMock());

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 1, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 2, PropertyId = 2, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 3, PropertyId = 3, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" }
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        _assessmentYearRangeCVRepo.Setup(r => r.GetQueryable()).Returns(new List<AssessmentYearRangeCVEntity>
        {
            new() { Id = 200, FromYear = 2000, ToYear = 2050, IsActive = true }
        }.BuildMock());

        _rateMasterForCVRepo.Setup(r => r.GetQueryable()).Returns(new List<RateMasterForCVEntity>
        {
            new() { Id = 300, AssessmentYearRangeId = 200, TypeOfUseGroupCVId = 1, IsActive = true }
        }.BuildMock());

        _csnDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<CSNDetailsEntity>
        {
            new() { MoujaId = 1, CSN = "CSN1", RateCVMasterId = 300, IsActive = true }
        }.BuildMock());

        _taxPercentageMasterCVRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxPercentageMasterCVEntity>
        {
            new() { TaxId = 1, TypeOfUseId = 1, YearRangeCVId = 200, IsActive = true }
        }.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetInitAsync(actingUserId: 1, financeYearId: 1);

        // Assert
        result.Should().NotBeNull();
        result.Summary.TotalProperties.Should().Be(3);
        result.Summary.TransmastProperties.Should().Be(1);
        result.Summary.EligibleRecords.Should().Be(1); // Property 2 is CV-Eligible
        result.Summary.SkippedRecords.Should().Be(1);  // Property 3 is CVRateMappingNotFound
    }

    [Fact]
    public async Task GetInitAsync_HandlesUnknownWard_AndInvalidAssessmentYear()
    {
        // Arrange:
        // Property 1 has unconfigured WardId (999) -> Cannot match ward rate section details -> Skipped (RateNotFound)
        // Property 2 has invalid assessment year format "INVALID" -> Skipped (RateNotFound)
        var properties = new List<PropertyEntity>
        {
            new() { Id = 1, IsActive = true, MarkedForDeletion = false, WardId = 999, TaxZoneId = 1 },
            new() { Id = 2, IsActive = true, MarkedForDeletion = false, WardId = 1, TaxZoneId = 1 }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(properties.BuildMock());

        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 1, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "2025-26" },
            new() { Id = 2, PropertyId = 2, IsActive = true, ConstructionTypeId = 1, TypeOfUseId = 1, AssessmentYear = "INVALID" }
        };
        _detailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());

        var service = CreateService();

        // Act
        var result = await service.GetInitAsync(actingUserId: 1, financeYearId: 1);

        // Assert: Neither property is Eligible; both are Skipped due to master data failure
        result.Should().NotBeNull();
        result.Summary.TotalProperties.Should().Be(2);
        result.Summary.TransmastProperties.Should().Be(0);
        result.Summary.EligibleRecords.Should().Be(0);
        result.Summary.SkippedRecords.Should().Be(2);
    }
}
