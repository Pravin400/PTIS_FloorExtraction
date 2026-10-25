using System.Globalization;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Interfaces.Property;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Application.Services.Property;

/// <summary>
/// Implementation of the "Historical Property Data" use-case for the Property aggregate
/// (old property details, old taxes, and historical floor sub-sections).
/// Owns aggregate-invariant enforcement, validation, the upsert decisions and the transaction boundary;
/// persistence is delegated to <see cref="IPropertyOldDetailsRepository"/>, saving to
/// <see cref="IUnitOfWork"/>, and aggregate invariants to <see cref="IPropertyMutationInvariantPolicy"/>.
/// </summary>
public partial class PropertyOldDetailsService : IPropertyOldDetailsService
{
    private readonly IPropertyOldDetailsRepository _repository;
    private readonly IMasterRepository _masterRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPropertyMutationInvariantPolicy _invariantPolicy;

    public PropertyOldDetailsService(
        IPropertyOldDetailsRepository repository,
        IMasterRepository masterRepository,
        IUnitOfWork unitOfWork,
        IPropertyMutationInvariantPolicy invariantPolicy)
    {
        _repository = repository;
        _masterRepository = masterRepository;
        _unitOfWork = unitOfWork;
        _invariantPolicy = invariantPolicy;
    }

    // ---- Old Property Details sub-section ----

    public Task<PropertyOldDetailsDto?> GetOldDetailsAsync(int propertyId, CancellationToken cancellationToken = default)
        => _repository.GetOldDetailsAsync(propertyId, cancellationToken);

    public Task<PropertyTabHeaderInfoDto?> GetTabHeaderInfoAsync(int propertyId, CancellationToken cancellationToken = default)
        => _repository.GetTabHeaderInfoAsync(propertyId, cancellationToken);

    public async Task<PropertyOldDetailsDto?> UpdateOldDetailsAsync(int propertyId, UpdatePropertyOldDetailsDto dto, CancellationToken cancellationToken = default)
    {
        // Normalize default/placeholder values (0 or int.MaxValue) to null for optional master IDs
        if (dto.OldFloorId == 0 || dto.OldFloorId == int.MaxValue) dto.OldFloorId = null;
        if (dto.OldConstructionTypeId == 0 || dto.OldConstructionTypeId == int.MaxValue) dto.OldConstructionTypeId = null;
        if (dto.OldTypeOfUseId == 0 || dto.OldTypeOfUseId == int.MaxValue) dto.OldTypeOfUseId = null;
        if (dto.OldPropertyTypeId == 0 || dto.OldPropertyTypeId == int.MaxValue) dto.OldPropertyTypeId = null;

        // A missing property is reported as null (→ 404). Check before opening a transaction.
        var property = await _repository.GetActivePropertyAsync(propertyId, cancellationToken);
        if (property == null) return null;

        // Enforce all Property aggregate write invariants before any state change.
        await _invariantPolicy.EnforceAsync(property, cancellationToken);

        // Single timestamp: consistent across all entity fields in this operation.
        var now = DateTime.Now;

        // EnsurePropertyMastOldAsync performs an intermediate save to get the new row's PK, then
        // links it back to the parent. Both that mid-save and the final save below are wrapped in
        // one transaction so a failure at either point rolls back the entire operation atomically.
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Get or create the PropertyMastOld root, linking it back to the property when created.
            int propertyMastOldId = await _repository.EnsureMappedOldPropertyIdAsync(propertyId, cancellationToken);

            // OldSubZoneNo cannot be stored on PropertyEntity: SubZoneNo is the current property's value.

            // Update PropertyMastOld fields (only those supplied).
            var oldMastData = await _repository.GetPropertyMastOldByIdAsync(propertyMastOldId, cancellationToken);
            if (oldMastData != null)
            {
                if (dto.OldWardNo != null) oldMastData.OldWardNo = dto.OldWardNo;
                if (dto.OldPropertyNo != null) oldMastData.OldPropertyNo = dto.OldPropertyNo;
                if (dto.OldPartitionNo != null) oldMastData.OldPartitionNo = dto.OldPartitionNo;
                if (dto.OldEgovNo != null) oldMastData.OldEgovNo = dto.OldEgovNo;
                if (dto.OldPlotArea.HasValue) oldMastData.OldPlotArea = dto.OldPlotArea;
                if (dto.OldPlotNo != null) oldMastData.OldPlotNo = dto.OldPlotNo;
                if (dto.OldRV.HasValue) oldMastData.OldRV = dto.OldRV;
                if (dto.OldALV.HasValue) oldMastData.OldALV = dto.OldALV;
                if (dto.OldTotalTax.HasValue) oldMastData.OldTotalTax = dto.OldTotalTax;
                if (dto.OldZoneNo != null) oldMastData.OldZoneNo = dto.OldZoneNo;
                if (dto.OldConstructionArea != null) oldMastData.OldConstructionArea = dto.OldConstructionArea;
                if (dto.OldGeneralTax != null) oldMastData.OldGeneralTax = dto.OldGeneralTax;
                if (dto.OldCSN != null) oldMastData.OldCSN = dto.OldCSN;
                if (dto.OldPropertyTypeId.HasValue)
                {
                    if (!await _masterRepository.PropertyTypeExistsAsync(dto.OldPropertyTypeId.Value, cancellationToken))
                        throw new PropertyValidationException($"Invalid or inactive PropertyType ID: {dto.OldPropertyTypeId.Value}");
                    oldMastData.OldPropertyTypeId = dto.OldPropertyTypeId.Value;
                }
                if (dto.OldOwnerName != null) oldMastData.OldOwnerName = dto.OldOwnerName;
                if (dto.OldOccupierName != null) oldMastData.OldOccupierName = dto.OldOccupierName;
                if (dto.OldAddress != null) oldMastData.OldAddress = dto.OldAddress;
                if (dto.OldOwnerNameEnglish != null) oldMastData.OldOwnerNameEnglish = dto.OldOwnerNameEnglish;
                if (dto.OldOccupierNameEnglish != null) oldMastData.OldOccupierNameEnglish = dto.OldOccupierNameEnglish;
                if (dto.OldAddressEnglish != null) oldMastData.OldAddressEnglish = dto.OldAddressEnglish;
                if (dto.OldUseType != null) oldMastData.OldUseType = dto.OldUseType;
                if (dto.OldConstructionYear != null) oldMastData.OldConstructionYear = !string.IsNullOrWhiteSpace(dto.OldConstructionYear) ? dto.OldConstructionYear : null;
                if (dto.OldFlatOrShopNumber != null) oldMastData.OldFlatOrShopNumber = dto.OldFlatOrShopNumber;
                if (dto.OldWing != null) oldMastData.OldWing = dto.OldWing;
                if (dto.OldMobileNo != null) oldMastData.OldMobileNo = dto.OldMobileNo;
                if (dto.OldSocietyName != null) oldMastData.OldSocietyName = dto.OldSocietyName;
                if (dto.OldEmailId != null) oldMastData.OldEmailId = dto.OldEmailId;
                if (dto.OldParkingAreaSqFt.HasValue) oldMastData.OldParkingAreaSqFt = dto.OldParkingAreaSqFt;
                if (dto.OldParkingAreaSqMtr.HasValue) oldMastData.OldParkingAreaSqMtr = dto.OldParkingAreaSqMtr;
                if (dto.NoOfOldToilets.HasValue) oldMastData.NoOfOldToilets = dto.NoOfOldToilets;
                if (dto.OldTotalRooms.HasValue) oldMastData.OldTotalRooms = dto.OldTotalRooms;
                if (!string.IsNullOrWhiteSpace(dto.OldAssessmentDate))
                {
                    string[] formats = ["yyyy-MM-dd", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mm:ss.fffZ", "yyyy-MM-ddTHH:mm:ssZ"];
                    if (!DateTime.TryParseExact(dto.OldAssessmentDate.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                        throw new PropertyValidationException("Invalid OldAssessmentDate. Expected format is yyyy-MM-dd.");
                    oldMastData.OldAssessmentDate = parsedDate;
                }
                else if (dto.OldAssessmentDate != null)
                {
                    oldMastData.OldAssessmentDate = null;
                }
                oldMastData.UpdatedDate = now;
            }

            // Upsert the first PropertyDetailsOld row.
            var oldDetailsId = await _repository.GetFirstOldDetailsIdAsync(propertyMastOldId, cancellationToken);

            // Validate any master-data references supplied in this request.
            if (dto.OldFloorId.HasValue || dto.OldConstructionTypeId.HasValue || dto.OldTypeOfUseId.HasValue)
                await ValidateFloorReferencesAsync(dto.OldFloorId, null, dto.OldConstructionTypeId, dto.OldTypeOfUseId, null, cancellationToken);

            bool hasOldDetailsData = !string.IsNullOrWhiteSpace(dto.OldConstructionYear) || 
                                     (dto.OldCarpetAreaSqFeet.HasValue && dto.OldCarpetAreaSqFeet.Value > 0) ||
                                     (dto.OldCarpetAreaSqMeter.HasValue && dto.OldCarpetAreaSqMeter.Value > 0) ||
                                     dto.OldConstructionTypeId.HasValue || 
                                     dto.OldTypeOfUseId.HasValue ||
                                     dto.OldFloorId.HasValue;
            if (oldDetailsId > 0)
            {
                var oldDetailsData = await _repository.GetOldDetailsByIdAsync(oldDetailsId, cancellationToken);
                if (oldDetailsData != null)
                {
                    if (dto.OldConstructionYear != null) oldDetailsData.OldConstructionYear = dto.OldConstructionYear;
                    if (dto.OldCarpetAreaSqFeet.HasValue) oldDetailsData.OldCarpetAreaSqFeet = dto.OldCarpetAreaSqFeet;
                    if (dto.OldCarpetAreaSqMeter.HasValue) oldDetailsData.OldCarpetAreaSqMeter = dto.OldCarpetAreaSqMeter;
                    if (dto.OldConstructionTypeId.HasValue) oldDetailsData.OldConstructionTypeId = dto.OldConstructionTypeId.Value;
                    if (dto.OldTypeOfUseId.HasValue) oldDetailsData.OldTypeOfUseId = dto.OldTypeOfUseId.Value;
                    if (dto.OldFloorId.HasValue) oldDetailsData.OldFloorId = dto.OldFloorId.Value;
                    oldDetailsData.UpdatedDate = now;
                }
            }
            else if (hasOldDetailsData)
            {
                // Validate required fields before insert.
                if (!dto.OldFloorId.HasValue)
                    throw new PropertyValidationException("OldFloorId is required.");
                if (!dto.OldConstructionTypeId.HasValue)
                    throw new PropertyValidationException("OldConstructionTypeId is required.");
                if (!dto.OldTypeOfUseId.HasValue)
                    throw new PropertyValidationException("OldTypeOfUseId is required.");

                await _repository.AddOldDetailsAsync(new PropertyDetailsOldEntity
                {
                    PropertyMastOldId = propertyMastOldId,
                    OldConstructionYear = dto.OldConstructionYear,
                    OldCarpetAreaSqFeet = dto.OldCarpetAreaSqFeet,
                    OldCarpetAreaSqMeter = dto.OldCarpetAreaSqMeter,
                    OldConstructionTypeId = dto.OldConstructionTypeId.Value,
                    OldTypeOfUseId = dto.OldTypeOfUseId.Value,
                    OldFloorId = dto.OldFloorId.Value,
                    IsActive = true,
                    MarkedForDeletion = false,
                    CreatedDate = now
                }, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return await _repository.GetOldDetailsAsync(propertyId, cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

}
