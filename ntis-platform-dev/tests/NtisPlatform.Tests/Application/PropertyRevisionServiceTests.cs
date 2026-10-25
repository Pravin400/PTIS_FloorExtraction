using MockQueryable;
using MockQueryable.Moq;
using Moq;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Services.PropertyRevision;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models.Revision;

namespace NtisPlatform.Tests.Application;

public class PropertyRevisionServiceTests
{
    private readonly Mock<IRevisionRepository> _mockRevisionRepository;
    private readonly Mock<IRepository<PropertyEntity, int>> _mockPropertyRepository;
    private readonly Mock<IRepository<YearMasterEntity, int>> _mockYearMasterRepository;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly Mock<IRepository<RevisionPeriodEntity, long>> _mockRevisionPeriodRepo;
    private readonly Mock<IRepository<RevisionPropertyMastEntity, long>> _mockRevisionPropertyMastRepo;
    private readonly Mock<IRepository<RevisionPropertyMastDetailsEntity, long>> _mockRevisionPropertyMastDetailsRepo;
    private readonly Mock<IRepository<RevisionPropertyDetailsEntity, long>> _mockRevisionPropertyDetailsRepo;
    private readonly Mock<IRepository<RevisionRenterMastEntity, long>> _mockRevisionRenterMastRepo;
    private readonly Mock<IRepository<RevisionRoomWiseSubmissionDetailsEntity, long>> _mockRevisionRoomRepo;
    private readonly Mock<IRepository<RevisionPropertySocialDetailsEntity, long>> _mockRevisionSocialRepo;
    private readonly Mock<IRepository<RevisionPropertyCertificatesEntity, long>> _mockRevisionCertificatesRepo;
    private readonly Mock<IRepository<RevisionDocumentDetailsEntity, long>> _mockRevisionDocumentRepo;
    private readonly Mock<IRepository<RevisionRVCalculationResultsEntity, long>> _mockRevisionRVCalcRepo;
    private readonly Mock<IRepository<RevisionRVCalculationTaxDetailsEntity, long>> _mockRevisionRVTaxRepo;
    private readonly Mock<IRepository<RevisionPolicyTaxDetailsEntity, long>> _mockRevisionPolicyTaxRepo;
    private readonly Mock<IRepository<RevisionPropertyTaxCalculationCVResultsEntity, long>> _mockRevisionCVCalcRepo;
    private readonly Mock<IRepository<RevisionPolicyTaxDetailsCVEntity, long>> _mockRevisionPolicyTaxCVRepo;
    private readonly Mock<IRepository<FloorEntity, int>> _mockFloorRepo;
    private readonly Mock<IRepository<SubFloorEntity, int>> _mockSubFloorRepo;
    private readonly Mock<IRepository<TypeOfUseEntity, int>> _mockTypeOfUseRepo;
    private readonly Mock<IRepository<SubTypeOfUseEntity, int>> _mockSubTypeOfUseRepo;
    private readonly Mock<IRepository<ConstructionTypeEntity, int>> _mockConstructionTypeRepo;
    private readonly Mock<IRepository<TaxMasterEntity, int>> _mockTaxMasterRepo;
    private readonly Mock<IRepository<SocialAttributeEntity, int>> _mockSocialAttributeRepo;
    private readonly Mock<IRepository<PropertyCertificateTypeMasterEntity, int>> _mockCertificateTypeRepo;
    private readonly Mock<IRepository<ZoneEntity, int>> _mockZoneRepo;
    private readonly Mock<IRepository<WardEntity, int>> _mockWardRepo;
    private readonly Mock<IRepository<UserEntity, int>> _mockUserRepo;
    private readonly Mock<IRepository<RevisionRoomWiseMinusDataEntity, long>> _mockRevisionMinusRepo;
    private readonly Mock<IRepository<RoomTypeMasterEntity, int>> _mockRoomTypeRepo;
    private readonly Mock<IRepository<PropertyCategoryEntity, int>> _mockCategoryRepo;
    private readonly Mock<IRepository<MoujaEntity, int>> _mockMoujaRepo;
    private readonly Mock<IRepository<RateSectionDetailsEntity, int>> _mockRateSectionDetailsRepo;
    private readonly Mock<IRepository<RateSectionEntity, int>> _mockRateSectionRepo;
    private readonly Mock<IRepository<OwnerTypeMasterEntity, int>> _mockOwnerTypeRepo;
    private readonly Mock<IRepository<CommonRemarkDetailsEntity, int>> _mockCommonRemarkDetailsRepo;
    private readonly PropertyRevisionService _service;

    private const int PropertyId = 1487254;
    private const int FinanceYearId = 1;
    private const int UserId = 42;

    public PropertyRevisionServiceTests()
    {
        _mockRevisionRepository = new Mock<IRevisionRepository>();
        _mockPropertyRepository = new Mock<IRepository<PropertyEntity, int>>();
        _mockYearMasterRepository = new Mock<IRepository<YearMasterEntity, int>>();
        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockRevisionPeriodRepo = new Mock<IRepository<RevisionPeriodEntity, long>>();
        _mockRevisionPropertyMastRepo = new Mock<IRepository<RevisionPropertyMastEntity, long>>();
        _mockRevisionPropertyMastDetailsRepo = new Mock<IRepository<RevisionPropertyMastDetailsEntity, long>>();
        _mockRevisionPropertyDetailsRepo = new Mock<IRepository<RevisionPropertyDetailsEntity, long>>();
        _mockRevisionRenterMastRepo = new Mock<IRepository<RevisionRenterMastEntity, long>>();
        _mockRevisionRoomRepo = new Mock<IRepository<RevisionRoomWiseSubmissionDetailsEntity, long>>();
        _mockRevisionSocialRepo = new Mock<IRepository<RevisionPropertySocialDetailsEntity, long>>();
        _mockRevisionCertificatesRepo = new Mock<IRepository<RevisionPropertyCertificatesEntity, long>>();
        _mockRevisionDocumentRepo = new Mock<IRepository<RevisionDocumentDetailsEntity, long>>();
        _mockRevisionRVCalcRepo = new Mock<IRepository<RevisionRVCalculationResultsEntity, long>>();
        _mockRevisionRVTaxRepo = new Mock<IRepository<RevisionRVCalculationTaxDetailsEntity, long>>();
        _mockRevisionPolicyTaxRepo = new Mock<IRepository<RevisionPolicyTaxDetailsEntity, long>>();
        _mockRevisionCVCalcRepo = new Mock<IRepository<RevisionPropertyTaxCalculationCVResultsEntity, long>>();
        _mockRevisionPolicyTaxCVRepo = new Mock<IRepository<RevisionPolicyTaxDetailsCVEntity, long>>();
        _mockFloorRepo = new Mock<IRepository<FloorEntity, int>>();
        _mockSubFloorRepo = new Mock<IRepository<SubFloorEntity, int>>();
        _mockTypeOfUseRepo = new Mock<IRepository<TypeOfUseEntity, int>>();
        _mockSubTypeOfUseRepo = new Mock<IRepository<SubTypeOfUseEntity, int>>();
        _mockConstructionTypeRepo = new Mock<IRepository<ConstructionTypeEntity, int>>();
        _mockTaxMasterRepo = new Mock<IRepository<TaxMasterEntity, int>>();
        _mockSocialAttributeRepo = new Mock<IRepository<SocialAttributeEntity, int>>();
        _mockCertificateTypeRepo = new Mock<IRepository<PropertyCertificateTypeMasterEntity, int>>();
        _mockZoneRepo = new Mock<IRepository<ZoneEntity, int>>();
        _mockWardRepo = new Mock<IRepository<WardEntity, int>>();
        _mockUserRepo = new Mock<IRepository<UserEntity, int>>();
        _mockRevisionMinusRepo = new Mock<IRepository<RevisionRoomWiseMinusDataEntity, long>>();
        _mockRoomTypeRepo = new Mock<IRepository<RoomTypeMasterEntity, int>>();
        _mockCategoryRepo = new Mock<IRepository<PropertyCategoryEntity, int>>();
        _mockMoujaRepo = new Mock<IRepository<MoujaEntity, int>>();
        _mockRateSectionDetailsRepo = new Mock<IRepository<RateSectionDetailsEntity, int>>();
        _mockRateSectionRepo = new Mock<IRepository<RateSectionEntity, int>>();
        _mockOwnerTypeRepo = new Mock<IRepository<OwnerTypeMasterEntity, int>>();
        _mockCommonRemarkDetailsRepo = new Mock<IRepository<CommonRemarkDetailsEntity, int>>();

        _mockPropertyRepository
            .Setup(r => r.GetByIdAsync(PropertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PropertyEntity { Id = PropertyId, IsActive = true });

        var yearList = new List<YearMasterEntity>
        {
            new()
            {
                Id = FinanceYearId,
                YearCode = "2026-2027",
                IsActive = true,
                StartDate = new DateTime(2026, 4, 1),
                EndDate = new DateTime(2027, 3, 31)
            }
        };

        _mockYearMasterRepository
            .Setup(r => r.GetByIdAsync(FinanceYearId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(yearList[0]);

        _mockYearMasterRepository
            .Setup(r => r.GetQueryable())
            .Returns(yearList.BuildMock());

        _mockRevisionRepository
            .Setup(r => r.HasOpenRevisionAsync(PropertyId, FinanceYearId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockRevisionRepository
            .Setup(r => r.IsPropertyAtApprovalByUlbAsync(PropertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _mockCurrentUserService.Setup(s => s.GetCurrentUserId()).Returns(UserId);

        // Default empty queryables for all child repos
        _mockRevisionPeriodRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPeriodEntity>().BuildMock());
        _mockRevisionPropertyMastRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertyMastEntity>().BuildMock());
        _mockRevisionPropertyMastDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertyMastDetailsEntity>().BuildMock());
        _mockRevisionPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertyDetailsEntity>().BuildMock());
        _mockRevisionRenterMastRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionRenterMastEntity>().BuildMock());
        _mockRevisionRoomRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionRoomWiseSubmissionDetailsEntity>().BuildMock());
        _mockRevisionSocialRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertySocialDetailsEntity>().BuildMock());
        _mockRevisionCertificatesRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertyCertificatesEntity>().BuildMock());
        _mockRevisionDocumentRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionDocumentDetailsEntity>().BuildMock());
        _mockRevisionRVCalcRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionRVCalculationResultsEntity>().BuildMock());
        _mockRevisionRVTaxRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionRVCalculationTaxDetailsEntity>().BuildMock());
        _mockRevisionPolicyTaxRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPolicyTaxDetailsEntity>().BuildMock());
        _mockRevisionCVCalcRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPropertyTaxCalculationCVResultsEntity>().BuildMock());
        _mockRevisionPolicyTaxCVRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionPolicyTaxDetailsCVEntity>().BuildMock());
        _mockFloorRepo.Setup(r => r.GetQueryable()).Returns(new List<FloorEntity>().BuildMock());
        _mockSubFloorRepo.Setup(r => r.GetQueryable()).Returns(new List<SubFloorEntity>().BuildMock());
        _mockTypeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<TypeOfUseEntity>().BuildMock());
        _mockSubTypeOfUseRepo.Setup(r => r.GetQueryable()).Returns(new List<SubTypeOfUseEntity>().BuildMock());
        _mockConstructionTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<ConstructionTypeEntity>().BuildMock());
        _mockTaxMasterRepo.Setup(r => r.GetQueryable()).Returns(new List<TaxMasterEntity>().BuildMock());
        _mockSocialAttributeRepo.Setup(r => r.GetQueryable()).Returns(new List<SocialAttributeEntity>().BuildMock());
        _mockCertificateTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCertificateTypeMasterEntity>().BuildMock());
        _mockZoneRepo.Setup(r => r.GetQueryable()).Returns(new List<ZoneEntity>().BuildMock());
        _mockWardRepo.Setup(r => r.GetQueryable()).Returns(new List<WardEntity>().BuildMock());
        _mockUserRepo.Setup(r => r.GetQueryable()).Returns(new List<UserEntity>().BuildMock());
        _mockRevisionMinusRepo.Setup(r => r.GetQueryable()).Returns(new List<RevisionRoomWiseMinusDataEntity>().BuildMock());
        _mockRoomTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<RoomTypeMasterEntity>().BuildMock());
        _mockCategoryRepo.Setup(r => r.GetQueryable()).Returns(new List<PropertyCategoryEntity>().BuildMock());
        _mockMoujaRepo.Setup(r => r.GetQueryable()).Returns(new List<MoujaEntity>().BuildMock());
        _mockRateSectionDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<RateSectionDetailsEntity>().BuildMock());
        _mockRateSectionRepo.Setup(r => r.GetQueryable()).Returns(new List<RateSectionEntity>().BuildMock());
        _mockOwnerTypeRepo.Setup(r => r.GetQueryable()).Returns(new List<OwnerTypeMasterEntity>().BuildMock());
        _mockCommonRemarkDetailsRepo.Setup(r => r.GetQueryable()).Returns(new List<CommonRemarkDetailsEntity>().BuildMock());

        _service = new PropertyRevisionService(
            _mockRevisionRepository.Object,
            _mockPropertyRepository.Object,
            _mockYearMasterRepository.Object,
            _mockCurrentUserService.Object,
            _mockRevisionPeriodRepo.Object,
            _mockRevisionPropertyMastRepo.Object,
            _mockRevisionPropertyMastDetailsRepo.Object,
            _mockRevisionPropertyDetailsRepo.Object,
            _mockRevisionRenterMastRepo.Object,
            _mockRevisionRoomRepo.Object,
            _mockRevisionSocialRepo.Object,
            _mockRevisionCertificatesRepo.Object,
            _mockRevisionDocumentRepo.Object,
            _mockRevisionRVCalcRepo.Object,
            _mockRevisionRVTaxRepo.Object,
            _mockRevisionPolicyTaxRepo.Object,
            _mockRevisionCVCalcRepo.Object,
            _mockRevisionPolicyTaxCVRepo.Object,
            _mockFloorRepo.Object,
            _mockSubFloorRepo.Object,
            _mockTypeOfUseRepo.Object,
            _mockSubTypeOfUseRepo.Object,
            _mockConstructionTypeRepo.Object,
            _mockTaxMasterRepo.Object,
            _mockSocialAttributeRepo.Object,
            _mockCertificateTypeRepo.Object,
            _mockZoneRepo.Object,
            _mockWardRepo.Object,
            _mockUserRepo.Object,
            _mockRevisionMinusRepo.Object,
            _mockRoomTypeRepo.Object,
            _mockCategoryRepo.Object,
            _mockMoujaRepo.Object,
            _mockRateSectionDetailsRepo.Object,
            _mockRateSectionRepo.Object,
            _mockOwnerTypeRepo.Object,
            _mockCommonRemarkDetailsRepo.Object);
    }

    private static CreatePropertyRevisionDto HistoryOnlyRequest() => new()
    {
        FinanceYearId = FinanceYearId,
        CalculationType = RevisionCalculationType.RV,
        CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
        RevisionType = "AREA_CHANGE",
        EffectiveDate = null,
        RevisionReason = "Built-up area corrected"
    };

    private static CreatePropertyRevisionDto PeriodWiseRequest() => new()
    {
        FinanceYearId = FinanceYearId,
        CalculationType = RevisionCalculationType.RV,
        CalculationScope = RevisionCalculationScope.PERIOD_WISE,
        RevisionType = "USE_CHANGE",
        EffectiveDate = new DateTime(2026, 9, 1),
        RevisionReason = "Residential converted to commercial"
    };

    [Fact]
    public async Task CreateAsync_HistoryOnly_CallsBeginWithHistoryOnlyScope_AndReturnsNoPeriodIds()
    {
        _mockRevisionRepository
            .Setup(r => r.BeginRevisionAsync(
                It.Is<RevisionBeginParameters>(p =>
                    p.PropertyId == PropertyId
                    && p.FinanceYearId == FinanceYearId
                    && p.CalculationScope == "HISTORY_ONLY"
                    && p.CalculationType == "RV"
                    && p.EffectiveDate == null
                    && p.CreatedBy == UserId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RevisionBeginResult { RevisionId = 10001, RevisionNo = 2, OldPeriodId = null, NewPeriodId = null });

        var result = await _service.CreateAsync(PropertyId, HistoryOnlyRequest());

        Assert.Equal(10001, result.RevisionId);
        Assert.Equal(2, result.RevisionNo);
        Assert.Equal(RevisionStatus.DRAFT, result.RevisionStatus);
        Assert.Null(result.OldPeriodId);
        Assert.Null(result.NewPeriodId);
    }

    [Fact]
    public async Task CreateAsync_PeriodWise_CallsBeginWithEffectiveDate_AndReturnsPeriodIds()
    {
        _mockRevisionRepository
            .Setup(r => r.BeginRevisionAsync(
                It.Is<RevisionBeginParameters>(p =>
                    p.CalculationScope == "PERIOD_WISE"
                    && p.EffectiveDate == new DateTime(2026, 9, 1)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RevisionBeginResult { RevisionId = 10002, RevisionNo = 3, OldPeriodId = 20001, NewPeriodId = 20002 });

        var result = await _service.CreateAsync(PropertyId, PeriodWiseRequest());

        Assert.Equal(10002, result.RevisionId);
        Assert.Equal(20001, result.OldPeriodId);
        Assert.Equal(20002, result.NewPeriodId);
    }

    [Fact]
    public async Task CreateAsync_PropertyDoesNotExist_ThrowsPropertyNotFoundException()
    {
        _mockPropertyRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PropertyEntity?)null);

        await Assert.ThrowsAsync<PropertyNotFoundException>(
            () => _service.CreateAsync(999, HistoryOnlyRequest()));

        _mockRevisionRepository.Verify(
            r => r.BeginRevisionAsync(It.IsAny<RevisionBeginParameters>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateAsync_PropertyNotAtApprovalByUlb_ThrowsRevisionValidationException_AndDoesNotBegin()
    {
        _mockRevisionRepository
            .Setup(r => r.IsPropertyAtApprovalByUlbAsync(PropertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await Assert.ThrowsAsync<RevisionValidationException>(
            () => _service.CreateAsync(PropertyId, HistoryOnlyRequest()));

        _mockRevisionRepository.Verify(
            r => r.EnsureBaselineAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _mockRevisionRepository.Verify(
            r => r.BeginRevisionAsync(It.IsAny<RevisionBeginParameters>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateAsync_SavesBaselineBeforeBeginningRevision()
    {
        var order = new List<string>();
        _mockRevisionRepository
            .Setup(r => r.EnsureBaselineAsync(PropertyId, FinanceYearId, "RV", UserId, It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("baseline"))
            .ReturnsAsync(new RevisionBaselineResult { RevisionId = 1, Created = true });
        _mockRevisionRepository
            .Setup(r => r.BeginRevisionAsync(It.IsAny<RevisionBeginParameters>(), It.IsAny<CancellationToken>()))
            .Callback(() => order.Add("begin"))
            .ReturnsAsync(new RevisionBeginResult { RevisionId = 2, RevisionNo = 2 });

        await _service.CreateAsync(PropertyId, HistoryOnlyRequest());

        Assert.Equal(new[] { "baseline", "begin" }, order);
    }

    [Fact]
    public async Task CreateAsync_FinanceYearDoesNotExist_ThrowsRevisionValidationException()
    {
        _mockYearMasterRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((YearMasterEntity?)null);

        var request = HistoryOnlyRequest();
        request.FinanceYearId = 999;

        await Assert.ThrowsAsync<RevisionValidationException>(
            () => _service.CreateAsync(PropertyId, request));
    }

    [Fact]
    public async Task CreateAsync_PeriodWiseWithoutEffectiveDate_ThrowsRevisionValidationException()
    {
        var request = PeriodWiseRequest();
        request.EffectiveDate = null;

        await Assert.ThrowsAsync<RevisionValidationException>(
            () => _service.CreateAsync(PropertyId, request));
    }

    [Fact]
    public async Task CreateAsync_HistoryOnlyWithEffectiveDate_ThrowsRevisionValidationException()
    {
        var request = HistoryOnlyRequest();
        request.EffectiveDate = new DateTime(2026, 9, 1);

        await Assert.ThrowsAsync<RevisionValidationException>(
            () => _service.CreateAsync(PropertyId, request));
    }

    [Fact]
    public async Task CreateAsync_EffectiveDateOutsideFinanceYear_ThrowsRevisionValidationException()
    {
        var request = PeriodWiseRequest();
        request.EffectiveDate = new DateTime(2027, 6, 1);

        await Assert.ThrowsAsync<RevisionValidationException>(
            () => _service.CreateAsync(PropertyId, request));
    }

    [Fact]
    public async Task CreateAsync_PropertyAlreadyHasOpenRevision_ThrowsRevisionConflictException()
    {
        _mockRevisionRepository
            .Setup(r => r.HasOpenRevisionAsync(PropertyId, FinanceYearId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await Assert.ThrowsAsync<RevisionConflictException>(
            () => _service.CreateAsync(PropertyId, HistoryOnlyRequest()));

        _mockRevisionRepository.Verify(
            r => r.BeginRevisionAsync(It.IsAny<RevisionBeginParameters>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetAsync_ExistingRevision_ReturnsCompositeOverviewWithNestedDocuments()
    {
        var periods = new List<RevisionPeriodEntity>
        {
            new()
            {
                Id = 7001, RevisionMastId = 5001, PeriodNo = 1,
                EffectiveFrom = new DateTime(2026, 4, 1), EffectiveTo = new DateTime(2026, 8, 31),
                PeriodDays = 153, IsActive = true
            },
            new()
            {
                Id = 7002, RevisionMastId = 5001, PeriodNo = 2,
                EffectiveFrom = new DateTime(2026, 9, 1), EffectiveTo = new DateTime(2027, 3, 31),
                PeriodDays = 212, IsActive = true
            }
        };

        var revision = new RevisionMastEntity
        {
            Id = 5001,
            PropertyId = PropertyId,
            FinanceYearId = FinanceYearId,
            RevisionNo = 2,
            CalculationType = RevisionCalculationType.RV,
            CalculationScope = RevisionCalculationScope.PERIOD_WISE,
            RevisionType = "USE_CHANGE",
            EffectiveDate = new DateTime(2026, 9, 1),
            RevisionReason = "Residential converted to commercial",
            RevisionStatus = RevisionStatus.DRAFT,
            IsActive = true,
            Periods = periods
        };

        _mockRevisionRepository
            .Setup(r => r.GetByIdAsync(5001, It.IsAny<CancellationToken>()))
            .ReturnsAsync(revision);

        _mockRevisionPeriodRepo.Setup(r => r.GetQueryable()).Returns(periods.BuildMock());

        // Setup floors
        var floors = new List<RevisionPropertyDetailsEntity>
        {
            new()
            {
                Id = 101, RevisionMastId = 5001, RevisionPeriodId = 7001,
                FloorId = 1, TypeOfUseId = 1, ConstructionTypeId = 1,
                CarpetAreaSqFeet = 4305.599999999, BuiltupAreaSqFeet = 4305.599999999,
                IsActive = true
            }
        };
        _mockRevisionPropertyDetailsRepo.Setup(r => r.GetQueryable()).Returns(floors.BuildMock());

        // Setup documents
        var docs = new List<RevisionDocumentDetailsEntity>
        {
            new()
            {
                Id = 801, RevisionMastId = 5001, DocumentBindingId = 991,
                DocumentTitle = "Title Certificate", DocumentTypeCode = "CERT_DOC",
                DocumentStage = "SUPPORTING", IsActive = true
            }
        };
        _mockRevisionDocumentRepo.Setup(r => r.GetQueryable()).Returns(docs.BuildMock());

        // Setup certificates
        var certs = new List<RevisionPropertyCertificatesEntity>
        {
            new()
            {
                Id = 901, RevisionMastId = 5001, CertificateTypeId = 1,
                CertificateNo = "CERT-001", DocumentBindingId = 991, IsActive = true
            }
        };
        _mockRevisionCertificatesRepo.Setup(r => r.GetQueryable()).Returns(certs.BuildMock());

        var result = await _service.GetAsync(5001);

        Assert.Equal(5001, result.RevisionId);
        Assert.Equal("2026-2027", result.FinanceYear);
        Assert.Equal(2, result.Periods.Count);
        Assert.Equal(1, result.Periods[0].PeriodNo);
        Assert.Equal(2, result.Periods[1].PeriodNo);
        Assert.False(result.Periods[0].IsEditable);
        Assert.True(result.Periods[1].IsEditable);

        // Floor precision verification (2 decimals)
        Assert.Single(result.FloorDetails);
        Assert.Equal(4305.60, result.FloorDetails[0].CarpetAreaSqFeet);
        Assert.Equal(4305.60, result.FloorDetails[0].BuiltupAreaSqFeet);

        // Certificate with nested document
        Assert.Single(result.Certificates);
        Assert.Equal("CERT-001", result.Certificates[0].CertificateNo);
        Assert.NotNull(result.Certificates[0].Document);
        Assert.Equal(801, result.Certificates[0].Document!.DocumentId);
        Assert.Equal("Title Certificate", result.Certificates[0].Document!.DocumentTitle);
    }

    [Fact]
    public async Task GetAsync_UnknownRevision_ThrowsRevisionNotFoundException()
    {
        _mockRevisionRepository
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RevisionMastEntity?)null);

        await Assert.ThrowsAsync<RevisionNotFoundException>(() => _service.GetAsync(999));
    }

    [Fact]
    public async Task GetHistoryAsync_ResolvesFinanceYear_AndReturnsPagedResult()
    {
        _mockPropertyRepository
            .Setup(r => r.ExistsAsync(PropertyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var revisions = new List<RevisionMastEntity>
        {
            new()
            {
                Id = 5002, PropertyId = PropertyId, RevisionNo = 2, FinanceYearId = FinanceYearId,
                CalculationType = RevisionCalculationType.RV, CalculationScope = RevisionCalculationScope.HISTORY_ONLY,
                RevisionType = "AREA_CHANGE", RevisionReason = "Area corrected", RevisionStatus = RevisionStatus.DRAFT, IsActive = true
            }
        };

        _mockRevisionRepository
            .Setup(r => r.GetHistoryAsync(PropertyId, 1, 10, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((revisions, 1));

        var result = await _service.GetHistoryAsync(PropertyId, new PropertyRevisionQueryParameters());

        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal(5002, result.Items.First().RevisionId);
        Assert.Equal(5002, result.Items.First().Id);
        Assert.Equal(PropertyId, result.Items.First().PropertyId);
        Assert.Equal("2026-2027", result.Items.First().FinanceYear);
        Assert.Equal("Area corrected", result.Items.First().RevisionReason);
    }

    [Fact]
    public async Task GetHistoryAsync_PropertyDoesNotExist_ThrowsPropertyNotFoundException()
    {
        _mockPropertyRepository
            .Setup(r => r.ExistsAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await Assert.ThrowsAsync<PropertyNotFoundException>(
            () => _service.GetHistoryAsync(999, new PropertyRevisionQueryParameters()));
    }
}
