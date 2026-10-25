using Moq;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.DTOs.Property.ApartmentQcTopSection;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Property;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Services.Property;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class PropertyIndividualServiceTests
{
    [Fact]
    public async Task GetIndividualDetailsAsync_PropertyExists_CombinesAreaAndRevenue()
    {
        // Arrange
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        var rawData = new PropertyTopSectionRawData
        {
            Id = 100,
            Upic = "UPIC-270465-2024-000123",
            WardNo = "270465",
            PropertyNo = "2024",
            PartitionNo = "000123",
            OwnerName = "मातोश्री बिल्डर्स",
            OwnerNameEnglish = "MATOSHREE BUILDERS",
            OccupierName = "मातोश्री बिल्डर्स",
            OccupierNameEnglish = "MATOSHREE BUILDERS",
            OwnerCategory = "Individual",
            AadharCardNo = "XXXX-XXXX-8902",
            DivisionName = "कोपरी",
            MoujaName = "Kopri",
            Csn = "CSN005A",
            TaxZoneNo = "1",
            TaxZoneRemark = "KOLSHEET",
            SubZoneNo = "SZ01",
            RateSectionName = "RateSection_4",
            PlotNo = "55",
            FlatOrShopNo = "101",
            FlatOrShopName = "दुकान १",
            FlatOrShopNameEnglish = "Shop 1",
            MobileNo = "+91 98765 43210",
            AlternateMobileNo = "+91 98765 00000",
            EmailId = "contact@matoshreebuilders.in",
            Address = "Plot No. 55, Kopri",
            AddressEnglish = "Plot No. 55, Kopri English",
            PinCode = "400603",
            PropertyCategoryName = "Individual",
            PropertyDescription = "निवासी"
        };

        repositoryMock.Setup(r => r.GetPropertyAsync(It.IsAny<ApartmentQcTopSectionQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(rawData);

        supplementaryRepoMock.Setup(s => s.GetAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((538.20, 50.00, 538.20, 50.00));

        supplementaryRepoMock.Setup(s => s.GetOldAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((8944.17, 830.94, 10733.00, 997.13));

        supplementaryRepoMock.Setup(s => s.GetOwnerTitleAndPlotAreaAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyIndividualSupplementaryData("M/S", "M/S", 4305.60, 400.00, "XXXX-XXXX-8902", 1, 10, "6D"));

        supplementaryRepoMock.Setup(s => s.GetAdditionalRevenueTaxDetailsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyIndividualTaxData(70400m, 113000m, 0m, 50000m));

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        // Act
        var result = await service.GetIndividualDetailsAsync(100);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result!.PropertyId);
        Assert.Equal("270465-2024-000123", result.PropertyNo);
        Assert.Equal("UPIC-270465-2024-000123", result.UpicId);
        Assert.Equal("MATOSHREE BUILDERS", result.OwnerName);
        Assert.Equal("मातोश्री बिल्डर्स", result.OwnerNameRegional);
        Assert.Equal("MATOSHREE BUILDERS", result.OccupierName);
        Assert.Equal("मातोश्री बिल्डर्स", result.OccupierNameRegional);
        Assert.Equal("Individual", result.OwnerCategory);
        Assert.Equal("XXXX-XXXX-8902", result.AadharNo);
        Assert.Equal("M/S", result.OwnerTitle);
        Assert.Equal("कोपरी", result.Division);
        Assert.Equal("Kopri", result.MoujaName);
        Assert.Equal("CSN005A", result.SurveyNo);
        Assert.Equal("1", result.TaxZoneNo);
        Assert.Equal("SZ01", result.SubZoneNo);
        Assert.Equal("RateSection_4", result.RateSectionName);
        Assert.Equal("55", result.PlotNo);
        Assert.Equal("101", result.FlatOrShopNo);
        Assert.Equal("दुकान १", result.FlatOrShopName);
        Assert.Equal("Shop 1", result.FlatOrShopNameEnglish);
        Assert.Equal(1, result.CategoryId);
        Assert.Equal(10, result.WingDetailId);
        Assert.Equal("6D", result.WingName);
        Assert.Equal("+91 98765 43210", result.MobileNo);
        Assert.Equal("+91 98765 00000", result.AlternateMobileNo);
        Assert.Equal("contact@matoshreebuilders.in", result.EmailId);
        Assert.Equal("Plot No. 55, Kopri English", result.AddressEnglish);
        Assert.Equal("Plot No. 55, Kopri", result.AddressRegional);
        Assert.Equal(4305.60, result.PlotAreaFt);
        Assert.Equal(400.00, result.PlotAreaMtr);
        Assert.Equal(538.20, result.CarpetAreasqFt);
        Assert.Equal(50.00, result.CarpetAreasqMtr);
        Assert.Equal(538.20, result.BuiltUpAreasqFt);
        Assert.Equal(50.00, result.BuiltUpAreasqMtr);
        Assert.Equal(8944.17, result.OldCarpetAreaSqFeet);
        Assert.Equal(830.94, result.OldCarpetAreaSqMeter);
        Assert.Equal(10733.00, result.OldBuiltupAreaSqFeet);
        Assert.Equal(997.13, result.OldBuiltupAreaSqMeter);
        Assert.Equal("Individual", result.PropertyCategory);
        Assert.Equal("निवासी", result.PropertyDescription);

        // Tax / Revenue assertions
        Assert.Equal(70400m, result.AdditionalRevenue.CurrentTax);
        Assert.Equal(113000m, result.AdditionalRevenue.RetroTax);
        Assert.Equal(183400m, result.AdditionalRevenue.TotalTax);
        Assert.Equal(183400m, result.AdditionalRevenue.TotalDemand);
        // Additional revenue = total tax (183400, current + retro) - last year's tax (50000), the same as the
        // Apartment QC screen; the percent is the actual change (266.8 %), not limited to 100 %.
        Assert.Equal(133400m, result.AdditionalRevenue.DifferenceAmount);
        Assert.Equal(266.8, result.AdditionalRevenue.ChangePercent);
    }

    [Fact]
    public async Task GetIndividualDetailsAsync_IgnoresApartmentQcWholeBuildingAreaTotals()
    {
        // Regression test: the Individual screen must show this single property's own
        // Carpet/Built-Up area, not the whole-building (Ward+PropertyNo-wide) sum that
        // IApartmentQcTopSectionRepository.GetCarpetAreaTotalsAsync/GetBuiltUpAreaTotalsAsync
        // return when wingDetailId is null. If PropertyIndividualService ever starts reading
        // area from that repository again, this test catches the regression.
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        repositoryMock.Setup(r => r.GetPropertyAsync(It.IsAny<ApartmentQcTopSectionQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyTopSectionRawData { Id = 100, WardNo = "270465", PropertyNo = "2024" });

        // Whole-building totals a buggy caller would wrongly read.
        repositoryMock.Setup(r => r.GetCarpetAreaTotalsAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((967685.69, 89899.94));
        repositoryMock.Setup(r => r.GetBuiltUpAreaTotalsAsync(100, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((1160228.31, 107787.74));

        supplementaryRepoMock.Setup(s => s.GetOwnerTitleAndPlotAreaAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyIndividualSupplementaryData(null, null, null, null, null));

        supplementaryRepoMock.Setup(s => s.GetAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync((43701.84, 4060.00, 43701.84, 4060.00));

        supplementaryRepoMock.Setup(s => s.GetOldAreaTotalsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(((double?, double?, double?, double?))(null, null, null, null));

        supplementaryRepoMock.Setup(s => s.GetAdditionalRevenueTaxDetailsAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyIndividualTaxData(0m, 0m, 0m, 0m));

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        // Act
        var result = await service.GetIndividualDetailsAsync(100);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(43701.84, result!.CarpetAreasqFt);
        Assert.Equal(4060.00, result.CarpetAreasqMtr);
        Assert.Equal(43701.84, result.BuiltUpAreasqFt);
        Assert.Equal(4060.00, result.BuiltUpAreasqMtr);
        repositoryMock.Verify(r => r.GetCarpetAreaTotalsAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
        repositoryMock.Verify(r => r.GetBuiltUpAreaTotalsAsync(It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetIndividualDetailsAsync_PropertyNotFound_ReturnsNull()
    {
        // Arrange
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        repositoryMock.Setup(r => r.GetPropertyAsync(It.IsAny<ApartmentQcTopSectionQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyTopSectionRawData?)null);

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        // Act
        var result = await service.GetIndividualDetailsAsync(999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_NoFields_ReturnsNoFieldsProvided()
    {
        // Arrange
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        var dto = new UpdatePropertyIndividualDto();

        // Act
        var result = await service.UpdateIndividualDetailsAsync(100, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.NoFieldsProvided, result);
        supplementaryRepoMock.Verify(s => s.UpdateIndividualDetailsAsync(It.IsAny<int>(), It.IsAny<UpdatePropertyIndividualDto>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateIndividualDetailsAsync_ValidFields_DelegatesToSupplementaryRepository()
    {
        // Arrange
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        supplementaryRepoMock.Setup(s => s.UpdateIndividualDetailsAsync(100, It.IsAny<UpdatePropertyIndividualDto>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.Success);

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        var dto = new UpdatePropertyIndividualDto { FlatOrShopNo = "101", FlatOrShopName = "Shop 1" };

        // Act
        var result = await service.UpdateIndividualDetailsAsync(100, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, result);
        supplementaryRepoMock.Verify(s => s.UpdateIndividualDetailsAsync(100, dto, 1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("9876543210", null, null)]
    [InlineData(null, "123456789012", null)]
    [InlineData(null, null, 2)]
    public async Task UpdateIndividualDetailsAsync_SingleFieldOnly_ExecutesSuccessfully(string? mobileNo, string? aadharNo, int? ownerTypeId)
    {
        // Arrange
        var repositoryMock = new Mock<IApartmentQcTopSectionRepository>();
        var supplementaryRepoMock = new Mock<IPropertyIndividualSupplementaryRepository>();
        var calculator = new ApartmentQcTopSectionPerformanceCalculator();

        supplementaryRepoMock.Setup(s => s.UpdateIndividualDetailsAsync(100, It.IsAny<UpdatePropertyIndividualDto>(), 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TopSectionUpdateOutcome.Success);

        var service = new PropertyIndividualService(
            repositoryMock.Object,
            supplementaryRepoMock.Object,
            calculator);

        var dto = new UpdatePropertyIndividualDto
        {
            MobileNo = mobileNo,
            AadharNo = aadharNo,
            OwnerTypeId = ownerTypeId
        };

        // Assert HasAnyField evaluates to true
        Assert.True(dto.HasAnyField());

        // Act
        var result = await service.UpdateIndividualDetailsAsync(100, dto, updatedBy: 1);

        // Assert
        Assert.Equal(TopSectionUpdateOutcome.Success, result);
        supplementaryRepoMock.Verify(s => s.UpdateIndividualDetailsAsync(100, dto, 1, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void UpdatePropertyIndividualDto_HasAnyField_ReturnsTrue_ForMobileAadharAndOwnerType()
    {
        Assert.True(new UpdatePropertyIndividualDto { MobileNo = "9876543210" }.HasAnyField());
        Assert.True(new UpdatePropertyIndividualDto { AadharNo = "123456789012" }.HasAnyField());
        Assert.True(new UpdatePropertyIndividualDto { OwnerTypeId = 1 }.HasAnyField());
        Assert.False(new UpdatePropertyIndividualDto().HasAnyField());
    }
}
