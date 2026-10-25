using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Property;

namespace NtisPlatform.Application.Services.Property;

/// <summary>
/// Service providing individual property details combining Property Overview, Property Info,
/// and Individual-level Additional Revenue / Tax metrics.
/// Applies ApartmentQcTopSectionService pattern: fetches raw property data via repository,
/// aggregates metrics, and assembles comprehensive DTO.
/// </summary>
public class PropertyIndividualService : IPropertyIndividualService
{
    private readonly IApartmentQcTopSectionRepository _repository;
    private readonly IPropertyIndividualSupplementaryRepository _supplementaryRepository;
    private readonly ApartmentQcTopSectionPerformanceCalculator _calculator;

    public PropertyIndividualService(
        IApartmentQcTopSectionRepository repository,
        IPropertyIndividualSupplementaryRepository supplementaryRepository,
        ApartmentQcTopSectionPerformanceCalculator calculator)
    {
        _repository = repository;
        _supplementaryRepository = supplementaryRepository;
        _calculator = calculator;
    }

    public async Task<PropertyIndividualDto?> GetIndividualDetailsAsync(int propertyId, CancellationToken cancellationToken = default)
    {
        // ✅ Pattern: Fetch raw property by propertyMast.id
        var property = await _repository.GetPropertyAsync(
            new ApartmentQcTopSectionQueryParameters { PropertyId = propertyId },
            cancellationToken);

        if (property is null)
        {
            return null;
        }

        // ✅ Pattern: Fetch aggregates (carpet area, built-up area) strictly scoped to this single propertyId
        var (carpetFt, carpetMtr, builtUpFt, builtUpMtr) = await _supplementaryRepository.GetAreaTotalsAsync(propertyId, cancellationToken);

        // ✅ Pattern: Fetch historical/old area totals from mapped PropertyDetailsOld
        var (oldCarpetFt, oldCarpetMtr, oldBuiltUpFt, oldBuiltUpMtr) = await _supplementaryRepository.GetOldAreaTotalsAsync(propertyId, cancellationToken);

        // ✅ Pattern: Fetch individual-only fields (OwnerTitle, Plot Area) not exposed by the
        // shared ApartmentQC top-section repository
        var supplementary = await _supplementaryRepository.GetOwnerTitleAndPlotAreaAsync(propertyId, cancellationToken);

        // ✅ Pattern: Additional-revenue tax inputs, scoped strictly to this propertyId — not the
        // Society/Ward-wide summation the shared ApartmentQC repository applies for society scope.
        var taxData = await _supplementaryRepository.GetAdditionalRevenueTaxDetailsAsync(propertyId, cancellationToken);

        // ✅ Pattern: Calculate additional revenue using shared calculator
        var additionalRevenue = _calculator.ComputeAdditionalRevenue(
            taxData.CurrentTax, taxData.RetroTax, taxData.OldTotalTax, taxData.PendingCurrent);

        // ✅ Pattern: Format property ID (ward-propertyNo-partitionNo, omit empty parts)
        var propertyIdParts = new[] { property.WardNo, property.PropertyNo, property.PartitionNo }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        var formattedPropertyNo = string.Join("-", propertyIdParts);

        // ✅ Pattern: Build structured DTO with all property details
        return new PropertyIndividualDto
        {
            PropertyId = propertyId,
            PropertyNo = formattedPropertyNo,
            UpicId = property.Upic,
            OwnerName = property.OwnerNameEnglish,
            OwnerNameRegional = property.OwnerName,
            OccupierName = property.OccupierNameEnglish,
            OccupierNameRegional = property.OccupierName,
            OwnerCategory = property.OwnerCategory,
            AadharNo = supplementary.AadharCardNo,
            OwnerTitle = supplementary.OwnerTitle,

            MobileNo = property.MobileNo,
            AlternateMobileNo = property.AlternateMobileNo,
            EmailId = property.EmailId,
            AddressEnglish = property.AddressEnglish,
            AddressRegional = property.Address,
            PinCode = property.PinCode,

            Division = property.DivisionName,
            MoujaName = property.MoujaName,
            SurveyNo = property.Csn,
            TaxZoneNo = property.TaxZoneNo,
            SubZoneNo = property.SubZoneNo,
            RateSectionName = property.RateSectionName,
            PlotNo = property.PlotNo,
            FlatOrShopNo = property.FlatOrShopNo,
            FlatOrShopName = property.FlatOrShopName,
            FlatOrShopNameEnglish = property.FlatOrShopNameEnglish,
            WingDetailId = supplementary.WingDetailId,
            WingName = supplementary.WingName,

            // ✅ Pattern: Use aggregated area values (from repository methods)
            PlotAreaFt = supplementary.PlotAreaFt,
            PlotAreaMtr = supplementary.PlotAreaMtr,
            CarpetAreasqFt = carpetFt,
            CarpetAreasqMtr = carpetMtr,
            BuiltUpAreasqFt = builtUpFt,
            BuiltUpAreasqMtr = builtUpMtr,
            OldCarpetAreaSqFeet = oldCarpetFt,
            OldCarpetAreaSqMeter = oldCarpetMtr,
            OldBuiltupAreaSqFeet = oldBuiltUpFt,
            OldBuiltupAreaSqMeter = oldBuiltUpMtr,

            CategoryId = supplementary.CategoryId,
            PropertyCategory = property.PropertyCategoryName,
            PropertyDescription = property.PropertyDescription,

            IndividualPropertyGuid = property.IndividualPropertyGuid,
            IndividualPropertyPhotoGuid = property.IndividualPropertyPhotoGuid,
            SocietyBuildingPhotoGuid = property.SocietyBuildingPhotoGuid,

            // ✅ Pattern: Map calculated revenue to DTO
            AdditionalRevenue = new PropertyIndividualRevenueDto
            {
                CurrentTax = additionalRevenue.CurrentTax,
                RetroTax = additionalRevenue.RetroTax,
                TotalTax = additionalRevenue.TotalTax,
                CurrentDemand = additionalRevenue.CurrentDemand,
                TotalDemand = additionalRevenue.TotalDemand,
                Collection = additionalRevenue.Collection,
                TotalBalance = additionalRevenue.TotalBalance,
                OldCurrentTax = additionalRevenue.OldCurrentTax,
                // Additional revenue = total tax (current + retro) - old tax, the same as the Apartment QC screen.
                DifferenceAmount = additionalRevenue.DifferenceAmount,
                ChangePercent = additionalRevenue.ChangePercent,
                PendingCurrent = additionalRevenue.PendingCurrent,
                PendingDemand = additionalRevenue.PendingDemand
            }
        };
    }

    public async Task<TopSectionUpdateOutcome> UpdateIndividualDetailsAsync(
        int propertyId,
        UpdatePropertyIndividualDto dto,
        int updatedBy,
        CancellationToken cancellationToken = default)
    {
        // ✅ Pattern: Validate fields before proceeding
        if (dto is null || !dto.HasAnyField())
        {
            return TopSectionUpdateOutcome.NoFieldsProvided;
        }

        // ✅ Pattern: Delegate directly to supplementary repository (decoupled from ApartmentQC)
        return await _supplementaryRepository.UpdateIndividualDetailsAsync(propertyId, dto, updatedBy, cancellationToken);
    }
}
