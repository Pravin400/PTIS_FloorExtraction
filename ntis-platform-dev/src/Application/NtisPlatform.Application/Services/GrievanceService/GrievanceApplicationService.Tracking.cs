using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.Common;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Services.GrievanceService;

public partial class GrievanceApplicationService
{
    public async Task<GrievancePublicDetailsDto?> GetPublicDetailsByGrievanceNoAsync(
        string grievanceNo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(grievanceNo))
            return null;

        var normalizedNo = grievanceNo.Trim();
        var queryable = ApplyIncludes(_repository.GetQueryable());

        var entity = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.GrievanceNo == normalizedNo, cancellationToken)
            : queryable.AsNoTracking().FirstOrDefault(x => x.IsActive && x.GrievanceNo == normalizedNo);

        if (entity == null)
            return null;

        return await BuildPublicDetailsDtoAsync(entity, cancellationToken);
    }

    public async Task<GrievancePublicDetailsDto?> GetPublicDetailsByIdAsync(
        int id, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return null;

        var queryable = ApplyIncludes(_repository.GetQueryable());

        var entity = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.Id == id, cancellationToken)
            : queryable.AsNoTracking().FirstOrDefault(x => x.IsActive && x.Id == id);

        if (entity == null)
            return null;

        return await BuildPublicDetailsDtoAsync(entity, cancellationToken);
    }

    public async Task<List<GrievancePublicDetailsDto>> GetAllPublicDetailsAsync(CancellationToken cancellationToken = default)
    {
        var queryable = ApplyIncludes(_repository.GetQueryable());

        var entities = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.Id).ToListAsync(cancellationToken)
            : queryable.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.Id).ToList();

        if (entities.Count == 0)
            return new List<GrievancePublicDetailsDto>();

        var grievanceIds = entities.Select(e => e.Id).ToList();

        // 1. Fetch activity logs in batch
        var logQuery = _activityLogRepository.GetQueryable()
            .Include(l => l.FromState)
            .Include(l => l.ToState)
            .Include(l => l.ActionByUser)
            .Include(l => l.AssignedToUser)
            .Include(l => l.DeptForwardings)
                .ThenInclude(df => df.ForwardedToDept);

        var logs = logQuery.Provider is IAsyncQueryProvider
            ? await logQuery.AsNoTracking()
                .Where(l => grievanceIds.Contains(l.GrievanceApplicationId))
                .OrderBy(l => l.ActionAt)
                .ToListAsync(cancellationToken)
            : logQuery.AsNoTracking()
                .Where(l => grievanceIds.Contains(l.GrievanceApplicationId))
                .OrderBy(l => l.ActionAt)
                .ToList();

        var logsByGrievanceId = logs.GroupBy(l => l.GrievanceApplicationId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 2. Fetch photos in batch
        var photosByGrievanceId = new Dictionary<int, List<GrievancePublicPhotoDto>>();
        if (_photoRepository != null)
        {
            var photoQuery = _photoRepository.GetQueryable();
            var photoEntities = photoQuery.Provider is IAsyncQueryProvider
                ? await photoQuery.AsNoTracking()
                    .Include(p => p.PhotoType)
                    .Include(p => p.DocumentBinding)
                        .ThenInclude(b => b!.Document)
                    .Where(p => grievanceIds.Contains(p.GrievanceApplicationId) && p.IsActive && !p.MarkedForDeletion)
                    .OrderByDescending(p => p.IsLatest)
                    .ThenByDescending(p => p.Id)
                    .ToListAsync(cancellationToken)
                : photoQuery.AsNoTracking()
                    .Include(p => p.PhotoType)
                    .Include(p => p.DocumentBinding)
                        .ThenInclude(b => b!.Document)
                    .Where(p => grievanceIds.Contains(p.GrievanceApplicationId) && p.IsActive && !p.MarkedForDeletion)
                    .OrderByDescending(p => p.IsLatest)
                    .ThenByDescending(p => p.Id)
                    .ToList();

            photosByGrievanceId = photoEntities
                .GroupBy(p => p.GrievanceApplicationId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(p => new GrievancePublicPhotoDto
                    {
                        Id = p.Id,
                        GrievanceApplicationId = p.GrievanceApplicationId,
                        PhotoTypeId = p.PhotoTypeId,
                        PhotoTypeCode = p.PhotoType?.PhotoTypeCode ?? string.Empty,
                        PhotoTypeName = p.PhotoType?.PhotoTypeName ?? string.Empty,
                        DocumentBindingId = p.DocumentBindingId,
                        IsLatest = p.IsLatest,
                        Remarks = p.Remarks,
                        FileName = DocumentBindingHelper.GetSafeFileName(p.DocumentBinding),
                        OriginalFileName = p.DocumentBinding?.Document?.OriginalFileName ?? DocumentBindingHelper.GetSafeFileName(p.DocumentBinding),
                        FileExtension = p.DocumentBinding?.Document?.FileExtension,
                        MimeType = DocumentBindingHelper.GetSafeMimeType(p.DocumentBinding),
                        ViewPhotoUrl = $"/api/grievance-photos/{p.Id}/view"
                    }).ToList()
                );
        }

        var resultList = new List<GrievancePublicDetailsDto>(entities.Count);
        foreach (var entity in entities)
        {
            var entityLogs = logsByGrievanceId.TryGetValue(entity.Id, out var lList) ? lList : new List<GrievanceActivityLogEntity>();
            var entityPhotos = photosByGrievanceId.TryGetValue(entity.Id, out var pList) ? pList : new List<GrievancePublicPhotoDto>();

            var stateName = entity.CurrentState?.StateName ?? "Submitted";
            var progress = CalculateProgress(stateName, entity.ResolvedDate.HasValue, entity.ClosedDate.HasValue);
            var daysOpen = (int)Math.Max(0, (DateTime.Now - entity.SubmittedDate).TotalDays);
            var timelineItems = MapTimelineItems(entityLogs, isSanitized: false);

            var assignedOfficer = entity.CurrentAssignedToUser != null
                ? $"{entity.CurrentAssignedToUser.FirstName} {entity.CurrentAssignedToUser.LastName}".Trim()
                : null;
            if (string.IsNullOrWhiteSpace(assignedOfficer) && entity.CurrentAssignedToUser != null)
                assignedOfficer = entity.CurrentAssignedToUser.UserName;

            resultList.Add(new GrievancePublicDetailsDto
            {
                Id = entity.Id,
                GrievanceNo = entity.GrievanceNo,
                CitizenId = entity.CitizenId,
                CitizenName = entity.Citizen?.Name,
                MaskedMobileNo = MaskMobile(entity.Citizen?.MobileNo),
                GrievanceDepartmentId = entity.GrievanceDepartmentId,
                DepartmentName = entity.GrievanceDepartment?.DepartmentName,
                DepartmentNameLocal = entity.GrievanceDepartment?.DepartmentNameLocal,
                GrievanceTypeId = entity.GrievanceTypeId,
                GrievanceType = entity.GrievanceType?.GrievanceType,
                RoadLandmark = entity.RoadLandmark,
                Latitude = entity.Latitude,
                Longitude = entity.Longitude,
                Description = entity.Description,
                WorkflowId = entity.WorkflowId,
                WorkflowName = entity.Workflow?.WorkflowName,
                CurrentStateId = entity.CurrentStateId,
                CurrentStateName = stateName,
                CurrentAssignedToUserName = assignedOfficer,
                WardId = entity.WardId,
                WardNo = entity.Ward?.WardNo,
                WardName = entity.Ward?.Description,
                ZoneId = entity.ZoneId ?? entity.Ward?.ZoneId,
                ZoneNo = entity.Zone?.ZoneNo ?? entity.Ward?.Zone?.ZoneNo,
                ZoneName = entity.Zone?.Description ?? entity.Ward?.Zone?.Description,
                SubmittedDate = entity.SubmittedDate,
                ResolvedDate = entity.ResolvedDate,
                ClosedDate = entity.ClosedDate,
                ProgressPercentage = progress,
                DaysOpen = daysOpen,
                IsResolved = entity.ResolvedDate.HasValue,
                IsClosed = entity.ClosedDate.HasValue,
                Photos = entityPhotos,
                Timeline = timelineItems
            });
        }

        return resultList;
    }

    private async Task<GrievancePublicDetailsDto> BuildPublicDetailsDtoAsync(
        GrievanceApplicationEntity entity, CancellationToken cancellationToken)
    {
        var logQuery = _activityLogRepository.GetQueryable()
            .Include(l => l.FromState)
            .Include(l => l.ToState)
            .Include(l => l.ActionByUser)
            .Include(l => l.AssignedToUser)
            .Include(l => l.DeptForwardings)
                .ThenInclude(df => df.ForwardedToDept);

        var logs = logQuery.Provider is IAsyncQueryProvider
            ? await logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == entity.Id)
                .OrderBy(l => l.ActionAt)
                .ToListAsync(cancellationToken)
            : logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == entity.Id)
                .OrderBy(l => l.ActionAt)
                .ToList();

        var stateName = entity.CurrentState?.StateName ?? "Submitted";
        var progress = CalculateProgress(stateName, entity.ResolvedDate.HasValue, entity.ClosedDate.HasValue);
        var daysOpen = (int)Math.Max(0, (DateTime.Now - entity.SubmittedDate).TotalDays);
        var timelineItems = MapTimelineItems(logs, isSanitized: false);

        var photos = new List<GrievancePublicPhotoDto>();
        if (_photoRepository != null)
        {
            var photoQuery = _photoRepository.GetQueryable();
            var photoEntities = photoQuery.Provider is IAsyncQueryProvider
                ? await photoQuery.AsNoTracking()
                    .Include(p => p.PhotoType)
                    .Include(p => p.DocumentBinding)
                        .ThenInclude(b => b!.Document)
                    .Where(p => p.GrievanceApplicationId == entity.Id && p.IsActive && !p.MarkedForDeletion)
                    .OrderByDescending(p => p.IsLatest)
                    .ThenByDescending(p => p.Id)
                    .ToListAsync(cancellationToken)
                : photoQuery.AsNoTracking()
                    .Include(p => p.PhotoType)
                    .Include(p => p.DocumentBinding)
                        .ThenInclude(b => b!.Document)
                    .Where(p => p.GrievanceApplicationId == entity.Id && p.IsActive && !p.MarkedForDeletion)
                    .OrderByDescending(p => p.IsLatest)
                    .ThenByDescending(p => p.Id)
                    .ToList();

            photos = photoEntities.Select(p => new GrievancePublicPhotoDto
            {
                Id = p.Id,
                GrievanceApplicationId = p.GrievanceApplicationId,
                PhotoTypeId = p.PhotoTypeId,
                PhotoTypeCode = p.PhotoType?.PhotoTypeCode ?? string.Empty,
                PhotoTypeName = p.PhotoType?.PhotoTypeName ?? string.Empty,
                DocumentBindingId = p.DocumentBindingId,
                IsLatest = p.IsLatest,
                Remarks = p.Remarks,
                FileName = DocumentBindingHelper.GetSafeFileName(p.DocumentBinding),
                OriginalFileName = p.DocumentBinding?.Document?.OriginalFileName ?? DocumentBindingHelper.GetSafeFileName(p.DocumentBinding),
                FileExtension = p.DocumentBinding?.Document?.FileExtension,
                MimeType = DocumentBindingHelper.GetSafeMimeType(p.DocumentBinding),
                ViewPhotoUrl = $"/api/grievance-photos/{p.Id}/view"
            }).ToList();
        }
        else if (_photoService != null)
        {
            var photoDtos = await _photoService.GetPhotosByGrievanceIdAsync(entity.Id, cancellationToken);
            photos = photoDtos.Select(p => new GrievancePublicPhotoDto
            {
                Id = p.Id,
                GrievanceApplicationId = p.GrievanceApplicationId,
                PhotoTypeId = p.PhotoTypeId,
                PhotoTypeCode = p.PhotoTypeCode,
                PhotoTypeName = p.PhotoTypeName,
                DocumentBindingId = p.DocumentBindingId,
                IsLatest = p.IsLatest,
                Remarks = p.Remarks,
                FileName = p.FileName,
                OriginalFileName = p.OriginalFileName,
                FileExtension = p.FileExtension,
                MimeType = p.MimeType,
                ViewPhotoUrl = $"/api/grievance-photos/{p.Id}/view"
            }).ToList();
        }

        var assignedOfficer = entity.CurrentAssignedToUser != null
            ? $"{entity.CurrentAssignedToUser.FirstName} {entity.CurrentAssignedToUser.LastName}".Trim()
            : null;
        if (string.IsNullOrWhiteSpace(assignedOfficer) && entity.CurrentAssignedToUser != null)
            assignedOfficer = entity.CurrentAssignedToUser.UserName;

        return new GrievancePublicDetailsDto
        {
            Id = entity.Id,
            GrievanceNo = entity.GrievanceNo,
            CitizenId = entity.CitizenId,
            CitizenName = entity.Citizen?.Name,
            MaskedMobileNo = MaskMobile(entity.Citizen?.MobileNo),
            GrievanceDepartmentId = entity.GrievanceDepartmentId,
            DepartmentName = entity.GrievanceDepartment?.DepartmentName,
            DepartmentNameLocal = entity.GrievanceDepartment?.DepartmentNameLocal,
            GrievanceTypeId = entity.GrievanceTypeId,
            GrievanceType = entity.GrievanceType?.GrievanceType,
            RoadLandmark = entity.RoadLandmark,
            Latitude = entity.Latitude,
            Longitude = entity.Longitude,
            Description = entity.Description,
            WorkflowId = entity.WorkflowId,
            WorkflowName = entity.Workflow?.WorkflowName,
            CurrentStateId = entity.CurrentStateId,
            CurrentStateName = stateName,
            CurrentAssignedToUserName = assignedOfficer,
            WardId = entity.WardId,
            WardNo = entity.Ward?.WardNo,
            WardName = entity.Ward?.Description,
            ZoneId = entity.ZoneId ?? entity.Ward?.ZoneId,
            ZoneNo = entity.Zone?.ZoneNo ?? entity.Ward?.Zone?.ZoneNo,
            ZoneName = entity.Zone?.Description ?? entity.Ward?.Zone?.Description,
            SubmittedDate = entity.SubmittedDate,
            ResolvedDate = entity.ResolvedDate,
            ClosedDate = entity.ClosedDate,
            ProgressPercentage = progress,
            DaysOpen = daysOpen,
            IsResolved = entity.ResolvedDate.HasValue,
            IsClosed = entity.ClosedDate.HasValue,
            Photos = photos,
            Timeline = timelineItems
        };
    }

    public async Task<GrievanceTrackingDetailsDto?> TrackGrievanceAsync(
        string grievanceNo, string? mobileNo = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(grievanceNo))
            return null;

        var normalizedNo = grievanceNo.Trim();
        var queryable = ApplyIncludes(_repository.GetQueryable());

        var entity = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.GrievanceNo == normalizedNo, cancellationToken)
            : queryable.AsNoTracking().FirstOrDefault(x => x.IsActive && x.GrievanceNo == normalizedNo);

        if (entity == null)
            return null;

        bool isVerifiedCitizen = false;
        if (!string.IsNullOrWhiteSpace(mobileNo))
        {
            var cleanMobile = mobileNo.Trim();
            if (entity.Citizen?.MobileNo != cleanMobile)
            {
                return null;
            }
            isVerifiedCitizen = true;
        }

        // Fetch activity logs
        var logQuery = _activityLogRepository.GetQueryable()
            .Include(l => l.FromState)
            .Include(l => l.ToState)
            .Include(l => l.ActionByUser)
            .Include(l => l.AssignedToUser)
            .Include(l => l.DeptForwardings)
                .ThenInclude(df => df.ForwardedToDept);

        var logs = logQuery.Provider is IAsyncQueryProvider
            ? await logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == entity.Id)
                .OrderBy(l => l.ActionAt)
                .ToListAsync(cancellationToken)
            : logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == entity.Id)
                .OrderBy(l => l.ActionAt)
                .ToList();

        var stateName = entity.CurrentState?.StateName ?? "Submitted";
        var progress = CalculateProgress(stateName, entity.ResolvedDate.HasValue, entity.ClosedDate.HasValue);
        var daysOpen = (int)Math.Max(0, (DateTime.Now - entity.SubmittedDate).TotalDays);

        var timelineItems = MapTimelineItems(logs, isSanitized: !isVerifiedCitizen);

        var assignedOfficer = isVerifiedCitizen && entity.CurrentAssignedToUser != null
            ? $"{entity.CurrentAssignedToUser.FirstName} {entity.CurrentAssignedToUser.LastName}".Trim()
            : null;
        if (isVerifiedCitizen && string.IsNullOrWhiteSpace(assignedOfficer) && entity.CurrentAssignedToUser != null)
            assignedOfficer = entity.CurrentAssignedToUser.UserName;

        return new GrievanceTrackingDetailsDto
        {
            Id = entity.Id,
            GrievanceNo = entity.GrievanceNo,
            CitizenId = isVerifiedCitizen ? entity.CitizenId : 0,
            CitizenName = isVerifiedCitizen ? entity.Citizen?.Name : MaskCitizenName(entity.Citizen?.Name),
            MaskedMobileNo = MaskMobile(entity.Citizen?.MobileNo),
            GrievanceDepartmentId = entity.GrievanceDepartmentId,
            DepartmentName = entity.GrievanceDepartment?.DepartmentName,
            GrievanceTypeId = entity.GrievanceTypeId,
            GrievanceType = entity.GrievanceType?.GrievanceType,
            RoadLandmark = isVerifiedCitizen ? entity.RoadLandmark : null,
            Latitude = isVerifiedCitizen ? entity.Latitude : null,
            Longitude = isVerifiedCitizen ? entity.Longitude : null,
            Description = entity.Description,
            CurrentStateId = entity.CurrentStateId,
            CurrentStateName = stateName,
            CurrentAssignedToUserName = assignedOfficer,
            WardId = entity.WardId,
            WardNo = entity.Ward?.WardNo,
            ZoneId = entity.ZoneId ?? entity.Ward?.ZoneId,
            ZoneNo = entity.Zone?.ZoneNo ?? entity.Ward?.Zone?.ZoneNo,
            SubmittedDate = entity.SubmittedDate,
            ResolvedDate = entity.ResolvedDate,
            ClosedDate = entity.ClosedDate,
            ProgressPercentage = progress,
            DaysOpen = daysOpen,
            IsResolved = entity.ResolvedDate.HasValue,
            IsClosed = entity.ClosedDate.HasValue,
            Timeline = timelineItems
        };
    }

    public async Task<List<GrievanceTimelineItemDto>> GetHistoryAsync(int grievanceId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(grievanceId, cancellationToken);
        if (entity == null || !entity.IsActive)
            throw new KeyNotFoundException($"GrievanceApplication with ID '{grievanceId}' was not found.");

        var logQuery = _activityLogRepository.GetQueryable()
            .Include(l => l.FromState)
            .Include(l => l.ToState)
            .Include(l => l.ActionByUser)
            .Include(l => l.AssignedToUser)
            .Include(l => l.DeptForwardings)
                .ThenInclude(df => df.ForwardedToDept);

        var logs = logQuery.Provider is IAsyncQueryProvider
            ? await logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == grievanceId)
                .OrderBy(l => l.ActionAt)
                .ToListAsync(cancellationToken)
            : logQuery.AsNoTracking()
                .Where(l => l.GrievanceApplicationId == grievanceId)
                .OrderBy(l => l.ActionAt)
                .ToList();

        return MapTimelineItems(logs, isSanitized: false);
    }

    private static List<GrievanceTimelineItemDto> MapTimelineItems(List<GrievanceActivityLogEntity> logs, bool isSanitized = false)
    {
        var timelineItems = new List<GrievanceTimelineItemDto>();
        for (int i = 0; i < logs.Count; i++)
        {
            var log = logs[i];
            var fwd = log.DeptForwardings.FirstOrDefault(f => f.IsActive);

            var actionByName = isSanitized ? "Department Authority" : (log.ActionByUser != null
                ? $"{log.ActionByUser.FirstName} {log.ActionByUser.LastName}".Trim()
                : "System");
            if (!isSanitized && string.IsNullOrWhiteSpace(actionByName) && log.ActionByUser != null)
                actionByName = log.ActionByUser.UserName;

            var assignedToName = isSanitized ? null : (log.AssignedToUser != null
                ? $"{log.AssignedToUser.FirstName} {log.AssignedToUser.LastName}".Trim()
                : null);
            if (!isSanitized && string.IsNullOrWhiteSpace(assignedToName) && log.AssignedToUser != null)
                assignedToName = log.AssignedToUser.UserName;

            timelineItems.Add(new GrievanceTimelineItemDto
            {
                ActivityLogId = log.Id,
                FromState = log.FromState?.StateName,
                ToState = log.ToState?.StateName ?? "Updated",
                ActionByUserId = isSanitized ? 0 : log.ActionByUserId,
                ActionBy = actionByName,
                AssignedToUserId = isSanitized ? null : log.AssignedToUserId,
                AssignedTo = assignedToName,
                Remark = isSanitized ? $"Status updated to {log.ToState?.StateName ?? "In Progress"}." : log.Remark,
                ActionAt = log.ActionAt,
                ForwardedToDeptId = fwd?.ForwardedToDeptId,
                ForwardedToDepartment = fwd?.ForwardedToDept?.DepartmentName,
                ForwardingStatus = fwd?.ForwardingStatus,
                IsCurrentStep = (i == logs.Count - 1)
            });
        }

        return timelineItems;
    }

    private static int CalculateProgress(string stateName, bool isResolved, bool isClosed)
    {
        if (isClosed) return 100;
        if (isResolved) return 90;

        var upper = stateName.ToUpperInvariant();
        if (upper.Contains("RESOLV")) return 90;
        if (upper.Contains("PROGRESS") || upper.Contains("WORK") || upper.Contains("INVESTIGAT")) return 60;
        if (upper.Contains("ASSIGN") || upper.Contains("FORWARD")) return 40;
        if (upper.Contains("SUBMIT") || upper.Contains("PENDING") || upper.Contains("NEW") || upper.Contains("OPEN")) return 20;

        return 30;
    }

    private static string? MaskCitizenName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var maskedParts = parts.Select(p => p.Length switch
        {
            <= 2 => p[0] + "*",
            _ => $"{p[0]}{new string('*', p.Length - 2)}{p[^1]}"
        });

        return string.Join(" ", maskedParts);
    }

    private static string MaskMobile(string? mobileNo)
    {
        if (string.IsNullOrWhiteSpace(mobileNo))
            return string.Empty;

        return mobileNo.Length <= 4
            ? mobileNo
            : new string('X', mobileNo.Length - 4) + mobileNo[^4..];
    }
}
