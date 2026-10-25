using NtisPlatform.Application.DTOs.Property.ApartmentTaxDetails;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Application-layer service for the apartment tax-details panel. Assembles raw data fetched via
/// <see cref="IApartmentTaxDetailsRepository"/> into the API-facing DTO shape.
/// </summary>
public class ApartmentTaxDetailsService : IApartmentTaxDetailsService
{
    private readonly IApartmentTaxDetailsRepository _repository;

    public ApartmentTaxDetailsService(IApartmentTaxDetailsRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApartmentTaxDetailsDto?> GetTaxDetailsAsync(ApartmentTaxDetailsQueryParameters query, CancellationToken cancellationToken = default)
    {
        var raw = await _repository.GetTaxDetailsAsync(query, cancellationToken);
        if (raw is null)
        {
            return null;
        }

        return new ApartmentTaxDetailsDto
        {
            WardId = query.WardId,
            PropertyNo = query.PropertyNo,
            WingMasterId = raw.WingMasterId,
            WingName = raw.WingName,
            WingNo = raw.WingNo,
            SocietyName = raw.SocietyName,
            PropertyCount = raw.PropertyCount,
            CurrentTaxes = raw.CurrentTaxes,
            Arrears = raw.Arrears,
        };
    }

    public async Task<ApartmentDemandDetailsDto?> GetDemandDetailsAsync(ApartmentTaxDetailsQueryParameters query, CancellationToken cancellationToken = default)
    {
        var raw = await _repository.GetDemandDetailsAsync(query, cancellationToken);
        if (raw is null)
        {
            return null;
        }

        return new ApartmentDemandDetailsDto
        {
            WardId = query.WardId,
            PropertyNo = query.PropertyNo,
            WingMasterId = raw.WingMasterId,
            WingName = raw.WingName,
            WingNo = raw.WingNo,
            SocietyName = raw.SocietyName,
            PropertyCount = raw.PropertyCount,
            DemandTaxes = raw.DemandTaxes,
        };
    }

    public async Task<ApartmentYearWiseTaxDetailsDto?> GetYearWiseTaxDetailsAsync(ApartmentYearWiseTaxDetailsQueryParameters query, CancellationToken cancellationToken = default)
    {
        var raw = await _repository.GetYearWiseTaxDetailsAsync(query, cancellationToken);
        if (raw is null)
        {
            return null;
        }

        return new ApartmentYearWiseTaxDetailsDto
        {
            WardId = query.WardId,
            PropertyNo = query.PropertyNo,
            WingMasterId = raw.WingMasterId,
            WingName = raw.WingName,
            WingNo = raw.WingNo,
            SocietyName = raw.SocietyName,
            PropertyCount = raw.PropertyCount,
            FinanceYearId = query.FinanceYearId,
            FinanceYear = raw.FinanceYear,
            YearWiseTaxes = raw.YearWiseTaxes,
        };
    }
}
