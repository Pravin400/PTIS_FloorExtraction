using AutoMapper;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Asset_Management.AssetAssessmentYearRangeMasterCV;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Mappings.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Services.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

/// <summary>
/// Service-level tests for <see cref="AssetAssessmentYearRangeCVService"/> covering the
/// FromYear/ToYear range validation, duplicate-range and overlapping-range checks on both
/// Create and Update, plus the reference-validation gate on deactivation.
/// </summary>
public class AssetAssessmentYearRangeCVServiceTests
{
    private readonly Mock<IRepository<AssetAssessmentYearRangeMasterCVEntity, int>> _mockRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IReferenceValidationService> _mockReferenceValidator;
    private readonly IMapper _mapper;
    private readonly AssetAssessmentYearRangeCVService _service;

    public AssetAssessmentYearRangeCVServiceTests()
    {
        _mockRepository = new Mock<IRepository<AssetAssessmentYearRangeMasterCVEntity, int>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockReferenceValidator = new Mock<IReferenceValidationService>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AssetAssessmentYearRangeCVMappingProfile>();
        }, Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();

        _mockUnitOfWork.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new AssetAssessmentYearRangeCVService(
            _mockRepository.Object,
            _mockUnitOfWork.Object,
            _mapper,
            _mockReferenceValidator.Object);
    }

    private void SetupExistingRows(params AssetAssessmentYearRangeMasterCVEntity[] rows)
    {
        var mockQuery = rows.ToList().BuildMockDbSet();
        _mockRepository.Setup(r => r.GetQueryable()).Returns(mockQuery.Object);
    }

    #region Create - Year Range Validation

    [Fact]
    public async Task CreateAsync_WithFromYearLessThanToYear_Succeeds()
    {
        SetupExistingRows();
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2000, ToYear = 2005 };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2000, result.FromYear);
        Assert.Equal(2005, result.ToYear);
    }

    [Fact]
    public async Task CreateAsync_WithFromYearEqualToToYear_Succeeds()
    {
        SetupExistingRows();
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2005, ToYear = 2005 };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2005, result.FromYear);
        Assert.Equal(2005, result.ToYear);
    }

    [Fact]
    public async Task CreateAsync_WithFromYearGreaterThanToYear_ThrowsValidationException()
    {
        SetupExistingRows();
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2010, ToYear = 2005 };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("AssessmentYearRangeCV_ToYear_BeforeFromYear", ex.Errors.Values);
    }

    #endregion

    #region Create - Duplicate Range Validation

    [Fact]
    public async Task CreateAsync_WithDuplicateRange_ThrowsValidationException()
    {
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity
        {
            Id = 1,
            FromYear = 2000,
            ToYear = 2005,
            IsActive = true
        });

        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2000, ToYear = 2005 };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Equal("Assessment Year Range '2000-2005' already exists.", ex.Errors[nameof(createDto.ToYear)]);
        Assert.Equal("Assessment Year Range '2000-2005' already exists.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateOfRangeMarkedForDeletion_StillThrowsDuplicate()
    {
        // UQ_AssessmentYearRangeMaster_FromYear_ToYear also covers soft-deleted rows.
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity
        {
            Id = 1, FromYear = 2020, ToYear = 2025, IsActive = false, MarkedForDeletion = true
        });

        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2020, ToYear = 2025 };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("Assessment Year Range '2020-2025' already exists.", ex.Errors.Values);
    }

    #endregion

    #region Create - Overlapping Range Validation

    [Theory]
    [InlineData(2021, 2024)] // fully inside
    [InlineData(2022, 2022)] // single year inside
    [InlineData(2018, 2021)] // overlaps the start
    [InlineData(2024, 2030)] // overlaps the end
    [InlineData(2015, 2030)] // encloses the existing range
    [InlineData(2020, 2024)] // same start, shorter
    [InlineData(2021, 2025)] // same end, shorter
    [InlineData(2025, 2030)] // shares the last year (ranges are inclusive)
    [InlineData(2015, 2020)] // shares the first year
    public async Task CreateAsync_WithRangeOverlappingExistingRange_ThrowsValidationException(int fromYear, int toYear)
    {
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025, IsActive = true });
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = fromYear, ToYear = toYear };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Equal($"Assessment Year Range '{fromYear}-{toYear}' overlaps an existing year range.", ex.Errors[nameof(createDto.ToYear)]);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<AssetAssessmentYearRangeMasterCVEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(2026, 2030)] // starts the year after the existing range ends
    [InlineData(2015, 2019)] // ends the year before the existing range starts
    [InlineData(2026, 2026)] // single year right after
    [InlineData(2019, 2019)] // single year right before
    [InlineData(1990, 2000)] // far before
    public async Task CreateAsync_WithRangeOutsideExistingRange_Succeeds(int fromYear, int toYear)
    {
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025, IsActive = true });
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = fromYear, ToYear = toYear };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.Equal(fromYear, result.FromYear);
        Assert.Equal(toYear, result.ToYear);
    }

    [Fact]
    public async Task CreateAsync_WithRangeOverlappingInactiveRange_ThrowsValidationException()
    {
        // Inactive ranges can be reactivated, so they still reserve their years.
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity { Id = 6, FromYear = 2020, ToYear = 2025, IsActive = false });
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2021, ToYear = 2023 };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(createDto, CancellationToken.None));

        Assert.Contains("Assessment Year Range '2021-2023' overlaps an existing year range.", ex.Errors.Values);
    }

    [Fact]
    public async Task CreateAsync_WithRangeOverlappingRangeMarkedForDeletion_Succeeds()
    {
        SetupExistingRows(new AssetAssessmentYearRangeMasterCVEntity
        {
            Id = 1, FromYear = 2020, ToYear = 2025, IsActive = false, MarkedForDeletion = true, MarkedForDeletionDate = DateTime.Now
        });
        var createDto = new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2020, ToYear = 2024 };

        var result = await _service.CreateAsync(createDto, CancellationToken.None);

        Assert.Equal(2020, result.FromYear);
        Assert.Equal(2024, result.ToYear);
    }

    [Fact]
    public async Task CreateAsync_WithSeveralExistingRanges_OnlyGapOrTailIsAllowed()
    {
        SetupExistingRows(
            new AssetAssessmentYearRangeMasterCVEntity { Id = 2, FromYear = 2005, ToYear = 2015, IsActive = false },
            new AssetAssessmentYearRangeMasterCVEntity { Id = 7, FromYear = 2026, ToYear = 2030, IsActive = true });

        var gap = await _service.CreateAsync(new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2016, ToYear = 2025 }, CancellationToken.None);
        Assert.Equal(2016, gap.FromYear);

        var tail = await _service.CreateAsync(new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2031, ToYear = 2035 }, CancellationToken.None);
        Assert.Equal(2031, tail.FromYear);

        var spanning = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(new CreateAssetAssessmentYearRangeMasterCVDto { FromYear = 2014, ToYear = 2027 }, CancellationToken.None));
        Assert.Contains("Assessment Year Range '2014-2027' overlaps an existing year range.", spanning.Errors.Values);
    }

    #endregion

    #region Update - Year Range Validation

    [Fact]
    public async Task UpdateAsync_WithFromYearLessThanToYear_Succeeds()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2001, ToYear = 2006, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2001, result!.FromYear);
        Assert.Equal(2006, result.ToYear);
    }

    [Fact]
    public async Task UpdateAsync_WithFromYearEqualToToYear_Succeeds()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2007, ToYear = 2007, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2007, result!.FromYear);
        Assert.Equal(2007, result.ToYear);
    }

    [Fact]
    public async Task UpdateAsync_WithFromYearGreaterThanToYear_ThrowsValidationException()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2010, ToYear = 2005, IsActive = true };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Contains("AssessmentYearRangeCV_ToYear_BeforeFromYear", ex.Errors.Values);
    }

    #endregion

    #region Update - Duplicate Range Validation (excluding self)

    [Fact]
    public async Task UpdateAsync_WithRangeClashingAgainstAnotherRecord_ThrowsValidationException()
    {
        var recordBeingUpdated = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        var otherRecord = new AssetAssessmentYearRangeMasterCVEntity { Id = 2, FromYear = 2006, ToYear = 2010, IsActive = true };
        SetupExistingRows(recordBeingUpdated, otherRecord);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(recordBeingUpdated);

        // Attempt to change record 1's range so it collides with record 2's range
        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2006, ToYear = 2010, IsActive = true };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Contains("Assessment Year Range '2006-2010' already exists.", ex.Errors.Values);
        Assert.Equal("Assessment Year Range '2006-2010' already exists.", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_KeepingOwnRangeUnchanged_DoesNotThrowDuplicateException()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        // Same FromYear/ToYear as itself — the duplicate check must exclude the current ID
        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2000, ToYear = 2005, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(2000, result!.FromYear);
        Assert.Equal(2005, result.ToYear);
    }

    #endregion

    #region Update - Overlapping Range Validation (excluding self)

    [Theory]
    [InlineData(2024, 2027)] // extends into the other record's start
    [InlineData(2026, 2028)] // moves inside the other record
    [InlineData(2020, 2035)] // grows to enclose the other record
    public async Task UpdateAsync_MovingRangeOntoAnotherRecord_ThrowsValidationException(int fromYear, int toYear)
    {
        var recordBeingUpdated = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025, IsActive = true };
        var otherRecord = new AssetAssessmentYearRangeMasterCVEntity { Id = 2, FromYear = 2026, ToYear = 2030, IsActive = true };
        SetupExistingRows(recordBeingUpdated, otherRecord);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(recordBeingUpdated);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = fromYear, ToYear = toYear, IsActive = true };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));

        Assert.Contains($"Assessment Year Range '{fromYear}-{toYear}' overlaps an existing year range.", ex.Errors.Values);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<AssetAssessmentYearRangeMasterCVEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ChangingYearsOverlappingOnlyItsOwnOldRange_Succeeds()
    {
        var recordBeingUpdated = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025, IsActive = true };
        var otherRecord = new AssetAssessmentYearRangeMasterCVEntity { Id = 2, FromYear = 2026, ToYear = 2030, IsActive = true };
        SetupExistingRows(recordBeingUpdated, otherRecord);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(recordBeingUpdated);

        // Shrinks and shifts within the old range, still ending before record 2 starts.
        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2018, ToYear = 2025, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(2018, result!.FromYear);
        Assert.Equal(2025, result.ToYear);
    }

    [Fact]
    public async Task UpdateAsync_MovingRangeOntoRecordMarkedForDeletion_Succeeds()
    {
        var recordBeingUpdated = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2020, ToYear = 2025, IsActive = true };
        var deletedRecord = new AssetAssessmentYearRangeMasterCVEntity { Id = 2, FromYear = 2026, ToYear = 2030, IsActive = false, MarkedForDeletion = true };
        SetupExistingRows(recordBeingUpdated, deletedRecord);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(recordBeingUpdated);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2020, ToYear = 2028, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.Equal(2028, result!.ToYear);
    }

    [Fact]
    public async Task UpdateAsync_LegacyOverlappingRowWithUnchangedYears_CanStillBeActivated()
    {
        // Mirrors the seed data, where Id 1 (2016-2025) and Id 6 (2020-2025) already overlap.
        var legacyWide = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2016, ToYear = 2025, IsActive = false };
        var legacyNarrow = new AssetAssessmentYearRangeMasterCVEntity { Id = 6, FromYear = 2020, ToYear = 2025, IsActive = false };
        SetupExistingRows(legacyWide, legacyNarrow);
        _mockRepository.Setup(r => r.GetByIdAsync(6, It.IsAny<CancellationToken>())).ReturnsAsync(legacyNarrow);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2020, ToYear = 2025, IsActive = true };

        var result = await _service.UpdateAsync(6, updateDto, CancellationToken.None);

        Assert.True(result!.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_LegacyOverlappingRowWithChangedYears_IsValidatedForOverlap()
    {
        var legacyWide = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2016, ToYear = 2025, IsActive = false };
        var legacyNarrow = new AssetAssessmentYearRangeMasterCVEntity { Id = 6, FromYear = 2020, ToYear = 2025, IsActive = false };
        SetupExistingRows(legacyWide, legacyNarrow);
        _mockRepository.Setup(r => r.GetByIdAsync(6, It.IsAny<CancellationToken>())).ReturnsAsync(legacyNarrow);

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2021, ToYear = 2025, IsActive = false };

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(6, updateDto, CancellationToken.None));

        Assert.Contains("Assessment Year Range '2021-2025' overlaps an existing year range.", ex.Errors.Values);
    }

    #endregion

    #region Update - Deactivation Reference Validation

    [Fact]
    public async Task UpdateAsync_DeactivatingUnreferencedRecord_Succeeds()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<AssetAssessmentYearRangeMasterCVEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Success());

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2000, ToYear = 2005, IsActive = false };

        var result = await _service.UpdateAsync(1, updateDto, CancellationToken.None);

        Assert.NotNull(result);
        Assert.False(result!.IsActive);
        _mockReferenceValidator.Verify(
            v => v.ValidateReferencesAsync<AssetAssessmentYearRangeMasterCVEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_DeactivatingReferencedRecord_ThrowsValidationException()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        _mockReferenceValidator
            .Setup(v => v.ValidateReferencesAsync<AssetAssessmentYearRangeMasterCVEntity>(1, ReferenceValidationOperation.Deactivate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidationResult.Failure("Id", "Cannot deactivate - record is referenced by other entities"));

        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2000, ToYear = 2005, IsActive = false };

        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.UpdateAsync(1, updateDto, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WithCancellationToken_PropagatesTokenToDuplicateQuery()
    {
        var existing = new AssetAssessmentYearRangeMasterCVEntity { Id = 1, FromYear = 2000, ToYear = 2005, IsActive = true };
        SetupExistingRows(existing);
        _mockRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

        using var cts = new CancellationTokenSource();
        var updateDto = new UpdateAssetAssessmentYearRangeMasterCVDto { FromYear = 2001, ToYear = 2006, IsActive = true };

        var result = await _service.UpdateAsync(1, updateDto, cts.Token);

        Assert.NotNull(result);
        _mockRepository.Verify(r => r.GetByIdAsync(1, cts.Token), Times.Once);
    }

    #endregion
}
