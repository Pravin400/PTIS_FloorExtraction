using Moq;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.PropertyRevision;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class PropertyRevisionSnapshotServiceTests
{
    private readonly Mock<IRevisionPropertySnapshotRepository> _mockSnapshotRepository;
    private readonly Mock<IRevisionDraftGuardService> _mockDraftGuard;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly PropertyRevisionSnapshotService _service;

    private const long RevisionId = 5001;
    private const long PropertyMastId = 9001;
    private const int UserId = 42;

    public PropertyRevisionSnapshotServiceTests()
    {
        _mockSnapshotRepository = new Mock<IRevisionPropertySnapshotRepository>();
        _mockDraftGuard = new Mock<IRevisionDraftGuardService>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(s => s.GetCurrentUserId()).Returns(UserId);

        _service = new PropertyRevisionSnapshotService(
            _mockSnapshotRepository.Object,
            _mockDraftGuard.Object,
            _mockCurrentUserService.Object);
    }

    private static RevisionMastEntity HistoryOnlyRevision(RevisionStatus status = RevisionStatus.DRAFT) => new()
    {
        Id = RevisionId,
        PropertyId = 1487254,
        FinanceYearId = 1,
        RevisionNo = 1,
        RevisionType = "AREA_CHANGE",
        CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
        RevisionStatus = status,
        Periods = new List<RevisionPeriodEntity>()
    };

    private static RevisionMastEntity PeriodWiseRevision(RevisionStatus status, params int[] periodNumbers)
    {
        var revision = new RevisionMastEntity
        {
            Id = RevisionId,
            PropertyId = 1487254,
            FinanceYearId = 1,
            RevisionNo = 2,
            RevisionType = "USE_CHANGE",
            CalculationScope = RevisionCalculationScope.PERIOD_WISE,
            RevisionStatus = status,
        };
        revision.Periods = periodNumbers
            .Select(n => new RevisionPeriodEntity { Id = 7000 + n, RevisionMastId = RevisionId, PeriodNo = n })
            .ToList();
        return revision;
    }

    private static RevisionPropertyMastEntity Snapshot(long? revisionPeriodId = null) => new()
    {
        Id = PropertyMastId,
        RevisionMastId = RevisionId,
        RevisionPeriodId = revisionPeriodId,
        SourcePropertyId = 1487254,
        TaxZoneId = 1,
        WardId = 1,
        PropertySeqNo = 1,
        CategoryId = 10
    };

    private static UpdateRevisionPropertyMastDto UpdateRequest(int taxZoneId = 1, int wardId = 1, int? categoryId = 10) => new()
    {
        TaxZoneId = taxZoneId,
        WardId = wardId,
        PropertySeqNo = 1,
        CategoryId = categoryId
    };

    [Fact]
    public async Task GetPropertyMastAsync_UnknownRevision_ThrowsRevisionNotFoundException()
    {
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RevisionMastEntity?)null);

        await Assert.ThrowsAsync<RevisionNotFoundException>(() => _service.GetPropertyMastAsync(999));
    }

    [Fact]
    public async Task GetPropertyMastAsync_HistoryOnly_LooksUpNullPeriodRow()
    {
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HistoryOnlyRevision());
        _mockSnapshotRepository
            .Setup(r => r.GetPropertyMastAsync(RevisionId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Snapshot());

        var result = await _service.GetPropertyMastAsync(RevisionId);

        Assert.Equal(PropertyMastId, result.RevisionPropertyMastId);
        Assert.Null(result.RevisionPeriodId);
    }

    [Fact]
    public async Task GetPropertyMastAsync_PeriodWise_LooksUpLatestPeriodRow()
    {
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PeriodWiseRevision(RevisionStatus.DRAFT, 1, 2));
        _mockSnapshotRepository
            .Setup(r => r.GetPropertyMastAsync(RevisionId, 7002, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Snapshot(7002));

        var result = await _service.GetPropertyMastAsync(RevisionId);

        Assert.Equal(7002, result.RevisionPeriodId);
    }

    [Fact]
    public async Task GetPropertyMastAsync_MissingSnapshotRow_ThrowsRevisionConflictException()
    {
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HistoryOnlyRevision());
        _mockSnapshotRepository
            .Setup(r => r.GetPropertyMastAsync(RevisionId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RevisionPropertyMastEntity?)null);

        await Assert.ThrowsAsync<RevisionConflictException>(() => _service.GetPropertyMastAsync(RevisionId));
    }

    [Fact]
    public async Task UpdatePropertyMastAsync_ApprovedRevision_ThrowsRevisionConflictException_ViaDraftGuard()
    {
        var revision = HistoryOnlyRevision(RevisionStatus.APPROVED);
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revision);
        _mockDraftGuard
            .Setup(g => g.EnsureEditable(revision))
            .Throws(new RevisionConflictException($"Revision {RevisionId} is APPROVED and can no longer be edited."));

        await Assert.ThrowsAsync<RevisionConflictException>(
            () => _service.UpdatePropertyMastAsync(RevisionId, UpdateRequest()));

        _mockSnapshotRepository.Verify(
            r => r.GetPropertyMastAsync(It.IsAny<long>(), It.IsAny<long?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdatePropertyMastAsync_PeriodWiseWithNoPeriods_ThrowsRevisionConflictException()
    {
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PeriodWiseRevision(RevisionStatus.DRAFT));

        await Assert.ThrowsAsync<RevisionConflictException>(
            () => _service.UpdatePropertyMastAsync(RevisionId, UpdateRequest()));
    }

    [Fact]
    public async Task UpdatePropertyMastAsync_TaxRelevantFieldChanged_CallsDraftGuardWithTrue_AndReturnsResetFlag()
    {
        var revision = HistoryOnlyRevision(RevisionStatus.CALCULATED);
        var snapshot = Snapshot(); // TaxZoneId = 1, WardId = 1, CategoryId = 10
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revision);
        _mockSnapshotRepository
            .Setup(r => r.GetPropertyMastAsync(RevisionId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        _mockDraftGuard
            .Setup(g => g.ApplyIfTaxRelevantFieldChangedAsync(revision, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = UpdateRequest(taxZoneId: 2); // TaxZoneId changed 1 -> 2

        var result = await _service.UpdatePropertyMastAsync(RevisionId, request);

        Assert.True(result.ResetToDraft);
        Assert.Equal(2, result.Property.TaxZoneId);
        _mockDraftGuard.Verify(
            g => g.ApplyIfTaxRelevantFieldChangedAsync(revision, true, It.IsAny<CancellationToken>()),
            Times.Once);
        _mockSnapshotRepository.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePropertyMastAsync_NoTaxRelevantFieldChanged_CallsDraftGuardWithFalse()
    {
        var revision = HistoryOnlyRevision(RevisionStatus.CALCULATED);
        var snapshot = Snapshot(); // TaxZoneId = 1, WardId = 1, CategoryId = 10, PropertyNo = null
        _mockSnapshotRepository
            .Setup(r => r.GetRevisionForEditAsync(RevisionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revision);
        _mockSnapshotRepository
            .Setup(r => r.GetPropertyMastAsync(RevisionId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        _mockDraftGuard
            .Setup(g => g.ApplyIfTaxRelevantFieldChangedAsync(revision, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var request = UpdateRequest(); // same TaxZoneId/WardId/CategoryId, only a non-tax field would differ
        request.PropertyNo = "NEW-123";

        var result = await _service.UpdatePropertyMastAsync(RevisionId, request);

        Assert.False(result.ResetToDraft);
        Assert.Equal("NEW-123", result.Property.PropertyNo);
        _mockDraftGuard.Verify(
            g => g.ApplyIfTaxRelevantFieldChangedAsync(revision, false, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
