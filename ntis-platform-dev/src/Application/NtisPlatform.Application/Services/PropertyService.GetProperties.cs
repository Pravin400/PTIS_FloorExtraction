using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NtisPlatform.Application.DTOs.Property;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Models;
using NtisPlatform.Application.Utilities;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Core.Models;

namespace NtisPlatform.Application.Services;

/// <summary>
/// Partial class for GetPropertiesAsync implementation
/// </summary>
public partial class PropertyService
{
    public async Task<PagedResult<GetPropertiesItemDto>> GetPropertiesAsync(
        GetPropertiesQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        if (queryParameters == null)
            throw new ArgumentNullException(nameof(queryParameters));

        if (string.IsNullOrWhiteSpace(queryParameters.WardNo))
            throw new ValidationException(nameof(queryParameters.WardNo), "WardNo is required.", OperationType.Create);

        if (queryParameters.UserId <= 0)
            throw new ValidationException(nameof(queryParameters.UserId), "UserId is required and must be greater than 0.", OperationType.Create);

        if (string.IsNullOrWhiteSpace(queryParameters.Flag))
            throw new ValidationException(nameof(queryParameters.Flag), "Flag is required.", OperationType.Create);

        string flag = queryParameters.Flag.Trim().ToUpperInvariant();
        if (flag != "NEW" && flag != "OLD" && flag != "ALL")
            throw new ValidationException(nameof(queryParameters.Flag), "Flag must be one of: New, Old, All.", OperationType.Create);

        string wardNoInput = queryParameters.WardNo.Trim();
        bool isNumericWardId = int.TryParse(wardNoInput, out var wardIdInput);
        string? fromStr = string.IsNullOrWhiteSpace(queryParameters.FromPropertyNo) ? null : queryParameters.FromPropertyNo.Trim();
        string? toStr = string.IsNullOrWhiteSpace(queryParameters.ToPropertyNo) ? null : queryParameters.ToPropertyNo.Trim();
        string? partitionNo = string.IsNullOrWhiteSpace(queryParameters.PartitionNo) ? null : queryParameters.PartitionNo.Trim();
        int userId = queryParameters.UserId;

        // Step 1: Look up Ward from PTIS.WardMaster by WardNo or Id
        var wardEntity = await _wardRepository.GetQueryable()
            .AsNoTracking()
            .Where(w => w.IsActive && (w.WardNo == wardNoInput || (isNumericWardId && w.Id == wardIdInput)))
            .FirstOrDefaultAsync(cancellationToken);

        int targetWardId = wardEntity?.Id ?? (isNumericWardId ? wardIdInput : 0);
        string targetWardNo = wardEntity?.WardNo ?? wardNoInput;

        // Step 2: Base query from PTIS.PropertyMast filtered by WardId
        var propertiesQuery = _repository.GetQueryable()
            .AsNoTracking()
            .Where(pm => pm.IsActive && !pm.MarkedForDeletion && pm.WardId == targetWardId);

        if (queryParameters.Apartment)
        {
            var societyQuery = _societyRepository.GetQueryable().AsNoTracking().Where(sd => sd.IsActive && !sd.MarkedForDeletion);

            // Main Society: no PartitionNo in PropertyMast and has PropertyId in SocietyDetailsMast
            propertiesQuery = propertiesQuery.Where(pm =>
                (pm.PartitionNo == null || pm.PartitionNo == "") &&
                societyQuery.Any(sd => sd.PropertyId == pm.Id));
        }
        else
        {
            // Excluding Apartment properties where CategoryId = 1
            propertiesQuery = propertiesQuery.Where(pm => pm.CategoryId != 1);
        }

        // Step 3: PropertyNo range filtering (supports numeric and alphanumeric ranges)
        bool hasFrom = !string.IsNullOrWhiteSpace(fromStr);
        bool hasTo = !string.IsNullOrWhiteSpace(toStr);

        if (hasFrom && hasTo)
        {
            if (fromStr!.Equals(toStr, StringComparison.OrdinalIgnoreCase))
            {
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo == fromStr);
            }
            else if (long.TryParse(fromStr, out long fromNum) && long.TryParse(toStr, out long toNum))
            {
                // When both FromPropertyNo and ToPropertyNo are numeric, perform EF Core-translatable length & string comparison
                // so string values like "15" or "16" are not incorrectly included between "1" and "5".
                int minLen = fromStr.Length;
                int maxLen = toStr!.Length;

                if (minLen == maxLen)
                {
                    propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null &&
                        pm.PropertyNo.Length == minLen &&
                        string.Compare(pm.PropertyNo, fromStr) >= 0 &&
                        string.Compare(pm.PropertyNo, toStr) <= 0);
                }
                else
                {
                    propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null &&
                        (
                            (pm.PropertyNo.Length == minLen && string.Compare(pm.PropertyNo, fromStr) >= 0) ||
                            (pm.PropertyNo.Length > minLen && pm.PropertyNo.Length < maxLen) ||
                            (pm.PropertyNo.Length == maxLen && string.Compare(pm.PropertyNo, toStr) <= 0)
                        ));
                }
            }
            else
            {
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null &&
                    string.Compare(pm.PropertyNo, fromStr) >= 0 &&
                    string.Compare(pm.PropertyNo, toStr) <= 0);
            }
        }
        else if (hasFrom)
        {
            if (long.TryParse(fromStr, out _))
            {
                int minLen = fromStr!.Length;
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null &&
                    (pm.PropertyNo.Length > minLen || (pm.PropertyNo.Length == minLen && string.Compare(pm.PropertyNo, fromStr) >= 0)));
            }
            else
            {
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null && string.Compare(pm.PropertyNo, fromStr) >= 0);
            }
        }
        else if (hasTo)
        {
            if (long.TryParse(toStr, out _))
            {
                int maxLen = toStr!.Length;
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null &&
                    (pm.PropertyNo.Length < maxLen || (pm.PropertyNo.Length == maxLen && string.Compare(pm.PropertyNo, toStr) <= 0)));
            }
            else
            {
                propertiesQuery = propertiesQuery.Where(pm => pm.PropertyNo != null && string.Compare(pm.PropertyNo, toStr) <= 0);
            }
        }

        // Step 4: Optional PartitionNo filtering
        if (!string.IsNullOrWhiteSpace(partitionNo) && partitionNo != "0")
        {
            propertiesQuery = propertiesQuery.Where(pm => pm.PartitionNo == partitionNo);
        }

        // Step 5: Optional SearchText / SearchTerm filtering
        string? search = !string.IsNullOrWhiteSpace(queryParameters.SearchText)
            ? queryParameters.SearchText.Trim()
            : (!string.IsNullOrWhiteSpace(queryParameters.SearchTerm) ? queryParameters.SearchTerm.Trim() : null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            propertiesQuery = propertiesQuery.Where(pm =>
                (pm.PropertyNo != null && pm.PropertyNo.Contains(search)) ||
                (pm.PartitionNo != null && pm.PartitionNo.Contains(search)) ||
                (pm.OwnerName != null && pm.OwnerName.Contains(search)) ||
                (pm.OwnerNameEnglish != null && pm.OwnerNameEnglish.Contains(search)) ||
                (pm.OccupierName != null && pm.OccupierName.Contains(search)) ||
                (pm.OccupierNameEnglish != null && pm.OccupierNameEnglish.Contains(search)) ||
                (pm.Address != null && pm.Address.Contains(search)) ||
                (pm.AddressEnglish != null && pm.AddressEnglish.Contains(search)) ||
                (pm.Location != null && pm.Location.Contains(search)) ||
                (pm.LocationEnglish != null && pm.LocationEnglish.Contains(search)) ||
                (pm.UPICId != null && pm.UPICId.Contains(search)) ||
                (pm.CSN != null && pm.CSN.Contains(search)) ||
                (pm.PlotNo != null && pm.PlotNo.Contains(search)));
        }

        var mapDetailsQuery = _propertyMapDetailRepository.GetQueryable().AsNoTracking();
        var usersQuery = _userRepository.GetQueryable().AsNoTracking();
        var propertyTypesQuery = _propertyTypeRepository.GetQueryable().AsNoTracking();

        // Step 6: Flag filtering (New / Old / All)
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

        // Step 7: Projection with UserMaster join, PropertyTypeMaster join, and MapCount/IsMerged
        var query = from pm in propertiesQuery
                    join u in usersQuery on pm.CreatedBy equals u.Id into userJoin
                    from u in userJoin.DefaultIfEmpty()
                    join pt in propertyTypesQuery on pm.PropertyTypeId equals pt.Id into ptJoin
                    from pt in ptJoin.DefaultIfEmpty()
                    let mapCount = mapDetailsQuery.Count(pmd =>
                        pmd.PropertyIdNew == pm.Id && pmd.Status == "Active" && pmd.IsActive)
                    orderby pm.Id
                    select new GetPropertiesItemDto
                    {
                        PropertyId = pm.Id,
                        WardId = pm.WardId,
                        WardNo = targetWardNo,
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
                        Latitude = null,
                        Longitude = null,
                        IsMerged = mapCount > 0,
                        MapCount = mapCount,
                        CreatedBy = u != null ? u.UserName : (pm.CreatedBy != null ? pm.CreatedBy.ToString() : null),
                        MobileNo = pm.MobileNo
                    };

        var totalCount = await query.CountAsync(cancellationToken);

        var (pageNumber, pageSize, skip, take) = PaginationHelper.Calculate(
            queryParameters.PageNumber,
            queryParameters.PageSize,
            totalCount);

        var items = totalCount == 0
            ? new List<GetPropertiesItemDto>()
            : (queryParameters.PageSize == -1
                ? await query.ToListAsync(cancellationToken)
                : await query.Skip(skip).Take(take).ToListAsync(cancellationToken));

        if (items.Count > 0)
        {
            var propertyIds = items.Select(x => x.PropertyId).Distinct().ToList();

            var workflowRepo = _workflowDetailsRepository ?? _serviceProvider?.GetService<IPropertyWorkflowDetailsRepository>() ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowDetailsEntity, int>>() as IPropertyWorkflowDetailsRepository;
            var surveyVisitRepo = _propertySurveyVisitRepository ?? _serviceProvider?.GetService<IRepository<PropertySurveyVisitEntity, int>>();
            var stageRepo = _workflowStageRepository ?? _serviceProvider?.GetService<IRepository<PropertyWorkflowStageMasterEntity, int>>();
            var photoRepo = _propertyPhotoRepository ?? _serviceProvider?.GetService<IRepository<PropertyPhotoEntity, int>>();
            var bindingRepo = _documentBindingRepository ?? _serviceProvider?.GetService<IRepository<DocumentBindingEntity, int>>();
            var docRepo = _documentRepository ?? _serviceProvider?.GetService<IRepository<DocumentEntity, int>>();

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
                                           where (psv != null ? psv.CreatedBy : pwd.CreatedBy) == queryParameters.UserId
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
                                           where pwd.CreatedBy == queryParameters.UserId
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

            // Bulk Query 3: Latitude and Longitude from PTIS.PropertyMastDetails (Latest Active)
            var assessmentQuery = _assessmentRepository.GetQueryable().AsNoTracking();
            var assessmentRawQuery = from a in assessmentQuery
                                     where propertyIds.Contains(a.PropertyId) && a.IsActive && !a.MarkedForDeletion
                                     orderby a.Id descending
                                     select new
                                     {
                                         a.Id,
                                         a.PropertyId,
                                         a.Latitude,
                                         a.Longitude
                                     };

            var assessmentList = await assessmentRawQuery.ToListAsync(cancellationToken);
            var assessmentByPropertyId = assessmentList
                .GroupBy(a => a.PropertyId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.Id).First());

            // In-memory enrichment
            foreach (var item in items)
            {
                // Set Property coordinates from PropertyMastDetails
                if (assessmentByPropertyId.TryGetValue(item.PropertyId, out var assess))
                {
                    if (!string.IsNullOrWhiteSpace(assess.Latitude) && decimal.TryParse(assess.Latitude.Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lat))
                    {
                        item.Latitude = lat;
                    }
                    if (!string.IsNullOrWhiteSpace(assess.Longitude) && decimal.TryParse(assess.Longitude.Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                    {
                        item.Longitude = lon;
                    }
                }

                if (workflowByPropertyId.TryGetValue(item.PropertyId, out var stageEntries))
                {
                    item.Visits = stageEntries;

                    // Check if ANY active record exists in GSMS.PropertySurveyVisit
                    item.IsVisited = stageEntries.Any(e => e.VisitId > 0);

                    // Latest Visit is the most recent visit / workflow stage
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

        return new PagedResult<GetPropertiesItemDto>(items, totalCount, pageNumber, pageSize);
    }
}
