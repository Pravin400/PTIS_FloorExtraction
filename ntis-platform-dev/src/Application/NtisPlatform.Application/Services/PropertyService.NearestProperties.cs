using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Partial class for GetNearestPropertiesAsync implementation
/// </summary>
public partial class PropertyService
{
    private const double DefaultRadiusKm = 2.0;
    private const double MaxRadiusKm = 50.0;
    private const int DefaultLimit = 10;
    private const int MaxLimit = 100;

    public async Task<List<NearestPropertyDto>> GetNearestPropertiesAsync(
        NearestPropertiesQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        if (parameters == null)
            throw new ArgumentNullException(nameof(parameters));

        if (parameters.Latitude < -90.0 || parameters.Latitude > 90.0)
            throw new ValidationException(nameof(parameters.Latitude), "Latitude must be between -90 and 90 degrees.", OperationType.Create);

        if (parameters.Longitude < -180.0 || parameters.Longitude > 180.0)
            throw new ValidationException(nameof(parameters.Longitude), "Longitude must be between -180 and 180 degrees.", OperationType.Create);

        double surveyorLat = parameters.Latitude;
        double surveyorLon = parameters.Longitude;
        double radiusKm = parameters.RadiusInKm > 0
            ? Math.Min(parameters.RadiusInKm, MaxRadiusKm)
            : DefaultRadiusKm;

        int limit = parameters.Limit > 0
            ? Math.Min(parameters.Limit, MaxLimit)
            : DefaultLimit;

        // 1. Calculate Bounding Box in degrees for SQL-level pre-filtering (1 degree lat ~ 111 km)
        double latDelta = radiusKm / 111.0;
        double minLat = surveyorLat - latDelta;
        double maxLat = surveyorLat + latDelta;

        double cosLat = Math.Cos(surveyorLat * Math.PI / 180.0);
        double lonDelta = cosLat > 0.0001 ? radiusKm / (111.0 * cosLat) : radiusKm / 111.0;
        double minLon = surveyorLon - lonDelta;
        double maxLon = surveyorLon + lonDelta;

        // 2. Base property query with active & non-deleted filters
        var propertiesQuery = _repository.GetQueryable().AsNoTracking()
            .Where(pm => pm.IsActive && !pm.MarkedForDeletion);

        // Optional Ward filtering (by WardId or WardNo)
        if (parameters.WardId.HasValue && parameters.WardId.Value > 0)
        {
            propertiesQuery = propertiesQuery.Where(pm => pm.WardId == parameters.WardId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(parameters.WardNo))
        {
            string wardNoInput = parameters.WardNo.Trim();
            var wardIdQuery = _wardRepository.GetQueryable().AsNoTracking()
                .Where(w => w.IsActive && w.WardNo == wardNoInput)
                .Select(w => w.Id);

            propertiesQuery = propertiesQuery.Where(pm => wardIdQuery.Contains(pm.WardId));
        }

        // Flag filtering (New / Old / All) matching GetProperties behavior
        string flag = !string.IsNullOrWhiteSpace(parameters.Flag)
            ? parameters.Flag.Trim().ToUpperInvariant()
            : "ALL";

        if (flag != "NEW" && flag != "OLD" && flag != "ALL")
            throw new ValidationException(nameof(parameters.Flag), "Flag must be one of: New, Old, All.", OperationType.Create);

        var mapDetailsQuery = _propertyMapDetailRepository.GetQueryable().AsNoTracking();
        var propertyTypesQuery = _propertyTypeRepository.GetQueryable().AsNoTracking();

        if (flag == "NEW")
        {
            propertiesQuery = propertiesQuery.Where(pm => !mapDetailsQuery.Any(pmd =>
                pmd.PropertyIdNew == pm.Id && pmd.Status == "Active" && pmd.IsActive));
        }
        else if (flag == "OLD")
        {
            propertiesQuery = propertiesQuery.Where(pm => mapDetailsQuery.Any(pmd =>
                pmd.PropertyIdNew == pm.Id && pmd.Status == "Active" && pmd.IsActive));
        }

        // 3. Assessment query: filter active records with coordinates and select latest row per PropertyId
        var latestAssessmentIds = _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(pmd => pmd.IsActive
                          && !pmd.MarkedForDeletion
                          && pmd.Latitude != null && pmd.Latitude != ""
                          && pmd.Longitude != null && pmd.Longitude != "")
            .GroupBy(pmd => pmd.PropertyId)
            .Select(g => g.Max(pmd => pmd.Id));

        var assessmentQuery = _assessmentRepository.GetQueryable().AsNoTracking()
            .Where(pmd => latestAssessmentIds.Contains(pmd.Id));

        var coordsQuery = from pm in propertiesQuery
                          join pmd in assessmentQuery on pm.Id equals pmd.PropertyId
                          select new 
                          {
                              PropertyId = pm.Id,
                              RawLatitude = pmd.Latitude,
                              RawLongitude = pmd.Longitude
                          };

        var allCoords = await coordsQuery.ToListAsync(cancellationToken);

        // 5. Calculate precise geodesic distance on the bounded set and return Top N
        var nearestListIds = new List<(int PropertyId, double DistanceInKm, string RawLatitude, string RawLongitude)>(allCoords.Count);

        foreach (var p in allCoords)
        {
            if (!double.TryParse(p.RawLatitude, NumberStyles.Float, CultureInfo.InvariantCulture, out double propLat) ||
                !double.TryParse(p.RawLongitude, NumberStyles.Float, CultureInfo.InvariantCulture, out double propLon))
            {
                continue;
            }

            // Exclude properties outside the bounding box
            if (propLat < minLat || propLat > maxLat || propLon < minLon || propLon > maxLon)
            {
                continue;
            }

            double distKm = CalculateHaversineDistanceInKm(surveyorLat, surveyorLon, propLat, propLon);

            if (distKm <= radiusKm)
            {
                nearestListIds.Add((p.PropertyId, distKm, p.RawLatitude!, p.RawLongitude!));
            }
        }

        var topNearestIds = nearestListIds
            .OrderBy(x => x.DistanceInKm)
            .Take(limit)
            .ToList();

        if (topNearestIds.Count == 0)
        {
            return new List<NearestPropertyDto>();
        }

        var topIds = topNearestIds.Select(x => x.PropertyId).ToList();

        var wardsQuery = _wardRepository.GetQueryable().AsNoTracking().Where(w => w.IsActive);

        // 6. LINQ Join and projection executed directly in SQL Server ONLY for Top N properties
        var candidateQuery = from pm in propertiesQuery.Where(p => topIds.Contains(p.Id))
                             join pmd in assessmentQuery on pm.Id equals pmd.PropertyId
                             join w in wardsQuery on pm.WardId equals w.Id into wardJoin
                             from w in wardJoin.DefaultIfEmpty()
                             join pt in propertyTypesQuery on pm.PropertyTypeId equals pt.Id into ptJoin
                             from pt in ptJoin.DefaultIfEmpty()
                             let mapCount = mapDetailsQuery.Count(pmd =>
                                 pmd.PropertyIdNew == pm.Id && pmd.Status == "Active" && pmd.IsActive)
                             select new
                             {
                                 PropertyId = pm.Id,
                                 WardId = pm.WardId,
                                 WardNo = w != null ? w.WardNo : null,
                                 PropertyNo = pm.PropertyNo,
                                 PartitionNo = pm.PartitionNo,
                                 PropertyTypeId = pm.PropertyTypeId,
                                 UPICId = pm.UPICId,
                                 CSN = pm.CSN,
                                 SubZoneNo = pm.SubZoneNo,
                                 PlotNo = pm.PlotNo,
                                 CategoryId = pm.CategoryId,
                                 Type = pm.Type ?? (pt != null ? pt.Type : null),
                                 PartType = pt != null ? pt.PartType : null,
                                 OwnerTitle = pm.OwnerTitle,
                                 OwnerName = pm.OwnerName,
                                 OwnerTitleEnglish = pm.OwnerTitleEnglish,
                                 OwnerNameEnglish = pm.OwnerNameEnglish,
                                 OccupierTitle = pm.OccupierTitle,
                                 OccupierName = pm.OccupierName,
                                 OccupierTitleEnglish = pm.OccupierTitleEnglish,
                                 OccupierNameEnglish = pm.OccupierNameEnglish,
                                 Address = pm.Address,
                                 Location = pm.Location,
                                 AddressEnglish = pm.AddressEnglish,
                                 LocationEnglish = pm.LocationEnglish,
                                 MobileNo = pm.MobileNo,
                                 IsMerged = mapCount > 0,
                                 MapCount = mapCount
                             };

        // Executes SQL Server query and retrieves candidate properties
        var candidateList = await candidateQuery.ToListAsync(cancellationToken);

        var nearestList = new List<NearestPropertyDto>(candidateList.Count);
        var distanceDict = topNearestIds.ToDictionary(x => x.PropertyId, x => new { x.DistanceInKm, x.RawLatitude, x.RawLongitude });

        foreach (var p in candidateList)
        {
            if (distanceDict.TryGetValue(p.PropertyId, out var distInfo))
            {
                nearestList.Add(new NearestPropertyDto
                {
                    PropertyId = p.PropertyId,
                    WardId = p.WardId,
                    WardNo = p.WardNo,
                    PropertyNo = p.PropertyNo,
                    PartitionNo = p.PartitionNo,
                    PropertyTypeId = p.PropertyTypeId,
                    UPICId = p.UPICId,
                    CSN = p.CSN,
                    SubZoneNo = p.SubZoneNo,
                    PlotNo = p.PlotNo,
                    CategoryId = p.CategoryId,
                    Type = p.Type,
                    PartType = p.PartType,
                    OwnerTitle = p.OwnerTitle,
                    OwnerName = p.OwnerName,
                    OwnerTitleEnglish = p.OwnerTitleEnglish,
                    OwnerNameEnglish = p.OwnerNameEnglish,
                    OccupierTitle = p.OccupierTitle,
                    OccupierName = p.OccupierName,
                    OccupierTitleEnglish = p.OccupierTitleEnglish,
                    OccupierNameEnglish = p.OccupierNameEnglish,
                    Address = p.Address,
                    Location = p.Location,
                    AddressEnglish = p.AddressEnglish,
                    LocationEnglish = p.LocationEnglish,
                    MobileNo = p.MobileNo,
                    IsMerged = p.IsMerged,
                    MapCount = p.MapCount,
                    Latitude = decimal.TryParse(distInfo.RawLatitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var decLat) ? decLat : null,
                    Longitude = decimal.TryParse(distInfo.RawLongitude, NumberStyles.Float, CultureInfo.InvariantCulture, out var decLon) ? decLon : null,
                    DistanceInKm = Math.Round(distInfo.DistanceInKm, 3),
                    DistanceInMeters = Math.Round(distInfo.DistanceInKm * 1000.0, 2)
                });
            }
        }

        var topNearest = nearestList
            .OrderBy(x => x.DistanceInMeters)
            .ToList();



        // 6. Enrich top nearest properties with Visits and Photo details (matching GetProperties behavior)
        if (topNearest.Count > 0)
        {
            var propertyIds = topNearest.Select(x => x.PropertyId).Distinct().ToList();

            var workflowRepo = _workflowDetailsRepository ?? _serviceProvider?.GetService<IPropertyWorkflowDetailsRepository>() ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowDetailsEntity, int>>() as IPropertyWorkflowDetailsRepository;
            var surveyVisitRepo = _propertySurveyVisitRepository ?? _serviceProvider?.GetService<IRepository<PropertySurveyVisitEntity, int>>();
            var stageRepo = _workflowStageRepository ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowStageMasterEntity, int>>();
            var photoRepo = _propertyPhotoRepository ?? _serviceProvider?.GetService<IRepository<PropertyPhotoEntity, int>>();
            var bindingRepo = _documentBindingRepository ?? _serviceProvider?.GetService<IRepository<DocumentBindingEntity, int>>();
            var docRepo = _documentRepository ?? _serviceProvider?.GetService<IRepository<DocumentEntity, int>>();
            var usersQuery = _userRepository.GetQueryable().AsNoTracking();

            var workflowByPropertyId = new Dictionary<int, List<PropertyLatestVisitDto>>();
            if (workflowRepo != null && stageRepo != null)
            {
                var workflowQuery = workflowRepo.GetQueryable().AsNoTracking();
                var stagesQuery = stageRepo.GetQueryable().AsNoTracking();
                var surveyVisitQuery = surveyVisitRepo?.GetQueryable().AsNoTracking();

                if (surveyVisitQuery != null)
                {
                    var workflowRawQuery = from pwd in workflowQuery
                                           where propertyIds.Contains(pwd.PropertyId) && pwd.IsActive
                                           join psv in surveyVisitQuery.Where(v => v.IsActive) on pwd.Id equals psv.PropertyWorkflowDetailsId into visitJoin
                                           from psv in visitJoin.DefaultIfEmpty()
                                           join s in stagesQuery on pwd.WorkflowStageId equals s.Id
                                           where s.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.GeoSequencing ||
                                                 s.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.InternalSurvey
                                           join u in usersQuery on (psv != null ? psv.CreatedBy : pwd.CreatedBy) equals u.Id into userJoin
                                           from u in userJoin.DefaultIfEmpty()
                                           orderby pwd.CreatedDate descending, pwd.Id descending
                                           select new
                                           {
                                               PropertyId = pwd.PropertyId,
                                               WorkflowDetailsId = pwd.Id,
                                               WorkflowStageId = pwd.WorkflowStageId,
                                               StageName = s != null ? s.StageName : null,
                                               StageDescription = s != null ? s.Description : null,
                                               WorkflowCreatedDate = pwd.CreatedDate,
                                               WorkflowCreatedBy = pwd.CreatedBy,
                                               VisitId = (int?)(psv != null ? psv.Id : (int?)null),
                                               VisitDate = (DateTime?)(psv != null ? psv.CreatedDate : (DateTime?)null),
                                               InternalSurveyVerified = psv != null ? psv.InternalSurveyVerified : null,
                                               RemarkId = psv != null ? psv.RemarkId : null,
                                               RemarkText = psv != null ? psv.RemarkText : null,
                                               Latitude = psv != null ? psv.Latitude : null,
                                               Longitude = psv != null ? psv.Longitude : null,
                                               Location = psv != null ? psv.Location : null,
                                               UserId = (int?)(u != null ? u.Id : (psv != null ? psv.CreatedBy : pwd.CreatedBy)),
                                               UserName = u != null ? u.UserName : null,
                                               FirstName = u != null ? u.FirstName : null,
                                               MiddleName = u != null ? u.MiddleName : null,
                                               LastName = u != null ? u.LastName : null
                                           };

                    var workflowList = await workflowRawQuery.ToListAsync(cancellationToken);
                    workflowByPropertyId = workflowList
                        .GroupBy(w => w.PropertyId)
                        .ToDictionary(g => g.Key, g => g.Select(entry => 
                        {
                            var userParts = new[] { entry.FirstName, entry.MiddleName, entry.LastName }
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s!.Trim());
                            var combinedUserName = string.Join(" ", userParts);
                            var userFullName = !string.IsNullOrWhiteSpace(combinedUserName)
                                ? combinedUserName
                                : (!string.IsNullOrWhiteSpace(entry.UserName) ? entry.UserName : (entry.UserId?.ToString() ?? entry.WorkflowCreatedBy.ToString()));

                            var stageStatus = entry.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.InternalSurvey ? "Visited" : (entry.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.GeoSequencing ? "Completed" : "Unknown");

                            return new PropertyLatestVisitDto
                            {
                                VisitId = entry.VisitId ?? entry.WorkflowDetailsId,
                                PropertyWorkflowDetailsId = entry.WorkflowDetailsId,
                                Status = stageStatus,
                                InternalSurveyVerified = entry.InternalSurveyVerified,
                                RemarkId = entry.RemarkId,
                                RemarkText = entry.RemarkText,
                                Latitude = entry.Latitude,
                                Longitude = entry.Longitude,
                                Location = entry.Location,
                                VisitDate = entry.VisitDate ?? entry.WorkflowCreatedDate,
                                WorkflowStageId = entry.WorkflowStageId,
                                WorkflowStageName = entry.StageName,
                                WorkflowStageDescription = entry.StageDescription,
                                VisitedByUserId = entry.UserId,
                                VisitedByUserName = entry.UserName,
                                VisitedByFullName = userFullName
                            };
                        }).ToList());
                }
                else
                {
                    var workflowRawQuery = from pwd in workflowQuery
                                           where propertyIds.Contains(pwd.PropertyId) && pwd.IsActive
                                           join s in stagesQuery on pwd.WorkflowStageId equals s.Id
                                           where s.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.GeoSequencing ||
                                                 s.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.InternalSurvey
                                           join u in usersQuery on pwd.CreatedBy equals u.Id into userJoin
                                           from u in userJoin.DefaultIfEmpty()
                                           orderby pwd.CreatedDate descending, pwd.Id descending
                                           select new
                                           {
                                               PropertyId = pwd.PropertyId,
                                               WorkflowDetailsId = pwd.Id,
                                               WorkflowStageId = pwd.WorkflowStageId,
                                               StageName = s != null ? s.StageName : null,
                                               StageDescription = s != null ? s.Description : null,
                                               WorkflowCreatedDate = pwd.CreatedDate,
                                               WorkflowCreatedBy = pwd.CreatedBy,
                                               VisitId = (int?)null,
                                               VisitDate = (DateTime?)null,
                                               InternalSurveyVerified = (bool?)null,
                                               RemarkId = (int?)null,
                                               RemarkText = (string?)null,
                                               Latitude = (decimal?)null,
                                               Longitude = (decimal?)null,
                                               Location = (string?)null,
                                               UserId = (int?)(u != null ? u.Id : pwd.CreatedBy),
                                               UserName = u != null ? u.UserName : null,
                                               FirstName = u != null ? u.FirstName : null,
                                               MiddleName = u != null ? u.MiddleName : null,
                                               LastName = u != null ? u.LastName : null
                                           };

                    var workflowList = await workflowRawQuery.ToListAsync(cancellationToken);
                    workflowByPropertyId = workflowList
                        .GroupBy(w => w.PropertyId)
                        .ToDictionary(g => g.Key, g => g.Select(entry => 
                        {
                            var userParts = new[] { entry.FirstName, entry.MiddleName, entry.LastName }
                                .Where(s => !string.IsNullOrWhiteSpace(s))
                                .Select(s => s!.Trim());
                            var combinedUserName = string.Join(" ", userParts);
                            var userFullName = !string.IsNullOrWhiteSpace(combinedUserName)
                                ? combinedUserName
                                : (!string.IsNullOrWhiteSpace(entry.UserName) ? entry.UserName : (entry.UserId?.ToString() ?? entry.WorkflowCreatedBy.ToString()));

                            var stageStatus = entry.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.InternalSurvey ? "Visited" : (entry.StageName == NtisPlatform.Core.Constants.WorkflowStageConstants.GeoSequencing ? "Completed" : "Unknown");

                            return new PropertyLatestVisitDto
                            {
                                VisitId = entry.VisitId ?? entry.WorkflowDetailsId,
                                PropertyWorkflowDetailsId = entry.WorkflowDetailsId,
                                Status = stageStatus,
                                InternalSurveyVerified = entry.InternalSurveyVerified,
                                RemarkId = entry.RemarkId,
                                RemarkText = entry.RemarkText,
                                Latitude = entry.Latitude,
                                Longitude = entry.Longitude,
                                Location = entry.Location,
                                VisitDate = entry.VisitDate ?? entry.WorkflowCreatedDate,
                                WorkflowStageId = entry.WorkflowStageId,
                                WorkflowStageName = entry.StageName,
                                WorkflowStageDescription = entry.StageDescription,
                                VisitedByUserId = entry.UserId,
                                VisitedByUserName = entry.UserName,
                                VisitedByFullName = userFullName
                            };
                        }).ToList());
                }
            }

            // Bulk Query 2: Representative/Latest Property Photo per Property
            var photoByPropertyId = new Dictionary<int, PropertyPhotoSummaryDto>();
            if (photoRepo != null && bindingRepo != null && docRepo != null)
            {
                var photoQuery = photoRepo.GetQueryable().AsNoTracking();
                var bindingQuery = bindingRepo.GetQueryable().AsNoTracking();
                var docQuery = docRepo.GetQueryable().AsNoTracking();

                var photosRawQuery = from pp in photoQuery
                                     where pp.PropertyId.HasValue && propertyIds.Contains(pp.PropertyId.Value)
                                           && pp.EntityType == "P" && pp.IsActive && pp.IsLatest && !pp.MarkedForDeletion
                                     join b in bindingQuery.Where(x => x.IsActive && !x.MarkedForDeletion) on pp.DocumentBindingId equals b.Id into bindingJoin
                                     from b in bindingJoin.DefaultIfEmpty()
                                     join d in docQuery.Where(x => x.IsActive && !x.MarkedForDeletion) on b.DocumentId equals d.Id into docJoin
                                     from d in docJoin.DefaultIfEmpty()
                                     orderby pp.DisplayOrder, pp.Id descending
                                     select new
                                     {
                                         PropertyId = pp.PropertyId!.Value,
                                         PropertyPhotoId = pp.Id,
                                         PhotoTypeId = pp.PhotoTypeId,
                                         DocumentBindingId = pp.DocumentBindingId,
                                         DocumentId = (int?)(d != null ? d.Id : (int?)null),
                                         DocumentGuid = (Guid?)(d != null ? d.DocumentGuid : (Guid?)null),
                                         FileName = d != null ? d.FileName : null,
                                         OriginalFileName = d != null ? d.OriginalFileName : null,
                                         MimeType = d != null ? d.MimeType : null
                                     };

                var photosList = await photosRawQuery.ToListAsync(cancellationToken);
                photoByPropertyId = photosList
                    .GroupBy(p => p.PropertyId)
                    .ToDictionary(g => g.Key, g => 
                    {
                        var firstPhoto = g.First();
                        return new PropertyPhotoSummaryDto
                        {
                            PropertyPhotoId = firstPhoto.PropertyPhotoId,
                            PhotoTypeId = firstPhoto.PhotoTypeId,
                            DocumentBindingId = firstPhoto.DocumentBindingId,
                            DocumentId = firstPhoto.DocumentId,
                            DocumentGuid = firstPhoto.DocumentGuid,
                            FileName = firstPhoto.FileName,
                            OriginalFileName = firstPhoto.OriginalFileName,
                            MimeType = firstPhoto.MimeType,
                            PhotoUrl = firstPhoto.DocumentGuid.HasValue 
                                ? $"/api/document/download/{firstPhoto.DocumentGuid.Value}" 
                                : null
                        };
                    });
            }

            // Enrich each nearest property item
            foreach (var item in topNearest)
            {
                if (workflowByPropertyId.TryGetValue(item.PropertyId, out var stageEntries))
                {
                    item.Visits = stageEntries;
                    item.IsVisited = stageEntries.Any(e => e.VisitId > 0);
                    item.LatestVisit = item.Visits.FirstOrDefault();
                }
                else
                {
                    item.IsVisited = false;
                    item.LatestVisit = null;
                }

                if (photoByPropertyId.TryGetValue(item.PropertyId, out var p))
                {
                    item.Photo = p;
                }
                else
                {
                    item.Photo = null;
                }
            }
        }

        return topNearest;
    }

    private static double CalculateHaversineDistanceInKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadius = 6371.0;
        double dLat = (lat2 - lat1) * (Math.PI / 180.0);
        double dLon = (lon2 - lon1) * (Math.PI / 180.0);

        double radLat1 = lat1 * (Math.PI / 180.0);
        double radLat2 = lat2 * (Math.PI / 180.0);

        double a = Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
                   Math.Cos(radLat1) * Math.Cos(radLat2) *
                   Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);

        double c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
        return EarthRadius * c;
    }
}
