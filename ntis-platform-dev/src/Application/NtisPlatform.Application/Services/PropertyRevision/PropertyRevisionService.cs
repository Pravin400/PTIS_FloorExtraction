using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.PropertyRevision;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Entities.Revision;
using NtisPlatform.Core.Enums.Revision;
using NtisPlatform.Core.Exceptions;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models.Revision;

namespace NtisPlatform.Application.Services.PropertyRevision;

/// <inheritdoc cref="IPropertyRevisionService"/>
public class PropertyRevisionService : IPropertyRevisionService
{
    private readonly IRevisionRepository _revisionRepository;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<YearMasterEntity, int> _yearMasterRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<RevisionPeriodEntity, long> _revisionPeriodRepo;
    private readonly IRepository<RevisionPropertyMastEntity, long> _revisionPropertyMastRepo;
    private readonly IRepository<RevisionPropertyMastDetailsEntity, long> _revisionPropertyMastDetailsRepo;
    private readonly IRepository<RevisionPropertyDetailsEntity, long> _revisionPropertyDetailsRepo;
    private readonly IRepository<RevisionRenterMastEntity, long> _revisionRenterMastRepo;
    private readonly IRepository<RevisionRoomWiseSubmissionDetailsEntity, long> _revisionRoomRepo;
    private readonly IRepository<RevisionPropertySocialDetailsEntity, long> _revisionSocialRepo;
    private readonly IRepository<RevisionPropertyCertificatesEntity, long> _revisionCertificatesRepo;
    private readonly IRepository<RevisionDocumentDetailsEntity, long> _revisionDocumentRepo;
    private readonly IRepository<RevisionRVCalculationResultsEntity, long> _revisionRVCalcRepo;
    private readonly IRepository<RevisionRVCalculationTaxDetailsEntity, long> _revisionRVTaxRepo;
    private readonly IRepository<RevisionPolicyTaxDetailsEntity, long> _revisionPolicyTaxRepo;
    private readonly IRepository<RevisionPropertyTaxCalculationCVResultsEntity, long> _revisionCVCalcRepo;
    private readonly IRepository<RevisionPolicyTaxDetailsCVEntity, long> _revisionPolicyTaxCVRepo;
    private readonly IRepository<FloorEntity, int> _floorRepo;
    private readonly IRepository<SubFloorEntity, int> _subFloorRepo;
    private readonly IRepository<TypeOfUseEntity, int> _typeOfUseRepo;
    private readonly IRepository<SubTypeOfUseEntity, int> _subTypeOfUseRepo;
    private readonly IRepository<ConstructionTypeEntity, int> _constructionTypeRepo;
    private readonly IRepository<TaxMasterEntity, int> _taxMasterRepo;
    private readonly IRepository<SocialAttributeEntity, int> _socialAttributeRepo;
    private readonly IRepository<PropertyCertificateTypeMasterEntity, int> _certificateTypeRepo;
    private readonly IRepository<ZoneEntity, int> _zoneRepo;
    private readonly IRepository<WardEntity, int> _wardRepo;
    private readonly IRepository<UserEntity, int> _userRepo;
    private readonly IRepository<RevisionRoomWiseMinusDataEntity, long> _revisionMinusRepo;
    private readonly IRepository<RoomTypeMasterEntity, int> _roomTypeRepo;
    private readonly IRepository<PropertyCategoryEntity, int> _categoryRepo;
    private readonly IRepository<MoujaEntity, int> _moujaRepo;
    private readonly IRepository<RateSectionDetailsEntity, int> _rateSectionDetailsRepo;
    private readonly IRepository<RateSectionEntity, int> _rateSectionRepo;
    private readonly IRepository<OwnerTypeMasterEntity, int> _ownerTypeRepo;
    private readonly IRepository<CommonRemarkDetailsEntity, int> _commonRemarkDetailsRepo;

    public PropertyRevisionService(
        IRevisionRepository revisionRepository,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<YearMasterEntity, int> yearMasterRepository,
        ICurrentUserService currentUserService,
        IRepository<RevisionPeriodEntity, long> revisionPeriodRepo,
        IRepository<RevisionPropertyMastEntity, long> revisionPropertyMastRepo,
        IRepository<RevisionPropertyMastDetailsEntity, long> revisionPropertyMastDetailsRepo,
        IRepository<RevisionPropertyDetailsEntity, long> revisionPropertyDetailsRepo,
        IRepository<RevisionRenterMastEntity, long> revisionRenterMastRepo,
        IRepository<RevisionRoomWiseSubmissionDetailsEntity, long> revisionRoomRepo,
        IRepository<RevisionPropertySocialDetailsEntity, long> revisionSocialRepo,
        IRepository<RevisionPropertyCertificatesEntity, long> revisionCertificatesRepo,
        IRepository<RevisionDocumentDetailsEntity, long> revisionDocumentRepo,
        IRepository<RevisionRVCalculationResultsEntity, long> revisionRVCalcRepo,
        IRepository<RevisionRVCalculationTaxDetailsEntity, long> revisionRVTaxRepo,
        IRepository<RevisionPolicyTaxDetailsEntity, long> revisionPolicyTaxRepo,
        IRepository<RevisionPropertyTaxCalculationCVResultsEntity, long> revisionCVCalcRepo,
        IRepository<RevisionPolicyTaxDetailsCVEntity, long> revisionPolicyTaxCVRepo,
        IRepository<FloorEntity, int> floorRepo,
        IRepository<SubFloorEntity, int> subFloorRepo,
        IRepository<TypeOfUseEntity, int> typeOfUseRepo,
        IRepository<SubTypeOfUseEntity, int> subTypeOfUseRepo,
        IRepository<ConstructionTypeEntity, int> constructionTypeRepo,
        IRepository<TaxMasterEntity, int> taxMasterRepo,
        IRepository<SocialAttributeEntity, int> socialAttributeRepo,
        IRepository<PropertyCertificateTypeMasterEntity, int> certificateTypeRepo,
        IRepository<ZoneEntity, int> zoneRepo,
        IRepository<WardEntity, int> wardRepo,
        IRepository<UserEntity, int> userRepo,
        IRepository<RevisionRoomWiseMinusDataEntity, long> revisionMinusRepo,
        IRepository<RoomTypeMasterEntity, int> roomTypeRepo,
        IRepository<PropertyCategoryEntity, int> categoryRepo,
        IRepository<MoujaEntity, int> moujaRepo,
        IRepository<RateSectionDetailsEntity, int> rateSectionDetailsRepo,
        IRepository<RateSectionEntity, int> rateSectionRepo,
        IRepository<OwnerTypeMasterEntity, int> ownerTypeRepo,
        IRepository<CommonRemarkDetailsEntity, int> commonRemarkDetailsRepo)
    {
        _revisionRepository = revisionRepository;
        _propertyRepository = propertyRepository;
        _yearMasterRepository = yearMasterRepository;
        _currentUserService = currentUserService;
        _floorRepo = floorRepo;
        _subFloorRepo = subFloorRepo;
        _revisionPeriodRepo = revisionPeriodRepo;
        _revisionPropertyMastRepo = revisionPropertyMastRepo;
        _revisionPropertyMastDetailsRepo = revisionPropertyMastDetailsRepo;
        _revisionPropertyDetailsRepo = revisionPropertyDetailsRepo;
        _revisionRenterMastRepo = revisionRenterMastRepo;
        _revisionRoomRepo = revisionRoomRepo;
        _revisionSocialRepo = revisionSocialRepo;
        _revisionCertificatesRepo = revisionCertificatesRepo;
        _revisionDocumentRepo = revisionDocumentRepo;
        _revisionRVCalcRepo = revisionRVCalcRepo;
        _revisionRVTaxRepo = revisionRVTaxRepo;
        _revisionPolicyTaxRepo = revisionPolicyTaxRepo;
        _revisionCVCalcRepo = revisionCVCalcRepo;
        _revisionPolicyTaxCVRepo = revisionPolicyTaxCVRepo;
        _typeOfUseRepo = typeOfUseRepo;
        _subTypeOfUseRepo = subTypeOfUseRepo;
        _constructionTypeRepo = constructionTypeRepo;
        _taxMasterRepo = taxMasterRepo;
        _socialAttributeRepo = socialAttributeRepo;
        _certificateTypeRepo = certificateTypeRepo;
        _zoneRepo = zoneRepo;
        _wardRepo = wardRepo;
        _userRepo = userRepo;
        _revisionMinusRepo = revisionMinusRepo;
        _roomTypeRepo = roomTypeRepo;
        _categoryRepo = categoryRepo;
        _moujaRepo = moujaRepo;
        _rateSectionDetailsRepo = rateSectionDetailsRepo;
        _rateSectionRepo = rateSectionRepo;
        _ownerTypeRepo = ownerTypeRepo;
        _commonRemarkDetailsRepo = commonRemarkDetailsRepo;
    }

    public async Task<PropertyRevisionCreatedDto> CreateAsync(
        int propertyId,
        CreatePropertyRevisionDto request,
        CancellationToken cancellationToken = default)
    {
        if (propertyId <= 0)
        {
            throw new RevisionValidationException("propertyId must be a positive integer.");
        }

        // ---- Property exists (section 26) ----
        var property = await _propertyRepository.GetByIdAsync(propertyId, cancellationToken);
        if (property is null || !property.IsActive)
        {
            throw new PropertyNotFoundException(propertyId);
        }

        // ---- Property must be at workflow stage ApprovalByULB ----
        await EnsureApprovedByUlbAsync(propertyId, cancellationToken);

        // ---- Finance year exists (section 26) ----
        var financeYear = await _yearMasterRepository.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (financeYear is null || !financeYear.IsActive)
        {
            throw new RevisionValidationException($"FinanceYearId {request.FinanceYearId} does not exist.");
        }

        // ---- EffectiveDate required for PERIOD_WISE / must be omitted for HISTORY_ONLY (section 26) ----
        if (request.CalculationScope == RevisionCalculationScope.PERIOD_WISE && request.EffectiveDate is null)
        {
            throw new RevisionValidationException(
                "EffectiveDate is required when CalculationScope is PERIOD_WISE.");
        }

        if (request.CalculationScope == RevisionCalculationScope.HISTORY_ONLY && request.EffectiveDate is not null)
        {
            throw new RevisionValidationException(
                "EffectiveDate must not be supplied when CalculationScope is HISTORY_ONLY " +
                "(a whole-year revision does not create RevisionPeriod rows).");
        }

        // ---- EffectiveDate must fall within the finance year (section 26) ----
        if (request.EffectiveDate.HasValue
            && financeYear.StartDate.HasValue
            && financeYear.EndDate.HasValue
            && (request.EffectiveDate.Value.Date < financeYear.StartDate.Value.Date
                || request.EffectiveDate.Value.Date > financeYear.EndDate.Value.Date))
        {
            throw new RevisionValidationException(
                $"EffectiveDate {request.EffectiveDate.Value:yyyy-MM-dd} falls outside finance year " +
                $"{financeYear.StartDate.Value:yyyy-MM-dd} - {financeYear.EndDate.Value:yyyy-MM-dd}.");
        }

        // ---- Prevent a second concurrent open revision for the same property/year (section 26) ----
        var hasOpenRevision = await _revisionRepository.HasOpenRevisionAsync(
            propertyId, request.FinanceYearId, cancellationToken);
        if (hasOpenRevision)
        {
            throw new RevisionConflictException(
                $"Property {propertyId} already has an open (DRAFT or CALCULATED) revision for " +
                $"FinanceYearId {request.FinanceYearId}. Approve/post/cancel it before opening another.");
        }

        var userId = _currentUserService.GetCurrentUserId();

        // ---- Save the initial assessment (before details + tax) if none exists yet ----
        await _revisionRepository.EnsureBaselineAsync(
            propertyId, request.FinanceYearId, request.CalculationType.ToString(), userId, cancellationToken);

        var beginResult = await _revisionRepository.BeginRevisionAsync(
            new RevisionBeginParameters
            {
                PropertyId = propertyId,
                FinanceYearId = request.FinanceYearId,
                CalculationType = request.CalculationType.ToString(),
                CalculationScope = request.CalculationScope.ToString(),
                RevisionType = request.RevisionType,
                EffectiveDate = request.EffectiveDate,
                RevisionReason = request.RevisionReason,
                CreatedBy = userId
            },
            cancellationToken);

        return new PropertyRevisionCreatedDto
        {
            RevisionId = beginResult.RevisionId,
            PropertyId = propertyId,
            FinanceYearId = request.FinanceYearId,
            RevisionNo = beginResult.RevisionNo,
            CalculationType = request.CalculationType,
            CalculationScope = request.CalculationScope,
            RevisionStatus = RevisionStatus.DRAFT,
            OldPeriodId = beginResult.OldPeriodId,
            NewPeriodId = beginResult.NewPeriodId
        };
    }

    public async Task<RevisionBaselineDto> EnsureBaselineAsync(
        int propertyId,
        EnsureRevisionBaselineDto request,
        CancellationToken cancellationToken = default)
    {
        var property = await _propertyRepository.GetByIdAsync(propertyId, cancellationToken);
        if (property is null || !property.IsActive)
        {
            throw new PropertyNotFoundException(propertyId);
        }

        await EnsureApprovedByUlbAsync(propertyId, cancellationToken);

        var financeYear = await _yearMasterRepository.GetByIdAsync(request.FinanceYearId, cancellationToken);
        if (financeYear is null || !financeYear.IsActive)
        {
            throw new RevisionValidationException($"FinanceYearId {request.FinanceYearId} does not exist.");
        }

        if (await _revisionRepository.HasOpenRevisionAsync(propertyId, request.FinanceYearId, cancellationToken))
        {
            throw new RevisionConflictException(
                "A revision is already open for this property and finance year; the live data may already " +
                "be changed, so a baseline can no longer be taken from it.");
        }

        var result = await _revisionRepository.EnsureBaselineAsync(
            propertyId,
            request.FinanceYearId,
            request.CalculationType.ToString(),
            _currentUserService.GetCurrentUserId(),
            cancellationToken);

        return new RevisionBaselineDto
        {
            RevisionId = result.RevisionId,
            PropertyId = propertyId,
            FinanceYearId = request.FinanceYearId,
            Created = result.Created
        };
    }

    public async Task<PropertyRevisionDetailsDto> GetAsync(
        long revisionId,
        CancellationToken cancellationToken = default)
    {
        var revision = await _revisionRepository.GetByIdAsync(revisionId, cancellationToken);
        if (revision is null)
        {
            throw new RevisionNotFoundException(revisionId);
        }

        // 1. Resolve Financial Year Display String & Entity
        var fyEntity = await _yearMasterRepository.GetQueryable()
            .AsNoTracking()
            .Where(y => y.Id == revision.FinanceYearId)
            .FirstOrDefaultAsync(cancellationToken);
        var fyDisplay = fyEntity?.YearCode ?? fyEntity?.Description ?? fyEntity?.Year.ToString() ?? revision.FinanceYearId.ToString();

        // 2. Fetch Periods & Calculations
        var periods = await _revisionPeriodRepo.GetQueryable()
            .AsNoTracking()
            .Where(p => p.RevisionMastId == revisionId && !p.MarkedForDeletion && p.IsActive)
            .OrderBy(p => p.PeriodNo)
            .ToListAsync(cancellationToken);

        if (revision.Periods == null || !revision.Periods.Any())
        {
            revision.Periods = periods;
        }

        var isCv = revision.CalculationType == RevisionCalculationType.CV;
        var isRv = revision.CalculationType == RevisionCalculationType.RV;
        var isBoth = revision.CalculationType == RevisionCalculationType.BOTH;

        var includeRv = isRv || isBoth;
        var includeCv = isCv || isBoth;

        var rvCalcResults = includeRv
            ? await _revisionRVCalcRepo.GetQueryable()
                .AsNoTracking()
                .Where(c => c.RevisionMastId == revisionId && !c.MarkedForDeletion && c.IsActive)
                .ToListAsync(cancellationToken)
            : new List<RevisionRVCalculationResultsEntity>();

        var rvTaxResults = includeRv
            ? await _revisionRVTaxRepo.GetQueryable()
                .AsNoTracking()
                .Where(t => t.RevisionMastId == revisionId && !t.MarkedForDeletion && t.IsActive)
                .ToListAsync(cancellationToken)
            : new List<RevisionRVCalculationTaxDetailsEntity>();

        var rvPolicyTaxes = includeRv
            ? await _revisionPolicyTaxRepo.GetQueryable()
                .AsNoTracking()
                .Where(p => p.RevisionMastId == revisionId && !p.MarkedForDeletion && p.IsActive)
                .ToListAsync(cancellationToken)
            : new List<RevisionPolicyTaxDetailsEntity>();

        var cvCalcResults = includeCv
            ? await _revisionCVCalcRepo.GetQueryable()
                .AsNoTracking()
                .Where(c => c.RevisionMastId == revisionId && !c.MarkedForDeletion && c.IsActive)
                .ToListAsync(cancellationToken)
            : new List<RevisionPropertyTaxCalculationCVResultsEntity>();

        var cvPolicyTaxes = includeCv
            ? await _revisionPolicyTaxCVRepo.GetQueryable()
                .AsNoTracking()
                .Where(p => p.RevisionMastId == revisionId && !p.MarkedForDeletion && p.IsActive)
                .ToListAsync(cancellationToken)
            : new List<RevisionPolicyTaxDetailsCVEntity>();

        // 3. Fetch Renter Details Snapshot
        var rawRenters = await _revisionRenterMastRepo.GetQueryable()
            .AsNoTracking()
            .Where(r => r.RevisionMastId == revisionId && !r.MarkedForDeletion && r.IsActive)
            .ToListAsync(cancellationToken);

        var renterDetails = rawRenters.Select(r => new RevisionRenterDto
        {
            RenterId = r.Id,
            FloorDetailId = r.RevisionPropertyDetailsId > 0 ? r.RevisionPropertyDetailsId : null,
            PeriodId = r.RevisionPeriodId,
            RenterName = r.RenterNameEnglish ?? r.RenterName,
            RentMonthly = r.RentMonthly.HasValue ? Math.Round(r.RentMonthly.Value, 2, MidpointRounding.AwayFromZero) : null,
            FinalYearlyRent = r.FinalYearlyRent.HasValue ? Math.Round(r.FinalYearlyRent.Value, 2, MidpointRounding.AwayFromZero) : null,
            AgreementDate = r.AgreementDate,
            AgreementFromDate = r.AgreementFromDate,
            AgreementToDate = r.AgreementToDate,
            TaxLiability = r.TaxLiability
        }).ToList();

        var renterByFloorId = renterDetails
            .Where(r => r.FloorDetailId.HasValue && r.FloorDetailId.Value > 0)
            .GroupBy(r => r.FloorDetailId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var calcByFloorId = rvCalcResults
            .Where(c => c.RevisionPropertyDetailsId > 0)
            .GroupBy(c => c.RevisionPropertyDetailsId)
            .ToDictionary(g => g.Key, g => g.First());

        // 4. Fetch Floor Details Snapshot
        var rawFloors = await (from f in _revisionPropertyDetailsRepo.GetQueryable()
                               join flr in _floorRepo.GetQueryable() on f.FloorId equals flr.Id into flrJoin
                               from flr in flrJoin.DefaultIfEmpty()
                               join subFlr in _subFloorRepo.GetQueryable() on f.SubFloorId equals subFlr.Id into subFlrJoin
                               from subFlr in subFlrJoin.DefaultIfEmpty()
                               join use in _typeOfUseRepo.GetQueryable() on f.TypeOfUseId equals use.Id into useJoin
                               from use in useJoin.DefaultIfEmpty()
                               join subUse in _subTypeOfUseRepo.GetQueryable() on f.SubTypeOfUseId equals subUse.Id into subUseJoin
                               from subUse in subUseJoin.DefaultIfEmpty()
                               join cType in _constructionTypeRepo.GetQueryable() on f.ConstructionTypeId equals cType.Id into cTypeJoin
                               from cType in cTypeJoin.DefaultIfEmpty()
                               where f.RevisionMastId == revisionId && !f.MarkedForDeletion && f.IsActive
                               select new
                               {
                                   FloorDetailId = f.Id,
                                   PeriodId = f.RevisionPeriodId,
                                   FloorId = f.FloorId,
                                   FloorName = flr != null ? (flr.Description ?? flr.FloorCode ?? $"Floor {f.FloorId}") : $"Floor {f.FloorId}",
                                   SubFloorId = f.SubFloorId,
                                   SubFloor = subFlr != null ? (subFlr.Description ?? subFlr.SubFloorCode) : null,
                                   TypeOfUseId = f.TypeOfUseId,
                                   TypeOfUse = use != null ? (use.Description ?? use.Type ?? "N/A") : "N/A",
                                   TypeOfUseCode = use != null ? use.TypeOfUseCode : null,
                                   SubTypeOfUseId = f.SubTypeOfUseId,
                                   SubTypeOfUse = subUse != null ? subUse.Description : null,
                                   ConstructionTypeId = (int?)f.ConstructionTypeId,
                                   ConstructionType = cType != null ? (cType.Description ?? cType.ConstructionCode) : null,
                                   ConstructionTypeCode = cType != null ? cType.ConstructionCode : null,
                                   ConstructionYear = f.ConstructionYear,
                                   AssessmentYear = f.AssessmentYear,
                                   NoOfRooms = f.NoOfRooms,
                                   f.CarpetAreaSqMeter,
                                   f.CarpetAreaSqFeet,
                                   f.BuiltupAreaSqMeter,
                                   f.BuiltupAreaSqFeet,
                                   IsTaxable = f.IsTaxable ?? true,
                                   IsRenter = f.IsRenter ?? false
                               }).ToListAsync(cancellationToken);

        var periodMap = periods.ToDictionary(p => p.Id);
        var maxPeriodNo = periods.Count > 0 ? periods.Max(p => p.PeriodNo) : 1;

        var floorDetails = rawFloors.Select(f =>
        {
            var calc = calcByFloorId.GetValueOrDefault(f.FloorDetailId);
            periodMap.TryGetValue(f.PeriodId ?? 0, out var periodObj);

            return new RevisionFloorDto
            {
                FloorDetailId = f.FloorDetailId,
                PeriodId = f.PeriodId,
                PeriodNo = periodObj?.PeriodNo,
                EffectiveFrom = periodObj?.EffectiveFrom,
                EffectiveTo = periodObj?.EffectiveTo,
                PeriodLabel = periodObj != null
                    ? $"Period {periodObj.PeriodNo} ({periodObj.EffectiveFrom:dd/MM/yyyy} - {periodObj.EffectiveTo:dd/MM/yyyy})"
                    : null,
                IsCurrentPeriod = periodObj != null && periodObj.PeriodNo == maxPeriodNo,
                FloorId = f.FloorId,
                FloorName = f.FloorName,
                SubFloorId = f.SubFloorId,
                SubFloor = f.SubFloor,
                TypeOfUseId = f.TypeOfUseId,
                TypeOfUse = f.TypeOfUse,
                TypeOfUseCode = f.TypeOfUseCode,
                SubTypeOfUseId = f.SubTypeOfUseId,
                SubTypeOfUse = f.SubTypeOfUse,
                ConstructionTypeId = f.ConstructionTypeId,
                ConstructionType = f.ConstructionType,
                ConstructionTypeCode = f.ConstructionTypeCode,
                ConstructionYear = f.ConstructionYear,
                AssessmentYear = f.AssessmentYear,
                NoOfRooms = f.NoOfRooms,
                CarpetAreaSqMeter = f.CarpetAreaSqMeter.HasValue ? Math.Round(f.CarpetAreaSqMeter.Value, 2, MidpointRounding.AwayFromZero) : null,
                CarpetAreaSqFeet = f.CarpetAreaSqFeet.HasValue ? Math.Round(f.CarpetAreaSqFeet.Value, 2, MidpointRounding.AwayFromZero) : null,
                BuiltupAreaSqMeter = f.BuiltupAreaSqMeter.HasValue ? Math.Round(f.BuiltupAreaSqMeter.Value, 2, MidpointRounding.AwayFromZero) : null,
                BuiltupAreaSqFeet = f.BuiltupAreaSqFeet.HasValue ? Math.Round(f.BuiltupAreaSqFeet.Value, 2, MidpointRounding.AwayFromZero) : null,
                IsTaxable = f.IsTaxable,
                IsRenter = f.IsRenter,
                Renter = renterByFloorId.GetValueOrDefault(f.FloorDetailId),

                // Calculation Results (from PTIS.RevisionRVCalculationResults)
                AppliedOn = calc?.AppliedOn,
                MonthlyRate = calc?.MonthlyRate != null ? Math.Round(calc.MonthlyRate.Value, 2, MidpointRounding.AwayFromZero) : null,
                YearlyRate = calc?.YearlyRate != null ? Math.Round(calc.YearlyRate.Value, 2, MidpointRounding.AwayFromZero) : null,
                Depreciation = calc?.Depreciation != null ? Math.Round(calc.Depreciation.Value, 2, MidpointRounding.AwayFromZero) : null,
                DepreciationPer = calc?.DepreciationPer != null ? Math.Round(calc.DepreciationPer.Value, 2, MidpointRounding.AwayFromZero) : null,
                AnnualRentalValue = calc?.AnnualRentalValue != null ? Math.Round((decimal)calc.AnnualRentalValue.Value, 2, MidpointRounding.AwayFromZero) : null,
                Maintenance = calc?.Maintenance != null ? Math.Round(calc.Maintenance.Value, 2, MidpointRounding.AwayFromZero) : null,
                RateableValue = calc?.RateableValue != null ? Math.Round(calc.RateableValue.Value, 2, MidpointRounding.AwayFromZero) : null
            };
        }).OrderBy(f => f.PeriodNo).ThenBy(f => f.FloorId).ToList();

        // Detect differences between Period 1 (baseline) and subsequent revised periods
        var baselineFloors = floorDetails.Where(f => f.PeriodNo == 1).ToList();
        if (baselineFloors.Any())
        {
            var baseFloorMap = baselineFloors
                .GroupBy(f => (f.FloorId, f.SubFloorId ?? 0))
                .ToDictionary(g => g.Key, g => g.First());
            foreach (var f in floorDetails.Where(f => f.PeriodNo > 1))
            {
                if (baseFloorMap.TryGetValue((f.FloorId, f.SubFloorId ?? 0), out var baseFloor))
                {
                    f.PreviousTypeOfUse = baseFloor.TypeOfUse;
                    f.PreviousBuiltupAreaSqFeet = baseFloor.BuiltupAreaSqFeet;
                    f.HasChanges = !string.Equals(baseFloor.TypeOfUse, f.TypeOfUse, StringComparison.OrdinalIgnoreCase) ||
                                   baseFloor.BuiltupAreaSqFeet != f.BuiltupAreaSqFeet ||
                                   !string.Equals(baseFloor.ConstructionType, f.ConstructionType, StringComparison.OrdinalIgnoreCase) ||
                                   baseFloor.IsRenter != f.IsRenter;
                }
                else
                {
                    f.IsNewlyAddedInRevision = true;
                    f.HasChanges = true;
                }
            }
        }

        var periodWiseFloors = periods.Select(p =>
        {
            var pFloors = floorDetails.Where(f => f.PeriodId == p.Id).ToList();
            return new RevisionPeriodFloorsDto
            {
                PeriodId = p.Id,
                PeriodNo = p.PeriodNo,
                EffectiveFrom = p.EffectiveFrom,
                EffectiveTo = p.EffectiveTo,
                PeriodLabel = $"Period {p.PeriodNo} ({p.EffectiveFrom:dd/MM/yyyy} - {p.EffectiveTo:dd/MM/yyyy})",
                TotalFloors = pFloors.Count,
                TotalBuiltupAreaSqFeet = Math.Round(pFloors.Sum(f => f.BuiltupAreaSqFeet ?? 0), 2, MidpointRounding.AwayFromZero),
                TotalCarpetAreaSqFeet = Math.Round(pFloors.Sum(f => f.CarpetAreaSqFeet ?? 0), 2, MidpointRounding.AwayFromZero),
                Floors = pFloors
            };
        }).ToList();

        // 4. Build PeriodDetails Section
        var fyStartDate = fyEntity?.StartDate ?? new DateTime(revision.CreatedDate?.Year ?? DateTime.UtcNow.Year, 4, 1);
        var fyEndDate = fyEntity?.EndDate ?? fyStartDate.AddYears(1).AddDays(-1);
        var fyTotalDays = (int)(fyEndDate - fyStartDate).TotalDays + 1;
        if (fyTotalDays <= 0) fyTotalDays = 365;

        var periodDetails = new PeriodDetailsSectionDto();
        if (periods.Any())
        {
            foreach (var p in periods)
            {
                var pUse = rawFloors.FirstOrDefault(f => f.PeriodId == p.Id)?.TypeOfUse
                    ?? rawFloors.FirstOrDefault()?.TypeOfUse
                    ?? "Mixed";

                decimal annualRv = 0m, periodRv = 0m, annualTax = 0m, periodTax = 0m, factor = 1m;

                if (includeCv)
                {
                    var pCv = cvCalcResults.Where(c => c.RevisionPeriodId == p.Id).ToList();
                    annualRv += Math.Round(pCv.Sum(c => c.CapitalValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    periodRv += Math.Round(pCv.Sum(c => c.PeriodCapitalValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    annualTax += Math.Round(pCv.Sum(c => c.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    periodTax += Math.Round(pCv.Sum(c => c.PeriodTaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    factor = pCv.FirstOrDefault()?.ProrationFactor ?? (p.PeriodDays > 0 ? (decimal)p.PeriodDays / (decimal)fyTotalDays : 1m);
                }

                if (includeRv)
                {
                    var pCalc = rvCalcResults.Where(c => c.RevisionPeriodId == p.Id).ToList();
                    var pTaxes = rvTaxResults.Where(t => t.RevisionPeriodId == p.Id).ToList();
                    annualRv += Math.Round(pCalc.Sum(c => (decimal?)c.RateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    periodRv += Math.Round(pCalc.Sum(c => c.PeriodRateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    annualTax += Math.Round(pTaxes.Sum(t => (decimal?)t.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    periodTax += Math.Round(pTaxes.Sum(t => t.PeriodTaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    factor = pCalc.FirstOrDefault()?.ProrationFactor ?? factor;
                }

                periodDetails.Periods.Add(new RevisionPeriodRowDto
                {
                    PeriodId = p.Id,
                    PeriodNo = p.PeriodNo,
                    FromDate = p.EffectiveFrom,
                    ToDate = p.EffectiveTo,
                    NoOfDays = p.PeriodDays > 0 ? p.PeriodDays : (int)(p.EffectiveTo - p.EffectiveFrom).TotalDays + 1,
                    ProrationFactor = Math.Round(factor, 6),
                    TypeOfUse = pUse,
                    AnnualRateableValue = annualRv,
                    PeriodRateableValue = periodRv,
                    AnnualTax = annualTax,
                    PeriodTax = periodTax,
                    Status = revision.RevisionStatus.ToString()
                });
            }
        }
        else
        {
            decimal annualRv = 0m, periodRv = 0m, annualTax = 0m, periodTax = 0m;
            if (includeCv)
            {
                annualRv += Math.Round(cvCalcResults.Sum(c => c.CapitalValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                periodRv += Math.Round(cvCalcResults.Sum(c => c.PeriodCapitalValue ?? c.CapitalValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                annualTax += Math.Round(cvCalcResults.Sum(c => c.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                periodTax += Math.Round(cvCalcResults.Sum(c => c.PeriodTaxAmount ?? c.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
            }
            if (includeRv)
            {
                annualRv += Math.Round(rvCalcResults.Sum(c => (decimal?)c.RateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                periodRv += Math.Round(rvCalcResults.Sum(c => c.PeriodRateableValue ?? (decimal?)c.RateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                annualTax += Math.Round(rvTaxResults.Sum(t => (decimal?)t.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                periodTax += Math.Round(rvTaxResults.Sum(t => t.PeriodTaxAmount ?? (decimal?)t.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
            }

            var primaryUse = rawFloors.FirstOrDefault()?.TypeOfUse ?? "Residential";
            var startDate = fyStartDate;
            var endDate = fyEndDate;
            var noOfDays = (int)(endDate - startDate).TotalDays + 1;

            periodDetails.Periods.Add(new RevisionPeriodRowDto
            {
                PeriodId = null,
                PeriodNo = 1,
                FromDate = startDate,
                ToDate = endDate,
                NoOfDays = noOfDays > 0 ? noOfDays : fyTotalDays,
                ProrationFactor = 1m,
                TypeOfUse = primaryUse,
                AnnualRateableValue = annualRv,
                PeriodRateableValue = periodRv,
                AnnualTax = annualTax,
                PeriodTax = periodTax,
                Status = revision.RevisionStatus.ToString()
            });
        }

        var totalDays = periodDetails.Periods.Sum(p => p.NoOfDays);
        var finalRv = Math.Round(periodDetails.Periods.Sum(p => p.PeriodRateableValue), 2, MidpointRounding.AwayFromZero);
        var finalTax = Math.Round(periodDetails.Periods.Sum(p => p.PeriodTax), 2, MidpointRounding.AwayFromZero);

        periodDetails.TotalDays = totalDays > 0 ? totalDays : fyTotalDays;
        periodDetails.PeriodsCount = periodDetails.Periods.Count;
        periodDetails.FinalFyRateableValue = finalRv;
        periodDetails.FinalFyTax = finalTax;
        // Build "After" values: based on the latest / last period of the current revision
        var currentLastPeriod = periodDetails.Periods.LastOrDefault();
        var currentLastPeriodFloors = currentLastPeriod?.PeriodId.HasValue == true
            ? floorDetails.Where(f => f.PeriodId == currentLastPeriod.PeriodId.Value).ToList()
            : floorDetails;

        var afterAlv = currentLastPeriodFloors.Any()
            ? Math.Round(currentLastPeriodFloors.Sum(f => f.AnnualRentalValue ?? (decimal)(f.RateableValue ?? 0)), 2, MidpointRounding.AwayFromZero)
            : (currentLastPeriod?.AnnualRateableValue ?? finalRv);
        var afterRv = currentLastPeriod?.AnnualRateableValue ?? finalRv;
        var afterTax = currentLastPeriod?.AnnualTax ?? finalTax;

        var afterDto = new RevisionComparisonValuesDto
        {
            RevisionNo = revision.RevisionNo,
            RevisionType = revision.RevisionType,
            PeriodNo = currentLastPeriod?.PeriodNo,
            EffectiveFrom = currentLastPeriod?.FromDate,
            EffectiveTo = currentLastPeriod?.ToDate,
            AnnualRentalValue = afterAlv,
            RateableValue = afterRv,
            TotalTax = afterTax
        };

        // Build "Before" values: based on the last period of the previous revision (Revision N-1)
        RevisionComparisonValuesDto? beforeDto = null;
        if (revision.PreviousRevisionMastId.HasValue && revision.PreviousRevisionMastId.Value > 0)
        {
            var prevRev = await _revisionRepository.GetByIdAsync(revision.PreviousRevisionMastId.Value, cancellationToken);
            if (prevRev != null)
            {
                var prevPeriods = await _revisionPeriodRepo.GetQueryable()
                    .AsNoTracking()
                    .Where(p => p.RevisionMastId == prevRev.Id && !p.MarkedForDeletion && p.IsActive)
                    .OrderBy(p => p.PeriodNo)
                    .ToListAsync(cancellationToken);

                var prevLastPeriod = prevPeriods.LastOrDefault();
                long? prevPeriodId = prevLastPeriod?.Id;

                decimal prevAlv = 0m, prevRv = 0m, prevTax = 0m;
                if (prevRev.CalculationType == RevisionCalculationType.CV)
                {
                    var prevCvCalc = await _revisionCVCalcRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(c => c.RevisionMastId == prevRev.Id && (prevPeriodId == null || c.RevisionPeriodId == prevPeriodId) && !c.MarkedForDeletion && c.IsActive)
                        .ToListAsync(cancellationToken);

                    prevRv = Math.Round(prevCvCalc.Sum(c => c.CapitalValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    prevAlv = prevRv;
                    prevTax = Math.Round(prevCvCalc.Sum(c => c.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                }
                else
                {
                    var prevRvCalc = await _revisionRVCalcRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(c => c.RevisionMastId == prevRev.Id && (prevPeriodId == null || c.RevisionPeriodId == prevPeriodId) && !c.MarkedForDeletion && c.IsActive)
                        .ToListAsync(cancellationToken);

                    var prevRvTax = await _revisionRVTaxRepo.GetQueryable()
                        .AsNoTracking()
                        .Where(t => t.RevisionMastId == prevRev.Id && (prevPeriodId == null || t.RevisionPeriodId == prevPeriodId) && !t.MarkedForDeletion && t.IsActive)
                        .ToListAsync(cancellationToken);

                    prevAlv = Math.Round(prevRvCalc.Sum(c => (decimal?)c.AnnualRentalValue ?? (decimal?)c.RateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    prevRv = Math.Round(prevRvCalc.Sum(c => (decimal?)c.RateableValue) ?? 0m, 2, MidpointRounding.AwayFromZero);
                    prevTax = Math.Round(prevRvTax.Sum(t => (decimal?)t.TaxAmount) ?? 0m, 2, MidpointRounding.AwayFromZero);
                }

                beforeDto = new RevisionComparisonValuesDto
                {
                    RevisionNo = prevRev.RevisionNo,
                    RevisionType = prevRev.RevisionType,
                    PeriodNo = prevLastPeriod?.PeriodNo,
                    EffectiveFrom = prevLastPeriod?.EffectiveFrom,
                    EffectiveTo = prevLastPeriod?.EffectiveTo,
                    AnnualRentalValue = prevAlv > 0 ? prevAlv : prevRv,
                    RateableValue = prevRv,
                    TotalTax = prevTax
                };
            }
        }

        var diffRv = afterDto.RateableValue - (beforeDto?.RateableValue ?? 0m);
        var diffTax = afterDto.TotalTax - (beforeDto?.TotalTax ?? 0m);

        var finalAlv = !includeRv
            ? finalRv
            : (rvCalcResults.Any()
                ? Math.Round(rvCalcResults.Sum(c => c.PeriodAnnualRentalValue ?? (((decimal?)c.AnnualRentalValue ?? (decimal?)c.RateableValue ?? 0m) * (c.ProrationFactor ?? 1m))), 2, MidpointRounding.AwayFromZero)
                : finalRv);

        periodDetails.FinalValues = new FinalRevisedValuesDto
        {
            AnnualRentalValue = finalAlv,
            RateableValue = finalRv,
            TotalTax = finalTax,
            PolicyCodesCount = rvPolicyTaxes.Select(pt => pt.PolicyCodeId).Union(cvPolicyTaxes.Select(pt => pt.PolicyCodeId)).Distinct().Count(),
            TaxesCount = rvTaxResults.Select(tr => tr.TaxId).Union(cvCalcResults.Select(tr => tr.TaxId)).Distinct().Count(),
            Before = beforeDto,
            After = afterDto,
            Difference = new RevisionValueDifferenceDto
            {
                RateableValue = diffRv,
                TotalTax = diffTax
            }
        };

        // 5. Property Changes Tab (Period-wise Snapshots)
        var propMasts = await _revisionPropertyMastRepo.GetQueryable()
            .AsNoTracking()
            .Where(p => p.RevisionMastId == revisionId && !p.MarkedForDeletion && p.IsActive)
            .OrderBy(p => p.RevisionPeriodId)
            .ToListAsync(cancellationToken);

        var mastIds = propMasts.Select(p => p.Id).ToList();
        var allPropMastDetails = await _revisionPropertyMastDetailsRepo.GetQueryable()
            .AsNoTracking()
            .Where(d => mastIds.Contains(d.RevisionPropertyMastId) && !d.MarkedForDeletion && d.IsActive)
            .ToListAsync(cancellationToken);
        var detailsDict = allPropMastDetails.ToDictionary(d => d.RevisionPropertyMastId);

        var wardIds = propMasts.Select(p => p.WardId).Distinct().ToList();
        var wards = await _wardRepo.GetQueryable().AsNoTracking().Where(w => wardIds.Contains(w.Id) && w.IsActive).ToListAsync(cancellationToken);
        var wardDict = wards.ToDictionary(w => w.Id);

        var zoneIds = wards.Select(w => w.ZoneId).Concat(propMasts.Select(p => p.TaxZoneId)).Distinct().ToList();
        var zones = await _zoneRepo.GetQueryable().AsNoTracking().Where(z => zoneIds.Contains(z.Id) && z.IsActive).ToListAsync(cancellationToken);
        var zoneDict = zones.ToDictionary(z => z.Id);

        var categoryIds = propMasts.Where(p => p.CategoryId.HasValue).Select(p => p.CategoryId!.Value).Distinct().ToList();
        var categories = await _categoryRepo.GetQueryable().AsNoTracking().Where(c => categoryIds.Contains(c.Id) && c.IsActive).ToListAsync(cancellationToken);
        var categoryDict = categories.ToDictionary(c => c.Id);

        var moujaIds = propMasts.Where(p => p.MoujaId.HasValue).Select(p => p.MoujaId!.Value).Distinct().ToList();
        var moujas = await _moujaRepo.GetQueryable().AsNoTracking().Where(m => moujaIds.Contains(m.Id) && m.IsActive).ToListAsync(cancellationToken);
        var moujaDict = moujas.ToDictionary(m => m.Id);

        var ownerTypeIds = allPropMastDetails.Where(d => d.OwnerTypeId.HasValue).Select(d => d.OwnerTypeId!.Value).Distinct().ToList();
        var ownerTypes = await _ownerTypeRepo.GetQueryable().AsNoTracking().Where(o => ownerTypeIds.Contains(o.Id) && o.IsActive).ToListAsync(cancellationToken);
        var ownerTypeDict = ownerTypes.ToDictionary(o => o.Id);

        var rateSecDetails = await _rateSectionDetailsRepo.GetQueryable().AsNoTracking().Where(rsd => wardIds.Contains(rsd.WardId) && rsd.IsActive).ToListAsync(cancellationToken);
        var rateSecIds = rateSecDetails.Select(rsd => rsd.RateSectionId).Distinct().ToList();
        var rateSections = await _rateSectionRepo.GetQueryable().AsNoTracking().Where(rs => rateSecIds.Contains(rs.Id) && rs.IsActive).ToListAsync(cancellationToken);
        var rateSectionDict = rateSections.ToDictionary(rs => rs.Id);
        var wardToRateSectionName = rateSecDetails
            .GroupBy(rsd => rsd.WardId)
            .ToDictionary(
                g => g.Key,
                g => rateSectionDict.TryGetValue(g.First().RateSectionId, out var rs) ? rs.Description : null
            );

        double? plotAreaSqMtr = null;
        double? plotAreaSqFeet = null;

        var propertyChanges = new List<RevisionPropertyChangesDto>();
        int pIndex = 1;
        foreach (var pm in propMasts)
        {
            detailsDict.TryGetValue(pm.Id, out var pmDetails);
            var period = periods.FirstOrDefault(p => p.Id == pm.RevisionPeriodId);

            wardDict.TryGetValue(pm.WardId, out var ward);
            zoneDict.TryGetValue(pm.TaxZoneId, out var taxZone);
            ZoneEntity? divisionZone = null;
            if (ward != null)
            {
                zoneDict.TryGetValue(ward.ZoneId, out divisionZone);
            }
            var division = divisionZone?.Description ?? divisionZone?.ZoneNo ?? taxZone?.Description ?? taxZone?.ZoneNo ?? $"Zone {pm.TaxZoneId}";

            var categoryName = pm.CategoryId.HasValue && categoryDict.TryGetValue(pm.CategoryId.Value, out var cat) ? cat.PropertyCategoryName : null;
            var moujaName = pm.MoujaId.HasValue && moujaDict.TryGetValue(pm.MoujaId.Value, out var mj) ? mj.MoujaName : null;
            wardToRateSectionName.TryGetValue(pm.WardId, out var rateSecName);
            var ownerCategory = pmDetails?.OwnerTypeId.HasValue == true && ownerTypeDict.TryGetValue(pmDetails.OwnerTypeId.Value, out var ot) ? ot.OwnerType : null;

            var periodFloors = pm.RevisionPeriodId.HasValue
                ? rawFloors.Where(f => f.PeriodId == pm.RevisionPeriodId.Value).ToList()
                : rawFloors;
            if (!periodFloors.Any()) periodFloors = rawFloors;

            var carpetSqMtr = periodFloors.Sum(f => f.CarpetAreaSqMeter ?? 0);
            var carpetSqFeet = periodFloors.Sum(f => f.CarpetAreaSqFeet ?? 0);
            var builtupSqMtr = pmDetails?.TotalBuiltupAreaSqMeter ?? periodFloors.Sum(f => f.BuiltupAreaSqMeter ?? 0);
            var builtupSqFeet = pmDetails?.TotalBuiltupAreaSqFeet ?? periodFloors.Sum(f => f.BuiltupAreaSqFeet ?? 0);

            propertyChanges.Add(new RevisionPropertyChangesDto
            {
                RevisionPeriodId = pm.RevisionPeriodId,
                PeriodNo = period?.PeriodNo ?? pIndex,
                EffectiveFrom = period?.EffectiveFrom ?? revision.EffectiveDate ?? revision.CreatedDate,
                EffectiveTo = period?.EffectiveTo,
                WardId = pm.WardId,
                WardNo = ward?.WardNo,
                WardName = ward?.Description ?? ward?.WardNo ?? $"Ward {pm.WardId}",
                TaxZoneId = pm.TaxZoneId,
                ZoneName = division,
                Division = division,
                PropertyNo = pm.PropertyNo,
                PartitionNo = pm.PartitionNo,
                SubZoneNo = pm.SubZoneNo,
                MoujaId = pm.MoujaId,
                MoujaName = moujaName,
                RateSectionName = rateSecName,
                CSN = pm.CSN,
                PlotNo = pm.PlotNo,
                PlotAreaSqMtr = plotAreaSqMtr,
                PlotAreaSqFeet = plotAreaSqFeet,
                CarpetAreaSqMtr = carpetSqMtr > 0 ? Math.Round(carpetSqMtr, 2, MidpointRounding.AwayFromZero) : null,
                CarpetAreaSqFeet = carpetSqFeet > 0 ? Math.Round(carpetSqFeet, 2, MidpointRounding.AwayFromZero) : null,
                BuiltupAreaSqMtr = builtupSqMtr > 0 ? Math.Round(builtupSqMtr, 2, MidpointRounding.AwayFromZero) : null,
                BuiltupAreaSqFeet = builtupSqFeet > 0 ? Math.Round(builtupSqFeet, 2, MidpointRounding.AwayFromZero) : null,
                CategoryId = pm.CategoryId,
                PropertyCategoryName = categoryName,
                OwnerTypeId = pmDetails?.OwnerTypeId,
                OwnerCategory = ownerCategory,
                OwnerName = pm.OwnerName,
                OwnerNameEnglish = pm.OwnerNameEnglish ?? pm.OwnerName,
                OccupierName = pm.OccupierName,
                OccupierNameEnglish = pm.OccupierNameEnglish ?? pm.OccupierName,
                FlatOrShopNo = pm.FlatOrShopNo,
                FlatOrShopName = pm.FlatOrShopName,
                FlatOrShopNameEnglish = pm.FlatOrShopNameEnglish ?? pm.FlatOrShopName,
                AadharNo = pmDetails?.AdharCardNo,
                Address = pm.Address,
                AddressEnglish = pm.AddressEnglish ?? pm.Address,
                PinCode = pm.PinCode,
                MobileNo = pm.MobileNo,
                AlternateMobileNo = pm.AlternateMobileNo,
                EmailId = pm.EmailId
            });

            pIndex++;
        }


        // 7. Room Details Tab & Deductions
        var rawMinusData = await _revisionMinusRepo.GetQueryable()
            .AsNoTracking()
            .Where(m => m.RevisionMastId == revisionId && !m.MarkedForDeletion && m.IsActive)
            .ToListAsync(cancellationToken);

        var minusByRoomId = rawMinusData
            .GroupBy(m => m.RevisionRoomWiseSubmissionId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(m => new RevisionRoomMinusDto
                {
                    MinusId = m.Id,
                    RoomId = m.RevisionRoomWiseSubmissionId,
                    Shape = m.Shape,
                    LengthMtr = m.LengthMtr.HasValue ? Math.Round(m.LengthMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    WidthMtr = m.WidthMtr.HasValue ? Math.Round(m.WidthMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    AreaSqMtr = m.AreaSqMtr.HasValue ? Math.Round(m.AreaSqMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    HeightMtr = m.HeightMtr.HasValue ? Math.Round(m.HeightMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    Base1Mtr = m.Base1Mtr.HasValue ? Math.Round(m.Base1Mtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    Base2Mtr = m.Base2Mtr.HasValue ? Math.Round(m.Base2Mtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                    IsOffset = m.IsOffset
                }).ToList()
            );

        var rawRooms = await _revisionRoomRepo.GetQueryable()
            .AsNoTracking()
            .Where(rm => rm.RevisionMastId == revisionId && !rm.MarkedForDeletion && rm.IsActive)
            .ToListAsync(cancellationToken);

        // Fetch room type master names from PTIS.RoomTypeMaster
        var roomTypeIds = rawRooms
            .Where(rm => rm.RoomTypeId.HasValue && rm.RoomTypeId.Value > 0)
            .Select(rm => rm.RoomTypeId!.Value)
            .Distinct()
            .ToList();

        var roomTypeMap = roomTypeIds.Any()
            ? await _roomTypeRepo.GetQueryable()
                .AsNoTracking()
                .Where(rt => roomTypeIds.Contains(rt.Id) && rt.IsActive)
                .ToDictionaryAsync(rt => rt.Id, rt => rt.RoomTypeName, cancellationToken)
            : new Dictionary<int, string>();

        var roomDetails = rawRooms.Select(rm =>
        {
            var roomMinusList = minusByRoomId.GetValueOrDefault(rm.Id) ?? new List<RevisionRoomMinusDto>();
            var firstMinus = roomMinusList.FirstOrDefault();
            double? minusLength = firstMinus?.LengthMtr;
            double? minusWidth = firstMinus?.WidthMtr;
            double? minusArea = roomMinusList.Any()
                ? Math.Round(roomMinusList.Sum(m => m.AreaSqMtr ?? 0), 2, MidpointRounding.AwayFromZero)
                : null;

            string? roomTypeName = null;
            if (rm.RoomTypeId.HasValue && roomTypeMap.TryGetValue(rm.RoomTypeId.Value, out var rtName))
            {
                roomTypeName = rtName;
            }
            else if (!string.IsNullOrWhiteSpace(rm.SubmissionType))
            {
                roomTypeName = rm.SubmissionType;
            }

            return new RevisionRoomDto
            {
                RoomId = rm.Id,
                FloorDetailId = rm.RevisionPropertyDetailsId,
                PeriodId = rm.RevisionPeriodId,
                RoomNo = rm.RoomNo,
                RoomTypeId = rm.RoomTypeId,
                RoomTypeName = roomTypeName,
                RoomType = roomTypeName ?? rm.SubmissionType,
                Shape = rm.Shape,
                LengthMtr = rm.LengthMtr.HasValue ? Math.Round(rm.LengthMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                WidthMtr = rm.WidthMtr.HasValue ? Math.Round(rm.WidthMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                HeightMtr = rm.HeightMtr.HasValue ? Math.Round(rm.HeightMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                Base1Mtr = rm.Base1Mtr.HasValue ? Math.Round(rm.Base1Mtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                Base2Mtr = rm.Base2Mtr.HasValue ? Math.Round(rm.Base2Mtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                NoOfRooms = rm.NoOfRooms,
                AreaSqMtr = rm.AreaSqMtr.HasValue ? Math.Round(rm.AreaSqMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                TotalAreaSqMtr = rm.TotalAreaSqMtr.HasValue ? Math.Round(rm.TotalAreaSqMtr.Value, 2, MidpointRounding.AwayFromZero) : null,
                OuterYesNo = rm.OuterYesNo,
                MinusYesNo = rm.MinusYesNo,
                MinusLengthMtr = minusLength,
                MinusWidthMtr = minusWidth,
                MinusAreaSqMtr = minusArea,
                MinusDetails = roomMinusList
            };
        }).ToList();

        var roomsByFloorId = roomDetails
            .Where(r => r.FloorDetailId.HasValue && r.FloorDetailId.Value > 0)
            .GroupBy(r => r.FloorDetailId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        if (floorDetails != null && floorDetails.Count > 0)
        {
            foreach (var f in floorDetails)
            {
                f.Rooms = roomsByFloorId.GetValueOrDefault(f.FloorDetailId) ?? new List<RevisionRoomDto>();
            }
        }

        // 8. Documents lookup for nested Document bindings
        var documents = await _revisionDocumentRepo.GetQueryable()
            .AsNoTracking()
            .Where(d => d.RevisionMastId == revisionId && !d.MarkedForDeletion && d.IsActive)
            .ToListAsync(cancellationToken);

        var docByBindingId = documents
            .Where(d => d.DocumentBindingId > 0)
            .GroupBy(d => d.DocumentBindingId)
            .ToDictionary(g => g.Key, g => g.First());

        // 9. Social Attributes Tab
        var rawSocial = await (from s in _revisionSocialRepo.GetQueryable()
                               join sa in _socialAttributeRepo.GetQueryable() on s.SocialAttributeId equals sa.Id into saJoin
                               from sa in saJoin.DefaultIfEmpty()
                               where s.RevisionMastId == revisionId && !s.MarkedForDeletion && s.IsActive
                               select new
                               {
                                   SocialDetailId = s.Id,
                                   AttributeId = s.SocialAttributeId,
                                   AttributeName = sa != null ? sa.SocialAttributeName : $"Attribute {s.SocialAttributeId}",
                                   s.BitValue,
                                   s.TextValue,
                                   s.IntValue,
                                   s.DecimalValue,
                                   s.DateValue,
                                   s.Remark,
                                   s.DocumentBindingId
                               }).ToListAsync(cancellationToken);

        var socialAttributes = rawSocial.Select(s =>
        {
            string? formattedValue = s.BitValue.HasValue
                ? (s.BitValue.Value ? "Yes" : "No")
                : s.TextValue
                    ?? (s.IntValue.HasValue ? s.IntValue.Value.ToString() : null)
                    ?? (s.DecimalValue.HasValue ? s.DecimalValue.Value.ToString("0.##") : null)
                    ?? (s.DateValue.HasValue ? s.DateValue.Value.ToString("yyyy-MM-dd") : null);

            RevisionDocumentDto? docDto = s.DocumentBindingId.HasValue && docByBindingId.TryGetValue(s.DocumentBindingId.Value, out var doc)
                ? MapToDocumentDto(doc)
                : null;

            return new RevisionSocialAttributeDto
            {
                SocialDetailId = s.SocialDetailId,
                AttributeId = s.AttributeId,
                AttributeName = s.AttributeName,
                Value = formattedValue,
                Remark = s.Remark,
                Document = docDto
            };
        }).ToList();

        // 10. Certificates Tab
        var rawCerts = await (from c in _revisionCertificatesRepo.GetQueryable()
                              join ctType in _certificateTypeRepo.GetQueryable() on c.CertificateTypeId equals ctType.Id into ctTypeJoin
                              from ctType in ctTypeJoin.DefaultIfEmpty()
                              where c.RevisionMastId == revisionId && !c.MarkedForDeletion && c.IsActive
                              select new
                              {
                                  CertificateId = c.Id,
                                  c.CertificateTypeId,
                                  CertificateType = ctType != null ? ctType.CertificateTypeName : $"Certificate {c.CertificateTypeId}",
                                  c.CertificateNo,
                                  c.CertificateIssueDate,
                                  c.TaxApplied,
                                  c.TaxAppliedDate,
                                  c.DocumentBindingId
                              }).ToListAsync(cancellationToken);

        var certificates = rawCerts.Select(c =>
        {
            RevisionDocumentDto? docDto = c.DocumentBindingId.HasValue && docByBindingId.TryGetValue(c.DocumentBindingId.Value, out var doc)
                ? MapToDocumentDto(doc)
                : null;

            return new RevisionCertificateDto
            {
                CertificateId = c.CertificateId,
                CertificateTypeId = c.CertificateTypeId,
                CertificateType = c.CertificateType,
                CertificateNo = c.CertificateNo,
                CertificateIssueDate = c.CertificateIssueDate,
                TaxApplied = c.TaxApplied,
                TaxAppliedDate = c.TaxAppliedDate,
                Document = docDto
            };
        }).ToList();

        // 11. Tax Calculation Breakdown Tab
        var taxCalculationList = isCv
            ? await BuildTaxCalculationListAsync(
                cvCalcResults.Select(t => (t.TaxId, (decimal?)t.TaxAmount ?? 0m, (decimal?)t.PeriodTaxAmount ?? 0m)),
                _taxMasterRepo,
                cancellationToken)
            : await BuildTaxCalculationListAsync(
                rvTaxResults.Select(t => (t.TaxId, (decimal?)t.TaxAmount ?? 0m, (decimal?)t.PeriodTaxAmount ?? 0m)),
                _taxMasterRepo,
                cancellationToken);

        // 12. Remarks Tab
        var propMastDetails = await _revisionPropertyMastDetailsRepo.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.RevisionMastId == revisionId && !d.MarkedForDeletion && d.IsActive, cancellationToken);

        string? ownerSignRemarkText = null;
        if (propMastDetails?.OwnerSignRemarkId.HasValue == true && propMastDetails.OwnerSignRemarkId.Value > 0)
        {
            ownerSignRemarkText = await _commonRemarkDetailsRepo.GetQueryable()
                .AsNoTracking()
                .Where(r => r.Id == propMastDetails.OwnerSignRemarkId.Value && r.IsActive)
                .Select(r => r.Remark)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var periodRemarksList = periods
            .Select(p => new RevisionPeriodRemarkDto
            {
                PeriodId = p.Id,
                PeriodNo = p.PeriodNo,
                EffectiveFrom = p.EffectiveFrom,
                EffectiveTo = p.EffectiveTo,
                Remarks = p.Remarks
            })
            .ToList();

        var latestPeriodRemark = periods.LastOrDefault()?.Remarks ?? periods.FirstOrDefault()?.Remarks;

        var remarks = new RevisionRemarksDto
        {
            RevisionReason = revision.RevisionReason,
            AssessmentRemark = propMastDetails?.AssessmentRemark,
            CombPropRemark = propMastDetails?.CombPropRemark,
            QcRemark = null,
            SurveyRemark = propMastDetails?.SurveyRemark,
            FlatSystemRemark = propMastDetails?.FlatSystemRemark,
            OwnerSignRemarkId = propMastDetails?.OwnerSignRemarkId,
            OwnerSignRemark = ownerSignRemarkText,
            PeriodRemark = latestPeriodRemark,
            PeriodRemarks = periodRemarksList
        };

        // 13. Resolve User Names (CreatedBy, ApprovedBy) from CORE.UserMaster
        var userIds = new List<int>();
        if (revision.CreatedBy.HasValue && revision.CreatedBy.Value > 0)
            userIds.Add(revision.CreatedBy.Value);
        if (revision.ApprovedBy.HasValue && revision.ApprovedBy.Value > 0)
            userIds.Add(revision.ApprovedBy.Value);

        var userMap = userIds.Any()
            ? await _userRepo.GetQueryable()
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UserName, cancellationToken)
            : new Dictionary<int, string>();

        string? createdByName = revision.CreatedBy.HasValue && userMap.TryGetValue(revision.CreatedBy.Value, out var cName)
            ? cName
            : null;

        string? approvedByName = revision.ApprovedBy.HasValue && userMap.TryGetValue(revision.ApprovedBy.Value, out var aName)
            ? aName
            : null;

        // 14. Map to PropertyRevisionDetailsDto
        var latestPeriodNo = revision.Periods.Count > 0 ? revision.Periods.Max(p => p.PeriodNo) : (int?)null;

        return new PropertyRevisionDetailsDto
        {
            RevisionId = revision.Id,
            PropertyId = revision.PropertyId,
            FinanceYearId = revision.FinanceYearId,
            FinanceYear = !string.IsNullOrWhiteSpace(fyDisplay) ? fyDisplay : $"{revision.FinanceYearId}",
            RevisionNo = revision.RevisionNo,
            PreviousRevisionMastId = revision.PreviousRevisionMastId,
            CalculationType = revision.CalculationType,
            CalculationScope = revision.CalculationScope,
            RevisionType = revision.RevisionType,
            EffectiveDate = revision.EffectiveDate,
            RevisionReason = revision.RevisionReason,
            RevisionStatus = revision.RevisionStatus,
            IsCurrent = revision.IsCurrent,
            CreatedBy = revision.CreatedBy,
            CreatedByName = createdByName,
            ApprovedBy = revision.ApprovedBy,
            ApprovedByName = approvedByName,
            ApprovedDate = revision.ApprovedDate,
            CreatedDate = revision.CreatedDate,
            Periods = revision.Periods
                .OrderBy(p => p.PeriodNo)
                .Select(p => new PropertyRevisionPeriodDto
                {
                    RevisionPeriodId = p.Id,
                    PeriodNo = p.PeriodNo,
                    EffectiveFrom = p.EffectiveFrom,
                    EffectiveTo = p.EffectiveTo,
                    PeriodDays = p.PeriodDays,
                    IsEditable = revision.RevisionStatus is RevisionStatus.DRAFT or RevisionStatus.CALCULATED && latestPeriodNo.HasValue && p.PeriodNo == latestPeriodNo.Value,
                    Remarks = p.Remarks
                })
                .ToList(),
            PeriodDetails = periodDetails,
            PropertyChanges = propertyChanges,
            FloorDetails = floorDetails,
            PeriodWiseFloors = periodWiseFloors,
            RenterDetails = renterDetails,
            RoomDetails = roomDetails,
            SocialAttributes = socialAttributes,
            Certificates = certificates,
            TaxCalculation = taxCalculationList,
            Remarks = remarks
        };
    }

    public async Task<PagedResult<PropertyRevisionSummaryDto>> GetHistoryAsync(
        int propertyId,
        PropertyRevisionQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var propertyExists = await _propertyRepository.ExistsAsync(propertyId, cancellationToken);
        if (!propertyExists)
        {
            throw new PropertyNotFoundException(propertyId);
        }

        var (items, totalCount) = await _revisionRepository.GetHistoryAsync(
            propertyId, query.PageNumber, query.PageSize, query.Status, cancellationToken);

        var fyIds = items.Select(r => r.FinanceYearId).Distinct().ToList();
        var yearMasters = await _yearMasterRepository.GetQueryable()
            .AsNoTracking()
            .Where(y => fyIds.Contains(y.Id))
            .ToDictionaryAsync(y => y.Id, y => y.YearCode ?? y.Description ?? y.Year.ToString(), cancellationToken);

        var dtos = items.Select(r =>
        {
            yearMasters.TryGetValue(r.FinanceYearId, out var fyDisplay);
            return new PropertyRevisionSummaryDto
            {
                Id = r.Id,
                RevisionId = r.Id,
                PropertyId = r.PropertyId,
                RevisionNo = r.RevisionNo,
                FinanceYearId = r.FinanceYearId,
                FinanceYear = !string.IsNullOrWhiteSpace(fyDisplay) ? fyDisplay : $"{r.FinanceYearId}",
                CalculationType = r.CalculationType,
                CalculationScope = r.CalculationScope,
                RevisionType = r.RevisionType,
                RevisionReason = r.RevisionReason,
                EffectiveDate = r.EffectiveDate,
                RevisionStatus = r.RevisionStatus,
                IsCurrent = r.IsCurrent,
                IsActive = r.IsActive,
                CreatedDate = r.CreatedDate,
                UpdatedDate = r.UpdatedDate
            };
        }).ToList();

        return new PagedResult<PropertyRevisionSummaryDto>(dtos, totalCount, query.PageNumber, query.PageSize);
    }

    public async Task<RevisionSnapshotCapturedDto> CaptureSnapshotAsync(
        long revisionId,
        CaptureRevisionSnapshotDto request,
        CancellationToken cancellationToken = default)
    {
        var revision = await _revisionRepository.GetByIdAsync(revisionId, cancellationToken);
        if (revision is null)
        {
            throw new RevisionNotFoundException(revisionId);
        }

        if (revision.RevisionStatus is not (RevisionStatus.DRAFT or RevisionStatus.CALCULATED))
        {
            throw new RevisionConflictException(
                $"Revision {revisionId} is {revision.RevisionStatus} - a snapshot can only be " +
                "captured for a DRAFT or CALCULATED revision.");
        }

        long? revisionPeriodId = request.RevisionPeriodId;

        if (revision.CalculationScope == RevisionCalculationScope.HISTORY_ONLY)
        {
            if (revisionPeriodId.HasValue)
            {
                throw new RevisionValidationException(
                    "RevisionPeriodId must not be supplied for a HISTORY_ONLY revision.");
            }
        }
        else 
        {
            if (!revisionPeriodId.HasValue)
            {
                var periods = await _revisionRepository.GetPeriodsAsync(revisionId, cancellationToken);
                if (periods.Count == 0)
                {
                    throw new RevisionValidationException(
                        $"Revision {revisionId} is PERIOD_WISE but has no periods to capture a snapshot for.");
                }

                revisionPeriodId = periods.OrderByDescending(p => p.PeriodNo).First().Id;
            }
        }

        var userId = _currentUserService.GetCurrentUserId();

        var result = await _revisionRepository.CaptureSnapshotAsync(
            new RevisionCaptureSnapshotParameters
            {
                RevisionMastId = revisionId,
                RevisionPeriodId = revisionPeriodId,
                CreatedBy = userId,
                ProrationMethod = string.IsNullOrWhiteSpace(request.ProrationMethod)
                    ? "DAY_WISE"
                    : string.Equals(request.ProrationMethod, "DAY_WISE", StringComparison.OrdinalIgnoreCase)
                        ? "DAY_WISE"
                        : throw new RevisionValidationException("ProrationMethod must be DAY_WISE.")
            },
            cancellationToken);

        return new RevisionSnapshotCapturedDto
        {
            RevisionId = result.RevisionMastId,
            RevisionPeriodId = result.RevisionPeriodId,
            PropertyId = result.PropertyId,
            CalculationScope = Enum.Parse<RevisionCalculationScope>(result.CalculationScope),
            CalculationType = Enum.Parse<RevisionCalculationType>(result.CalculationType),
            PeriodDays = result.PeriodDays,
            YearDays = result.YearDays,
            ProrationFactor = result.ProrationFactor
        };
    }

    public async Task<PropertyRevisionDetailsDto> ApproveAsync(
        long revisionId,
        CancellationToken cancellationToken = default)
    {
        var revision = await _revisionRepository.GetByIdAsync(revisionId, cancellationToken);
        if (revision is null)
        {
            throw new RevisionNotFoundException(revisionId);
        }

        if (revision.RevisionStatus == RevisionStatus.POSTED)
        {
            throw new RevisionConflictException("Revision is already POSTED.");
        }

        if (revision.RevisionStatus == RevisionStatus.CANCELLED)
        {
            throw new RevisionConflictException("A cancelled revision cannot be approved.");
        }

        if (revision.RevisionStatus == RevisionStatus.DRAFT)
        {
            throw new RevisionConflictException("Revision is in DRAFT status. Please calculate taxes before approving.");
        }

        await EnsureApprovedByUlbAsync(revision.PropertyId, cancellationToken);

        var userId = _currentUserService.GetCurrentUserId();
        await _revisionRepository.ApproveAsync(revisionId, userId, cancellationToken);

        return await GetAsync(revisionId, cancellationToken);
    }

    public async Task<RevisionPostedDto> PostAsync(
        long revisionId,
        CancellationToken cancellationToken = default)
    {
        var revision = await _revisionRepository.GetByIdAsync(revisionId, cancellationToken);
        if (revision is null)
        {
            throw new RevisionNotFoundException(revisionId);
        }

        if (revision.RevisionStatus != RevisionStatus.APPROVED)
        {
            throw new RevisionConflictException(
                $"Revision {revisionId} is {revision.RevisionStatus} - only an APPROVED revision can be posted.");
        }

        await EnsureApprovedByUlbAsync(revision.PropertyId, cancellationToken);

        var userId = _currentUserService.GetCurrentUserId();

        var result = await _revisionRepository.PostAsync(revisionId, userId, cancellationToken);

        return new RevisionPostedDto
        {
            RevisionId = result.RevisionMastId,
            PropertyId = result.PropertyId,
            FinanceYearId = result.FinanceYearId,
            CalculationScope = Enum.Parse<RevisionCalculationScope>(result.CalculationScope),
            CalculationType = Enum.Parse<RevisionCalculationType>(result.CalculationType),
            RevisionStatus = Enum.Parse<RevisionStatus>(result.RevisionStatus)
        };
    }

    private async Task EnsureApprovedByUlbAsync(int propertyId, CancellationToken cancellationToken)
    {
        if (!await _revisionRepository.IsPropertyAtApprovalByUlbAsync(propertyId, cancellationToken))
        {
            throw new RevisionValidationException(
                $"Property {propertyId} is not at workflow stage 'ApprovalByULB'. " +
                "A revision can only be created for a property whose current stage is ApprovalByULB.");
        }
    }

    private static RevisionDocumentDto MapToDocumentDto(RevisionDocumentDetailsEntity doc) => new()
    {
        DocumentId = doc.Id,
        DocumentTitle = doc.DocumentTitle,
        DocumentTypeCode = doc.DocumentTypeCode,
        DocumentStage = doc.DocumentStage,
        DocumentBindingId = doc.DocumentBindingId,
        Remarks = doc.Remarks
    };

    private static async Task<List<RevisionTaxCalculationDto>> BuildTaxCalculationListAsync(
        IEnumerable<(int TaxId, decimal AnnualTax, decimal PeriodTax)> taxItems,
        IRepository<TaxMasterEntity, int> taxMasterRepo,
        CancellationToken cancellationToken)
    {
        var taxSummary = taxItems
            .GroupBy(t => t.TaxId)
            .Select(g => new
            {
                TaxId = g.Key,
                AnnualTax = g.Sum(x => x.AnnualTax),
                PeriodTax = g.Sum(x => x.PeriodTax)
            })
            .ToList();

        var taxIds = taxSummary.Select(t => t.TaxId).Distinct().ToList();
        var taxMasters = await taxMasterRepo.GetQueryable()
            .AsNoTracking()
            .Where(t => taxIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.TaxName, cancellationToken);

        var result = new List<RevisionTaxCalculationDto>();
        foreach (var t in taxSummary)
        {
            taxMasters.TryGetValue(t.TaxId, out var taxName);
            result.Add(new RevisionTaxCalculationDto
            {
                TaxId = t.TaxId,
                TaxName = taxName ?? $"Tax Head {t.TaxId}",
                AnnualTaxAmount = Math.Round(t.AnnualTax, 2, MidpointRounding.AwayFromZero),
                PeriodTaxAmount = Math.Round(t.PeriodTax, 2, MidpointRounding.AwayFromZero)
            });
        }

        return result;
    }
}
