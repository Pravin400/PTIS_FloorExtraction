using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Constants;
using NtisPlatform.Application.DTOs.Property.PropertySurveyDashboard;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Constants;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class PropertySurveyDashboardService : IPropertySurveyDashboardService
{
    private static readonly string[] AllowedAllWardRoles =
    {
        RoleConstants.SuperAdmin,
        RoleConstants.Admin,
        RoleConstants.ZoneManager
    };

    private static readonly string[] AllowedModules =
    {
        ModuleConstants.Survey,
        ModuleConstants.GeoSequencing
    };

    private readonly ILogger<PropertySurveyDashboardService> _logger;
    private readonly IRepository<PropertyEntity, int> _propertyRepository;
    private readonly IRepository<PropertyMastOldEntity, int> _propertyOldRepository;
    private readonly IRepository<PropertyTypeMasterEntity, int> _propertyTypeRepository;
    private readonly IRepository<PropertyCategoryEntity, int> _propertyCategoryRepository;
    private readonly IRepository<PropertyDetailsEntity, int> _propertyDetailsRepository;
    private readonly IRepository<PropertyWorkflowDetailsEntity, int> _propertyWorkflowRepository;
    private readonly IRepository<PropertySurveyVisitEntity, int> _propertySurveyVisitRepository;
    private readonly IRepository<PropertyAssessmentStatusEntity, int> _propertyAssessmentStatusRepository;
    private readonly IRepository<UserRoleMasterEntity, int> _userRoleMasterRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _userRoleAllocationRepository;
    private readonly IRepository<DepartmentMasterEntity, int> _departmentMasterRepository;
    private readonly IRepository<ModuleMasterEntity, int> _moduleMasterRepository;
    private readonly IRepository<UserModuleAllocationEntity, int> _userModuleAllocationRepository;
    private readonly IRepository<GlobalSurveyWardAllocationEntity, int> _wardAllocationRepository;

    public PropertySurveyDashboardService(
        ILogger<PropertySurveyDashboardService> logger,
        IRepository<PropertyEntity, int> propertyRepository,
        IRepository<PropertyMastOldEntity, int> propertyOldRepository,
        IRepository<PropertyTypeMasterEntity, int> propertyTypeRepository,
        IRepository<PropertyCategoryEntity, int> propertyCategoryRepository,
        IRepository<PropertyDetailsEntity, int> propertyDetailsRepository,
        IRepository<PropertyWorkflowDetailsEntity, int> propertyWorkflowRepository,
        IRepository<PropertySurveyVisitEntity, int> propertySurveyVisitRepository,
        IRepository<PropertyAssessmentStatusEntity, int> propertyAssessmentStatusRepository,
        IRepository<UserRoleMasterEntity, int> userRoleMasterRepository,
        IRepository<UserRoleAllocationEntity, int> userRoleAllocationRepository,
        IRepository<DepartmentMasterEntity, int> departmentMasterRepository,
        IRepository<ModuleMasterEntity, int> moduleMasterRepository,
        IRepository<UserModuleAllocationEntity, int> userModuleAllocationRepository,
        IRepository<GlobalSurveyWardAllocationEntity, int> wardAllocationRepository)
    {
        _logger = logger;
        _propertyRepository = propertyRepository;
        _propertyOldRepository = propertyOldRepository;
        _propertyTypeRepository = propertyTypeRepository;
        _propertyCategoryRepository = propertyCategoryRepository;
        _propertyDetailsRepository = propertyDetailsRepository;
        _propertyWorkflowRepository = propertyWorkflowRepository;
        _propertySurveyVisitRepository = propertySurveyVisitRepository;
        _propertyAssessmentStatusRepository = propertyAssessmentStatusRepository;
        _userRoleMasterRepository = userRoleMasterRepository;
        _userRoleAllocationRepository = userRoleAllocationRepository;
        _departmentMasterRepository = departmentMasterRepository;
        _moduleMasterRepository = moduleMasterRepository;
        _userModuleAllocationRepository = userModuleAllocationRepository;
        _wardAllocationRepository = wardAllocationRepository;
    }

    public async Task<SurveyDashboardResponseDto> GetAllAsync(
        SurveyDashboardQueryParameters queryParameters,
        int userId,
        CancellationToken cancellationToken)
    {
        if (queryParameters == null)
        {
            throw new ValidationException("Query parameters are required.", OperationType.Read);
        }

        if (userId <= 0)
        {
            throw new ValidationException("Valid user identification is required.", OperationType.Read);
        }

        var filterType = queryParameters.FilterType?.Trim() ?? string.Empty;
        if (!string.IsNullOrEmpty(filterType) &&
            !string.Equals(filterType, "All", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(filterType, "Ward", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException($"Invalid filter type '{filterType}'. Supported values are 'All' and 'Ward'.", OperationType.Read);
        }

        var wardId = queryParameters.WardId;
        var isViewAllWards = false;

        _logger.LogInformation("Survey dashboard requested for WardId: {WardId}, UserId: {UserId}, FilterType: {FilterType}", wardId, userId, filterType);

        if (string.Equals(filterType, "All", StringComparison.OrdinalIgnoreCase))
        {
            // SuperAdmin and Admin can view all wards corporation-wide
            isViewAllWards = await (
                from urm in _userRoleMasterRepository.GetQueryable().AsNoTracking()
                join dm in _departmentMasterRepository.GetQueryable().AsNoTracking()
                    on urm.DepartmentId equals dm.Id
                join ura in _userRoleAllocationRepository.GetQueryable().AsNoTracking()
                    on urm.Id equals ura.UserRoleId
                join mm in _moduleMasterRepository.GetQueryable().AsNoTracking()
                    on dm.Id equals mm.DepartmentId
                join uma in _userModuleAllocationRepository.GetQueryable().AsNoTracking()
                    on new { UserId = ura.UserId, DepartmentId = dm.Id, ModuleId = mm.Id }
                    equals new { UserId = uma.UserId, DepartmentId = uma.DepartmentId, ModuleId = uma.ModuleId }
                where urm.IsActive
                        && dm.IsActive
                        && ura.IsActive
                        && mm.IsActive
                        && uma.IsActive
                        && dm.DepartmentCode == DepartmentConstants.Ptis
                        && ura.UserId == userId
                        && AllowedModules.Contains(mm.ModuleCode)
                        && AllowedAllWardRoles.Contains(urm.UserRoleName)
                select urm.Id
            ).AnyAsync(cancellationToken);

            if (!isViewAllWards)
            {
                throw new ForbiddenException("User is not allowed to view all wards.");
            }
        }
        else
        {
            // Ward filter requires a valid WardId
            if (!wardId.HasValue || wardId.Value <= 0)
            {
                throw new ValidationException("WardId is required for ward-specific dashboard queries.", OperationType.Read);
            }

            // Check active ward allocation for logged-in user
            var hasWardAccess = await (
                from wa in _wardAllocationRepository.GetQueryable().AsNoTracking()
                join dm in _departmentMasterRepository.GetQueryable().AsNoTracking()
                    on wa.DepartmentId equals dm.Id
                join mm in _moduleMasterRepository.GetQueryable().AsNoTracking()
                    on wa.ModuleId equals mm.Id
                where wa.UserId == userId
                    && wa.WardId == wardId.Value
                    && wa.IsActive
                    && !wa.MarkedForDeletion
                    && dm.IsActive
                    && dm.DepartmentCode == DepartmentConstants.Ptis
                    && mm.IsActive
                    && mm.DepartmentId == dm.Id
                    && AllowedModules.Contains(mm.ModuleCode)

                select wa.Id
            ).AnyAsync(cancellationToken);

            if (!hasWardAccess)
            {
                throw new ForbiddenException("User is not allocated to the requested ward.");
            }
        }

        // BASE PROPERTY
        var properties = _propertyRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.MarkedForDeletion != true &&
                        (!wardId.HasValue || x.WardId == wardId.Value))
            .Select(x => new
            {
                x.Id,
                x.WingDetailId,
                x.PropertyTypeId,
                x.CategoryId,
                x.PartitionNo,
                x.PropertyAssessmentStatusId
            });

        // OLD PROPERTY
        var oldProperties = _propertyOldRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.MarkedForDeletion != true)
            .Select(x => x.Id);

        // PROPERTY TYPE - AMENITY
        var amenityPropertyTypeIds = _propertyTypeRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.PartType == PartTypeConstants.Amenity)
            .Select(x => (int?)x.Id);

        // PROPERTY CATEGORY
        var propertyCategories = _propertyCategoryRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => new
            {
                x.Id,
                x.PropertyCategoryName
            });

        // ASSESSED STATUS
        var assessedStatusIds = _propertyAssessmentStatusRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.StatusName == PropertyAssessmentStatus.Assessed)
            .Select(x => (int?)x.Id);

        // UNASSESSED STATUS
        var unassessedStatusIds = _propertyAssessmentStatusRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.StatusName == PropertyAssessmentStatus.Unassessed)
            .Select(x => (int?)x.Id);

        // PROPERTY DETAILS / SUBMISSION COMPLETE
        var submissionCompletePropertyIds = _propertyDetailsRepository.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive && x.MarkedForDeletion != true &&
                        (x.CarpetAreaSqMeter ?? 0) > 1 && (x.BuiltupAreaSqMeter ?? 0) > 1)
            .Select(x => (int?)x.PropertyId)
            .Distinct();

        // SURVEY VERIFIED
        var surveyVerifiedPropertyIds =
            (
                from workflow in _propertyWorkflowRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive)
                join visit in _propertySurveyVisitRepository.GetQueryable().AsNoTracking().Where(x => x.IsActive && x.InternalSurveyVerified == true)
                    on workflow.Id equals visit.PropertyWorkflowDetailsId
                select (int?)workflow.PropertyId
            )
            .Distinct();

        // MAIN DASHBOARD SOURCE
        var dashboardSource =
            from property in properties

            join category in propertyCategories
                on property.CategoryId equals category.Id
                into categoryJoin
            from category in categoryJoin.DefaultIfEmpty()

            join assessedStatusId in assessedStatusIds
                on property.PropertyAssessmentStatusId equals assessedStatusId
                into assessedJoin
            from assessedStatusId in assessedJoin.DefaultIfEmpty()

            join unassessedStatusId in unassessedStatusIds
                on property.PropertyAssessmentStatusId equals unassessedStatusId
                into unassessedJoin
            from unassessedStatusId in unassessedJoin.DefaultIfEmpty()

            join amenityPropertyTypeId in amenityPropertyTypeIds
                on property.PropertyTypeId equals amenityPropertyTypeId
                into amenityJoin
            from amenityPropertyTypeId in amenityJoin.DefaultIfEmpty()

            join surveyVerifiedPropertyId in surveyVerifiedPropertyIds
                on (int?)property.Id equals surveyVerifiedPropertyId
                into surveyJoin
            from surveyVerifiedPropertyId in surveyJoin.DefaultIfEmpty()

            join submissionCompletePropertyId in submissionCompletePropertyIds
                on (int?)property.Id equals submissionCompletePropertyId
                into submissionJoin
            from submissionCompletePropertyId in submissionJoin.DefaultIfEmpty()

            select new
            {
                property.Id,
                property.WingDetailId,
                property.PartitionNo,
                CategoryName = category != null ? category.PropertyCategoryName : null,
                IsAssessed = assessedStatusId != null,
                IsUnassessed = unassessedStatusId != null,
                IsAmenity = amenityPropertyTypeId != null,
                IsSurveyVerified = surveyVerifiedPropertyId != null,
                IsSubmissionComplete = submissionCompletePropertyId != null
            };

        // SINGLE AGGREGATION QUERY
        var dashboard = await dashboardSource
            .GroupBy(_ => 1)
            .Select(g => new
            {
                // General
                TotalProperties = g.Count(),
                TotalWings = g.Where(x => x.WingDetailId != null).Select(x => x.WingDetailId).Distinct().Count(),
                Assessed = g.Count(x => x.IsAssessed),
                Unassessed = g.Count(x => x.IsUnassessed),
                TotalAmenities = g.Count(x => x.IsAmenity),

                // Survey
                InternalSurveyVerified = g.Count(x => x.IsSurveyVerified),
                InternalSurveyVerifiedAssessed = g.Count(x => x.IsSurveyVerified && x.IsAssessed),
                InternalSurveyVerifiedUnassessed = g.Count(x => x.IsSurveyVerified && x.IsUnassessed),
                InternalSurveyPendingAssessed = g.Count(x => !x.IsSurveyVerified && x.IsAssessed),
                InternalSurveyPendingUnassessed = g.Count(x => !x.IsSurveyVerified && x.IsUnassessed),

                // Submission
                SubmissionComplete = g.Count(x => x.IsSubmissionComplete),
                SubmissionCompleteAssessed = g.Count(x => x.IsSubmissionComplete && x.IsAssessed),
                SubmissionCompleteUnassessed = g.Count(x => x.IsSubmissionComplete && x.IsUnassessed),
                SubmissionPendingAssessed = g.Count(x => !x.IsSubmissionComplete && x.IsAssessed),
                SubmissionPendingUnassessed = g.Count(x => !x.IsSubmissionComplete && x.IsUnassessed),

                // Industry
                IndustryCount = g.Count(x => x.CategoryName == PropertyCategoryConstants.Industry),
                IndustryMainProperty = g.Count(x => x.CategoryName == PropertyCategoryConstants.Industry && string.IsNullOrEmpty(x.PartitionNo)),
                IndustryPartitionProperty = g.Count(x => x.CategoryName == PropertyCategoryConstants.Industry && !string.IsNullOrEmpty(x.PartitionNo)),
                IndustryAssessed = g.Count(x => x.CategoryName == PropertyCategoryConstants.Industry && x.IsAssessed),
                IndustryUnassessed = g.Count(x => x.CategoryName == PropertyCategoryConstants.Industry && x.IsUnassessed),

                // Apartment
                ApartmentCount = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName)),
                ApartmentMainProperty = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && string.IsNullOrEmpty(x.PartitionNo)),
                ApartmentPartitionProperty = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && !string.IsNullOrEmpty(x.PartitionNo)),
                ApartmentMainPropertyAmenity = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && string.IsNullOrEmpty(x.PartitionNo) && x.IsAmenity),
                ApartmentPartitionPropertyAmenity = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && !string.IsNullOrEmpty(x.PartitionNo) && x.IsAmenity),
                ApartmentAssessed = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && x.IsAssessed),
                ApartmentUnassessed = g.Count(x => PropertyCategoryConstants.ApartmentCategoryNames.Contains(x.CategoryName) && x.IsUnassessed),

                // Plot
                PlotCount = g.Count(x => x.CategoryName == PropertyCategoryConstants.Plot),
                PlotMainProperty = g.Count(x => x.CategoryName == PropertyCategoryConstants.Plot && string.IsNullOrEmpty(x.PartitionNo)),
                PlotPartitionProperty = g.Count(x => x.CategoryName == PropertyCategoryConstants.Plot && !string.IsNullOrEmpty(x.PartitionNo)),
                PlotAssessed = g.Count(x => x.CategoryName == PropertyCategoryConstants.Plot && x.IsAssessed),
                PlotUnassessed = g.Count(x => x.CategoryName == PropertyCategoryConstants.Plot && x.IsUnassessed),

                // Individual
                IndividualCount = g.Count(x => PropertyCategoryConstants.IndividualCategoryNames.Contains(x.CategoryName)),
                IndividualMainProperty = g.Count(x => PropertyCategoryConstants.IndividualCategoryNames.Contains(x.CategoryName) && string.IsNullOrEmpty(x.PartitionNo)),
                IndividualPartitionProperty = g.Count(x => PropertyCategoryConstants.IndividualCategoryNames.Contains(x.CategoryName) && !string.IsNullOrEmpty(x.PartitionNo)),
                IndividualAssessed = g.Count(x => PropertyCategoryConstants.IndividualCategoryNames.Contains(x.CategoryName) && x.IsAssessed),
                IndividualUnassessed = g.Count(x => PropertyCategoryConstants.IndividualCategoryNames.Contains(x.CategoryName) && x.IsUnassessed),

                // Old Property
                TotalOldProperties = oldProperties.Count()
            })
            .SingleOrDefaultAsync(cancellationToken);

        // NO PROPERTY
        if (dashboard == null)
        {
            return new SurveyDashboardResponseDto
            {
                TotalOldProperties = await oldProperties.CountAsync(cancellationToken)
            };
        }

        // DERIVED VALUES

        // General
        var totalProperties = dashboard.TotalProperties;
        var assessed = dashboard.Assessed;
        var unassessed = dashboard.Unassessed;

        // Survey
        var surveyVerified = dashboard.InternalSurveyVerified;
        var surveyVerifiedAssessed = dashboard.InternalSurveyVerifiedAssessed;
        var surveyVerifiedUnassessed = dashboard.InternalSurveyVerifiedUnassessed;

        var surveyPending = totalProperties - surveyVerified;
        var surveyPendingAssessed = dashboard.InternalSurveyPendingAssessed;
        var surveyPendingUnassessed = dashboard.InternalSurveyPendingUnassessed;

        // Submission
        var submissionComplete = dashboard.SubmissionComplete;
        var submissionCompleteAssessed = dashboard.SubmissionCompleteAssessed;
        var submissionCompleteUnassessed = dashboard.SubmissionCompleteUnassessed;

        var submissionPending = totalProperties - submissionComplete;
        var submissionPendingAssessed = dashboard.SubmissionPendingAssessed;
        var submissionPendingUnassessed = dashboard.SubmissionPendingUnassessed;

        // Apartment
        var apartmentAmenity = dashboard.ApartmentMainPropertyAmenity + dashboard.ApartmentPartitionPropertyAmenity;
        var apartmentMainProperty = dashboard.ApartmentMainProperty - dashboard.ApartmentMainPropertyAmenity;
        var apartmentPartitionProperty = dashboard.ApartmentPartitionProperty - dashboard.ApartmentPartitionPropertyAmenity;

        // RESPONSE
        return new SurveyDashboardResponseDto
        {
            // General
            TotalOldProperties = dashboard.TotalOldProperties,
            TotalProperties = totalProperties,
            TotalWings = dashboard.TotalWings,
            Assessed = assessed,
            Unassessed = unassessed,
            TotalAmenities = dashboard.TotalAmenities,

            // Survey
            SurveyVerifiedDetails = new SurveyVerifiedDto
            {
                InternalSurveyVerified = surveyVerified,
                InternalSurveyVerifiedAssessed = surveyVerifiedAssessed,
                InternalSurveyVerifiedUnassessed = surveyVerifiedUnassessed,
                InternalSurveyPending = surveyPending,
                InternalSurveyPendingAssessed = surveyPendingAssessed,
                InternalSurveyPendingUnassessed = surveyPendingUnassessed
            },

            // Submission
            SubmissionDetails = new SubmissionDto
            {
                SubmissionComplete = submissionComplete,
                SubmissionCompleteAssessed = submissionCompleteAssessed,
                SubmissionCompleteUnassessed = submissionCompleteUnassessed,
                SubmissionPending = submissionPending,
                SubmissionPendingAssessed = submissionPendingAssessed,
                SubmissionPendingUnassessed = submissionPendingUnassessed
            },

            // Individual
            IndividualDetails = new IndividualDto
            {
                TotalIndividualProperties = dashboard.IndividualCount,
                IndividualMainProperty = dashboard.IndividualMainProperty,
                IndividualPartitionProperty = dashboard.IndividualPartitionProperty,
                IndividualAssessed = dashboard.IndividualAssessed,
                IndividualUnassessed = dashboard.IndividualUnassessed
            },

            // Apartment
            ApartmentDetails = new ApartmentDto
            {
                TotalApartmentProperties = dashboard.ApartmentCount,
                ApartmentMainProperty = apartmentMainProperty,
                ApartmentPartitionProperty = apartmentPartitionProperty,
                ApartmentAmenity = apartmentAmenity,
                ApartmentAssessed = dashboard.ApartmentAssessed,
                ApartmentUnassessed = dashboard.ApartmentUnassessed
            },

            // Industry
            IndustryDetails = new IndustryDto
            {
                TotalIndustryProperties = dashboard.IndustryCount,
                IndustryMainProperty = dashboard.IndustryMainProperty,
                IndustryPartitionProperty = dashboard.IndustryPartitionProperty,
                IndustryAssessed = dashboard.IndustryAssessed,
                IndustryUnassessed = dashboard.IndustryUnassessed
            },

            // Plot
            PlotDetails = new PlotDto
            {
                TotalPlotProperties = dashboard.PlotCount,
                PlotMainProperty = dashboard.PlotMainProperty,
                PlotPartitionProperty = dashboard.PlotPartitionProperty,
                PlotAssessed = dashboard.PlotAssessed,
                PlotUnassessed = dashboard.PlotUnassessed
            }
        };
    }
}