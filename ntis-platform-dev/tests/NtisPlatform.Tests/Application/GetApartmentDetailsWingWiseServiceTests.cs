using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MockQueryable;
using Moq;
using NtisPlatform.Application.DTOs.Property.ApartmentQC;
using NtisPlatform.Application.Helpers;
using NtisPlatform.Application.Mappings;
using NtisPlatform.Application.Services;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Tests.Helpers;
using Xunit;

namespace NtisPlatform.Tests.Application;

public class GetApartmentDetailsWingWiseServiceTests
{
    private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepo = new();
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _categoryRepo = new();
    private readonly Mock<IRepository<PropertyTypeMasterEntity, int>> _propertyTypeRepo = new();
    private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _assessmentRepo = new();
    private readonly Mock<IRepository<SocietyDetailsEntity, int>> _societyRepo = new();
    private readonly Mock<IRepository<WingDetailsMastEntity, int>> _wingDetailsMastRepo = new();
    private readonly Mock<IRepository<WardEntity, int>> _wardRepo = new();
    private readonly Mock<IRepository<ZoneEntity, int>> _zoneRepo = new();
    private readonly Mock<IRepository<PropertyDetailsEntity, int>> _propertyDetailsRepo = new();
    private readonly Mock<IRepository<FloorEntity, int>> _floorRepo = new();
    private readonly Mock<IRepository<ConstructionTypeEntity, int>> _constructionTypeRepo = new();
    private readonly Mock<IRepository<TypeOfUseEntity, int>> _typeOfUseRepo = new();
    private readonly Mock<IRepository<SubTypeOfUseEntity, int>> _subTypeOfUseRepo = new();
    private readonly Mock<IRepository<PropertyMastOldEntity, int>> _oldPropertyRepo = new();
    private readonly Mock<IRepository<PropertyMapDetailEntity, int>> _propertyMapDetailRepo = new();
    private readonly Mock<IRepository<TransMastEntity, int>> _transMastRepo = new();
    private readonly Mock<IRepository<TaxMasterEntity, int>> _taxMasterRepo = new();
    private readonly Mock<IRepository<YearMasterEntity, int>> _yearMasterRepo = new();
    private readonly Mock<IRepository<PolicyCodeMasterEntity, int>> _policyCodeMasterRepo = new();
    private readonly Mock<IRepository<PolicyTaxDetailsEntity, int>> _policyTaxDetailsRepo = new();
    private readonly Mock<IRepository<PolicyTaxDetailsCVEntity, int>> _policyTaxDetailsCVRepo = new();
    private readonly Mock<IRepository<PolicyConfigurationEntity, int>> _policyConfigRepo = new();
    private readonly Mock<IRepository<PropertyPhotoEntity, int>> _photoRepo = new();
    private readonly Mock<IRepository<PropertyPhotoOldEntity, int>> _photoOldRepo = new();
    private readonly Mock<IRepository<PropertyPhotoTypeEntity, int>> _photoTypeRepo = new();
    private readonly Mock<IRepository<DocumentBindingEntity, int>> _documentBindingRepo = new();
    private readonly Mock<IRepository<DocumentEntity, int>> _documentRepo = new();

    private readonly Mock<IRepository<TransMastOldEntity, int>> _transMastOldRepo = new();
    private readonly Mock<IRepository<PropertyDetailsOldEntity, int>> _oldPropertyDetailsRepo = new();
    private readonly Mock<IRepository<PropertyCertificateEntity, int>> _certificateRepo = new();
    private readonly Mock<IRepository<PropertyCertificateTypeMasterEntity, int>> _certificateTypeRepo = new();
    private readonly Mock<IRepository<RenterMastEntity, int>> _renterRepo = new();

    public GetApartmentDetailsWingWiseServiceTests()
    {
        _categoryRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCategoryEntity>
        {
            new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
        }.BuildMock());
        _propertyTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyTypeMasterEntity>().BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _assessmentRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyAssessmentEntity>().BuildMock());
        _societyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>().BuildMock());
        _wingDetailsMastRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>().BuildMock());
        _wardRepo.Setup(r => r.GetQueryable()).Returns(new List<WardEntity>().BuildMock());
        _zoneRepo.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity>().BuildMock());
        _floorRepo.Setup(r => r.GetQueryable()).Returns(new List<FloorEntity>().BuildMock());
        _constructionTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<ConstructionTypeEntity>().BuildMock());
        _typeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<TypeOfUseEntity>().BuildMock());
        _subTypeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<SubTypeOfUseEntity>().BuildMock());
        _transMastRepo.Setup(r => r.GetQueryable()).Returns(new List<TransMastEntity>().BuildMock());
        _transMastOldRepo.Setup(r => r.GetQueryable()).Returns(new List<TransMastOldEntity>().BuildMock());
        _oldPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsOldEntity>().BuildMock());
        _taxMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity>().BuildMock());
        _yearMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<YearMasterEntity>().BuildMock());
        _policyCodeMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyCodeMasterEntity>().BuildMock());
        _policyTaxDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsEntity>().BuildMock());
        _policyTaxDetailsCVRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyTaxDetailsCVEntity>().BuildMock());
        _policyConfigRepo.Setup(r => r.GetQueryable()).Returns(new List<PolicyConfigurationEntity>().BuildMock());
        _photoRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoEntity>().BuildMock());
        _photoOldRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoOldEntity>().BuildMock());
        _photoTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoTypeEntity>().BuildMock());
        _documentBindingRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>().BuildMock());
        _documentRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>().BuildMock());
        _certificateRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateEntity>().BuildMock());
        _renterRepo.Setup(r => r.GetQueryable()).Returns(new List<RenterMastEntity>().BuildMock());
        _certificateTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateTypeMasterEntity>
        {
            new() { Id = OcTypeId, CertificateTypeCode = "OC", IsActive = true }
        }.BuildMock());
    }

    private const int OcTypeId = 5;

    private GetApartmentDetailsWingWiseService CreateService(IApartmentSortOrderCache? sortOrderCache = null)
    {
        var mapper = AutoMapperTestHelper.CreateMapper();

        return new GetApartmentDetailsWingWiseService(
            _propertyRepo.Object,
            _categoryRepo.Object,
            _propertyTypeRepo.Object,
            _assessmentRepo.Object,
            _societyRepo.Object,
            _wingDetailsMastRepo.Object,
            _wardRepo.Object,
            _zoneRepo.Object,
            _propertyDetailsRepo.Object,
            _floorRepo.Object,
            _constructionTypeRepo.Object,
            _typeOfUseRepo.Object,
            _subTypeOfUseRepo.Object,
            _oldPropertyRepo.Object,
            _propertyMapDetailRepo.Object,
            _transMastRepo.Object,
            _taxMasterRepo.Object,
            _yearMasterRepo.Object,
            _policyCodeMasterRepo.Object,
            _policyTaxDetailsRepo.Object,
            _policyTaxDetailsCVRepo.Object,
            _policyConfigRepo.Object,
            _photoRepo.Object,
            _photoOldRepo.Object,
            _photoTypeRepo.Object,
            _documentBindingRepo.Object,
            _documentRepo.Object,
            mapper,
            _transMastOldRepo.Object,
            _oldPropertyDetailsRepo.Object,
            rvCalculationResultsRepository: null,
            certificateRepository: _certificateRepo.Object,
            certificateTypeRepository: _certificateTypeRepo.Object,
            renterRepository: _renterRepo.Object,
            sortOrderCache: sortOrderCache);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_ManyNewToOneOld_ReturnsIndividualNewPropertiesWithOwnFlatNo()
    {
        // Arrange
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 102, PropertyNo = "NEW-102", FlatOrShopNo = "102", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var newDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 400.0, IsActive = true },
            new() { Id = 2, PropertyId = 102, CarpetAreaSqFeet = 600.0, IsActive = true }
        }.BuildMock();

        // 1 Old property (OldRV=10000, OldTotalTax=20000, ConstructionArea=1000) mapped to both 101 and 102
        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 501, OldPropertyNo = "OLD-501", OldRV = 10000, OldTotalTax = 20000, OldConstructionArea = 1000, IsActive = true }
        }.BuildMock();

        var oldTaxes = new List<TransMastOldEntity>
        {
            new() { Id = 1, PropertyMastOldId = 501, FinanceYearId = 10, TaxId = 1, TaxAmount = 5000m, IsActive = true }
        }.BuildMock();

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true },
            new() { Id = 2, PropertyIdNew = 102, PropertyIdOld = 501, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(newDetails);
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _transMastOldRepo.Setup(r => r.GetQueryable()).Returns(oldTaxes);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert: 1 main row with aggregated calculation data and no comma separated flat no
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);

        Assert.Equal(1000m, row.NewSurvey.CarpetASqFt); // 400 + 600
        Assert.Null(row.NewSurvey.FlatOrShopNo); // not comma-separated
        Assert.Equal(501L, row.OldSurvey.Id);
        Assert.Single(row.OldSurvey.OldTaxDetails);
        Assert.Equal(5000m, row.OldSurvey.OldTaxDetails[0].TaxAmount);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_MergeMapping_AggregatesAllOldProperties()
    {
        // Arrange: 1 New property mapped to 2 Old properties
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var newDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 1000.0, IsActive = true }
        }.BuildMock();

        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 501, OldPropertyNo = "OLD-501", OldRV = 4000, OldTotalTax = 8000, OldConstructionArea = 400, IsActive = true },
            new() { Id = 502, OldPropertyNo = "OLD-502", OldRV = 6000, OldTotalTax = 12000, OldConstructionArea = 600, IsActive = true }
        }.BuildMock();

        var oldTaxes = new List<TransMastOldEntity>
        {
            new() { Id = 1, PropertyMastOldId = 501, FinanceYearId = 10, TaxId = 1, TaxAmount = 2000m, IsActive = true },
            new() { Id = 2, PropertyMastOldId = 502, FinanceYearId = 10, TaxId = 1, TaxAmount = 3000m, IsActive = true }
        }.BuildMock();

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true },
            new() { Id = 2, PropertyIdNew = 101, PropertyIdOld = 502, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(newDetails);
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _transMastOldRepo.Setup(r => r.GetQueryable()).Returns(oldTaxes);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);
        // Total = 4000 + 6000 = 10000 RV, 8000 + 12000 = 20000 Tax, 400 + 600 = 1000 ConstArea
        Assert.Equal(10000m, row.OldSurvey.RateableValue);
        Assert.Equal(20000m, row.OldSurvey.TotalTax);
        Assert.Equal(1000m, row.OldSurvey.ConstructionArea);
        Assert.Contains("OLD-501", row.OldSurvey.OldPropertyNo);
        Assert.Contains("OLD-502", row.OldSurvey.OldPropertyNo);
        Assert.Equal(2, row.OldSurvey.OldTaxDetails.Count);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_MultipleDetailsPerProperty_SumsAreasAndRoomsAcrossActiveDetails()
    {
        // Arrange: Single property with multiple active PropertyDetails rows
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var newDetails = new List<PropertyDetailsEntity>
        {
            new()
            {
                Id = 1,
                PropertyId = 101,
                NoOfRooms = 2,
                CarpetAreaSqFeet = 300.0,
                CarpetAreaSqMeter = 27.87,
                BuiltupAreaSqFeet = 350.0,
                BuiltupAreaSqMeter = 32.51,
                IsActive = true,
                MarkedForDeletion = false
            },
            new()
            {
                Id = 2,
                PropertyId = 101,
                NoOfRooms = 3,
                CarpetAreaSqFeet = 400.0,
                CarpetAreaSqMeter = 37.16,
                BuiltupAreaSqFeet = 450.0,
                BuiltupAreaSqMeter = 41.80,
                IsActive = true,
                MarkedForDeletion = false
            }
        }.BuildMock();

        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 501, OldPropertyNo = "OLD-501", IsActive = true }
        }.BuildMock();

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(newDetails);
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);
        Assert.Equal(5, row.NewSurvey.NoOfRooms); // 2 + 3
        Assert.Equal(700m, row.NewSurvey.CarpetASqFt); // 300 + 400
        Assert.Equal(65.03m, row.NewSurvey.CarpetASqMtr); // 27.87 + 37.16
        Assert.Equal(800m, row.NewSurvey.BuiltupASqFt); // 350 + 450
        Assert.Equal(74.31m, row.NewSurvey.BuiltupASqMtr); // 32.51 + 41.80
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_MixedNullAndAllNullDetails_PreservesNullCorrectly()
    {
        // Arrange: Property 101 has mixed nulls, Property 102 has all nulls
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 102, PropertyNo = "NEW-102", FlatOrShopNo = "102", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var newDetails = new List<PropertyDetailsEntity>
        {
            // Prop 101: Detail 1 has rooms & carpet area, but null builtup
            new()
            {
                Id = 1,
                PropertyId = 101,
                NoOfRooms = 2,
                CarpetAreaSqFeet = 300.0,
                CarpetAreaSqMeter = 27.87,
                BuiltupAreaSqFeet = null,
                BuiltupAreaSqMeter = null,
                IsActive = true
            },
            // Prop 101: Detail 2 has null rooms, but builtup area
            new()
            {
                Id = 2,
                PropertyId = 101,
                NoOfRooms = null,
                CarpetAreaSqFeet = null,
                CarpetAreaSqMeter = null,
                BuiltupAreaSqFeet = 450.0,
                BuiltupAreaSqMeter = 41.80,
                IsActive = true
            },
            // Prop 102: All null detail
            new()
            {
                Id = 3,
                PropertyId = 102,
                NoOfRooms = null,
                CarpetAreaSqFeet = null,
                CarpetAreaSqMeter = null,
                BuiltupAreaSqFeet = null,
                BuiltupAreaSqMeter = null,
                IsActive = true
            }
        }.BuildMock();

        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 501, OldPropertyNo = "OLD-501", IsActive = true },
            new() { Id = 502, OldPropertyNo = "OLD-502", IsActive = true }
        }.BuildMock();

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true },
            new() { Id = 2, PropertyIdNew = 102, PropertyIdOld = 502, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(newDetails);
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);

        var row101 = result.Items.First(x => x.NewSurvey.Id == 101);
        Assert.Equal(2, row101.NewSurvey.NoOfRooms); // 2 + null = 2
        Assert.Equal(300m, row101.NewSurvey.CarpetASqFt);
        Assert.Equal(27.87m, row101.NewSurvey.CarpetASqMtr);
        Assert.Equal(450m, row101.NewSurvey.BuiltupASqFt);
        Assert.Equal(41.80m, row101.NewSurvey.BuiltupASqMtr);

        var row102 = result.Items.First(x => x.NewSurvey.Id == 102);
        Assert.Null(row102.NewSurvey.NoOfRooms); // all nulls -> null
        Assert.Null(row102.NewSurvey.CarpetASqFt);
        Assert.Null(row102.NewSurvey.CarpetASqMtr);
        Assert.Null(row102.NewSurvey.BuiltupASqFt);
        Assert.Null(row102.NewSurvey.BuiltupASqMtr);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_WithPropertyDetailsOld_PopulatesOldSurveyAreas()
    {
        // Arrange
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 201, PropertyNo = "NEW-201", FlatOrShopNo = "201", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 601, OldPropertyNo = "OLD-601", OldConstructionArea = 500, IsActive = true }
        }.BuildMock();

        var oldDetails = new List<PropertyDetailsOldEntity>
        {
            new()
            {
                Id = 1,
                PropertyMastOldId = 601,
                OldCarpetAreaSqMeter = 273.29,
                OldCarpetAreaSqFeet = 2941.67,
                OldBuiltupAreaSqMeter = 327.95,
                OldBuiltupAreaSqFeet = 3530,
                IsActive = true
            }
        }.BuildMock();

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 201, PropertyIdOld = 601, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _oldPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(oldDetails);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);
        Assert.Equal(273.29m, row.OldSurvey.CarpetASqMtr);
        Assert.Equal(2941.67m, row.OldSurvey.CarpetASqFt);
        Assert.Equal(327.95m, row.OldSurvey.BuiltupASqMtr);
        Assert.Equal(3530m, row.OldSurvey.BuiltupASqFt);
        Assert.Equal(500m, row.OldSurvey.ConstructionArea);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_WithALV_PopulatesAnnualRentalValueAndALVCorrectly()
    {
        // Arrange
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 301, PropertyNo = "NEW-301", FlatOrShopNo = "301", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var oldProps = new List<PropertyMastOldEntity>
        {
            new() { Id = 701, OldPropertyNo = "OLD-701", OldALV = 12000, OldRV = 10800, IsActive = true }
        }.BuildMock();

        var rvCalcResultsRepo = new Mock<IRepository<RVCalculationResultsEntity, int>>();
        var rvCalcResults = new List<RVCalculationResultsEntity>
        {
            new() { Id = 1, PropertyId = 301, AnnualRentalValue = 15000, RateableValue = 13500, IsActive = true }
        }.BuildMock();
        rvCalcResultsRepo.Setup(r => r.GetQueryable()).Returns(rvCalcResults);

        var mappings = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 301, PropertyIdOld = 701, IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>().BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(oldProps);
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(mappings);

        var mapper = AutoMapperTestHelper.CreateMapper();
        var service = new GetApartmentDetailsWingWiseService(
            _propertyRepo.Object,
            _categoryRepo.Object,
            _propertyTypeRepo.Object,
            _assessmentRepo.Object,
            _societyRepo.Object,
            _wingDetailsMastRepo.Object,
            _wardRepo.Object,
            _zoneRepo.Object,
            _propertyDetailsRepo.Object,
            _floorRepo.Object,
            _constructionTypeRepo.Object,
            _typeOfUseRepo.Object,
            _subTypeOfUseRepo.Object,
            _oldPropertyRepo.Object,
            _propertyMapDetailRepo.Object,
            _transMastRepo.Object,
            _taxMasterRepo.Object,
            _yearMasterRepo.Object,
            _policyCodeMasterRepo.Object,
            _policyTaxDetailsRepo.Object,
            _policyTaxDetailsCVRepo.Object,
            _policyConfigRepo.Object,
            _photoRepo.Object,
            _photoOldRepo.Object,
            _photoTypeRepo.Object,
            _documentBindingRepo.Object,
            _documentRepo.Object,
            mapper,
            _transMastOldRepo.Object,
            _oldPropertyDetailsRepo.Object,
            rvCalcResultsRepo.Object);

        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);
        Assert.Equal(15000m, row.NewSurvey.AnnualRentalValue);
        Assert.Equal(15000m, row.NewSurvey.ALV);
        Assert.Equal(12000m, row.OldSurvey.AnnualRentalValue);
        Assert.Equal(12000m, row.OldSurvey.ALV);
        Assert.Equal(3000m, row.Difference.AnnualRentalValueDiff);
        Assert.Equal(3000m, row.Difference.ALVDiff);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_IncludesFloorCodeAndConstructionCode_InNewSurveyResponse()
    {
        // Arrange
        var newProps = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock();

        var newDetails = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, FloorId = 10, ConstructionTypeId = 20, IsActive = true }
        }.BuildMock();

        var floors = new List<FloorEntity>
        {
            new() { Id = 10, FloorCode = "FL-01", Description = "First Floor", IsActive = true }
        }.BuildMock();

        var constructionTypes = new List<ConstructionTypeEntity>
        {
            new() { Id = 20, ConstructionCode = "RCC-01", Description = "RCC", IsActive = true }
        }.BuildMock();

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(newProps);
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(newDetails);
        _floorRepo.Setup(r => r.GetQueryable()).Returns(floors);
        _constructionTypeRepo.Setup(r => r.GetQueryable()).Returns(constructionTypes);
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var service = CreateService();
        var query = new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 };

        // Act
        var result = await service.GetApartmentDetailsWingWiseAsync(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var row = Assert.Single(result.Items);
        Assert.Equal("FL-01", row.NewSurvey.FloorCode);
        Assert.Equal("First Floor", row.NewSurvey.Floor);
        Assert.Equal("RCC-01", row.NewSurvey.ConstructionCode);
        Assert.Equal("RCC", row.NewSurvey.ConstructionType);
    }

    // ── OC No / OC Date come from PropertyCertificates (type OC), by scope: unit -> wing -> society ──

    private async Task<NewSurveyPropertyDto> GetUnitRowWithCertificatesAsync(params PropertyCertificateEntity[] certificates)
    {
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 400.0, IsActive = true }
        }.BuildMock());
        _wingDetailsMastRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = 1, SocietyDetailsMastId = 7, WingName = "A", IsActive = true }
        }.BuildMock());
        _societyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = 7, PropertyId = 900, IsActive = true }
        }.BuildMock());
        _certificateRepo.Setup(r => r.GetQueryable()).Returns(certificates.ToList().BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(
            new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 }, CancellationToken.None);

        return Assert.Single(result.Items).NewSurvey;
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_UnitOcCertificate_FillsOcNoAndDate()
    {
        var row = await GetUnitRowWithCertificatesAsync(
            PropertyCertificateEntity.Create(101, OcTypeId, "OC-101", new DateTime(2024, 3, 5)));

        Assert.Equal("OC-101", row.OCNo);
        Assert.Equal(new DateTime(2024, 3, 5), row.OCDate);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_NoUnitCertificate_FallsBackToWingThenSociety()
    {
        var wingRow = await GetUnitRowWithCertificatesAsync(
            PropertyCertificateEntity.Create(null, OcTypeId, "OC-WING", new DateTime(2023, 1, 10), entityType: "W", societyDetailId: 7, wingDetailId: 1),
            PropertyCertificateEntity.Create(null, OcTypeId, "OC-SOC", new DateTime(2022, 1, 10), entityType: "S", societyDetailId: 7));
        Assert.Equal("OC-WING", wingRow.OCNo);

        var societyRow = await GetUnitRowWithCertificatesAsync(
            PropertyCertificateEntity.Create(null, OcTypeId, "OC-SOC", new DateTime(2022, 1, 10), entityType: "S", societyDetailId: 7));
        Assert.Equal("OC-SOC", societyRow.OCNo);
        Assert.Equal(new DateTime(2022, 1, 10), societyRow.OCDate);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_UnitCertificateWinsOverWingCertificate()
    {
        var row = await GetUnitRowWithCertificatesAsync(
            PropertyCertificateEntity.Create(null, OcTypeId, "OC-WING", new DateTime(2023, 1, 10), entityType: "W", societyDetailId: 7, wingDetailId: 1),
            PropertyCertificateEntity.Create(101, OcTypeId, "OC-UNIT", new DateTime(2024, 6, 1)));

        Assert.Equal("OC-UNIT", row.OCNo);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_OcCertificateWithoutNumberOrDate_ShowsNothing()
    {
        // A certificate that was only marked as issued (for example an imported PDF) has no number and no date to show.
        var row = await GetUnitRowWithCertificatesAsync(PropertyCertificateEntity.Create(101, OcTypeId));

        Assert.Null(row.OCNo);
        Assert.Null(row.OCDate);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_OtherCertificateType_IsNotShownAsOc()
    {
        var row = await GetUnitRowWithCertificatesAsync(
            PropertyCertificateEntity.Create(101, OcTypeId + 1, "CC-9", new DateTime(2024, 3, 5)));

        Assert.Null(row.OCNo);
    }

    // ── IMG / PLAN icons: front photo and PROPERTY_PLAN (own, else the shared society / wing + Type plan) ──

    private static readonly Guid FrontGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OwnPlanGuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid SharedPlanGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private async Task<NewSurveyPropertyDto> GetUnitRowWithPhotosAsync(string? unitType, params PropertyPhotoEntity[] photos)
    {
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, Type = unitType, IsActive = true }
        }.BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 400.0, IsActive = true }
        }.BuildMock());
        _wingDetailsMastRepo.Setup(r => r.GetQueryable()).Returns(new List<WingDetailsMastEntity>
        {
            new() { Id = 1, SocietyDetailsMastId = 7, WingName = "A", IsActive = true }
        }.BuildMock());
        _societyRepo.Setup(r => r.GetQueryable()).Returns(new List<SocietyDetailsEntity>
        {
            new() { Id = 7, PropertyId = 900, IsActive = true }
        }.BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());

        _photoTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyPhotoTypeEntity>
        {
            new() { Id = 21, PhotoTypeCode = "PROPERTY_FRONT", IsActive = true },
            new() { Id = 13, PhotoTypeCode = "PROPERTY_PLAN", IsActive = true }
        }.BuildMock());
        _photoRepo.Setup(r => r.GetQueryable()).Returns(photos.ToList().BuildMock());
        _documentBindingRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentBindingEntity>
        {
            new() { Id = 1, DocumentId = 1, IsActive = true },
            new() { Id = 2, DocumentId = 2, IsActive = true },
            new() { Id = 3, DocumentId = 3, IsActive = true }
        }.BuildMock());
        _documentRepo.Setup(r => r.GetQueryable()).Returns(new List<DocumentEntity>
        {
            new() { Id = 1, DocumentGuid = FrontGuid, IsActive = true },
            new() { Id = 2, DocumentGuid = OwnPlanGuid, IsActive = true },
            new() { Id = 3, DocumentGuid = SharedPlanGuid, IsActive = true }
        }.BuildMock());

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(
            new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 }, CancellationToken.None);

        return Assert.Single(result.Items).NewSurvey;
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_FrontPhoto_FillsTheImageIcon()
    {
        var row = await GetUnitRowWithPhotosAsync(null,
            PropertyPhotoEntity.CreateWithDetails(101, 21, "P", 7, 1, documentBindingId: 1, displayOrder: 1));

        Assert.Equal(FrontGuid, row.PropertyPhotoDocumentGuid);
        Assert.Null(row.PlanPhotoDocumentGuid);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_UnitsOwnPlan_FillsThePlanIcon()
    {
        var row = await GetUnitRowWithPhotosAsync("1",
            PropertyPhotoEntity.CreateWithDetails(101, 13, "P", 7, 1, documentBindingId: 2, displayOrder: 1),
            PropertyPhotoEntity.CreateWithDetails(null, 13, "S", 7, null, documentBindingId: 3, displayOrder: 1, type: "1"));

        Assert.Equal(OwnPlanGuid, row.PlanPhotoDocumentGuid); // its own plan wins over the shared one
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_NoOwnPlan_UsesTheSharedPlanOfItsSocietyAndType()
    {
        var row = await GetUnitRowWithPhotosAsync("1",
            PropertyPhotoEntity.CreateWithDetails(null, 13, "S", 7, null, documentBindingId: 3, displayOrder: 1, type: "1"));

        Assert.Equal(SharedPlanGuid, row.PlanPhotoDocumentGuid);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_SharedPlanOfAnotherType_IsNotShown()
    {
        var row = await GetUnitRowWithPhotosAsync("2",
            PropertyPhotoEntity.CreateWithDetails(null, 13, "S", 7, null, documentBindingId: 3, displayOrder: 1, type: "1"));

        Assert.Null(row.PlanPhotoDocumentGuid);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_UnitWithoutType_GetsNoSharedPlan()
    {
        var row = await GetUnitRowWithPhotosAsync(null,
            PropertyPhotoEntity.CreateWithDetails(null, 13, "S", 7, null, documentBindingId: 3, displayOrder: 1, type: "1"));

        Assert.Null(row.PlanPhotoDocumentGuid);
    }

    // ── RENTER and RENT (M/Y) come from PTIS.RenterMast ──

    private async Task<NewSurveyPropertyDto> GetUnitRowWithRentersAsync(params RenterMastEntity[] renters)
    {
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", FlatOrShopNo = "101", WingDetailId = 1, CategoryId = 1, IsActive = true }
        }.BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 400.0, IsActive = true },
            new() { Id = 2, PropertyId = 101, CarpetAreaSqFeet = 200.0, IsActive = true }
        }.BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMastOldEntity>().BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyMapDetailEntity>().BuildMock());
        _renterRepo.Setup(r => r.GetQueryable()).Returns(renters.ToList().BuildMock());

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(
            new GetApartmentDetailsWingWiseQueryParameters { WingDetailId = 1 }, CancellationToken.None);

        return Assert.Single(result.Items).NewSurvey;
    }

    private static RenterMastEntity Renter(int id, int detailId, string name, double? monthly, double? yearly, DateTime created, bool active = true) => new()
    {
        Id = id, PropertyDetailsId = detailId, RenterName = name, RenterNameEnglish = name + " (en)", RentMonthly = monthly, FinalYearlyRent = yearly,
        CreatedDate = created, IsActive = active
    };

    [Fact]
    public async Task GetApartmentDetailsWingWise_Renter_FillsNameAndMonthlyAndYearlyRent()
    {
        var row = await GetUnitRowWithRentersAsync(Renter(1, 1, "Sharma", 10000, 120000, new DateTime(2024, 1, 1)));

        Assert.Equal("Sharma", row.RenterName);
        Assert.Equal("Sharma (en)", row.RenterNameEnglish);
        Assert.Equal(10000m, row.RentMonthly);
        Assert.Equal(120000m, row.RentYearly);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_YearlyRentNotSet_IsTheMonthlyRentTimesTwelve()
    {
        var row = await GetUnitRowWithRentersAsync(Renter(1, 1, "Sharma", 5000, null, new DateTime(2024, 1, 1)));

        Assert.Equal(5000m, row.RentMonthly);
        Assert.Equal(60000m, row.RentYearly);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_LatestRenterOfADetailCounts_AndDetailsAreAddedUp()
    {
        var row = await GetUnitRowWithRentersAsync(
            Renter(1, 1, "Old tenant", 1000, 12000, new DateTime(2022, 1, 1)),
            Renter(2, 1, "New tenant", 2000, 24000, new DateTime(2024, 1, 1)),   // latest renter of detail 1
            Renter(3, 2, "Shop tenant", 3000, 36000, new DateTime(2023, 6, 1)));  // detail 2

        Assert.Equal("New tenant", row.RenterName);          // the latest renter overall
        Assert.Equal(5000m, row.RentMonthly);                // 2000 + 3000
        Assert.Equal(60000m, row.RentYearly);                // 24000 + 36000
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_InactiveRenter_IsIgnored_AndNoRenterGivesNothing()
    {
        var inactive = await GetUnitRowWithRentersAsync(Renter(1, 1, "Gone", 9000, 108000, new DateTime(2024, 1, 1), active: false));
        Assert.Null(inactive.RenterName);
        Assert.Null(inactive.RentMonthly);
        Assert.Null(inactive.RentYearly);

        var none = await GetUnitRowWithRentersAsync();
        Assert.Null(none.RenterName);
        Assert.Null(none.RentMonthly);
    }
    // ── Sort of the whole list (server side) ─────────────────────────────────────────────────────

    /// <summary>Units 101..N of one wing with the given carpet areas (in order of id).</summary>
    private void SeedUnitsWithCarpetAreas(params double[] carpetAreas)
    {
        var props = new List<PropertyEntity>();
        var details = new List<PropertyDetailsEntity>();
        for (var i = 0; i < carpetAreas.Length; i++)
        {
            props.Add(new PropertyEntity { Id = 101 + i, PropertyNo = $"NEW-{101 + i}", WingDetailId = 1, CategoryId = 1, IsActive = true });
            details.Add(new PropertyDetailsEntity { Id = 1 + i, PropertyId = 101 + i, CarpetAreaSqFeet = carpetAreas[i], IsActive = true });
        }

        _propertyRepo.Setup(r => r.GetQueryable()).Returns(props.BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
    }

    private static GetApartmentDetailsWingWiseQueryParameters SortedQuery(string sortBy, string order, int page, int size) =>
        new() { WingDetailId = 1, SortBy = sortBy, SortOrder = order, PageNumber = page, PageSize = size };

    private static List<long> PropertyNos(IEnumerable<ApartmentQCComparisonDto> rows) =>
        rows.Select(r => long.Parse(r.NewSurvey.PropertyNo.Replace("NEW-", string.Empty))).ToList();

    [Fact]
    public async Task GetApartmentDetailsWingWise_SortedByAColumn_OrdersAllUnitsAcrossThePages()
    {
        SeedUnitsWithCarpetAreas(500, 100, 300, 200, 400);   // units 101..105
        var service = CreateService();

        var page1 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 1, 2), CancellationToken.None);
        var page2 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 2, 2), CancellationToken.None);
        var page3 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 3, 2), CancellationToken.None);

        Assert.Equal(new long[] { 102, 104 }, PropertyNos(page1.Items));   // 100, 200
        Assert.Equal(new long[] { 103, 105 }, PropertyNos(page2.Items));   // 300, 400
        Assert.Equal(new long[] { 101 }, PropertyNos(page3.Items));        // 500
        Assert.Equal(5, page1.TotalCount);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_SortedDescending_ReversesTheOrder()
    {
        SeedUnitsWithCarpetAreas(500, 100, 300, 200, 400);
        var service = CreateService();

        var page1 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "desc", 1, 3), CancellationToken.None);

        Assert.Equal(new long[] { 101, 105, 103 }, PropertyNos(page1.Items));   // 500, 400, 300
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_NextPagesComeFromTheOrderOfPageOne_WhenTheCacheIsOn()
    {
        SeedUnitsWithCarpetAreas(500, 100, 300, 200, 400);
        var service = CreateService(new ApartmentSortOrderCache());

        var page1 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 1, 2), CancellationToken.None);
        var page2 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 2, 2), CancellationToken.None);
        var page3 = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 3, 2), CancellationToken.None);

        Assert.Equal(new long[] { 102, 104 }, PropertyNos(page1.Items));
        Assert.Equal(new long[] { 103, 105 }, PropertyNos(page2.Items));
        Assert.Equal(new long[] { 101 }, PropertyNos(page3.Items));
        Assert.Equal(5, page2.TotalCount);
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_PageOneAlwaysRecomputesTheOrder_SoANewSortIsNeverStale()
    {
        SeedUnitsWithCarpetAreas(500, 100, 300);
        var service = CreateService(new ApartmentSortOrderCache());

        var first = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 1, 10), CancellationToken.None);
        SeedUnitsWithCarpetAreas(50, 100, 300);   // unit 101 is now the smallest
        var again = await service.GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "asc", 1, 10), CancellationToken.None);

        Assert.Equal(new long[] { 102, 103, 101 }, PropertyNos(first.Items));
        Assert.Equal(new long[] { 101, 102, 103 }, PropertyNos(again.Items));
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_SortByAColumnOfTheExistingTable_OrdersByTheOldAssessment()
    {
        var props = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 102, PropertyNo = "NEW-102", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 103, PropertyNo = "NEW-103", WingDetailId = 1, CategoryId = 1, IsActive = true }
        };
        var olds = new List<PropertyMastOldEntity>
        {
            new() { Id = 501, OldPropertyNo = "OLD-501", OldRV = 30000, OldTotalTax = 1, IsActive = true },
            new() { Id = 502, OldPropertyNo = "OLD-502", OldRV = 10000, OldTotalTax = 1, IsActive = true },
            new() { Id = 503, OldPropertyNo = "OLD-503", OldRV = 20000, OldTotalTax = 1, IsActive = true }
        };
        var maps = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true },
            new() { Id = 2, PropertyIdNew = 102, PropertyIdOld = 502, IsActive = true },
            new() { Id = 3, PropertyIdNew = 103, PropertyIdOld = 503, IsActive = true }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(props.BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(olds.BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(maps.BuildMock());

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(SortedQuery("existing:rv", "asc", 1, 10), CancellationToken.None);

        Assert.Equal(new long[] { 102, 103, 101 }, PropertyNos(result.Items));   // old RV 10000, 20000, 30000
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_SortedList_KeepsManyNewToOneOldInOneRow_AndCountsTheRows()
    {
        var props = new List<PropertyEntity>
        {
            new() { Id = 101, PropertyNo = "NEW-101", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 102, PropertyNo = "NEW-102", WingDetailId = 1, CategoryId = 1, IsActive = true },
            new() { Id = 103, PropertyNo = "NEW-103", WingDetailId = 1, CategoryId = 1, IsActive = true }
        };
        var details = new List<PropertyDetailsEntity>
        {
            new() { Id = 1, PropertyId = 101, CarpetAreaSqFeet = 400, IsActive = true },
            new() { Id = 2, PropertyId = 102, CarpetAreaSqFeet = 600, IsActive = true },
            new() { Id = 3, PropertyId = 103, CarpetAreaSqFeet = 700, IsActive = true }
        };
        var olds = new List<PropertyMastOldEntity> { new() { Id = 501, OldPropertyNo = "OLD-501", OldRV = 1, IsActive = true } };
        var maps = new List<PropertyMapDetailEntity>
        {
            new() { Id = 1, PropertyIdNew = 101, PropertyIdOld = 501, IsActive = true },
            new() { Id = 2, PropertyIdNew = 102, PropertyIdOld = 501, IsActive = true }
        };
        _propertyRepo.Setup(r => r.GetQueryable()).Returns(props.BuildMock());
        _propertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(details.BuildMock());
        _oldPropertyRepo.Setup(r => r.GetQueryable()).Returns(olds.BuildMock());
        _propertyMapDetailRepo.Setup(r => r.GetQueryable()).Returns(maps.BuildMock());

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(SortedQuery("survey:cpt", "desc", 1, 10), CancellationToken.None);

        Assert.Equal(2, result.TotalCount);                              // 101 + 102 are one row
        Assert.Equal(1000m, result.Items.ToList()[0].NewSurvey.CarpetASqFt);      // 400 + 600, the value of the row
        Assert.Equal(700m, result.Items.ToList()[1].NewSurvey.CarpetASqFt);       // unit 103
    }

    [Fact]
    public async Task GetApartmentDetailsWingWise_UnknownSortColumn_KeepsTheOriginalOrder()
    {
        SeedUnitsWithCarpetAreas(500, 100, 300);

        var result = await CreateService().GetApartmentDetailsWingWiseAsync(SortedQuery("survey:nonsense", "asc", 1, 10), CancellationToken.None);

        Assert.Equal(new long[] { 101, 102, 103 }, PropertyNos(result.Items));
    }
}
