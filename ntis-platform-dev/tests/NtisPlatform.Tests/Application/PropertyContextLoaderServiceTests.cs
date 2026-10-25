using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.Rules.RuleExecution;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Application.Interfaces.TaxEngine;
using NtisPlatform.Application.Services.Rules;
using NtisPlatform.Application.Services.TaxEngine;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Rules;
using NtisPlatform.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NtisPlatform.Tests.Application
{
    /// <summary>
    /// Unit tests for <see cref="PropertyContextLoaderService"/>.
    ///
    /// Each test covers a distinct execution path through <c>LoadPropertyContextAsync</c>:
    /// — DB query composition and parallel fetch
    /// — All validation checks (property, details, construction year, year range)
    /// — The shape and values of the assembled <see cref="PropertyCalculationContext"/>
    /// </summary>
    public class PropertyContextLoaderServiceTests
    {
        // ─── Shared Mocks ─────────────────────────────────────────────────────────

        private readonly Mock<IRepository<PropertyEntity, int>> _propertyRepo;
        private readonly Mock<IRepository<PropertyCategoryEntity, int>> _categoryRepo;
        private readonly Mock<IRepository<PropertyDetailsEntity, int>> _propertyDetailsRepo;
        private readonly Mock<IRepository<PropertyAssessmentEntity, int>> _propertyAssessmentRepo;
        private readonly Mock<IRepository<PropertySocialDetailsEntity, int>> _propertySocialDetailsRepo;
        private readonly Mock<IRepository<RenterMastEntity, int>> _renterRepo;
        private readonly Mock<IRepository<PropertyCertificateEntity, int>> _propertyCertificateRepo;
        private readonly Mock<ITaxMasterDataService> _masterDataService;

        private readonly Mock<IFinanceYearProvider> _financeYearProvider;
        private readonly Mock<IRepository<YearMasterEntity, int>> _yearMasterRepo;
        private readonly Mock<IRVCalculationCleanupService> _rvCalculationCleanupService;
        private readonly Mock<IUnitOfWork> _unitOfWork;
        private readonly Mock<IRepository<RVCalculationResultsEntity, int>> _rvCalculationResultsRepo;
        private readonly Mock<IRepository<TransMastEntity, int>> _transMastRepo;
        private readonly Mock<IRepository<WingDetailsMastEntity, int>> _wingDetailsMastRepo;
        private readonly Mock<IRepository<SocietyDetailsEntity, int>> _societyRepo;

        // Standard valid year range used across most tests
        private static readonly AssessmentYearRangeEntity DefaultYearRange = new()
        {
            Id = 10,
            FromYear = 2000,
            ToYear = 2030,
            IsActive = true
        };

        public PropertyContextLoaderServiceTests()
        {
            _propertyRepo = new Mock<IRepository<PropertyEntity, int>>();
            _categoryRepo = new Mock<IRepository<PropertyCategoryEntity, int>>();
            _propertyDetailsRepo = new Mock<IRepository<PropertyDetailsEntity, int>>();
            _propertyAssessmentRepo = new Mock<IRepository<PropertyAssessmentEntity, int>>();
            _propertySocialDetailsRepo = new Mock<IRepository<PropertySocialDetailsEntity, int>>();
            _renterRepo = new Mock<IRepository<RenterMastEntity, int>>();
            _propertyCertificateRepo = new Mock<IRepository<PropertyCertificateEntity, int>>();

            _financeYearProvider = new Mock<IFinanceYearProvider>();
            _yearMasterRepo = new Mock<IRepository<YearMasterEntity, int>>();
            _rvCalculationCleanupService = new Mock<IRVCalculationCleanupService>();
            _unitOfWork = new Mock<IUnitOfWork>();
            _rvCalculationResultsRepo = new Mock<IRepository<RVCalculationResultsEntity, int>>();
            _transMastRepo = new Mock<IRepository<TransMastEntity, int>>();
            _wingDetailsMastRepo = new Mock<IRepository<WingDetailsMastEntity, int>>();
            _societyRepo = new Mock<IRepository<SocietyDetailsEntity, int>>();

            _masterDataService = new Mock<ITaxMasterDataService>();

            // Default: all repos return empty async-capable mocks.
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>().BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>().BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>().BuildMockDbSet().Object);

            _propertyAssessmentRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyAssessmentEntity>().BuildMockDbSet().Object);

            _propertySocialDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertySocialDetailsEntity>().BuildMockDbSet().Object);

            _renterRepo.Setup(r => r.GetQueryable())
                .Returns(new List<RenterMastEntity>().BuildMockDbSet().Object);

            _propertyCertificateRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCertificateEntity>().BuildMockDbSet().Object);

            _wingDetailsMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<WingDetailsMastEntity>().BuildMockDbSet().Object);

            _societyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SocietyDetailsEntity>().BuildMockDbSet().Object);

            _financeYearProvider.Setup(x => x.GetCurrentFinanceYear())
                .Returns(2026);

            _yearMasterRepo.Setup(r => r.GetQueryable())
                .Returns(new List<YearMasterEntity>().BuildMockDbSet().Object);

            _rvCalculationResultsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<RVCalculationResultsEntity>().BuildMockDbSet().Object);

            _transMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<TransMastEntity>().BuildMockDbSet().Object);

            _unitOfWork.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);
        }

        // ─── Failure / Validation Tests ──────────────────────────────────────────

        [Fact]
        public async Task LoadPropertyContextAsync_PropertyNotFound_ThrowsInvalidOperationException()
        {
            // Arrange
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>().BuildMockDbSet().Object);

            var sut = CreateService();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => sut.LoadPropertyContextAsync(99, 2026));

            Assert.Contains("Property not found", ex.Message);
            Assert.Contains("99", ex.Message);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_NoPropertyDetails_DeactivatesExistingRVCalculationsAndReturnsEmptyContext()
        {
            // Arrange
            const int propertyId = 1;
            const int financeYear = 2026;
            const int yearMasterId = 7;

            SetupValidProperty(propertyId);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>().BuildMockDbSet().Object);

            _financeYearProvider.Setup(x => x.GetCurrentFinanceYear())
                .Returns(financeYear);

            _yearMasterRepo.Setup(r => r.GetQueryable())
                .Returns(new List<YearMasterEntity>
                {
                    new()
                    {
                        Id = yearMasterId,
                        Year = financeYear,
                        IsActive = true
                    }
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, financeYear);

            // Assert — context signals empty details so callers can return a zero result
            Assert.NotNull(ctx);
            Assert.Empty(ctx.Details);
            Assert.Equal(financeYear, ctx.Parameters.FinanceYear);

            _rvCalculationCleanupService.Verify(
                x => x.DeactivateExistingRVCalculationsAsync(
                    propertyId,
                    financeYear,
                    yearMasterId),
                Times.Once);

            _unitOfWork.Verify(
                x => x.SaveChangesAsync(It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_ConstructionYearIsNull_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupValidProperty(propertyId: 1);
            SetupPropertyDetails(propertyId: 1, constructionYear: null);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => sut.LoadPropertyContextAsync(1, 2026));

            Assert.Contains("ConstructionYear not found", ex.Message);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_ConstructionYearIsNotNumeric_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupValidProperty(propertyId: 1);
            SetupPropertyDetails(propertyId: 1, constructionYear: "INVALID");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => sut.LoadPropertyContextAsync(1, 2026));

            Assert.Contains("Invalid ConstructionYear", ex.Message);
            Assert.Contains("INVALID", ex.Message);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_NoMatchingYearRange_ReturnsZeroYearRangeRVId()
        {
            // Arrange — construction year 1850 is outside DefaultYearRange (2000-2030).
            // No range covering the construction year must not fail the whole request;
            // it should fall back to YearRangeRVId=0, which downstream tax calculation
            // already treats as "apply zero tax" instead of throwing.
            SetupValidProperty(propertyId: 1);
            SetupPropertyDetails(propertyId: 1, constructionYear: "1850");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(1, 2026);

            // Assert
            Assert.Equal(0, ctx.Parameters.YearRangeRVId);
        }

        // ─── Happy Path Tests ────────────────────────────────────────────────────

        [Fact]
        public async Task LoadPropertyContextAsync_ValidInput_ReturnsPopulatedContext()
        {
            // Arrange
            const int propertyId = 1;
            const int financeYear = 2026;
            const int constructionYearValue = 2015;

            SetupValidProperty(propertyId);
            SetupPropertyDetails(
                propertyId,
                constructionYear: constructionYearValue.ToString(),
                assessmentYear: constructionYearValue.ToString());

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, financeYear);

            // Assert — entity aggregates
            Assert.NotNull(ctx);
            Assert.NotNull(ctx.Property);
            Assert.Equal(propertyId, ctx.Property.Id);
            Assert.NotEmpty(ctx.Details);

            // Assert — typed parameters
            Assert.Equal(financeYear, ctx.Parameters.FinanceYear);
            Assert.Equal(constructionYearValue, ctx.Parameters.ConstructionYearValue);
            Assert.Equal(DefaultYearRange.Id, ctx.Parameters.YearRangeRVId);

            // Per-detail fields are null at root context level
            Assert.Null(ctx.Parameters.Detail);
            Assert.Null(ctx.Parameters.DetailTypeOfUse);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_ValidInput_CalculatesBuildingMaxFloorParametersCorrectly()
        {
            // Arrange
            const int propertyId = 1;
            SetupValidProperty(propertyId);

            var floor10 = new FloorEntity { FloorCode = "10", SequenceNo = 21 };
            var floor2 = new FloorEntity { FloorCode = "2", SequenceNo = 13 };

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 1,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        FloorId = 1,
                        Floor = floor2
                    },
                    new()
                    {
                        Id = 2,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        FloorId = 2,
                        Floor = floor10
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            Assert.Equal(21, ctx.Parameters.BuildingMaxFloorSequence);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_PropertyHasSocialAttributes_PopulatesSocialAttributeIds()
        {
            // Arrange
            const int propertyId = 1;

            SetupValidProperty(propertyId);
            SetupPropertyDetails(propertyId, constructionYear: "2010");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            _propertySocialDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertySocialDetailsEntity>
                {
                    new()
                    {
                        Id = 1,
                        PropertyId = propertyId,
                        IsActive = true,
                        SocialAttributeId = 99,
                        BitValue = true,
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 99,
                            SocialAttributeCode = "HAS_LIFT",
                            DataType = "BIT"
                        }
                    }
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.Contains(99, ctx.Parameters.SocialAttributeId);
            Assert.True(ctx.Parameters.SocialAttributes.ContainsKey("HAS_LIFT"));
            Assert.Equal(true, ctx.Parameters.SocialAttributes["HAS_LIFT"]);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_AssessmentNotFound_ReturnsNullAssessmentAndContinues()
        {
            // Arrange
            SetupValidProperty(propertyId: 1);
            SetupPropertyDetails(propertyId: 1, constructionYear: "2010");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            _propertyAssessmentRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyAssessmentEntity>().BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(1, 2026);

            // Assert
            Assert.Null(ctx.PropertyAssessment);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_ChildCollections_ArePopulatedCorrectly()
        {
            // Arrange
            const int propertyId = 1;
            const int detailId = 42;

            SetupValidProperty(propertyId);
            SetupPropertyDetails(propertyId, constructionYear: "2012", detailId: detailId);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            _renterRepo.Setup(r => r.GetQueryable())
                .Returns(new List<RenterMastEntity>
                {
                    new()
                    {
                        Id = 1,
                        PropertyDetailsId = detailId,
                        IsActive = true,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            var ocCertificate = PropertyCertificateEntity.Create(
                propertyId: propertyId,
                certificateTypeId: 1,
                certificateNo: "OC-123",
                issueDate: DateTime.Now,
                propertyDetailsId: detailId);
            typeof(PropertyCertificateEntity)
                .GetProperty(nameof(PropertyCertificateEntity.CertificateType))!
                .SetValue(ocCertificate, new PropertyCertificateTypeMasterEntity
                {
                    CertificateTypeCode = CertificateTypeCodes.OC
                });

            _propertyCertificateRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCertificateEntity> { ocCertificate }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.Single(ctx.Renters);
            Assert.Single(ctx.Certificates);
            Assert.Equal("OC-123", ctx.Certificates[0].CertificateNo);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_AllCertificateTypes_AreLoadedAndResolvedCorrectly()
        {
            // Arrange
            const int propertyId = 1;
            const int detailId1 = 101;
            const int detailId2 = 102;

            SetupValidProperty(propertyId);
            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new() { Id = detailId1, PropertyId = propertyId, ConstructionYear = "2020", AssessmentYear = "2020", IsActive = true },
                    new() { Id = detailId2, PropertyId = propertyId, ConstructionYear = "2020", AssessmentYear = "2020", IsActive = true }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            // Detail 101 has OC; Detail 102 has CC; Property level has EleBillDt
            var ocCert = PropertyCertificateEntity.Create(propertyId, 2, "OC-101", DateTime.Now, detailId1);
            typeof(PropertyCertificateEntity).GetProperty(nameof(PropertyCertificateEntity.CertificateType))!
                .SetValue(ocCert, new PropertyCertificateTypeMasterEntity { Id = 2, CertificateTypeCode = "OC", CertificateTypeName = "Occupancy Certificate" });

            var ccCert = PropertyCertificateEntity.Create(propertyId, 1, "CC-102", DateTime.Now, detailId2);
            typeof(PropertyCertificateEntity).GetProperty(nameof(PropertyCertificateEntity.CertificateType))!
                .SetValue(ccCert, new PropertyCertificateTypeMasterEntity { Id = 1, CertificateTypeCode = "CC", CertificateTypeName = "Completion Certificate" });

            var eleBillCert = PropertyCertificateEntity.Create(propertyId, 3, "EB-PROP", DateTime.Now);
            typeof(PropertyCertificateEntity).GetProperty(nameof(PropertyCertificateEntity.CertificateType))!
                .SetValue(eleBillCert, new PropertyCertificateTypeMasterEntity { Id = 3, CertificateTypeCode = "EleBillDt", CertificateTypeName = "Electric Bill Date" });

            _propertyCertificateRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCertificateEntity> { ocCert, ccCert, eleBillCert }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert root context
            Assert.Equal(3, ctx.Certificates.Count);
            Assert.True(ctx.Parameters.ElectricBillDate); // Property-level fallback

            // Clone for detail 101
            var detail1 = ctx.Details.First(d => d.Id == detailId1);
            var cloned1 = ctx.CloneForDetail(detail1, new TypeOfUseEntity { Id = 1 });
            Assert.True(cloned1.Parameters.OccupancyCertificate);
            Assert.False(cloned1.Parameters.CommencementCertificate); // CC was for detail 102
            Assert.True(cloned1.Parameters.ElectricBillDate); // Fallback to property-level
            Assert.True(cloned1.Parameters.CertificatesByCode.ContainsKey("OC"));
            Assert.True(cloned1.Parameters.CertificatesByCode.ContainsKey("EleBillDt"));

            // Clone for detail 102
            var detail2 = ctx.Details.First(d => d.Id == detailId2);
            var cloned2 = ctx.CloneForDetail(detail2, new TypeOfUseEntity { Id = 1 });
            Assert.False(cloned2.Parameters.OccupancyCertificate);
            Assert.True(cloned2.Parameters.CommencementCertificate);
            Assert.True(cloned2.Parameters.ElectricBillDate); // Fallback to property-level
            Assert.True(cloned2.Parameters.CertificatesByCode.ContainsKey("CC"));

            // Verify PropertyFieldFlattenerService produces exact keys for rule json
            var flattener = new PropertyFieldFlattenerService();
            var activeFields = new List<RulesFieldEntity>
            {
                new() { Id = 13, FieldName = "Occupancy Certificate", DatabaseColumnName = "OccupancyCertificate", IsActive = true },
                new() { Id = 14, FieldName = "Commencement Certificate", DatabaseColumnName = "CommencementCertificate", IsActive = true },
                new() { Id = 4013, FieldName = "Electric Bill Date", DatabaseColumnName = "ElectricBillDate", IsActive = true }
            };

            var flatInput1 = flattener.Flatten(cloned1, activeFields);
            Assert.Equal(true, flatInput1["OccupancyCertificate"]);
            Assert.Equal(false, flatInput1["CommencementCertificate"]);
            Assert.Equal(true, flatInput1["ElectricBillDate"]);
            Assert.Equal(true, flatInput1["Occupancy Certificate"]);
            Assert.Equal(false, flatInput1["Commencement Certificate"]);
            Assert.Equal(true, flatInput1["Electric Bill Date"]);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_CloneForDetail_SetsPerDetailParameters()
        {
            // Arrange
            SetupValidProperty(propertyId: 1);
            SetupPropertyDetails(propertyId: 1, constructionYear: "2010", assessmentYear: "2015");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();
            var ctx = await sut.LoadPropertyContextAsync(1, 2026);

            var detail = ctx.Details[0];
            var detailTypeOfUse = new TypeOfUseEntity
            {
                Id = 5,
                TypeOfUseGroupId = 3
            };

            // Act
            var cloned = ctx.CloneForDetail(detail, detailTypeOfUse);

            // Assert — per-detail fields
            Assert.Same(detail, cloned.Parameters.Detail);
            Assert.Same(detailTypeOfUse, cloned.Parameters.DetailTypeOfUse);
            Assert.NotNull(cloned.Parameters.AssessmentYearValue);
            Assert.NotNull(cloned.Parameters.YearRangeRVIdForDetail);

            // Assert — global parameters (should be same across all details)
            Assert.Equal(ctx.Parameters.FinanceYear, cloned.Parameters.FinanceYear);
            Assert.Equal(ctx.Parameters.ConstructionYearValue, cloned.Parameters.ConstructionYearValue);
            Assert.Equal(ctx.Parameters.YearRangeRVId, cloned.Parameters.YearRangeRVId);
            Assert.Equal(ctx.Parameters.SocialAttributeId, cloned.Parameters.SocialAttributeId);

            // Assert — entity references (shared read-only)
            Assert.Same(ctx.Property, cloned.Property);
            Assert.Same(ctx.Details, cloned.Details);
            Assert.Same(ctx.YearRanges, cloned.YearRanges);
        }

        // ─── Private Helpers ─────────────────────────────────────────────────────

        private PropertyContextLoaderService CreateService()
        {
            return new PropertyContextLoaderService(
                _propertyRepo.Object,
                _categoryRepo.Object,
                _propertyDetailsRepo.Object,
                _propertyAssessmentRepo.Object,
                _propertySocialDetailsRepo.Object,
                _renterRepo.Object,
                _propertyCertificateRepo.Object,
                _masterDataService.Object,
                _financeYearProvider.Object,
                _yearMasterRepo.Object,
                _rvCalculationCleanupService.Object,
                _unitOfWork.Object,
                _rvCalculationResultsRepo.Object,
                _transMastRepo.Object,
                NullLogger<PropertyContextLoaderService>.Instance,
                _wingDetailsMastRepo.Object,
                _societyRepo.Object);
        }

        private void SetupValidProperty(int propertyId)
        {
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1
                    }
                }.BuildMockDbSet().Object);
        }

        private void SetupPropertyDetails(
            int propertyId,
            string? constructionYear,
            int detailId = 1,
            string? assessmentYear = null)
        {
            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = detailId,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = constructionYear,
                        AssessmentYear = assessmentYear,
                        FloorId = 1,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_MultiplePropertiesSameBuilding_CalculatesMaxFloorAcrossAllProperties()
        {
            // Arrange
            const int targetPropertyId = 1;
            const int otherPropertyId = 2;
            const string propertyNo = "APT100";

            // Setup properties sharing WardId and PropertyNo
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    },
                    new()
                    {
                        Id = otherPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            var floor5 = new FloorEntity { FloorCode = "5", SequenceNo = 5 }; // Should be ignored as < 12
            var floor12 = new FloorEntity { FloorCode = "12", SequenceNo = 12 };
            var floor13 = new FloorEntity { FloorCode = "13", SequenceNo = 13 };

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        FloorId = 1,
                        Floor = floor5
                    },
                    new()
                    {
                        Id = 102,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        FloorId = 2,
                        Floor = floor12
                    },
                    new()
                    {
                        Id = 103,
                        PropertyId = otherPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        FloorId = 3,
                        Floor = floor13
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Should be 13 (floor13), since floor12 is smaller and floor5 is ignored (SequenceNo < 12)
            Assert.Equal(13, ctx.Parameters.BuildingMaxFloorSequence);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_MultiplePropertiesSameBuilding_CurrentYear_SumsRateableValueAcrossAllProperties()
        {
            // Arrange
            const int targetPropertyId = 1;
            const int otherPropertyId = 2;
            const string propertyNo = "APT100";
            const int currentFinanceYear = 2026;

            _financeYearProvider.Setup(x => x.GetCurrentFinanceYear())
                .Returns(currentFinanceYear);

            // Setup properties sharing WardId and PropertyNo
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    },
                    new()
                    {
                        Id = otherPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015"
                    },
                    new()
                    {
                        Id = 102,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015"
                    },
                    new()
                    {
                        Id = 103,
                        PropertyId = otherPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015"
                    }
                }.BuildMockDbSet().Object);

            _rvCalculationResultsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<RVCalculationResultsEntity>
                {
                    new() { PropertyId = targetPropertyId, PropertyDetailsId = 101, IsActive = true, MarkedForDeletion = false, RateableValue = 50000m, AnnualRentalValue = 5000d },
                    new() { PropertyId = targetPropertyId, PropertyDetailsId = 102, IsActive = true, MarkedForDeletion = false, RateableValue = 30000m, AnnualRentalValue = 3000d },
                    new() { PropertyId = otherPropertyId, PropertyDetailsId = 103, IsActive = true, MarkedForDeletion = false, RateableValue = 40000m, AnnualRentalValue = 4000d }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, currentFinanceYear);

            // Assert — building total is the sum across every detail in both properties, not just targetPropertyId's own
            Assert.NotNull(ctx);
            Assert.Equal(120000m, ctx.Parameters.BuildingTotalRateableValue);
            Assert.Equal(12000m, ctx.Parameters.BuildingTotalAnnualRentalValue);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_MultiplePropertiesSameBuilding_PastYear_SumsRateableValueFromTransMast()
        {
            // Arrange
            const int targetPropertyId = 1;
            const int otherPropertyId = 2;
            const string propertyNo = "APT100";
            const int currentFinanceYear = 2026;
            const int pastFinanceYear = 2020;
            const int yearMasterId = 55;

            _financeYearProvider.Setup(x => x.GetCurrentFinanceYear())
                .Returns(currentFinanceYear);

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    },
                    new()
                    {
                        Id = otherPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015"
                    }
                }.BuildMockDbSet().Object);

            _yearMasterRepo.Setup(r => r.GetQueryable())
                .Returns(new List<YearMasterEntity>
                {
                    new() { Id = yearMasterId, Year = pastFinanceYear, IsActive = true }
                }.BuildMockDbSet().Object);

            _transMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<TransMastEntity>
                {
                    new() { PropertyId = targetPropertyId, FinanceYearId = yearMasterId, CalculationType = "RV", CalculationValue = 70000m, CalculationAnnualValue = 7000m, IsActive = true, MarkedForDeletion = false, TaxId = 1 },
                    new() { PropertyId = otherPropertyId, FinanceYearId = yearMasterId, CalculationType = "RV", CalculationValue = 25000m, CalculationAnnualValue = 2500m, IsActive = true, MarkedForDeletion = false, TaxId = 1 }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, pastFinanceYear);

            // Assert — TransMast holds one property-wide RV/ALV row per property/year; building total sums across both properties
            Assert.NotNull(ctx);
            Assert.Equal(95000m, ctx.Parameters.BuildingTotalRateableValue);
            Assert.Equal(9500m, ctx.Parameters.BuildingTotalAnnualRentalValue);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_PartitionedProperty_MergesSocialAttributesFromMainProperty()
        {
            // Arrange
            const int targetPropertyId = 10;
            const int mainPropertyId = 20;
            const string propertyNo = "PROP-100";

            // Setup properties: partitioned property and main property
            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = "A",
                        CategoryId = 1
                    },
                    new()
                    {
                        Id = mainPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = null,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            SetupPropertyDetails(targetPropertyId, constructionYear: "2010");

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            // Setup social attributes for both properties
            _propertySocialDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertySocialDetailsEntity>
                {
                    // Partitioned property attributes
                    new()
                    {
                        Id = 1,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        SocialAttributeId = 101,
                        BitValue = false,
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 101,
                            SocialAttributeCode = "HAS_LIFT",
                            DataType = "BIT"
                        }
                    },
                    new()
                    {
                        Id = 2,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        SocialAttributeId = 102,
                        BitValue = true,
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 102,
                            SocialAttributeCode = "HAS_PARKING",
                            DataType = "BIT"
                        }
                    },
                    // Main property attributes (with overlapping "HAS_LIFT")
                    new()
                    {
                        Id = 3,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        SocialAttributeId = 101,
                        BitValue = true, // Main property says true, but target property says false
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 101,
                            SocialAttributeCode = "HAS_LIFT",
                            DataType = "BIT"
                        }
                    },
                    new()
                    {
                        Id = 4,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        SocialAttributeId = 103,
                        BitValue = true, // Unique to main property
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 103,
                            SocialAttributeCode = "HAS_SOLAR",
                            DataType = "BIT"
                        }
                    }
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Overlapping attribute: partitioned property (targetPropertyId) takes precedence
            Assert.True(ctx.Parameters.SocialAttributes.ContainsKey("HAS_LIFT"));
            Assert.Equal(false, ctx.Parameters.SocialAttributes["HAS_LIFT"]);

            // Partitioned property specific attribute
            Assert.True(ctx.Parameters.SocialAttributes.ContainsKey("HAS_PARKING"));
            Assert.Equal(true, ctx.Parameters.SocialAttributes["HAS_PARKING"]);

            // Main property specific attribute (inherited)
            Assert.True(ctx.Parameters.SocialAttributes.ContainsKey("HAS_SOLAR"));
            Assert.Equal(true, ctx.Parameters.SocialAttributes["HAS_SOLAR"]);

            // SocialAttributeId list should contain all of them (distinct)
            Assert.Contains(101, ctx.Parameters.SocialAttributeId);
            Assert.Contains(102, ctx.Parameters.SocialAttributeId);
            Assert.Contains(103, ctx.Parameters.SocialAttributeId);
            Assert.Equal(3, ctx.Parameters.SocialAttributeId.Count);
        }

        [Theory]
        [InlineData("Apartment")]
        [InlineData("Industry")]
        public async Task LoadPropertyContextAsync_ApartmentOrIndustryCategory_FetchesMainPropertyAndCalculatesMaxFloorAcrossAllProperties(string categoryName)
        {
            // Arrange
            const int targetPropertyId = 10;
            const int mainPropertyId = 20;
            const string propertyNo = "PROP-100";

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = "A",
                        CategoryId = 1
                    },
                    new()
                    {
                        Id = mainPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = null,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = categoryName, IsActive = true }
                }.BuildMockDbSet().Object);

            SetupPropertyDetails(targetPropertyId, constructionYear: "2010");

            var floor15 = new FloorEntity { FloorCode = "15", SequenceNo = 15 };
            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2010",
                        FloorId = 1,
                        TypeOfUseId = 1
                    },
                    new()
                    {
                        Id = 102,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2010",
                        FloorId = 2,
                        Floor = floor15,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            _propertySocialDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertySocialDetailsEntity>
                {
                    new()
                    {
                        Id = 1,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        SocialAttributeId = 101,
                        BitValue = true,
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 101,
                            SocialAttributeCode = "HAS_LIFT",
                            DataType = "BIT"
                        }
                    }
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Verify main property attributes are merged
            Assert.True(ctx.Parameters.SocialAttributes.ContainsKey("HAS_LIFT"));
            Assert.Equal(true, ctx.Parameters.SocialAttributes["HAS_LIFT"]);
            // Verify floor sequence checks includes main property
            Assert.Equal(15, ctx.Parameters.BuildingMaxFloorSequence);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_NonApartmentOrIndustryCategory_DoesNotFetchMainPropertyOrCalculateMaxFloorFromOtherProperties()
        {
            // Arrange
            const int targetPropertyId = 10;
            const int mainPropertyId = 20;
            const string propertyNo = "PROP-100";

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = "A",
                        CategoryId = 2 // Individual
                    },
                    new()
                    {
                        Id = mainPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        PropertyNo = propertyNo,
                        PartitionNo = null,
                        CategoryId = 2
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 2, PropertyCategoryName = "Individual", IsActive = true }
                }.BuildMockDbSet().Object);

            SetupPropertyDetails(targetPropertyId, constructionYear: "2010");

            var floor15 = new FloorEntity { FloorCode = "15", SequenceNo = 15 };
            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = targetPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2010",
                        FloorId = 1,
                        TypeOfUseId = 1
                    },
                    new()
                    {
                        Id = 102,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2010",
                        FloorId = 2,
                        Floor = floor15,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            _propertySocialDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertySocialDetailsEntity>
                {
                    new()
                    {
                        Id = 1,
                        PropertyId = mainPropertyId,
                        IsActive = true,
                        SocialAttributeId = 101,
                        BitValue = true,
                        SocialAttribute = new SocialAttributeEntity
                        {
                            Id = 101,
                            SocialAttributeCode = "HAS_LIFT",
                            DataType = "BIT"
                        }
                    }
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(targetPropertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Verify main property attributes are NOT merged
            Assert.False(ctx.Parameters.SocialAttributes.ContainsKey("HAS_LIFT"));
            // Verify floor sequence checks does NOT include main property (so building max floor sequence is 0 since target has no floor sequence >= 12)
            Assert.Equal(0, ctx.Parameters.BuildingMaxFloorSequence);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_CertificateScopeAndHierarchy_ValidatesEntityTypeAndFallsBackCorrectly()
        {
            // Arrange
            const int propertyId = 10;
            const int wingId = 5;
            const int societyId = 99;

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        WingDetailId = wingId,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        AssessmentYear = "2015",
                        FloorId = 1,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);

            _wingDetailsMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<WingDetailsMastEntity>
                {
                    new()
                    {
                        Id = wingId,
                        SocietyDetailsMastId = societyId,
                        IsActive = true,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            _societyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SocietyDetailsEntity>
                {
                    new()
                    {
                        Id = societyId,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var ocType = new PropertyCertificateTypeMasterEntity
            {
                Id = 1,
                CertificateTypeCode = "OC",
                CertificateTypeName = "Occupancy Certificate",
                IsActive = true
            };

            var ccType = new PropertyCertificateTypeMasterEntity
            {
                Id = 2,
                CertificateTypeCode = "CC",
                CertificateTypeName = "Commencement Certificate",
                IsActive = true
            };

            var eleType = new PropertyCertificateTypeMasterEntity
            {
                Id = 3,
                CertificateTypeCode = "EleBillDt",
                CertificateTypeName = "Electric Bill Date",
                IsActive = true
            };

            // Setup certificates:
            // 1. EntityType "S" for societyId -> CC
            // 2. EntityType "W" for wingId -> EleBillDt
            // 3. EntityType "P" for propertyId (PropertyDetailsId: null) -> OC
            // 4. EntityType "P" for another property (id 999) with wingId 5 -> should NOT leak!
            _propertyCertificateRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCertificateEntity>
                {
                    PropertyCertificateEntity.Create(null, ccType.Id, "CC-01", null, null, "S", societyId, null, ccType),
                    PropertyCertificateEntity.Create(null, eleType.Id, "ELE-01", null, null, "W", societyId, wingId, eleType),
                    PropertyCertificateEntity.Create(propertyId, ocType.Id, "OC-01", null, null, "P", null, null, ocType),
                    PropertyCertificateEntity.Create(999, ocType.Id, "LEAK-01", null, null, "P", societyId, wingId, ocType)
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            Assert.Equal(societyId, ctx.SocietyDetailId);
            Assert.True(ctx.Parameters.OccupancyCertificate);
            Assert.True(ctx.Parameters.CommencementCertificate);
            Assert.True(ctx.Parameters.ElectricBillDate);
            Assert.DoesNotContain(ctx.Certificates, c => c.CertificateNo == "LEAK-01");

            // Clone for detail
            var detail = ctx.Details[0];
            var typeOfUse = new TypeOfUseEntity { Id = 1 };
            var cloned = ctx.CloneForDetail(detail, typeOfUse);

            Assert.True(cloned.Parameters.OccupancyCertificate);
            Assert.True(cloned.Parameters.CommencementCertificate);
            Assert.True(cloned.Parameters.ElectricBillDate);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_InactiveWingSociety_FallsBackToDirectPropertySociety()
        {
            // Arrange
            const int propertyId = 10;
            const int wingId = 5;
            const int inactiveWingSocietyId = 99;
            const int directSocietyId = 100;

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        WingDetailId = wingId,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        AssessmentYear = "2015",
                        FloorId = 1,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);

            _wingDetailsMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<WingDetailsMastEntity>
                {
                    new()
                    {
                        Id = wingId,
                        SocietyDetailsMastId = inactiveWingSocietyId,
                        IsActive = true,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            // Inactive wing society (IsActive = false) and direct active society for property
            _societyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<SocietyDetailsEntity>
                {
                    new()
                    {
                        Id = inactiveWingSocietyId,
                        IsActive = false,
                        MarkedForDeletion = false
                    },
                    new()
                    {
                        Id = directSocietyId,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Inactive wing society 99 was discarded, and direct active society 100 was used!
            Assert.Equal(directSocietyId, ctx.SocietyDetailId);
        }

        [Fact]
        public async Task LoadPropertyContextAsync_InactiveWing_ClearsWingIdAndDoesNotInheritWingCertificates()
        {
            // Arrange
            const int propertyId = 10;
            const int staleWingId = 5;

            _propertyRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyEntity>
                {
                    new()
                    {
                        Id = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        TaxZoneId = 1,
                        WardId = 1,
                        WingDetailId = staleWingId,
                        CategoryId = 1
                    }
                }.BuildMockDbSet().Object);

            _categoryRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCategoryEntity>
                {
                    new() { Id = 1, PropertyCategoryName = "Apartment", IsActive = true }
                }.BuildMockDbSet().Object);

            _propertyDetailsRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyDetailsEntity>
                {
                    new()
                    {
                        Id = 101,
                        PropertyId = propertyId,
                        IsActive = true,
                        MarkedForDeletion = false,
                        ConstructionYear = "2015",
                        AssessmentYear = "2015",
                        FloorId = 1,
                        TypeOfUseId = 1
                    }
                }.BuildMockDbSet().Object);

            // Wing is inactive in DB
            _wingDetailsMastRepo.Setup(r => r.GetQueryable())
                .Returns(new List<WingDetailsMastEntity>
                {
                    new()
                    {
                        Id = staleWingId,
                        IsActive = false,
                        MarkedForDeletion = false
                    }
                }.BuildMockDbSet().Object);

            _masterDataService.Setup(m => m.GetActiveYearRangesAsync())
                .ReturnsAsync(new List<AssessmentYearRangeEntity> { DefaultYearRange });

            var eleType = new PropertyCertificateTypeMasterEntity
            {
                Id = 3,
                CertificateTypeCode = "EleBillDt",
                CertificateTypeName = "Electric Bill Date",
                IsActive = true
            };

            // Certificate attached to the stale wing ID
            _propertyCertificateRepo.Setup(r => r.GetQueryable())
                .Returns(new List<PropertyCertificateEntity>
                {
                    PropertyCertificateEntity.Create(null, eleType.Id, "ELE-01", null, null, "W", 1, staleWingId, eleType)
                }.BuildMockDbSet().Object);

            var sut = CreateService();

            // Act
            var ctx = await sut.LoadPropertyContextAsync(propertyId, 2026);

            // Assert
            Assert.NotNull(ctx);
            // Stale wing certificate should NOT be loaded
            Assert.False(ctx.Parameters.ElectricBillDate);
            Assert.Empty(ctx.Certificates);
        }
    }
}