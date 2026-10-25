using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Tests.Application;

public class WingWiseDetailsServiceTests
{
    [Fact]
    public async Task GetWingWiseDetailsAsync_AggregatesAreaAndDemandByWingAndPropertyType()
    {
        var propertyRepository = Repository([
            new PropertyEntity { Id = 1, WardId = 7, PropertyNo = "100", PropertyTypeId = 1, WingDetailId = 10, IsActive = true },
            new PropertyEntity { Id = 2, WardId = 7, PropertyNo = "100", PropertyTypeId = 1, WingDetailId = 10, IsActive = true },
            new PropertyEntity { Id = 3, WardId = 7, PropertyNo = "100", PropertyTypeId = 2, WingDetailId = 10, IsActive = true },
            new PropertyEntity { Id = 4, WardId = 7, PropertyNo = "100", PropertyTypeId = 1, WingDetailId = 20, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", PartType = "R", IsActive = true },
            new PropertyTypeMasterEntity { Id = 2, PropertyDescription = "Commercial", PartType = "C", IsActive = true },
            new PropertyTypeMasterEntity { Id = 3, PropertyDescription = "Amenity", PartType = "Amenity", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 7, WardNo = "W007", IsActive = true }
        ]);
        var propertyDetailsRepository = Repository([
            new PropertyDetailsEntity { Id = 1, PropertyId = 1, FloorId = 1, CarpetAreaSqFeet = 500, IsActive = true },
            new PropertyDetailsEntity { Id = 2, PropertyId = 2, FloorId = 2, CarpetAreaSqFeet = 600, IsActive = true },
            new PropertyDetailsEntity { Id = 3, PropertyId = 3, FloorId = 4, CarpetAreaSqFeet = 400, IsActive = true },
            new PropertyDetailsEntity { Id = 4, PropertyId = 4, FloorId = 3, CarpetAreaSqFeet = 1000, IsActive = true }
        ]);
        var floorRepository = Repository([
            new FloorEntity { Id = 1, FloorCode = "G", SequenceNo = 0, IsActive = true },
            new FloorEntity { Id = 2, FloorCode = "1", SequenceNo = 1, IsActive = true },
            new FloorEntity { Id = 3, FloorCode = "2", SequenceNo = 2, IsActive = true },
            new FloorEntity { Id = 4, FloorCode = "3", SequenceNo = 3, IsActive = true }
        ]);
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, SocietyDetailsMastId = 1, WingName = "Krishna Block", IsActive = true },
            new WingDetailsMastEntity { Id = 20, WingMasterId = 200, SocietyDetailsMastId = 1, WingName = "Sai Block", IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 100, WingNo = "A", IsActive = true },
            new WingEntity { Id = 200, WingNo = "B", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2023, Year = 2023, IsActive = true },
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var retroPolicy = new PolicyCodeMasterEntity { Id = 5, PolicyCode = "RETRO", PolicyName = "Retro", IsRetroDemand = true };
        var transRepository = Repository([
            // Retro demand (prior finance year 2023 != currentFinanceYearId 2024)
            new TransMastEntity { Id = 5, PropertyId = 1, TaxId = 99, FinanceYearId = 2023, PolicyCodeId = 5, PolicyCodeMaster = retroPolicy, TaxAmount = 250m, IsActive = true },
            new TransMastEntity { Id = 6, PropertyId = 2, TaxId = 99, FinanceYearId = 2023, PolicyCodeId = 5, PolicyCodeMaster = retroPolicy, TaxAmount = 250m, IsActive = true }
        ]);
        var propertyMastOldRepository = Repository([
            new PropertyMastOldEntity { Id = 501, OldTotalTax = 100d },
            new PropertyMastOldEntity { Id = 502, OldTotalTax = 200d }
        ]);
        var propertyMapDetailRepository = Repository([
            new PropertyMapDetailEntity { Id = 1, PropertyIdNew = 1, PropertyIdOld = 501 },
            new PropertyMapDetailEntity { Id = 2, PropertyIdNew = 2, PropertyIdOld = 502 }
        ]);

        var policyTaxDetailsRepository = Repository([
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 99, TaxAmount = 500m, CalculationValue = 150m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 2, TaxId = 99, TaxAmount = 500m, CalculationValue = 200m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 3, PropertyId = 3, TaxId = 99, TaxAmount = 250000m, CalculationValue = 300m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 4, PropertyId = 4, TaxId = 99, TaxAmount = 10000000m, CalculationValue = 400m, IsCurrent = true, IsActive = true }
        ]);
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "RV", IsActive = true },
            new PolicyConfigurationEntity { PolicyCode = "RateMasterAreaUnit", DefaultValue = "SqFeet", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters
        {
            WardId = 7,
            PropertyNo = "100"
        });

        Assert.Equal(1, result.PropertyId);
        Assert.Equal("100", result.PropertyNo);
        Assert.Equal("W007", result.WardNo);
        Assert.Equal("SqFeet", result.RateMasterAreaUnit);
        Assert.Equal(2, result.Wings.Count);

        var wingA = Assert.Single(result.Wings.Where(x => x.WingNo == "A"));
        Assert.Equal(3, wingA.PropertyCount);
        Assert.Equal("G-3", wingA.FloorRange);
        Assert.Equal(1500m, wingA.TotalArea);
        Assert.Equal("2.51 Lakh", wingA.CurrentDemand);
        Assert.Equal("300", wingA.OldDemand);
        Assert.Equal("500", wingA.RetroDemand);
        Assert.Equal("2.52 Lakh", wingA.TotalDemand);
        Assert.Equal("2.51 Lakh", wingA.RevenueImpact);

        var residential = Assert.Single(wingA.PropertyTypes.Where(x => x.PropertyTypeName == "Residential"));
        Assert.Equal(2, residential.PropertyCount);
        Assert.Equal(1100m, residential.TotalArea);
        Assert.Equal("1K", residential.CurrentDemand);
        Assert.Equal("300", residential.OldDemand);
        Assert.Equal("500", residential.RetroDemand);
        Assert.Equal("1.5K", residential.TotalDemand);
        Assert.Equal("1.2K", residential.TotalRevenue);

        var commercial = Assert.Single(wingA.PropertyTypes.Where(x => x.PropertyTypeName == "Commercial"));
        Assert.Equal(1, commercial.PropertyCount);
        Assert.Equal(400m, commercial.TotalArea);
        Assert.Equal("2.5 Lakh", commercial.CurrentDemand);
        Assert.Equal("2.5 Lakh", commercial.TotalDemand);
        Assert.Equal("2.5 Lakh", commercial.TotalRevenue);

        var amenity = Assert.Single(wingA.PropertyTypes.Where(x => x.PropertyTypeName == "Amenity"));
        Assert.Equal(0, amenity.PropertyCount);
        Assert.Equal(0m, amenity.TotalArea);
        Assert.Equal("0", amenity.TotalDemand);

        var wingB = Assert.Single(result.Wings.Where(x => x.WingNo == "B"));
        Assert.Equal(1, wingB.PropertyCount);
        Assert.Equal("G-2", wingB.FloorRange);
        Assert.Equal(1000m, wingB.TotalArea);
        Assert.Equal("1 Crore", wingB.CurrentDemand);
        Assert.Equal("1 Crore", wingB.TotalDemand);
    }

    [Fact]
    public async Task GetWingWiseDetailsAsync_SkipsExcludedFloorsAndUsesMaxSequenceNo()
    {
        var propertyRepository = Repository([
            new PropertyEntity { Id = 10, WardId = 7, PropertyNo = "200", PropertyTypeId = 1, WingDetailId = 30, IsActive = true },
            new PropertyEntity { Id = 11, WardId = 7, PropertyNo = "200", PropertyTypeId = 1, WingDetailId = 30, IsActive = true },
            new PropertyEntity { Id = 12, WardId = 7, PropertyNo = "200", PropertyTypeId = 1, WingDetailId = 30, IsActive = true },
            new PropertyEntity { Id = 13, WardId = 7, PropertyNo = "200", PropertyTypeId = 1, WingDetailId = 40, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", PartType = "R", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 7, WardNo = "W007", IsActive = true }
        ]);
        // Property 10 has Basement (excluded), Property 11 has Podium (excluded), Property 12 has Floor 4
        // Wing 40 only has Basement and Lower Ground (all excluded)
        var propertyDetailsRepository = Repository([
            new PropertyDetailsEntity { Id = 101, PropertyId = 10, FloorId = 65, CarpetAreaSqFeet = 500, IsActive = true }, // B
            new PropertyDetailsEntity { Id = 102, PropertyId = 11, FloorId = 75, CarpetAreaSqFeet = 600, IsActive = true }, // P8 (future podium)
            new PropertyDetailsEntity { Id = 103, PropertyId = 12, FloorId = 4, CarpetAreaSqFeet = 400, IsActive = true },  // 4
            new PropertyDetailsEntity { Id = 104, PropertyId = 13, FloorId = 85, CarpetAreaSqFeet = 300, IsActive = true }  // U3 only (future utility)
        ]);
        var floorRepository = Repository([
            new FloorEntity { Id = 65, FloorCode = "B", SequenceNo = 1, IsActive = true },
            new FloorEntity { Id = 75, FloorCode = "P8", SequenceNo = 18, IsActive = true }, // Higher SequenceNo than 4, but excluded!
            new FloorEntity { Id = 85, FloorCode = "U3", SequenceNo = 14, IsActive = true },
            new FloorEntity { Id = 4, FloorCode = "4", SequenceNo = 4, IsActive = true }
        ]);
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 30, WingMasterId = 300, SocietyDetailsMastId = 1, WingName = "Tower A", IsActive = true },
            new WingDetailsMastEntity { Id = 40, WingMasterId = 400, SocietyDetailsMastId = 1, WingName = "Tower B", IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 300, WingNo = "A", IsActive = true },
            new WingEntity { Id = 400, WingNo = "B", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var transRepository = Repository(Enumerable.Empty<TransMastEntity>());
        var propertyMastOldRepository = Repository(Enumerable.Empty<PropertyMastOldEntity>());
        var propertyMapDetailRepository = Repository(Enumerable.Empty<PropertyMapDetailEntity>());
        var policyTaxDetailsRepository = Repository(Enumerable.Empty<PolicyTaxDetailsEntity>());
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "RV", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters
        {
            WardId = 7,
            PropertyNo = "200"
        });

        // Tower A has B (Seq 1), P8 (Seq 18 - both excluded) and Floor 4 (SequenceNo 4) -> FloorRange = "G-4"
        var towerA = Assert.Single(result.Wings.Where(x => x.WingNo == "A"));
        Assert.Equal("G-4", towerA.FloorRange);

        // Tower B only has U3 (excluded) -> FloorRange = "G"
        var towerB = Assert.Single(result.Wings.Where(x => x.WingNo == "B"));
        Assert.Equal("G", towerB.FloorRange);
    }

    [Theory]
    [InlineData("B", true)]
    [InlineData("L", true)]
    [InlineData("M", true)]
    [InlineData("OP", true)]
    [InlineData("P1", true)]
    [InlineData("P6", true)]
    [InlineData("P7", true)]
    [InlineData("P8", true)]
    [InlineData("P9", true)]
    [InlineData("P15", true)]
    [InlineData("p7", true)]
    [InlineData("P-8", true)]
    [InlineData("U1", true)]
    [InlineData("U2", true)]
    [InlineData("U3", true)]
    [InlineData("U9", true)]
    [InlineData("u12", true)]
    [InlineData("B1", true)]
    [InlineData("B2", true)]
    [InlineData("G", false)]
    [InlineData("g", false)]
    [InlineData("1", false)]
    [InlineData("2", false)]
    [InlineData("4", false)]
    [InlineData("15", false)]
    [InlineData("", true)]
    [InlineData(null, true)]
    public void IsExcludedFloorCode_CorrectlyIdentifiesStaticAndDynamicExcludedFloors(string? floorCode, bool expectedExcluded)
    {
        var result = WingWiseDetailsService.IsExcludedFloorCode(floorCode);
        Assert.Equal(expectedExcluded, result);
    }

    [Theory]
    [InlineData(true, "CarpetArea", "SqMeter", WingWiseDetailsService.AreaSelectionMode.CarpetAreaSqMeter)]
    [InlineData(true, "CarpetArea", "SqFeet", WingWiseDetailsService.AreaSelectionMode.CarpetAreaSqFeet)]
    [InlineData(true, "BuiltUpArea", "SqMeter", WingWiseDetailsService.AreaSelectionMode.BuiltUpAreaSqMeter)]
    [InlineData(true, "BuiltUpArea", "SqFeet", WingWiseDetailsService.AreaSelectionMode.BuiltUpAreaSqFeet)]
    [InlineData(false, "CarpetArea", "SqMeter", WingWiseDetailsService.AreaSelectionMode.CarpetAreaSqMeter)]
    [InlineData(false, "CarpetArea", "SqFeet", WingWiseDetailsService.AreaSelectionMode.CarpetAreaSqFeet)]
    [InlineData(false, "BuiltUpArea", "SqMeter", WingWiseDetailsService.AreaSelectionMode.BuiltUpAreaSqMeter)]
    [InlineData(false, "BuiltUpArea", "SqFeet", WingWiseDetailsService.AreaSelectionMode.BuiltUpAreaSqFeet)]
    public void ResolveAreaSelectionMode_CorrectlyMapsPolicyConfigurations(
        bool isRv,
        string areaType,
        string areaUnit,
        WingWiseDetailsService.AreaSelectionMode expectedMode)
    {
        var policyConfig = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [isRv ? "RateableValueAreaType" : "CapitalValueAreaType"] = areaType,
            ["RateMasterAreaUnit"] = areaUnit
        };

        var mode = WingWiseDetailsService.ResolveAreaSelectionMode(isRv, policyConfig);
        Assert.Equal(expectedMode, mode);
    }

    [Fact]
    public async Task GetWingWiseDetailsAsync_CalculatesTotalAreaBasedOnPolicyConfiguration()
    {
        var propertyRepository = Repository([
            new PropertyEntity { Id = 50, WardId = 9, PropertyNo = "300", PropertyTypeId = 1, WingDetailId = 500, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", PartType = "R", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 9, WardNo = "W009", IsActive = true }
        ]);
        var propertyDetailsRepository = Repository([
            new PropertyDetailsEntity
            {
                Id = 1,
                PropertyId = 50,
                FloorId = 1,
                CarpetAreaSqFeet = 1000,
                CarpetAreaSqMeter = 90,
                BuiltupAreaSqFeet = 1200,
                BuiltupAreaSqMeter = 110,
                IsActive = true
            }
        ]);
        var floorRepository = Repository([
            new FloorEntity { Id = 1, FloorCode = "1", SequenceNo = 1, IsActive = true }
        ]);
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 500, WingMasterId = 50, SocietyDetailsMastId = 1, WingName = "Wing A", IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 50, WingNo = "A", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var transRepository = Repository(Enumerable.Empty<TransMastEntity>());
        var propertyMastOldRepository = Repository(Enumerable.Empty<PropertyMastOldEntity>());
        var propertyMapDetailRepository = Repository(Enumerable.Empty<PropertyMapDetailEntity>());
        var policyTaxDetailsRepository = Repository(Enumerable.Empty<PolicyTaxDetailsEntity>());
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "CV", IsActive = true },
            new PolicyConfigurationEntity { PolicyCode = "CapitalValueAreaType", DefaultValue = "BuiltUpArea", IsActive = true },
            new PolicyConfigurationEntity { PolicyCode = "RateMasterAreaUnit", DefaultValue = "SqMeter", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters
        {
            WardId = 9,
            PropertyNo = "300"
        });

        // CV + BuiltUpArea + SqMeter -> uses BuiltupAreaSqMeter = 110
        Assert.Equal("SqMeter", result.RateMasterAreaUnit);
        var wing = Assert.Single(result.Wings);
        Assert.Equal(110m, wing.TotalArea);

        var residential = Assert.Single(wing.PropertyTypes.Where(x => x.PropertyTypeName == "Residential"));
        Assert.Equal(110m, residential.TotalArea);
    }

    [Fact]
    public async Task GetWingWiseDetailsAsync_CalculatesOldDemandFromDistinctActiveOldPropertiesPerPropertyType()
    {
        var propertyRepository = Repository([
            new PropertyEntity { Id = 10, WardId = 5329, PropertyNo = "184", WingDetailId = 1525593, PropertyTypeId = 12, IsActive = true },
            new PropertyEntity { Id = 11, WardId = 5329, PropertyNo = "184", WingDetailId = 1525593, PropertyTypeId = 12, IsActive = true },
            new PropertyEntity { Id = 12, WardId = 5329, PropertyNo = "184", WingDetailId = 1525593, PropertyTypeId = 12, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 12, PropertyDescription = "Residential", PartType = "Residential", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 5329, WardNo = "W5329", IsActive = true }
        ]);
        var propertyDetailsRepository = Repository(Enumerable.Empty<PropertyDetailsEntity>());
        var floorRepository = Repository(Enumerable.Empty<FloorEntity>());
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 1525593, WingMasterId = 100, IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var transRepository = Repository(Enumerable.Empty<TransMastEntity>());
        var propertyMastOldRepository = Repository([
            new PropertyMastOldEntity { Id = 888, OldTotalTax = 5000d, OldRV = 20000d },
            new PropertyMastOldEntity { Id = 999, OldTotalTax = 99999d, OldRV = 99999d }
        ]);
        var propertyMapDetailRepository = Repository([
            new PropertyMapDetailEntity { Id = 1, PropertyIdNew = 10, PropertyIdOld = 888, IsActive = true },
            new PropertyMapDetailEntity { Id = 2, PropertyIdNew = 11, PropertyIdOld = 888, IsActive = true },
            new PropertyMapDetailEntity { Id = 3, PropertyIdNew = 12, PropertyIdOld = 999, IsActive = false }
        ]);
        var policyTaxDetailsRepository = Repository(Enumerable.Empty<PolicyTaxDetailsEntity>());
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "RV", IsActive = true },
            new PolicyConfigurationEntity { PolicyCode = "RateMasterAreaUnit", DefaultValue = "SqMeter", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters
        {
            WardId = 5329,
            PropertyNo = "184"
        });

        var wing = Assert.Single(result.Wings);
        // Both properties 10 & 11 map to OldProperty 888 (tax 5000); Property 12 is inactive mapping (ignored).
        // Distinct PropertyIdOld = [888] -> OldDemand = 5000 ("5K"), PreviousRV = 20000 ("20K")
        Assert.Equal("5K", wing.OldDemand);
        var residential = Assert.Single(wing.PropertyTypes.Where(x => x.PropertyTypeName == "Residential"));
        Assert.Equal("5K", residential.OldDemand);

        var impact = Assert.Single(wing.RevenueImpactDetails);
        Assert.Equal("20K", impact.PreviousRV);
    }

    [Fact]
    public async Task GetWingWiseDetailsAsync_UnitUnderCertificate_CurrentDemandIsTheCertificateRowNotNettaxPlusCertificate()
    {
        // A unit under an OC has TWO current TaxTotal rows in PolicyTaxDetails: its base NETTAX (400) and the OC row
        // the retrospective engine wrote for the current year (400). The engine replaces NETTAX with that OC row in
        // TransMast, so the current year's demand is 400 -- not 800 -- and Current + Retro (two prior years of 400)
        // is the ledger's 1,200. Adding both rows showed 1,600 and inflated Revenue Impact with it.
        var propertyRepository = Repository([
            new PropertyEntity { Id = 1, WardId = 7, PropertyNo = "100", PropertyTypeId = 1, WingDetailId = 10, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", PartType = "R", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 7, WardNo = "W007", IsActive = true }
        ]);
        var propertyDetailsRepository = Repository(Enumerable.Empty<PropertyDetailsEntity>());
        var floorRepository = Repository(Enumerable.Empty<FloorEntity>());
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, SocietyDetailsMastId = 1, WingName = "Krishna Block", IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2022, Year = 2022, IsActive = true },
            new YearMasterEntity { Id = 2023, Year = 2023, IsActive = true },
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var nettaxPolicy = new PolicyCodeMasterEntity { Id = 1, PolicyCode = "NETTAX", PolicyName = "Net Tax", IsRetroDemand = false };
        var ocPolicy = new PolicyCodeMasterEntity { Id = 5, PolicyCode = "OC", PolicyName = "Occupancy Certificate", IsRetroDemand = true };
        var transRepository = Repository([
            // Prior finance years are the retro demand; the current year (2024) is not counted here again.
            new TransMastEntity { Id = 1, PropertyId = 1, TaxId = 99, FinanceYearId = 2022, PolicyCodeId = 5, PolicyCodeMaster = ocPolicy, TaxAmount = 400m, IsActive = true },
            new TransMastEntity { Id = 2, PropertyId = 1, TaxId = 99, FinanceYearId = 2023, PolicyCodeId = 5, PolicyCodeMaster = ocPolicy, TaxAmount = 400m, IsActive = true },
            new TransMastEntity { Id = 3, PropertyId = 1, TaxId = 99, FinanceYearId = 2024, PolicyCodeId = 5, PolicyCodeMaster = ocPolicy, TaxAmount = 400m, IsActive = true }
        ]);
        var propertyMastOldRepository = Repository(Enumerable.Empty<PropertyMastOldEntity>());
        var propertyMapDetailRepository = Repository(Enumerable.Empty<PropertyMapDetailEntity>());
        var policyTaxDetailsRepository = Repository([
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 99, PolicyCodeId = 1, PolicyCodeMaster = nettaxPolicy, TaxAmount = 400m, CalculationValue = 150m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 1, TaxId = 99, PolicyCodeId = 5, PolicyCodeMaster = ocPolicy, TaxAmount = 400m, CalculationValue = 150m, IsCurrent = true, IsActive = true }
        ]);
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "RV", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters { WardId = 7, PropertyNo = "100" });

        var wing = Assert.Single(result.Wings);
        Assert.Equal("400", wing.CurrentDemand);   // the OC row only, not NETTAX 400 + OC 400
        Assert.Equal("800", wing.RetroDemand);     // 2022 + 2023
        Assert.Equal("1.2K", wing.TotalDemand);    // = the ledger: 2022 + 2023 + 2024
    }

    [Fact]
    public async Task GetWingWiseDetailsAsync_ReturnsCommonAmenitiesWithZeroedResidentialAndCommercial()
    {
        var propertyRepository = Repository([
            new PropertyEntity { Id = 1, WardId = 86, PropertyNo = "132", PropertyTypeId = 1, WingDetailId = 10, IsActive = true },
            new PropertyEntity { Id = 2, WardId = 86, PropertyNo = "132", PropertyTypeId = 140, PartitionNo = "AM1", WingDetailId = null, IsActive = true },
            new PropertyEntity { Id = 3, WardId = 86, PropertyNo = "132", PropertyTypeId = 140, PartitionNo = "AM2", WingDetailId = null, IsActive = true }
        ]);
        var propertyTypeRepository = Repository([
            new PropertyTypeMasterEntity { Id = 1, PropertyDescription = "Residential", PartType = "R", IsActive = true },
            new PropertyTypeMasterEntity { Id = 140, PropertyDescription = "Amenity", PartType = "Amenity", IsActive = true }
        ]);
        var wardRepository = Repository([
            new WardEntity { Id = 86, WardNo = "W086", IsActive = true }
        ]);
        var propertyDetailsRepository = Repository([
            new PropertyDetailsEntity { Id = 1, PropertyId = 1, FloorId = 1, CarpetAreaSqFeet = 600, IsActive = true },
            new PropertyDetailsEntity { Id = 2, PropertyId = 2, FloorId = 1, CarpetAreaSqFeet = 200, IsActive = true },
            new PropertyDetailsEntity { Id = 3, PropertyId = 3, FloorId = 1, CarpetAreaSqFeet = 300, IsActive = true }
        ]);
        var floorRepository = Repository([
            new FloorEntity { Id = 1, FloorCode = "G", SequenceNo = 0, IsActive = true }
        ]);
        var wingDetailsRepository = Repository([
            new WingDetailsMastEntity { Id = 10, WingMasterId = 100, SocietyDetailsMastId = 5, WingName = "Wing A", IsActive = true }
        ]);
        var wingRepository = Repository([
            new WingEntity { Id = 100, WingNo = "A", IsActive = true }
        ]);
        var taxRepository = Repository([
            new TaxMasterEntity { Id = 99, TaxCode = "TaxTotal", TaxName = "Tax Total", IsActive = true }
        ]);
        var yearMasterRepository = Repository([
            new YearMasterEntity { Id = 2024, Year = 2024, IsActive = true }
        ]);
        var transRepository = Repository(Enumerable.Empty<TransMastEntity>());
        var propertyMastOldRepository = Repository([
            new PropertyMastOldEntity { Id = 502, OldTotalTax = 50d }
        ]);
        var propertyMapDetailRepository = Repository([
            new PropertyMapDetailEntity { Id = 1, PropertyIdNew = 2, PropertyIdOld = 502 }
        ]);
        var policyTaxDetailsRepository = Repository([
            new PolicyTaxDetailsEntity { Id = 1, PropertyId = 1, TaxId = 99, TaxAmount = 1000m, CalculationValue = 100m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 2, PropertyId = 2, TaxId = 99, TaxAmount = 200m, CalculationValue = 20m, IsCurrent = true, IsActive = true },
            new PolicyTaxDetailsEntity { Id = 3, PropertyId = 3, TaxId = 99, TaxAmount = 300m, CalculationValue = 30m, IsCurrent = true, IsActive = true }
        ]);
        var policyTaxDetailsCVRepository = Repository(Enumerable.Empty<PolicyTaxDetailsCVEntity>());
        var policyConfigurationRepository = Repository([
            new PolicyConfigurationEntity { PolicyCode = "TaxCalculationMethod", DefaultValue = "RV", IsActive = true },
            new PolicyConfigurationEntity { PolicyCode = "RateMasterAreaUnit", DefaultValue = "SqFeet", IsActive = true }
        ]);
        var financeYearProvider = new Mock<IFinanceYearProvider>();
        financeYearProvider.Setup(x => x.GetCurrentFinanceYear()).Returns(2024);

        var service = new WingWiseDetailsService(
            propertyRepository.Object,
            propertyTypeRepository.Object,
            wardRepository.Object,
            propertyDetailsRepository.Object,
            floorRepository.Object,
            wingDetailsRepository.Object,
            wingRepository.Object,
            taxRepository.Object,
            transRepository.Object,
            yearMasterRepository.Object,
            propertyMastOldRepository.Object,
            propertyMapDetailRepository.Object,
            policyTaxDetailsRepository.Object,
            policyTaxDetailsCVRepository.Object,
            policyConfigurationRepository.Object,
            financeYearProvider.Object);

        var result = await service.GetWingWiseDetailsAsync(new WingWiseDetailsQueryParameters { WardId = 86, PropertyNo = "132" });

        Assert.Single(result.Wings);
        Assert.Single(result.CommonAmenities);

        var wing = Assert.Single(result.Wings);
        Assert.Equal("1K", wing.TotalDemand);
        Assert.Equal("1K", wing.TotalPropertyTypeDemand);

        var commonAmenity = result.CommonAmenities[0];
        Assert.Equal("Common Amenities", commonAmenity.WingNo);
        Assert.Equal(2, commonAmenity.PropertyCount);
        Assert.Equal(500m, commonAmenity.TotalArea);
        Assert.Equal("50", commonAmenity.OldDemand);
        Assert.Equal("500", commonAmenity.CurrentDemand);
        Assert.Equal("500", commonAmenity.TotalDemand);
        Assert.Equal("500", commonAmenity.TotalPropertyTypeDemand);
        Assert.Equal("500", commonAmenity.ExemptionAppliedAmount);
        Assert.Equal(2, commonAmenity.ExemptedPropertyCount);

        var residential = Assert.Single(commonAmenity.PropertyTypes.Where(x => x.PropertyTypeName == "Residential"));
        Assert.Equal(0, residential.PropertyCount);
        Assert.Equal(0m, residential.TotalArea);
        Assert.Equal("0", residential.TotalDemand);

        var commercial = Assert.Single(commonAmenity.PropertyTypes.Where(x => x.PropertyTypeName == "Commercial"));
        Assert.Equal(0, commercial.PropertyCount);
        Assert.Equal(0m, commercial.TotalArea);
        Assert.Equal("0", commercial.TotalDemand);

        var amenity = Assert.Single(commonAmenity.PropertyTypes.Where(x => x.PropertyTypeName == "Amenity"));
        Assert.Equal(2, amenity.PropertyCount);
        Assert.Equal(500m, amenity.TotalArea);
        Assert.Equal("50", amenity.OldDemand);
        Assert.Equal("500", amenity.CurrentDemand);
        Assert.Equal("500", amenity.TotalDemand);
    }

    private static Mock<IRepository<TEntity, int>> Repository<TEntity>(IEnumerable<TEntity> entities)
        where TEntity : class
    {
        var entityList = entities.ToList();
        var repository = new Mock<IRepository<TEntity, int>>();
        repository.Setup(x => x.GetQueryable()).Returns(entityList.BuildMock());
        return repository;
    }
}
