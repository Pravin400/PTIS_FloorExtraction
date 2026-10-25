using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.PropertyRevision;

/// <inheritdoc cref="IPropertyRevisionSnapshotService"/>
public class PropertyRevisionSnapshotService : IPropertyRevisionSnapshotService
{
    /// <summary>
    /// RevisionPropertyMast columns that are tax-relevant per REVISION LOGIC.txt section 19.
    /// ConstructionTypeId/TypeOfUseId/AssessmentYear/BuiltupArea/CarpetArea/IsRenter live on
    /// RevisionPropertyDetails, not this table, and are handled by that table's own edit service
    /// (a later phase) - they are not part of this list.
    /// </summary>
    private static bool IsTaxRelevantChange(RevisionPropertyMastEntity current, UpdateRevisionPropertyMastDto updated) =>
        current.CategoryId != updated.CategoryId
        || current.TaxZoneId != updated.TaxZoneId
        || current.WardId != updated.WardId
        || current.PropertyTypeId != updated.PropertyTypeId;

    private readonly IRevisionPropertySnapshotRepository _snapshotRepository;
    private readonly IRevisionDraftGuardService _draftGuard;
    private readonly ICurrentUserService _currentUserService;

    public PropertyRevisionSnapshotService(
        IRevisionPropertySnapshotRepository snapshotRepository,
        IRevisionDraftGuardService draftGuard,
        ICurrentUserService currentUserService)
    {
        _snapshotRepository = snapshotRepository;
        _draftGuard = draftGuard;
        _currentUserService = currentUserService;
    }

    public async Task<RevisionPropertyMastDto> GetPropertyMastAsync(
        long revisionId, CancellationToken cancellationToken = default)
    {
        var revision = await _snapshotRepository.GetRevisionForEditAsync(revisionId, cancellationToken)
            ?? throw new RevisionNotFoundException(revisionId);

        var targetPeriodId = ResolveEditableRevisionPeriodId(revision);
        var snapshot = await GetRequiredPropertyMastSnapshotAsync(revisionId, targetPeriodId, cancellationToken);

        var isEditable = revision.RevisionStatus == RevisionStatus.DRAFT || revision.RevisionStatus == RevisionStatus.CALCULATED;
        return MapToDto(snapshot, isEditable);
    }

    public async Task<UpdateRevisionPropertyMastResultDto> UpdatePropertyMastAsync(
        long revisionId, UpdateRevisionPropertyMastDto request, CancellationToken cancellationToken = default)
    {
        var revision = await _snapshotRepository.GetRevisionForEditAsync(revisionId, cancellationToken)
            ?? throw new RevisionNotFoundException(revisionId);

        _draftGuard.EnsureEditable(revision);

        var targetPeriodId = ResolveEditableRevisionPeriodId(revision);
        var snapshot = await GetRequiredPropertyMastSnapshotAsync(revisionId, targetPeriodId, cancellationToken);

        if (request.ConcurrencyToken.HasValue && snapshot.UpdatedDate.HasValue && snapshot.UpdatedDate > request.ConcurrencyToken.Value)
        {
            throw new RevisionConflictException(
                "The property snapshot has been modified by another operation. Please reload the latest revision data and try again.");
        }

        var taxRelevantFieldChanged = IsTaxRelevantChange(snapshot, request);

        ApplyRequestToSnapshot(snapshot, request);
        snapshot.UpdatedBy = _currentUserService.GetCurrentUserId();
        snapshot.UpdatedDate = DateTime.UtcNow;

        var resetToDraft = await _draftGuard.ApplyIfTaxRelevantFieldChangedAsync(
            revision, taxRelevantFieldChanged, cancellationToken);

        await _snapshotRepository.SaveChangesAsync(cancellationToken);

        return new UpdateRevisionPropertyMastResultDto
        {
            Property = MapToDto(snapshot, isEditable: true),
            ResetToDraft = resetToDraft
        };
    }

    /// <summary>
    /// HISTORY_ONLY revisions have a single snapshot row keyed by RevisionPeriodId = null.
    /// PERIOD_WISE revisions have one row per period; only the latest (highest PeriodNo) is
    /// editable (revision_api_rules.txt / REVISION LOGIC.txt section 8) - earlier periods are
    /// historical/locked, matching the same rule already enforced for RevisionPeriod itself in
    /// Phase 1's PropertyRevisionService.MapToDetailsDto.
    /// </summary>
    private static long? ResolveEditableRevisionPeriodId(RevisionMastEntity revision)
    {
        if (revision.CalculationScope == RevisionCalculationScope.HISTORY_ONLY)
        {
            return null;
        }

        var latestPeriod = revision.Periods.OrderByDescending(p => p.PeriodNo).FirstOrDefault();
        if (latestPeriod is null)
        {
            throw new RevisionConflictException(
                $"Revision {revision.Id} is PERIOD_WISE but has no RevisionPeriod rows to edit.");
        }

        return latestPeriod.Id;
    }

    private static void ApplyRequestToSnapshot(RevisionPropertyMastEntity snapshot, UpdateRevisionPropertyMastDto request)
    {
        // IsActive is lifecycle-managed internally and must not be overwritten by normal property edit DTO
        snapshot.TaxZoneId = request.TaxZoneId;
        snapshot.WardId = request.WardId;
        snapshot.PropertyNo = request.PropertyNo;
        snapshot.PartitionNo = request.PartitionNo;
        snapshot.PropertySeqNo = request.PropertySeqNo;
        snapshot.PropertyTypeId = request.PropertyTypeId;
        snapshot.UPICId = request.UPICId;
        snapshot.OpenPlot = request.OpenPlot;
        snapshot.MoujaId = request.MoujaId;
        snapshot.CSN = request.CSN;
        snapshot.SubZoneNo = request.SubZoneNo;
        snapshot.PlotNo = request.PlotNo;
        snapshot.CategoryId = request.CategoryId;
        snapshot.Type = request.Type;
        snapshot.OwnerTitle = request.OwnerTitle;
        snapshot.OwnerName = request.OwnerName;
        snapshot.OccupierTitle = request.OccupierTitle;
        snapshot.OccupierName = request.OccupierName;
        snapshot.FlatOrShopNo = request.FlatOrShopNo;
        snapshot.FlatOrShopName = request.FlatOrShopName;
        snapshot.Address = request.Address;
        snapshot.PinCode = request.PinCode;
        snapshot.Location = request.Location;
        snapshot.MobileNo = request.MobileNo;
        snapshot.MobileNoRemarkId = request.MobileNoRemarkId;
        snapshot.AlternateMobileNo = request.AlternateMobileNo;
        snapshot.OccupierMobileNo = request.OccupierMobileNo;
        snapshot.OccupierMobileNoRemarkId = request.OccupierMobileNoRemarkId;
        snapshot.EmailId = request.EmailId;
        snapshot.WingDetailId = request.WingDetailId;
        snapshot.OwnerTitleEnglish = request.OwnerTitleEnglish;
        snapshot.OwnerNameEnglish = request.OwnerNameEnglish;
        snapshot.OccupierTitleEnglish = request.OccupierTitleEnglish;
        snapshot.OccupierNameEnglish = request.OccupierNameEnglish;
        snapshot.FlatOrShopNoEnglish = request.FlatOrShopNoEnglish;
        snapshot.FlatOrShopNameEnglish = request.FlatOrShopNameEnglish;
        snapshot.AddressEnglish = request.AddressEnglish;
        snapshot.LocationEnglish = request.LocationEnglish;
        snapshot.PropertyAssessmentStatusId = request.PropertyAssessmentStatusId;
        snapshot.PropertyFloorId = request.PropertyFloorId;
    }

    private static RevisionPropertyMastDto MapToDto(RevisionPropertyMastEntity snapshot, bool isEditable = true) => new()
    {
        Id = snapshot.Id,
        IsActive = snapshot.IsActive,
        CreatedDate = snapshot.CreatedDate,
        UpdatedDate = snapshot.UpdatedDate,
        RevisionPropertyMastId = snapshot.Id,
        RevisionId = snapshot.RevisionMastId,
        RevisionPeriodId = snapshot.RevisionPeriodId,
        SourcePropertyId = snapshot.SourcePropertyId,
        TaxZoneId = snapshot.TaxZoneId,
        WardId = snapshot.WardId,
        PropertyNo = snapshot.PropertyNo,
        PartitionNo = snapshot.PartitionNo,
        PropertySeqNo = snapshot.PropertySeqNo,
        PropertyTypeId = snapshot.PropertyTypeId,
        UPICId = snapshot.UPICId,
        OpenPlot = snapshot.OpenPlot,
        MoujaId = snapshot.MoujaId,
        CSN = snapshot.CSN,
        SubZoneNo = snapshot.SubZoneNo,
        PlotNo = snapshot.PlotNo,
        CategoryId = snapshot.CategoryId,
        Type = snapshot.Type,
        OwnerTitle = snapshot.OwnerTitle,
        OwnerName = snapshot.OwnerName,
        OccupierTitle = snapshot.OccupierTitle,
        OccupierName = snapshot.OccupierName,
        FlatOrShopNo = snapshot.FlatOrShopNo,
        FlatOrShopName = snapshot.FlatOrShopName,
        Address = snapshot.Address,
        PinCode = snapshot.PinCode,
        Location = snapshot.Location,
        MobileNo = snapshot.MobileNo,
        MobileNoRemarkId = snapshot.MobileNoRemarkId,
        AlternateMobileNo = snapshot.AlternateMobileNo,
        OccupierMobileNo = snapshot.OccupierMobileNo,
        OccupierMobileNoRemarkId = snapshot.OccupierMobileNoRemarkId,
        EmailId = snapshot.EmailId,
        WingDetailId = snapshot.WingDetailId,
        OwnerTitleEnglish = snapshot.OwnerTitleEnglish,
        OwnerNameEnglish = snapshot.OwnerNameEnglish,
        OccupierTitleEnglish = snapshot.OccupierTitleEnglish,
        OccupierNameEnglish = snapshot.OccupierNameEnglish,
        FlatOrShopNoEnglish = snapshot.FlatOrShopNoEnglish,
        FlatOrShopNameEnglish = snapshot.FlatOrShopNameEnglish,
        AddressEnglish = snapshot.AddressEnglish,
        LocationEnglish = snapshot.LocationEnglish,
        PropertyAssessmentStatusId = snapshot.PropertyAssessmentStatusId,
        PropertyFloorId = snapshot.PropertyFloorId,
        IsEditable = isEditable
    };

    private async Task<RevisionPropertyMastEntity> GetRequiredPropertyMastSnapshotAsync(
        long revisionId, long? targetPeriodId, CancellationToken cancellationToken)
    {
        return await _snapshotRepository.GetPropertyMastAsync(revisionId, targetPeriodId, cancellationToken)
            ?? throw new RevisionConflictException(
                $"Revision {revisionId} has no RevisionPropertyMast snapshot row to edit. " +
                "This should have been created by usp_Revision_Begin when the revision was opened.");
    }
}
