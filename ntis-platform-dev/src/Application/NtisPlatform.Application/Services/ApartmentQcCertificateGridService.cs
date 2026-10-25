using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Application-layer service for the ApartmentQC certificate grid. Uses the same identifier
/// precedence as <see cref="IApartmentQcTopSectionRepository"/>'s top-section panel, but scopes
/// the resulting grid to what the supplied identifier actually identifies (one unit, one wing, or
/// the whole apartment) rather than always expanding out to the whole apartment.
/// </summary>
public class ApartmentQcCertificateGridService : IApartmentQcCertificateGridService
{
    private readonly IApartmentQcTopSectionRepository _topSectionRepository;
    private readonly IApartmentQcCertificateGridRepository _repository;

    public ApartmentQcCertificateGridService(
        IApartmentQcTopSectionRepository topSectionRepository,
        IApartmentQcCertificateGridRepository repository)
    {
        _topSectionRepository = topSectionRepository;
        _repository = repository;
    }

    public async Task<ApartmentQcCertificateGridDto?> GetGridAsync(ApartmentQcTopSectionQueryParameters query, CancellationToken cancellationToken = default)
    {
        // 1. Explicit single-partition / single-unit request:
        // When PartitionNo or Upic is explicitly supplied without a SocietyId, scope to that specific unit.
        var isExplicitSingleUnit = !query.SocietyId.HasValue
            && (!string.IsNullOrWhiteSpace(query.PartitionNo) || !string.IsNullOrWhiteSpace(query.Upic));

        if (isExplicitSingleUnit)
        {
            var unitProperty = await _topSectionRepository.GetPropertyAsync(query, cancellationToken);
            if (unitProperty is null)
            {
                return null;
            }

            return await _repository.GetGridForUnitAsync(unitProperty.Id, cancellationToken);
        }

        // 2. PropertyId-only request (without SocietyId):
        // A bare propertyId identifies a single unit-property, so scope to that unit which includes
        // floor-level certificates. Previously this fell through to path #4 (apartment-wide) which
        // intentionally omits floor rows.
        var isPropertyIdOnly = query.PropertyId.HasValue
            && !query.SocietyId.HasValue
            && !query.WingDetailsId.HasValue
            && !(query.WardId.HasValue && !string.IsNullOrWhiteSpace(query.PropertyNo));

        if (isPropertyIdOnly)
        {
            return await _repository.GetGridForUnitAsync(query.PropertyId!.Value, cancellationToken);
        }

        // 3. Standalone wing request:
        // When WingDetailsId is supplied without SocietyId, PropertyId, or WardId+PropertyNo.
        var isWingOnly = !query.SocietyId.HasValue
            && !query.PropertyId.HasValue
            && !(query.WardId.HasValue && !string.IsNullOrWhiteSpace(query.PropertyNo))
            && query.WingDetailsId.HasValue;

        if (isWingOnly)
        {
            return await _repository.GetGridForWingAsync(query.WingDetailsId!.Value, cancellationToken);
        }

        // 4. Apartment-wide grid:
        // Resolves the property across societyId, propertyId, or ward+propertyNo,
        // and returns the complete apartment-wide grid spanning Society, Wing, and Unit level certificates.
        var property = await _topSectionRepository.GetPropertyAsync(query, cancellationToken);
        if (property is null || string.IsNullOrWhiteSpace(property.PropertyNo))
        {
            return null;
        }

        return await _repository.GetGridAsync(property.WardId, property.PropertyNo, query.SocietyId, cancellationToken);
    }
}
