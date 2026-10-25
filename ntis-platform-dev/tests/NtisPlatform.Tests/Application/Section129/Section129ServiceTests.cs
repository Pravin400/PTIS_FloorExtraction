using Microsoft.Extensions.Logging;
using Moq;
using NtisPlatform.Application.DTOs.Section129;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.Section129;
using NtisPlatform.Application.Services.Section129;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Section129;
using NtisPlatform.Core.Models.Section129;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application.Section129;

public class Section129ServiceTests
{
    private readonly Mock<ISection129Repository> _mockRepository;
    private readonly Mock<IPolicyConfigurationService> _mockPolicyConfigurationService;
    private readonly Mock<IRateableValueService> _mockRateableValueService;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<ILogger<Section129Service>> _mockLogger;
    private readonly TimeProvider _timeProvider;
    private readonly Section129Service _service;

    public Section129ServiceTests()
    {
        _mockRepository = new Mock<ISection129Repository>();
        _mockPolicyConfigurationService = new Mock<IPolicyConfigurationService>();
        _mockRateableValueService = new Mock<IRateableValueService>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockLogger = new Mock<ILogger<Section129Service>>();
        _timeProvider = TimeProvider.System;

        _mockPolicyConfigurationService
            .Setup(p => p.GetPolicyValueAsync("SECTION129_STAGE_BASE_TAXCODE", "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync("General Tax");

        // Default: every ward has a configured Area Inclusion Date, so GetScheduleAsync's
        // "ward has no inclusion date" guard doesn't fire for tests that aren't specifically
        // exercising that guard. Tests covering the guard itself override this per-ward.
        _mockRepository
            .Setup(r => r.GetWardSection129InclusionDateAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DateTime(2020, 4, 1));

        _service = new Section129Service(
            _mockRepository.Object,
            _mockPolicyConfigurationService.Object,
            _mockRateableValueService.Object,
            _mockUnitOfWork.Object,
            _timeProvider,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetScheduleAsync_WhenPropertyHeaderNotFound_ReturnsNull()
    {
        // Arrange
        const int propertyId = 999;
        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129PropertyHeaderRow?)null);

        // Act
        var result = await _service.GetScheduleAsync(propertyId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetScheduleAsync_WhenPropertyExists_ReturnsPopulatedScheduleDto()
    {
        // Arrange
        const int propertyId = 10;
        var header = new Section129PropertyHeaderRow(
            Upic: "UPIC-0010",
            OwnerName: "John Doe",
            Address: "123 Main St",
            MoujaName: "Mouja 1",
            WardNo: "1",
            ZoneDescription: "Zone A",
            UseTypeGroupName: "Residential",
            AssessmentYear: "2022-23",
            PropertyDetailsId: 101,
            TypeOfUseId: 2,
            WardId: 1);

        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        _mockRepository
            .Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockRepository
            .Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1500m, 120m, new HashSet<string> { "Residential" }));

        _mockRepository
            .Setup(r => r.GetOldGpNoAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("GP-888");

        _mockRepository
            .Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 5, Year: 2024));

        _mockRepository
            .Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());

        _mockRepository
            .Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());

        // Act
        var result = await _service.GetScheduleAsync(propertyId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(propertyId, result.PropertyId);
        Assert.Equal("UPIC-0010", result.Upic);
        Assert.Equal("GP-888", result.OldGpNo);
        Assert.Equal("John Doe", result.OwnerName);
        Assert.Equal(1500m, result.OldTax);
        Assert.Equal("2024-25", result.CurrentFinancialYear);
    }

    [Fact]
    public async Task GetScheduleAsync_WhenWardHasNoInclusionDateAndNotYetApplied_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 11;
        var header = new Section129PropertyHeaderRow(
            Upic: "UPIC-0011",
            OwnerName: "Jane Doe",
            Address: "456 Main St",
            MoujaName: null,
            WardNo: "9",
            ZoneDescription: null,
            UseTypeGroupName: "Residential",
            AssessmentYear: "2022-23",
            PropertyDetailsId: 102,
            TypeOfUseId: 2,
            WardId: 9);

        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        // Ward 9 has no configured Area Inclusion Date, overriding the class-level default.
        _mockRepository
            .Setup(r => r.GetWardSection129InclusionDateAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        _mockRepository
            .Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertySection129ApplicationEntity?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.GetScheduleAsync(propertyId));
        Assert.Contains("Inclusion date not exists", ex.Message);
    }

    [Fact]
    public async Task GetScheduleAsync_WhenWardHasNoInclusionDateButAlreadyApplied_DoesNotThrow()
    {
        // Arrange — once IsApplied is true, the ward date was already validated at Apply time, so a
        // since-removed/missing ward row must not block viewing a property that already has its own schedule.
        const int propertyId = 12;
        var header = new Section129PropertyHeaderRow(
            Upic: "UPIC-0012",
            OwnerName: "Already Applied Owner",
            Address: "789 Main St",
            MoujaName: null,
            WardNo: "9",
            ZoneDescription: null,
            UseTypeGroupName: "Residential",
            AssessmentYear: "2022-23",
            PropertyDetailsId: 103,
            TypeOfUseId: 2,
            WardId: 9);

        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        _mockRepository
            .Setup(r => r.GetWardSection129InclusionDateAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        _mockRepository
            .Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true });

        _mockRepository
            .Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(0m, 0m, new HashSet<string>()));

        _mockRepository
            .Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());

        _mockRepository
            .Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());

        // Act
        var result = await _service.GetScheduleAsync(propertyId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(propertyId, result.PropertyId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(",,,")]
    public async Task SearchByOldGpNoAsync_WhenEmptyOrWhitespace_ReturnsNull(string rawInput)
    {
        // Act
        var result = await _service.SearchByOldGpNoAsync(rawInput);

        // Assert
        Assert.Null(result.Schedule);
        Assert.False(result.IsAmbiguous);
    }

    [Fact]
    public async Task SearchByOldGpNoAsync_WhenAmbiguous_ReturnsAmbiguousResult()
    {
        // Arrange
        const string oldGpNo = "GP-SHARED";
        _mockRepository
            .Setup(r => r.GetPropertyIdByOldGpNoAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoLookupResult.Ambiguous);

        // Act
        var result = await _service.SearchByOldGpNoAsync(oldGpNo);

        // Assert
        Assert.True(result.IsAmbiguous);
        Assert.Null(result.Schedule);
    }

    [Fact]
    public async Task SearchByOldGpNoAsync_WhenOldNumberExistsButNotMapped_ReturnsNotMappedResult()
    {
        // Arrange — the old number exists in PropertyMastOld but has no current, active mapping,
        // distinct from "no such old number at all".
        const string oldGpNo = "GP-UNMAPPED";
        _mockRepository
            .Setup(r => r.GetPropertyIdByOldGpNoAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoLookupResult.NotMapped);

        // Act
        var result = await _service.SearchByOldGpNoAsync(oldGpNo);

        // Assert
        Assert.Equal(Section129OldGpNoSearchStatus.NotMapped, result.Status);
        Assert.False(result.IsAmbiguous);
        Assert.Null(result.Schedule);
    }

    [Fact]
    public async Task SearchByOldGpNoAsync_WhenMatchFound_ReturnsSchedule()
    {
        // Arrange
        const string oldGpNo = "GP-100";
        const int propertyId = 77;
        _mockRepository
            .Setup(r => r.GetPropertyIdByOldGpNoAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Section129OldGpNoLookupResult.Found(propertyId));

        var header = new Section129PropertyHeaderRow(
            Upic: "UPIC-0077",
            OwnerName: "Owner 77",
            Address: "Addr",
            MoujaName: null,
            WardNo: "2",
            ZoneDescription: null,
            UseTypeGroupName: "Commercial",
            AssessmentYear: "2021",
            PropertyDetailsId: 771,
            TypeOfUseId: 3,
            WardId: 1);

        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        _mockRepository
            .Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(800m, 50m, new HashSet<string>()));

        _mockRepository
            .Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());

        _mockRepository
            .Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());

        // Act
        var result = await _service.SearchByOldGpNoAsync(oldGpNo);

        // Assert
        Assert.False(result.IsAmbiguous);
        Assert.NotNull(result.Schedule);
        Assert.Equal(propertyId, result.Schedule.PropertyId);
        Assert.Equal("UPIC-0077", result.Schedule.Upic);
    }

    [Fact]
    public async Task ApplyAsync_WhenPropertyHeaderNotFound_ReturnsNull()
    {
        // Arrange
        const int propertyId = 999;
        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129PropertyHeaderRow?)null);

        // Act
        var result = await _service.ApplyAsync(propertyId, new Section129ApplyRequestDto());

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ApplyAsync_WhenAreaChangedWithoutEffectiveDateOrRemark_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 1;
        var header = new Section129PropertyHeaderRow("UPIC-1", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);

        var request = new Section129ApplyRequestDto
        {
            AreaChanged = true,
            OtherStructuralChangeEffectiveDate = null,
            ChangeDetailsRemark = null
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ApplyAsync(propertyId, request));
        Assert.Contains("Change Effective Date and Change Details are required", ex.Message);
    }

    [Fact]
    public async Task ApplyAsync_WhenOcBasisRequestedButPropertyHasNoOcDate_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 1;
        var header = new Section129PropertyHeaderRow("UPIC-1", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetOrCreateApplicationAsync(propertyId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId });
        _mockRepository.Setup(r => r.GetOcDateAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync((DateTime?)null);
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 100m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 10, Year: 2024));
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: 1000m, CalculationValue: 50000m, CalculationAnnualValue: (decimal?)40000m));

        var request = new Section129ApplyRequestDto { UseOcDateBasis = true };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ApplyAsync(propertyId, request));
        Assert.Contains("Occupancy Certificate", ex.Message);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ApplyAsync_FirstApply_WhenNoBasisInTransMast_ThrowsInvalidOperationException()
    {
        // Arrange — First apply attempt when no TransMast RV basis row exists for the property and current year.
        const int propertyId = 77;
        var header = new Section129PropertyHeaderRow("UPIC-77", "Owner", "Addr", null, "1", null, null, null, 101, null, 7);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 100m, new HashSet<string>()));
        SetupScheduleReadPath(propertyId, new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, 10, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((decimal TaxAmount, decimal CalculationValue, decimal? CalculationAnnualValue)?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ApplyAsync(propertyId, new Section129ApplyRequestDto()));
        Assert.Equal("Not eligible to apply rule, as property has 0 tax", ex.Message);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenOldTaxIsZero_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 80;
        var header = new Section129PropertyHeaderRow("UPIC-80", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true });
        SetupScheduleReadPath(propertyId, new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(0m, 0m, new HashSet<string>()));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RecalculateAsync(propertyId));
        Assert.Equal("Not eligible to apply rule, as property has 0 old tax", ex.Message);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenMunicipalTaxIsZero_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 88;
        var header = new Section129PropertyHeaderRow("UPIC-88", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true });
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 100m, new HashSet<string>()));
        SetupScheduleReadPath(propertyId, new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((10, 2026));
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, 10, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: 0m, CalculationValue: 1000m, CalculationAnnualValue: (decimal?)1000m));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RecalculateAsync(propertyId));
        Assert.Equal("Not eligible to apply rule, as property has 0 tax", ex.Message);
    }

    [Fact]
    public async Task ApplyAsync_FirstApply_ResolvesStartYearFromWardAreaInclusionDate()
    {
        // Arrange — ward inclusion date 2020-04-01 is FY 2020, whose YearMaster id is 5.
        const int propertyId = 1;
        var header = new Section129PropertyHeaderRow("UPIC-1", "Owner", "Addr", null, "1", null, null, null, 101, null, 7);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId };
        _mockRepository.Setup(r => r.GetOrCreateApplicationAsync(propertyId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetWardSection129InclusionDateAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DateTime(2020, 4, 1));
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2020, It.IsAny<CancellationToken>())).ReturnsAsync(5);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(2020);
        // No active YearMaster: the fill-forward loop logs and returns without writing anything.
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(((int YearMasterId, int Year)?)null);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(BuildTwoStageChain());
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 100m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: 1000m, CalculationValue: 50000m, CalculationAnnualValue: (decimal?)40000m));
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        // Act
        await _service.ApplyAsync(propertyId, new Section129ApplyRequestDto());

        // Assert — start year frozen from the ward's date, and nothing was wiped (no basis flip).
        Assert.Equal(5, app.StartFinanceYearIdOverride);
        Assert.False(app.UseOcDateBasis);
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_WhenPropertyHeaderNotFound_ReturnsNull()
    {
        // Arrange
        const int propertyId = 999;
        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129PropertyHeaderRow?)null);

        // Act
        var result = await _service.RecalculateAsync(propertyId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RecalculateAsync_WhenApplicationNotApplied_ReturnsCurrentScheduleWithoutModifying()
    {
        // Arrange
        const int propertyId = 5;
        var header = new Section129PropertyHeaderRow("UPIC-5", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = false });
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(0m, 0m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());

        // Act
        var result = await _service.RecalculateAsync(propertyId);

        // Assert
        Assert.NotNull(result);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    private static List<Section129ScheduleRowProjection> OneCurrentYearRow() => new()
    {
        new Section129ScheduleRowProjection
        {
            FinanceYearId = 10,
            FinanceYearValue = 2024,
            TaxId = 1, // matches "General Tax" (this test class's default SECTION129_STAGE_BASE_TAXCODE)
            IsCurrent = true,
            TaxAmount = 2500m,
            FullBasisTaxAmount = 5000m
        }
    };

    /// <summary>Repository mocks GetScheduleAsync (the method's last step) needs so it doesn't trip over unset members.</summary>
    private void SetupScheduleReadPath(int propertyId, List<Section129ScheduleRowProjection> rows)
    {
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(rows);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 50m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 10, Year: 2024));
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenScheduleAlreadyExists_ForcesRvRefreshInsteadOfShortCircuiting()
    {
        // Arrange — the old "AlreadyCurrent" guard silently skipped every write once the current
        // year had a row, so Property-Change-Check edits never took effect.
        const int propertyId = 6;
        var header = new Section129PropertyHeaderRow("UPIC-6", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        var request = new Section129RecalculateRequestDto
        {
            AreaChanged = true,
            OtherStructuralChangeEffectiveDate = new DateTime(2024, 5, 1),
            ChangeDetailsRemark = "Extra floor added"
        };

        // Act
        var result = await _service.RecalculateAsync(propertyId, request);

        // Assert — edits persisted, RV force-refreshed once (its hook restages), no direct loop/transaction here.
        Assert.NotNull(result);
        Assert.Null(result.RecalculateBlockedReason);
        Assert.True(app.AreaChanged);
        Assert.Equal("Extra floor added", app.ChangeDetailsRemark);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(propertyId, true), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenChangeFlaggedWithoutDateOrDetails_ThrowsBeforeAnyWrite()
    {
        // Arrange
        const int propertyId = 6;
        var header = new Section129PropertyHeaderRow("UPIC-6", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true });
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.RecalculateAsync(propertyId, new Section129RecalculateRequestDto { UseChanged = true }));
        Assert.Contains("Change Effective Date and Change Details are required", ex.Message);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenNoScheduleAndNoBasis_ThrowsInvalidOperationException()
    {
        // Arrange
        const int propertyId = 8;
        var header = new Section129PropertyHeaderRow("UPIC-8", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true });
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(1000m, 100m, new HashSet<string>()));
        SetupScheduleReadPath(propertyId, new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, 10, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((decimal TaxAmount, decimal CalculationValue, decimal? CalculationAnnualValue)?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RecalculateAsync(propertyId));
        Assert.Equal("Not eligible to apply rule, as property has 0 tax", ex.Message);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenOcBasisFlipped_WipesScheduleReanchorsToOcYearAndRebuildsViaRv()
    {
        // Arrange — OC date 2023-06-15 is FY 2023, YearMaster id 9.
        const int propertyId = 9;
        var header = new Section129PropertyHeaderRow("UPIC-9", "Owner", "Addr", null, "1", null, null, null, null, null, 4);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        var app = new PropertySection129ApplicationEntity
        {
            PropertyId = propertyId,
            IsApplied = true,
            UseOcDateBasis = false,
            StartFinanceYearIdOverride = 5
        };
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());
        _mockRepository.Setup(r => r.GetOcDateAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(new DateTime(2023, 6, 15));
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>())).ReturnsAsync(9);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(9, It.IsAny<CancellationToken>())).ReturnsAsync(2023);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        // Act
        var result = await _service.RecalculateAsync(propertyId, new Section129RecalculateRequestDto { UseOcDateBasis = true });

        // Assert
        Assert.NotNull(result);
        Assert.True(app.UseOcDateBasis);
        Assert.Equal(9, app.StartFinanceYearIdOverride);
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(propertyId, It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.SweepPreStartYearOldArrearsAsync(propertyId, 2023, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(propertyId, true), Times.Once);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenBaseTaxCodeChangedSinceApply_BlocksWithoutAnyWrite()
    {
        // Arrange — this property's schedule was built under "Tax Total" (TaxId=99), but
        // SECTION129_STAGE_BASE_TAXCODE has since been switched to "General Tax" (TaxId=1, the
        // default configured in this test class's constructor).
        const int propertyId = 15;
        var header = new Section129PropertyHeaderRow("UPIC-15", "Owner", "Addr", null, "1", null, null, "2022", null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(0m, 0m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 10, Year: 2024));
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>
            {
                new() { FinanceYearId = 9, FinanceYearValue = 2023, TaxId = 99, PolicyCodeId = 2, FullBasisTaxAmount = 3000m, TaxAmount = 3000m, IsCurrent = true },
            });

        // Act
        var result = await _service.RecalculateAsync(propertyId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("BaseTaxCodeChanged", result.RecalculateBlockedReason);
        Assert.Equal("TaxTotal", result.AppliedBaseTaxCode);
        Assert.Equal("General Tax", result.BaseTaxCode);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_RvTriggered_WhenBaseTaxCodeChangedSinceApply_ThrowsInsteadOfMixingBases()
    {
        // Arrange — same mismatch as above, but reached via the RV engine's own post-save hook
        // (isFromRateableValueService=true), which has no earlier friendly-message gate. Must fail
        // loudly rather than silently write a new year under the wrong base tax.
        const int propertyId = 16;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>
            {
                new() { FinanceYearId = 10, FinanceYearValue = 2024, TaxId = 99, PolicyCodeId = 3, FullBasisTaxAmount = 2000m, TaxAmount = 2000m, IsCurrent = true },
            });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.RecalculateAsync(propertyId, isFromRateableValueService: true));
        Assert.Contains("already applied", ex.Message, StringComparison.OrdinalIgnoreCase);
        _mockRepository.Verify(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenBasisUnchangedAndWardDateBasis_DoesNotWipeSchedule()
    {
        // Arrange — ward-date basis (not OC), checkbox already matches what's stored. The ward
        // date is a shared, ward-wide setting and is never re-checked on an ordinary Recalculate.
        const int propertyId = 11;
        var header = new Section129PropertyHeaderRow("UPIC-11", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true, UseOcDateBasis = false });
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        // Act
        await _service.RecalculateAsync(propertyId, new Section129RecalculateRequestDto { UseOcDateBasis = false });

        // Assert
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.SweepPreStartYearOldArrearsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenOnOcBasisAndOcDateUnchanged_DoesNotWipeSchedule()
    {
        // Arrange — already on the OC-Date basis; the certificate's date hasn't changed since the
        // schedule was last anchored (both resolve to FY2023, YearMasterId 9).
        const int propertyId = 12;
        var header = new Section129PropertyHeaderRow("UPIC-12", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true, UseOcDateBasis = true, StartFinanceYearIdOverride = 9 });
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());
        _mockRepository.Setup(r => r.GetOcDateAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(new DateTime(2023, 6, 15));
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>())).ReturnsAsync(9);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        // Act
        await _service.RecalculateAsync(propertyId, new Section129RecalculateRequestDto { UseOcDateBasis = true });

        // Assert
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockRepository.Verify(r => r.SweepPreStartYearOldArrearsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_Manual_WhenOcCertificateDateCorrectedAfterApply_ReanchorsToTheNewOcYear()
    {
        // Arrange — the schedule was first anchored to OC Date = 2024-xx (FY2024, YearMasterId 10),
        // but the OC certificate has SINCE been corrected to 2023-06-15 (FY2023, YearMasterId 9).
        // The checkbox itself is unchanged (still true) — only the underlying certificate date moved.
        const int propertyId = 13;
        var header = new Section129PropertyHeaderRow("UPIC-13", "Owner", "Addr", null, "1", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true, UseOcDateBasis = true, StartFinanceYearIdOverride = 10 });
        SetupScheduleReadPath(propertyId, OneCurrentYearRow());
        _mockRepository.Setup(r => r.GetOcDateAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(new DateTime(2023, 6, 15));
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>())).ReturnsAsync(9);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(9, It.IsAny<CancellationToken>())).ReturnsAsync(2023);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        // Act
        var result = await _service.RecalculateAsync(propertyId, new Section129RecalculateRequestDto { UseOcDateBasis = true });

        // Assert
        Assert.NotNull(result);
        _mockRepository.Verify(r => r.ResetSection129ScheduleAsync(propertyId, It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.SweepPreStartYearOldArrearsAsync(propertyId, 2023, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockRateableValueService.Verify(s => s.CalculateAndSaveAsync(propertyId, true), Times.Once);
    }

    [Fact]
    public async Task GetScheduleCsvAsync_WhenPropertyNotFound_ReturnsNull()
    {
        // Arrange
        const int propertyId = 999;
        _mockRepository
            .Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Section129PropertyHeaderRow?)null);

        // Act
        var result = await _service.GetScheduleCsvAsync(propertyId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetScheduleCsvAsync_WhenPropertyExists_ProducesFormattedCsv()
    {
        // Arrange
        const int propertyId = 20;
        var header = new Section129PropertyHeaderRow("UPIC-0020", "Jane Smith", "456 Elm St", null, "3", null, null, null, null, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(500m, 60m, new HashSet<string>()));

        var rows = new List<Section129ScheduleRowProjection>
        {
            new Section129ScheduleRowProjection
            {
                FinanceYearId = 1,
                FinanceYearValue = 2023,
                PolicyCodeId = 1,
                PolicyCode = PolicyCodes.Section129Old1,
                PolicyName = "Old GP Rate (Year 1)",
                TaxPercentage = 0m,
                OldTaxAmount = 500m,
                FullBasisTaxAmount = 2000m,
                StageTaxAmount = 0m,
                TaxAmount = 500m,
                IsCurrent = false,
                IsPropertyChangeDisqualified = false
            }
        };
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(rows);
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, PolicyCodeMasterEntity>());

        // Act
        var csv = await _service.GetScheduleCsvAsync(propertyId);

        // Assert
        Assert.NotNull(csv);
        Assert.Contains("\"UPIC\",\"UPIC-0020\"", csv);
        Assert.Contains("\"Owner\",\"Jane Smith\"", csv);
        Assert.Contains("Financial Year", csv);
        Assert.Contains("2023-24", csv);
        Assert.Contains("500", csv);
    }

    // -------------------------------------------------------------------------
    // Write-loop: stage amounts, TransMast synchronisation, TaxTotal, rollback
    // -------------------------------------------------------------------------

    /// <summary>
    /// Helper: returns a minimal but complete set of repository mocks needed for any test that
    /// drives RecalculateThroughCurrentYearAsync (the inner write loop).
    /// propertyId=1, currentYearMasterId=10 (2024), start year=8 (2022), two stage years.
    /// </summary>
    private void SetupWriteLoopBase(
        int propertyId,
        PropertySection129ApplicationEntity application,
        Dictionary<int, PolicyCodeMasterEntity> chain,
        decimal basisAmount = 2000m)
    {
        var header = new Section129PropertyHeaderRow(
            "UPIC-1", "Owner", "Addr", null, "1", null, null, null, 101, null, 1);

        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 10, Year: 2024));
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.ResolveStartFinanceYearIdAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(8);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2022);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2022, It.IsAny<CancellationToken>())).ReturnsAsync(8);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>())).ReturnsAsync(9);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2024, It.IsAny<CancellationToken>())).ReturnsAsync(10);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("TaxTotal", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("Tax Total", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetTaxTotalComponentTaxIdsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int>());
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, It.IsAny<int>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: basisAmount, CalculationValue: 50000m, CalculationAnnualValue: (decimal?)40000m));
        _mockRepository.Setup(r => r.GetCurrentBasisTaxAmountsAsync(propertyId, It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, decimal>());
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(500m, 50m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(chain);
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.UpsertTransMastAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SupersedePolicyTaxDetailAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.ClearIsCurrentFlagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);
    }

    private static Dictionary<int, PolicyCodeMasterEntity> BuildTwoStageChain()
    {
        var p1 = new PolicyCodeMasterEntity { Id = 1, PolicyCode = PolicyCodes.Section129Old1, PolicyName = "Old GP Rate (Year 1)", NextPolicyCodeId = 2 };
        var p2 = new PolicyCodeMasterEntity { Id = 2, PolicyCode = PolicyCodes.Section129Old2, PolicyName = "Old GP Rate (Year 2)", NextPolicyCodeId = 3 };
        var p3 = new PolicyCodeMasterEntity { Id = 3, PolicyCode = PolicyCodes.Section129_20, PolicyName = "Stage 1 (20%)" };
        return new Dictionary<int, PolicyCodeMasterEntity> { [1] = p1, [2] = p2, [3] = p3 };
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_StageProgression_OldYearsGetOldPolicyCodes()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert
        Assert.NotNull(result);
        // 3 years: 2022 → OLD_1, 2023 → OLD_2, 2024 → 20%
        Assert.Equal(3, writtenRows.Count);

        var row2022 = writtenRows.Single(r => r.FinanceYearId == 8);
        var row2023 = writtenRows.Single(r => r.FinanceYearId == 9);
        var row2024 = writtenRows.Single(r => r.FinanceYearId == 10);

        Assert.Equal(1, row2022.PolicyCodeId); // OLD_1
        Assert.Equal(0m, row2022.TaxPercentage);
        Assert.False(row2022.IsCurrent);

        Assert.Equal(2, row2023.PolicyCodeId); // OLD_2
        Assert.Equal(0m, row2023.TaxPercentage);
        Assert.False(row2023.IsCurrent);

        Assert.Equal(3, row2024.PolicyCodeId); // 20%
        Assert.Equal(20m, row2024.TaxPercentage);
        Assert.True(row2024.IsCurrent);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_OldStageTaxAmount_IsMaxOfOldTaxAndStagedAmount()
    {
        // Arrange — basis 2000, old tax 500; 20% stage → staged = 400, old MAX wins at 500.
        // Chain: OLD_1 → OLD_2 → 20%. Start year = 2024 (current), so only one year written,
        // and it falls on the 20% stage (three policies, three years would be OLD_1/OLD_2/20%;
        // starting at year 3 of the chain means the loop assigns 20% to 2024).
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };

        // Full chain required — service seeds from Section129Old1
        var p1 = new PolicyCodeMasterEntity { Id = 1, PolicyCode = PolicyCodes.Section129Old1, PolicyName = "Old GP Rate (Year 1)", NextPolicyCodeId = 2 };
        var p2 = new PolicyCodeMasterEntity { Id = 2, PolicyCode = PolicyCodes.Section129Old2, PolicyName = "Old GP Rate (Year 2)", NextPolicyCodeId = 3 };
        var p3 = new PolicyCodeMasterEntity { Id = 3, PolicyCode = PolicyCodes.Section129_20, PolicyName = "Stage 1 (20%)" };
        var chain = new Dictionary<int, PolicyCodeMasterEntity> { [1] = p1, [2] = p2, [3] = p3 };

        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        // Start year = 2022 (default from SetupWriteLoopBase). The service writes:
        //   2022 → OLD_1, 2023 → OLD_2, 2024 → 20%.
        // The 20% row is the one whose TaxAmount is MAX(oldTax=500, staged=400)=500.
        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — the 2024 row (FinanceYearId=10) gets the 20% stage; TaxAmount = MAX(500, 400) = 500
        Assert.Equal(3, writtenRows.Count);
        var row = writtenRows.Single(r => r.FinanceYearId == 10);
        Assert.Equal(20m, row.TaxPercentage);
        Assert.Equal(400m, row.StageTaxAmount);     // 20% of 2000
        Assert.Equal(500m, row.TaxAmount);           // MAX(oldTax=500, staged=400) = 500
        Assert.Equal(500m, row.OldTaxAmount);
        Assert.Equal(2000m, row.FullBasisTaxAmount);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_TransMastCalledOncePerYear()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        var upsertTransMastCalls = new List<(int yearMasterId, int taxId, decimal amount)>();
        _mockRepository.Setup(r => r.UpsertTransMastAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<int, int, int, int, decimal, decimal, decimal?, DateTime, CancellationToken>((pid, ymid, taxId, _, amt, _, _, _, _) =>
                upsertTransMastCalls.Add((ymid, taxId, amt)))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — one UpsertTransMastAsync call per year (taxId=1, General Tax), no components
        Assert.Equal(3, upsertTransMastCalls.Count);
        Assert.All(upsertTransMastCalls, c => Assert.Equal(1, c.taxId));
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_PolicyTaxDetails_OnlyWrittenForCurrentYear()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        var supersedeCalls = new List<(int taxId, int yearMasterIdContext)>();

        // We track which year context SupersedePolicyTaxDetailAsync was called in by checking
        // that UpsertTransMastAsync for that year preceded the Supersede call.
        _mockRepository.Setup(r => r.SupersedePolicyTaxDetailAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<int, int, int, decimal, decimal?, IReadOnlyCollection<int>, DateTime, CancellationToken>((pid, taxId, _, _, _, _, _, _) =>
                supersedeCalls.Add((taxId, 0)))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — SupersedePolicyTaxDetailAsync called exactly once (for current year only, taxId=1)
        Assert.Single(supersedeCalls);
        Assert.Equal(1, supersedeCalls[0].taxId);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_Disqualified_WritesFullTaxAndMarksDisqualified()
    {
        // Arrange — AreaChanged=true with effective date in 2024, so only 2024 is disqualified
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity
        {
            PropertyId = propertyId,
            IsApplied = true,
            AreaChanged = true,
            OtherStructuralChangeEffectiveDate = new DateTime(2024, 6, 1)
        };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert
        var row2024 = writtenRows.Single(r => r.FinanceYearId == 10);
        Assert.True(row2024.IsPropertyChangeDisqualified);
        Assert.Equal(100m, row2024.TaxPercentage);
        Assert.Equal(2000m, row2024.TaxAmount); // full basis, no reduction

        // Pre-disqualification years are unaffected
        var row2022 = writtenRows.Single(r => r.FinanceYearId == 8);
        Assert.False(row2022.IsPropertyChangeDisqualified);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_ChangeEffectiveInEarlierYear_RewritesAlreadyWrittenPastYearsAt100PercentFromStoredBasis()
    {
        // Arrange — 2022 (OLD_1) and 2023 (OLD_2) were already written as staged; the officer now flags
        // an area change effective in FY 2023. 2022 must stay staged, 2023 must flip to 100% using the
        // schedule row's own stored full basis (3000), not today's basis (2000) and not the staged TransMast figure.
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity
        {
            PropertyId = propertyId,
            IsApplied = true,
            AreaChanged = true,
            OtherStructuralChangeEffectiveDate = new DateTime(2023, 6, 1)
        };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>
            {
                new() { FinanceYearId = 8, FinanceYearValue = 2022, TaxId = 1, PolicyCodeId = 1, FullBasisTaxAmount = 3000m, TaxAmount = 500m, IsPropertyChangeDisqualified = false },
                new() { FinanceYearId = 9, FinanceYearValue = 2023, TaxId = 1, PolicyCodeId = 2, FullBasisTaxAmount = 3000m, TaxAmount = 500m, IsPropertyChangeDisqualified = false },
                new() { FinanceYearId = 10, FinanceYearValue = 2024, TaxId = 1, PolicyCodeId = 3, FullBasisTaxAmount = 2000m, TaxAmount = 500m, IsPropertyChangeDisqualified = false, IsCurrent = true },
            });

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert
        var row2023 = writtenRows.Single(r => r.FinanceYearId == 9);
        Assert.True(row2023.IsPropertyChangeDisqualified);
        Assert.Equal(100m, row2023.TaxPercentage);
        Assert.Equal(3000m, row2023.TaxAmount);
        Assert.Equal(2, row2023.PolicyCodeId); // keeps its own chain position

        // 2022 predates the effective year and was not disqualified before, so it is left untouched.
        Assert.DoesNotContain(writtenRows, r => r.FinanceYearId == 8);

        // The current year is re-synced as usual and is also disqualified.
        var row2024 = writtenRows.Single(r => r.FinanceYearId == 10);
        Assert.True(row2024.IsPropertyChangeDisqualified);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_ChangeRevertedToNo_RestoresStagedAmountForPreviouslyDisqualifiedPastYear()
    {
        // Arrange — 2023 was written at 100% (disqualified) and the officer has since set every change back to No.
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>
            {
                new() { FinanceYearId = 9, FinanceYearValue = 2023, TaxId = 1, PolicyCodeId = 2, FullBasisTaxAmount = 3000m, TaxAmount = 3000m, IsPropertyChangeDisqualified = true },
                new() { FinanceYearId = 10, FinanceYearValue = 2024, TaxId = 1, PolicyCodeId = 3, FullBasisTaxAmount = 2000m, TaxAmount = 2000m, IsPropertyChangeDisqualified = true, IsCurrent = true },
            });

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — OLD_2 is a 0% stage: applicable = MAX(oldTax 500, staged 0) = 500, no longer the full 3000.
        var row2023 = writtenRows.Single(r => r.FinanceYearId == 9);
        Assert.False(row2023.IsPropertyChangeDisqualified);
        Assert.Equal(0m, row2023.TaxPercentage);
        Assert.Equal(500m, row2023.TaxAmount);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_RepositoryThrows_RollsBackTransaction()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        // Make the first UpsertScheduleRowAsync throw to simulate a mid-loop failure
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated DB failure"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.RecalculateAsync(propertyId, isFromRateableValueService: true));

        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_TaxTotalSync_CalledInGeneralTaxModeWhenComponentsExist()
    {
        // Arrange — General Tax mode with two component tax heads (edu=2, emp=3) under TaxTotal=99.
        // Start year = 2024 = current year so only one row written (current-year path only).
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };

        // Full chain required — service seeds from Section129Old1
        var p1 = new PolicyCodeMasterEntity { Id = 1, PolicyCode = PolicyCodes.Section129Old1, PolicyName = "Old GP Rate (Year 1)", NextPolicyCodeId = 2 };
        var p2 = new PolicyCodeMasterEntity { Id = 2, PolicyCode = PolicyCodes.Section129Old2, PolicyName = "Old GP Rate (Year 2)", NextPolicyCodeId = 3 };
        var p3 = new PolicyCodeMasterEntity { Id = 3, PolicyCode = PolicyCodes.Section129_20, PolicyName = "Stage 1 (20%)" };
        var chain = new Dictionary<int, PolicyCodeMasterEntity> { [1] = p1, [2] = p2, [3] = p3 };
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 1000m);

        _mockRepository.Setup(r => r.ResolveStartFinanceYearIdAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(10);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(2024);

        // Components: edu=2 (200), emp=3 (100), genTax=1 (basis 1000)
        _mockRepository.Setup(r => r.GetTaxTotalComponentTaxIdsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { 2, 3 });
        _mockRepository.Setup(r => r.GetCurrentBasisTaxAmountsAsync(propertyId, 10, It.Is<IReadOnlyCollection<int>>(ids => ids.Contains(2)), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, decimal> { [2] = 200m, [3] = 100m });

        // After loop writes, GetCurrentBasisTaxAmountsAsync for TaxTotal sync returns all 3 heads
        _mockRepository.Setup(r => r.GetCurrentBasisTaxAmountsAsync(propertyId, 10, It.Is<IReadOnlyCollection<int>>(ids => ids.Contains(1) && ids.Contains(2)), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, decimal> { [1] = 800m, [2] = 133m, [3] = 67m });

        var taxTotalUpsertAmount = 0m;
        _mockRepository.Setup(r => r.UpsertTransMastAsync(propertyId, 10, 99, It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<int, int, int, int, decimal, decimal, decimal?, DateTime, CancellationToken>((_, _, _, _, amt, _, _, _, _) => taxTotalUpsertAmount = amt)
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — TaxTotal row written with sum of all component+anchor amounts
        _mockRepository.Verify(r => r.UpsertTransMastAsync(propertyId, 10, 99, It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(1000m, taxTotalUpsertAmount); // 800+133+67
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_TaxTotalSync_NotCalledInTaxTotalMode()
    {
        // In TaxTotal mode baseTaxId IS TaxTotal — no separate sync write needed.
        // Start year = 2024 = current year so only one row written.
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };

        _mockPolicyConfigurationService
            .Setup(p => p.GetPolicyValueAsync("SECTION129_STAGE_BASE_TAXCODE", "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync("TaxTotal");

        // Full chain required — service seeds from Section129Old1
        var p1 = new PolicyCodeMasterEntity { Id = 1, PolicyCode = PolicyCodes.Section129Old1, PolicyName = "Old GP Rate (Year 1)", NextPolicyCodeId = 2 };
        var p2 = new PolicyCodeMasterEntity { Id = 2, PolicyCode = PolicyCodes.Section129Old2, PolicyName = "Old GP Rate (Year 2)", NextPolicyCodeId = 3 };
        var p3 = new PolicyCodeMasterEntity { Id = 3, PolicyCode = PolicyCodes.Section129_20, PolicyName = "Stage 1 (20%)" };
        var chain = new Dictionary<int, PolicyCodeMasterEntity> { [1] = p1, [2] = p2, [3] = p3 };
        SetupWriteLoopBase(propertyId, app, chain);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("TaxTotal", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("Tax Total", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, It.IsAny<int>(), 99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: 2000m, CalculationValue: 50000m, CalculationAnnualValue: (decimal?)40000m));
        // baseTaxCode is "TaxTotal" in this test — must mock GetOldSnapshotAsync for that code
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "TaxTotal", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(500m, 50m, new HashSet<string>()));
        _mockRepository.Setup(r => r.GetTaxTotalComponentTaxIdsAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { 1, 2, 3 });
        _mockRepository.Setup(r => r.GetCurrentBasisTaxAmountsAsync(propertyId, It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, decimal> { [1] = 800m, [2] = 133m, [3] = 67m });

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — taxId=99 is written as the anchor (base tax), NOT as a separate TaxTotal sync
        // The UpsertTransMastAsync for taxId=99 comes from the anchor write, not the sync block.
        // We verify GetCurrentBasisTaxAmountsAsync for the sync-specific allHeadIds is NOT called
        // in a way that includes taxId=99 together with component ids (which would signal the sync block fired).
        _mockRepository.Verify(r => r.GetCurrentBasisTaxAmountsAsync(
            propertyId, It.IsAny<int>(),
            It.Is<IReadOnlyCollection<int>>(ids => ids.Contains(99) && ids.Contains(1)),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_GeneralTaxMode_ExcludesTaxTotalsOwnIdFromComponentSet()
    {
        // Arrange — reproduces the live bug source: GetTaxTotalComponentTaxIdsAsync only excludes
        // whichever id it was CALLED WITH (GEN's id, in General Tax mode) — not Tax Total's own id,
        // which also carries OldTaxStatus=1 like a real component tax head. Left unfiltered, the
        // final TaxTotal-recompute sync block would read Tax Total's own TransMast value back as
        // if it were just another component to sum, inflating the recomputed total every year.
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain, basisAmount: 2000m);

        _mockRepository.Setup(r => r.GetTaxTotalComponentTaxIdsAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int> { 2, 99 }); // 2 = a real component (edu); 99 = Tax Total's OWN id (the bug)
        // 2022/2023 are backfilled (not the current year) so the component-distribution block
        // actually runs for them, same as a real property with real old-property history.
        _mockRepository.Setup(r => r.GetOldPropertyIdsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int>());

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — Tax Total's own id (99) must never appear in the id set used to recompute its own total.
        _mockRepository.Verify(r => r.GetCurrentBasisTaxAmountsAsync(
            propertyId, It.IsAny<int>(), It.Is<IReadOnlyCollection<int>>(ids => ids.Contains(99)), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_CommitsTransactionOnSuccess()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_ClearsIsCurrentFlagsAfterLoop()
    {
        // Arrange
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — ClearIsCurrentFlagsAsync called with the current year's YearMasterId
        _mockRepository.Verify(r => r.ClearIsCurrentFlagsAsync(propertyId, 10, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RecalculateAsync_WriteLoop_SkipsYearWhenNoYearMasterRow()
    {
        // Arrange — YearMaster row for 2023 missing; 2022 and 2024 should still be written
        const int propertyId = 1;
        var app = new PropertySection129ApplicationEntity { PropertyId = propertyId, IsApplied = true };
        var chain = BuildTwoStageChain();
        SetupWriteLoopBase(propertyId, app, chain);

        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null); // missing

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert — 2023 row skipped, 2022 and 2024 written
        Assert.Equal(2, writtenRows.Count);
        Assert.DoesNotContain(writtenRows, r => r.FinanceYearId == 9);
        Assert.Contains(writtenRows, r => r.FinanceYearId == 8);
        Assert.Contains(writtenRows, r => r.FinanceYearId == 10);
    }

    [Fact]
    public async Task RecalculateAsync_WhenAreaChangedWithEffectiveDate_OnlyDisqualifiesFromEffectiveYearOnward()
    {
        // Arrange
        const int propertyId = 7;
        // PropertyDetailsId must be non-null — service throws if null (FK guard).
        var header = new Section129PropertyHeaderRow("UPIC-7", "Owner", "Addr", null, "1", null, null, null, 701, null, 1);
        _mockRepository.Setup(r => r.GetPropertyHeaderAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(header);

        var app = new PropertySection129ApplicationEntity
        {
            PropertyId = propertyId,
            IsApplied = true,
            AreaChanged = true,
            OtherStructuralChangeEffectiveDate = new DateTime(2024, 10, 15) // FY 2024-25
        };
        _mockRepository.Setup(r => r.GetApplicationAsync(propertyId, It.IsAny<CancellationToken>())).ReturnsAsync(app);
        _mockRepository.Setup(r => r.GetActiveFinanceYearAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterId: 10, Year: 2024));
        _mockRepository.Setup(r => r.GetScheduleRowsAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Section129ScheduleRowProjection>());
        _mockRepository.Setup(r => r.ResolveStartFinanceYearIdAsync(propertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(8);
        _mockRepository.Setup(r => r.GetFinanceYearValueAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2022);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2022, It.IsAny<CancellationToken>())).ReturnsAsync(8);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2023, It.IsAny<CancellationToken>())).ReturnsAsync(9);
        _mockRepository.Setup(r => r.GetYearMasterIdAsync(2024, It.IsAny<CancellationToken>())).ReturnsAsync(10);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetTaxTotalComponentTaxIdsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<int>());
        _mockRepository.Setup(r => r.GetCurrentBasisTaxRowAsync(propertyId, It.IsAny<int>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxAmount: 2000m, CalculationValue: 50000m, CalculationAnnualValue: (decimal?)40000m));
        _mockRepository.Setup(r => r.GetOldSnapshotAsync(propertyId, "General Tax", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Section129OldSnapshot(500m, 50m, new HashSet<string>()));

        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("General Tax", It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("TaxTotal", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetTaxIdByCodeAsync("Tax Total", It.IsAny<CancellationToken>())).ReturnsAsync(99);
        _mockRepository.Setup(r => r.GetCurrentBasisTaxAmountsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, decimal>());

        var policy1 = new PolicyCodeMasterEntity { Id = 1, PolicyCode = PolicyCodes.Section129Old1, PolicyName = "Old GP Rate (Year 1)", NextPolicyCodeId = 2 };
        var policy2 = new PolicyCodeMasterEntity { Id = 2, PolicyCode = PolicyCodes.Section129Old2, PolicyName = "Old GP Rate (Year 2)", NextPolicyCodeId = 3 };
        var policy3 = new PolicyCodeMasterEntity { Id = 3, PolicyCode = PolicyCodes.Section129_20, PolicyName = "Stage 1 (20%)" };
        var chain = new Dictionary<int, PolicyCodeMasterEntity> { [1] = policy1, [2] = policy2, [3] = policy3 };
        _mockRepository.Setup(r => r.GetSection129PolicyChainAsync(It.IsAny<CancellationToken>())).ReturnsAsync(chain);
        _mockRepository.Setup(r => r.UpsertTransMastAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.SupersedePolicyTaxDetailAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal?>(), It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.ClearIsCurrentFlagsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(0);

        var writtenRows = new List<Section129ScheduleRowWrite>();
        _mockRepository.Setup(r => r.UpsertScheduleRowAsync(It.IsAny<Section129ScheduleRowWrite>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Callback<Section129ScheduleRowWrite, DateTime, CancellationToken>((w, _, _) => writtenRows.Add(w))
            .Returns(Task.CompletedTask);

        // Act
        await _service.RecalculateAsync(propertyId, isFromRateableValueService: true);

        // Assert
        Assert.NotEmpty(writtenRows);
        var row2022 = writtenRows.FirstOrDefault(r => r.FinanceYearId == 8);
        var row2023 = writtenRows.FirstOrDefault(r => r.FinanceYearId == 9);
        var row2024 = writtenRows.FirstOrDefault(r => r.FinanceYearId == 10);

        Assert.NotNull(row2022);
        Assert.False(row2022.IsPropertyChangeDisqualified);
        Assert.Equal(0m, row2022.TaxPercentage);

        Assert.NotNull(row2023);
        Assert.False(row2023.IsPropertyChangeDisqualified);
        Assert.Equal(0m, row2023.TaxPercentage);

        Assert.NotNull(row2024);
        Assert.True(row2024.IsPropertyChangeDisqualified);
        Assert.Equal(100m, row2024.TaxPercentage);
    }
}
