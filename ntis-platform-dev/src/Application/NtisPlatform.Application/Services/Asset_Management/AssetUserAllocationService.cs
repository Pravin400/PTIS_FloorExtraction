using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.DTOs.Asset_Management.AssetUserAllocation;
using NtisPlatform.Application.DTOs.Master.UserMaster;
using NtisPlatform.Application.Extensions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.Asset_Management;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Asset_Management;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.Asset_Management;

/// <summary>
/// Asset Management users and their allocations.
///
/// APIs supported:
/// 1. GET  /api/AssetUserAllocation/GetAllUserList - paged Asset Management users + allocations
/// 2. GET  /api/AssetUserAllocation/{userId}       - a user's active allocations
/// 3. POST /api/AssetUserAllocation                - save a user's allocations (user in the body)
/// 4. PUT  /api/AssetUserAllocation/{userId}       - same save, user in the route
///
/// Tables:
/// - [AMS].[UserOwningDepartmentAllocation]: one row per (UserId, OwningDepartmentId), optional DesignationId.
/// - [AMS].[UserZoneAllocation]: one row per (UserId, ZoneId, WardId). A zone sent without wards allocates
///   every active ward of the zone; a zone sent with wards allocates only those wards.
/// - [AMS].[StageAccessControl]: the user's own rows only (UserId = the user, DesignationId null), one live row
///   per grievance workflow stage. Designation-level rows are left alone, and so are rows marked for deletion
///   (GrievanceStageAccessControlService treats those as deleted).
/// The two allocation tables' unique constraints cover inactive rows too, so their rows are never deleted or
/// duplicated (StageAccessControl has no unique key; the sync keeps one live row per stage itself). In all three,
/// a removed department/ward/stage is deactivated (kept as history) and re-selecting it re-activates the same row.
/// A save runs in one transaction that first locks the user's CORE.UserMaster row, so concurrent saves of the
/// same user apply one after the other instead of merging.
///
/// The allocations are stored here only: nothing filters what a user sees by them yet
/// (e.g. AssetGrievanceDetailsService.GetAllForUserAsync is not scoped).
/// </summary>
public class AssetUserAllocationService : IAssetUserAllocationService
{
    /// <summary>CORE.DepartmentMaster.DepartmentName whose users GetAllUserList returns.</summary>
    public const string AssetDepartmentName = "Asset Management";

    private readonly IRepository<UserEntity, int> _userRepository;
    private readonly IRepository<DepartmentMasterEntity, int> _departmentRepository;
    private readonly IRepository<UserDepartmentAllocationEntity, int> _departmentAllocationRepository;
    private readonly IRepository<UserRoleAllocationEntity, int> _roleAllocationRepository;
    private readonly IRepository<UserOwningDepartmentAllocationEntity, int> _owningDepartmentAllocationRepository;
    private readonly IRepository<UserZoneAllocationEntity, int> _zoneAllocationRepository;
    private readonly IRepository<OwningDepartmentEntity, int> _owningDepartmentRepository;
    private readonly IRepository<AssetDesignationEntity, int> _designationRepository;
    private readonly IRepository<ZoneEntity, int> _zoneRepository;
    private readonly IRepository<WardEntity, int> _wardRepository;
    private readonly IRepository<GrievanceStageAccessControlEntity, int> _stageAccessRepository;
    private readonly IRepository<GrievanceWorkflowStageMasterEntity, int> _stageRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AssetUserAllocationService> _logger;

    // The unique keys a save can hit when another writer inserted the same row first.
    private static readonly string[] AllocationUniqueKeys =
        ["UQ_UserOwningDepartmentAllocation_User_OwningDepartment", "UQ_UserZoneAllocation_User_Zone_Ward"];

    public AssetUserAllocationService(
        IRepository<UserEntity, int> userRepository,
        IRepository<DepartmentMasterEntity, int> departmentRepository,
        IRepository<UserDepartmentAllocationEntity, int> departmentAllocationRepository,
        IRepository<UserRoleAllocationEntity, int> roleAllocationRepository,
        IRepository<UserOwningDepartmentAllocationEntity, int> owningDepartmentAllocationRepository,
        IRepository<UserZoneAllocationEntity, int> zoneAllocationRepository,
        IRepository<OwningDepartmentEntity, int> owningDepartmentRepository,
        IRepository<AssetDesignationEntity, int> designationRepository,
        IRepository<ZoneEntity, int> zoneRepository,
        IRepository<WardEntity, int> wardRepository,
        IRepository<GrievanceStageAccessControlEntity, int> stageAccessRepository,
        IRepository<GrievanceWorkflowStageMasterEntity, int> stageRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        ILogger<AssetUserAllocationService> logger)
    {
        _userRepository = userRepository;
        _departmentRepository = departmentRepository;
        _departmentAllocationRepository = departmentAllocationRepository;
        _roleAllocationRepository = roleAllocationRepository;
        _owningDepartmentAllocationRepository = owningDepartmentAllocationRepository;
        _zoneAllocationRepository = zoneAllocationRepository;
        _owningDepartmentRepository = owningDepartmentRepository;
        _designationRepository = designationRepository;
        _zoneRepository = zoneRepository;
        _wardRepository = wardRepository;
        _stageAccessRepository = stageAccessRepository;
        _stageRepository = stageRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    // GET ALL USERS (paged)
    // Users are filtered/sorted/paged in SQL; the page's allocations are then batch-loaded with one
    // query per allocation table (not one per user). Roles, owning departments, zones and stages carry only ids
    // and names (no row ids or audit dates), and zones are listed once per zone, without their wards.
    // Sequential awaits — DbContext is not thread-safe.

    public async Task<PagedResult<AssetUserListItemDto>> GetAllUserListAsync(
        AssetUserListQueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(queryParameters);

        var assetDepartmentIds = await _departmentRepository.GetQueryable().AsNoTracking()
            .Where(d => d.DepartmentName == AssetDepartmentName)
            .Select(d => d.Id)
            .ToListAsync(cancellationToken);

        if (assetDepartmentIds.Count == 0)
        {
            _logger.LogWarning("Department '{DepartmentName}' not found in CORE.DepartmentMaster; returning no asset users", AssetDepartmentName);
            var (emptyPageNumber, emptyPageSize, _) = Page(queryParameters, 0);
            return new PagedResult<AssetUserListItemDto>([], 0, emptyPageNumber, emptyPageSize);
        }

        var assetDepartmentAllocations = _departmentAllocationRepository.GetQueryable()
            .Where(a => a.IsActive && assetDepartmentIds.Contains(a.DepartmentId));

        // Active users only: an inactive (locked) user is not listed, even with an active Asset Management allocation.
        var query = _userRepository.GetQueryable().AsNoTracking()
            .Where(u => u.IsActive && !u.MarkedForDeletion && assetDepartmentAllocations.Any(a => a.UserId == u.Id))
            .ApplyFilters(queryParameters)
            .ApplySearch(queryParameters)
            .ApplySort(queryParameters);

        var totalCount = await query.CountAsync(cancellationToken);
        var (pageNumber, pageSize, skip) = Page(queryParameters, totalCount);

        var users = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(u => new AssetUserListItemDto
            {
                Id = u.Id,
                UserName = u.UserName,
                FirstName = u.FirstName,
                MiddleName = u.MiddleName,
                LastName = u.LastName,
                UserCode = u.UserCode,
                Address = u.Address,
                MobileNo = u.MobileNo,
                AlternateMobileNo = u.AlternateMobileNo,
                Email = u.Email,
                EmployeeTypeID = u.EmployeeTypeID,
                Language = u.Language,
                Remark = u.Remark,
                MustChangePassword = u.MustChangePassword,
                IsActive = u.IsActive,
                CreatedDate = u.CreatedDate,
                UpdatedDate = u.UpdatedDate
            })
            .ToListAsync(cancellationToken);

        if (users.Count > 0)
        {
            var userIds = users.Select(u => u.Id).ToList();

            var departments = (await assetDepartmentAllocations.AsNoTracking()
                    .Where(a => userIds.Contains(a.UserId))
                    .OrderBy(a => a.Id)
                    .Select(a => new UserDepartmentAllocationDto
                    {
                        Id = a.Id,
                        UserId = a.UserId,
                        DepartmentId = a.DepartmentId,
                        DepartmentName = a.Department!.DepartmentName,
                        DepartmentNameLocal = a.Department!.DepartmentNameLocal,
                        IsActive = a.IsActive,
                        CreatedDate = a.CreatedDate,
                        UpdatedDate = a.UpdatedDate
                    })
                    .ToListAsync(cancellationToken))
                .ToLookup(d => d.UserId);

            // One entry per (user, role): CORE.UserRoleAllocation has no unique key, so the same role can be on
            // two rows, and without the row id those would look like duplicates.
            var roles = (await _roleAllocationRepository.GetQueryable().AsNoTracking()
                    .Where(r => r.IsActive && userIds.Contains(r.UserId) && assetDepartmentIds.Contains(r.DepartmentId))
                    .Select(r => new { r.UserId, r.UserRoleId, r.UserRole!.UserRoleName })
                    .Distinct()
                    .OrderBy(r => r.UserRoleName)
                    .ToListAsync(cancellationToken))
                .ToLookup(r => r.UserId, r => new AssetUserRoleDto { UserRoleId = r.UserRoleId, UserRoleName = r.UserRoleName });

            var owningDepartments = await LoadOwningDepartmentsAsync(userIds, cancellationToken);
            var zones = await LoadZonesAsync(userIds, cancellationToken);
            var stages = await LoadStagesAsync(userIds, cancellationToken);

            foreach (var user in users)
            {
                user.Departments = departments[user.Id].ToList();
                user.RoleAllocations = roles[user.Id].ToList();
                user.OwningDepartments = owningDepartments[user.Id].ToList();
                user.ZoneAllocations = zones[user.Id].ToList();
                user.StageAccess = stages[user.Id].ToList();
            }
        }

        return new PagedResult<AssetUserListItemDto>(users, totalCount, pageNumber, pageSize);
    }

    // Every page size goes through PagingGuard: a positive size is capped at 100, and PageSize = -1 ("all rows",
    // BaseQueryParameters) is one page from the first row, capped at PagingGuard's ceiling for -1 (5,000) — a bigger
    // result reports its real totalCount and hasNext, and the rest is read with normal paging. The offset is computed
    // in long and clamped to totalCount, so a huge PageNumber gives an empty page instead of an overflowed Skip.
    private static (int PageNumber, int PageSize, int Skip) Page(AssetUserListQueryParameters queryParameters, int totalCount)
    {
        var (pageNumber, pageSize, skip) = PagingGuard.Normalize(queryParameters.PageNumber, queryParameters.PageSize, totalCount);
        return queryParameters.PageSize == -1 ? (1, pageSize, 0) : (pageNumber, pageSize, skip);
    }

    // GET (single user)

    public async Task<AssetUserAllocationDto> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        await EnsureUserExistsAsync(userId, cancellationToken);

        List<int> userIds = [userId];
        return new AssetUserAllocationDto
        {
            UserId = userId,
            OwningDepartments = (await LoadOwningDepartmentRowsAsync(userIds, cancellationToken))[userId].ToList(),
            ZoneAllocations = (await LoadZoneWardsAsync(userIds, cancellationToken))[userId].ToList(),
            StageAccess = (await LoadStageAccessRowsAsync(userIds, cancellationToken))[userId].ToList()
        };
    }

    // SAVE / UPDATE
    // POST and PUT differ only in where the user id comes from. The audit user (CreatedBy / UpdatedBy) is
    // always the authenticated caller, never a request field.

    public Task<AssetUserAllocationDto> SaveAsync(SaveAssetUserAllocationDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return SaveAllocationAsync(dto.UserId, dto, cancellationToken);
    }

    public Task<AssetUserAllocationDto> UpdateAsync(int userId, UpdateAssetUserAllocationDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        return SaveAllocationAsync(userId, dto, cancellationToken);
    }

    private async Task<AssetUserAllocationDto> SaveAllocationAsync(
        int userId, AssetUserAllocationListsDto request, CancellationToken cancellationToken)
    {
        if (userId <= 0)
            throw new ArgumentException("Valid UserId is required.");

        // Throws UnauthorizedAccessException (401) when the token carries no valid staff user id.
        var auditUserId = _currentUserService.GetCurrentUserId();

        // A list left out (null) keeps the user's current allocation of that kind; [] removes all of it.
        var departments = request.OwningDepartments == null ? null : ToDepartmentMap(request.OwningDepartments);
        var zones = request.ZoneAllocations == null ? null : ToZoneMap(request.ZoneAllocations);
        var stages = request.StageAccess == null ? null : ToStageSet(request.StageAccess);

        int? wardCount = null;
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            // Held until the transaction ends: a concurrent save of this user waits here and then reads what
            // this one committed, so two replacements apply one after the other instead of merging. The same
            // statement re-checks the user, so a user deleted after the request started is a 404, not a save.
            if (await LockUserRowAsync(userId, cancellationToken) == 0)
                throw new KeyNotFoundException($"User with ID {userId} was not found.");

            // Every row of the user, active or not — the unique constraints include inactive rows, so a
            // re-selected department/ward must re-use its row instead of inserting a new one.
            var departmentRows = departments == null ? null : await _owningDepartmentAllocationRepository.GetQueryable()
                .Where(a => a.UserId == userId)
                .ToListAsync(cancellationToken);
            var zoneRows = zones == null ? null : await _zoneAllocationRepository.GetQueryable()
                .Where(a => a.UserId == userId)
                .ToListAsync(cancellationToken);
            // Only the user's own stage rows (no designation), active or not. Rows marked for deletion are left out:
            // GrievanceStageAccessControlService treats them as deleted, so a re-selected stage gets a new row.
            var stageRows = stages == null ? null : await _stageAccessRepository.GetQueryable()
                .Where(a => a.UserId == userId && a.DesignationId == null && !a.MarkedForDeletion)
                .ToListAsync(cancellationToken);

            // Validate every list before staging anything, so a bad zone can't leave half-staged department changes.
            if (departments != null)
                await EnsureDepartmentsAssignableAsync(departments, departmentRows!, cancellationToken);
            var zoneWards = zones == null ? null : await ResolveZoneWardsAsync(zones, zoneRows!, cancellationToken);
            if (stages != null)
                await EnsureStagesAssignableAsync(stages, stageRows!, cancellationToken);

            if (departments != null)
                await SyncDepartmentsAsync(userId, departmentRows!, departments, auditUserId, cancellationToken);
            if (zoneWards != null)
                await SyncZonesAsync(userId, zoneRows!, zoneWards, auditUserId, cancellationToken);
            if (stages != null)
                await SyncStagesAsync(userId, stageRows!, stages, auditUserId, cancellationToken);

            // Saves every table and commits them atomically
            await _unitOfWork.CommitTransactionAsync(cancellationToken);
            wardCount = zoneWards?.Count;
        }
        catch (DbUpdateException ex) when (IsAllocationUniqueKeyViolation(ex))
        {
            await _unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            _unitOfWork.DiscardChanges();
            // EF's own "the rows changed under you" exception (these entities have no concurrency token, so it
            // only comes from here); the controller returns it as 409, every other DbUpdateException as an error.
            throw new DbUpdateConcurrencyException(
                "Allocations were changed by another request. Reload and try again.", ex);
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(CancellationToken.None);
            _unitOfWork.DiscardChanges();
            throw;
        }

        _logger.LogInformation(
            "Asset user allocations saved for user {UserId}: {DepartmentCount} owning department(s), {ZoneCount} zone(s) / {WardCount} ward(s), {StageCount} stage(s) (null = unchanged) (By: {AuditUserId})",
            userId, departments?.Count, zones?.Count, wardCount, stages?.Count, auditUserId);

        return await GetByUserIdAsync(userId, cancellationToken);
    }

    // Takes an exclusive lock on the user's CORE.UserMaster row for the rest of the save's transaction with an
    // UPDATE that writes back the value already there (UserMaster has no trigger, rowversion or concurrency token,
    // so nothing changes). A second save of the same user waits on this row until the first commits or rolls back;
    // saves of other users and plain reads of the allocation tables are not blocked. Only a user that is not marked
    // for deletion is locked, so the returned row count (0 or 1) is also the existence check, made under the lock:
    // a soft delete committed before it gives 0, and one that comes after it waits for this save to finish.
    // Inactive (locked) users are allowed — the Asset User screen saves the scoping of a locked user too.
    private Task<int> LockUserRowAsync(int userId, CancellationToken cancellationToken)
        => _userRepository.GetQueryable()
            .Where(u => u.Id == userId && !u.MarkedForDeletion)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.UpdatedDate, u => u.UpdatedDate), cancellationToken);

    // A unique-key violation on one of the allocation tables: another writer inserted the same row first.
    // Any other database failure (a foreign key, a missing column) is not a conflict and is rethrown as is.
    // The error number is read by name (AssetMasterValidation.IsDuplicateKey), so no SQL Server package is needed here.
    private static bool IsAllocationUniqueKeyViolation(DbUpdateException exception)
        => AssetMasterValidation.IsDuplicateKey(exception)
           && AllocationUniqueKeys.Any(key => exception.GetBaseException().Message.Contains(key, StringComparison.Ordinal));

    // PRIVATE: diff-patch
    // Repository.AddAsync / UpdateAsync stamp CreatedDate / UpdatedDate. A row is only written when
    // something on it actually changes. "Revive(row) | SetIfDifferent(...)" uses | (not ||) on purpose:
    // both must run, so a re-activated row also picks up its new designation.

    private async Task SyncDepartmentsAsync(
        int userId,
        List<UserOwningDepartmentAllocationEntity> rows,
        Dictionary<int, int?> requested,
        int? auditUserId,
        CancellationToken cancellationToken)
    {
        foreach (var row in rows)
        {
            var changed = requested.TryGetValue(row.OwningDepartmentId, out var designationId)
                ? Revive(row) | SetIfDifferent(row.DesignationId, designationId, v => row.DesignationId = v)
                : Retire(row);

            if (changed)
            {
                row.UpdatedBy = auditUserId;
                await _owningDepartmentAllocationRepository.UpdateAsync(row, cancellationToken);
            }
        }

        var existing = rows.Select(r => r.OwningDepartmentId).ToHashSet();
        foreach (var (departmentId, designationId) in requested.Where(r => !existing.Contains(r.Key)))
        {
            await _owningDepartmentAllocationRepository.AddAsync(new UserOwningDepartmentAllocationEntity
            {
                UserId = userId,
                OwningDepartmentId = departmentId,
                DesignationId = designationId,
                IsActive = true,
                CreatedBy = auditUserId
            }, cancellationToken);
        }
    }

    // A row is one (zone, ward) pair, so a ward change retires the old ward's row and adds the new one.
    private async Task SyncZonesAsync(
        int userId,
        List<UserZoneAllocationEntity> rows,
        HashSet<(int ZoneId, int WardId)> requested,
        int? auditUserId,
        CancellationToken cancellationToken)
    {
        foreach (var row in rows)
        {
            var changed = requested.Contains((row.ZoneId, row.WardId)) ? Revive(row) : Retire(row);

            if (changed)
            {
                row.UpdatedBy = auditUserId;
                await _zoneAllocationRepository.UpdateAsync(row, cancellationToken);
            }
        }

        var existing = rows.Select(r => (r.ZoneId, r.WardId)).ToHashSet();
        foreach (var (zoneId, wardId) in requested.Where(r => !existing.Contains(r)).OrderBy(r => r.ZoneId).ThenBy(r => r.WardId))
        {
            await _zoneAllocationRepository.AddAsync(new UserZoneAllocationEntity
            {
                UserId = userId,
                ZoneId = zoneId,
                WardId = wardId,
                IsActive = true,
                CreatedBy = auditUserId
            }, cancellationToken);
        }
    }

    // rows = the user's own stage rows not marked for deletion. StageAccessControl has no unique key, so a stage can
    // already have more than one row (e.g. one added through the Grievance Stage Access Control screen): a selected
    // stage keeps exactly one live row — an active one if there is one, else the oldest — and its other rows are
    // retired like the rows of stages no longer selected. CanTakeAction is not touched on existing rows.
    private async Task SyncStagesAsync(
        int userId,
        List<GrievanceStageAccessControlEntity> rows,
        HashSet<int> requested,
        int? auditUserId,
        CancellationToken cancellationToken)
    {
        var kept = new HashSet<int>();
        foreach (var row in rows.OrderByDescending(r => r.IsActive).ThenBy(r => r.Id))
        {
            var changed = requested.Contains(row.StageId) && kept.Add(row.StageId) ? Revive(row) : Retire(row);

            if (changed)
            {
                row.UpdatedBy = auditUserId;
                await _stageAccessRepository.UpdateAsync(row, cancellationToken);
            }
        }

        foreach (var stageId in requested.Where(id => !kept.Contains(id)).Order())
        {
            await _stageAccessRepository.AddAsync(new GrievanceStageAccessControlEntity
            {
                StageId = stageId,
                UserId = userId,
                DesignationId = null,
                CanTakeAction = true,   // the column default; not set through this API
                IsActive = true,
                CreatedBy = auditUserId
            }, cancellationToken);
        }
    }

    // Makes a selected row live again (also clears a pending hard-delete mark). Returns true if it changed.
    private static bool Revive<TEntity>(TEntity row) where TEntity : BaseEntity, IHardDeletable
    {
        if (row.IsActive && !row.MarkedForDeletion)
            return false;

        row.IsActive = true;
        row.MarkedForDeletion = false;
        row.MarkedForDeletionDate = null;
        return true;
    }

    // Deactivates a row that is no longer selected (kept as history). Returns true if it changed.
    private static bool Retire(BaseEntity row)
    {
        if (!row.IsActive)
            return false;

        row.IsActive = false;
        return true;
    }

    private static bool SetIfDifferent<T>(T current, T value, Action<T> set)
    {
        if (EqualityComparer<T>.Default.Equals(current, value))
            return false;

        set(value);
        return true;
    }

    private static bool IsLive<TEntity>(TEntity row) where TEntity : BaseEntity, IHardDeletable
        => row.IsActive && !row.MarkedForDeletion;

    // PRIVATE: allocation read
    // Active rows only, keyed by user; a user with no active row gets an empty sequence from the lookup.
    // GetByUserIdAsync reads the full rows, one zone entry per ward and one entry per stage (the edit screen
    // rebuilds its selection from them). GetAllUserListAsync reads only the ids and names its grid shows, one
    // entry per zone and per stage.

    private async Task<ILookup<int, UserOwningDepartmentAllocationDto>> LoadOwningDepartmentRowsAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in _owningDepartmentAllocationRepository.GetQueryable().AsNoTracking()
                where userIds.Contains(a.UserId) && a.IsActive && !a.MarkedForDeletion
                join d in _owningDepartmentRepository.GetQueryable() on a.OwningDepartmentId equals d.Id
                join g in _designationRepository.GetQueryable() on a.DesignationId equals (int?)g.Id into designations
                from g in designations.DefaultIfEmpty()
                orderby d.OwningDepartmentName
                select new UserOwningDepartmentAllocationDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    OwningDepartmentId = a.OwningDepartmentId,
                    OwningDepartmentName = d.OwningDepartmentName,
                    DesignationId = a.DesignationId,
                    DesignationName = g == null ? null : g.DesignationName,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate
                })
            .ToListAsync(cancellationToken)).ToLookup(a => a.UserId);

    private async Task<ILookup<int, UserZoneAllocationDto>> LoadZoneWardsAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in _zoneAllocationRepository.GetQueryable().AsNoTracking()
                where userIds.Contains(a.UserId) && a.IsActive && !a.MarkedForDeletion
                join z in _zoneRepository.GetQueryable() on a.ZoneId equals z.Id
                join w in _wardRepository.GetQueryable() on a.WardId equals w.Id
                orderby z.SequenceNo, z.ZoneNo, w.SequenceNo, w.WardNo
                select new UserZoneAllocationDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    ZoneId = a.ZoneId,
                    ZoneNo = z.ZoneNo,
                    ZoneDescription = z.Description,
                    WardId = a.WardId,
                    WardNo = w.WardNo,
                    WardDescription = w.Description,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate
                })
            .ToListAsync(cancellationToken)).ToLookup(a => a.UserId);

    // The user's own active stage rows (UserId = the user, no designation), in workflow order. StageAccessControl
    // has no unique key, so a stage can have two active rows (e.g. one added on the Grievance Stage Access Control
    // screen); it is listed once, with its oldest row — the row a save keeps (SyncStagesAsync).
    private async Task<ILookup<int, UserStageAccessAllocationDto>> LoadStageAccessRowsAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in UserStageAccessRows(userIds)
                join s in _stageRepository.GetQueryable() on a.StageId equals s.Id
                orderby s.StageOrder, s.StageName, a.Id
                select new UserStageAccessAllocationDto
                {
                    Id = a.Id,
                    UserId = a.UserId!.Value,
                    StageId = a.StageId,
                    StageCode = s.StageCode,
                    StageName = s.StageName,
                    IsActive = a.IsActive,
                    CreatedDate = a.CreatedDate,
                    UpdatedDate = a.UpdatedDate
                })
            .ToListAsync(cancellationToken))
            .DistinctBy(a => (a.UserId, a.StageId))   // rows of one stage come oldest first, so the oldest is kept
            .ToLookup(a => a.UserId);

    // Active, user-level (no designation) StageAccessControl rows of the given users — what both GETs read.
    private IQueryable<GrievanceStageAccessControlEntity> UserStageAccessRows(List<int> userIds)
        => _stageAccessRepository.GetQueryable().AsNoTracking()
            .Where(a => a.UserId != null && userIds.Contains(a.UserId.Value) && a.DesignationId == null
                        && a.IsActive && !a.MarkedForDeletion);

    // List shape: one row per (user, owning department) — the unique key allows no more.
    private async Task<ILookup<int, AssetUserOwningDepartmentDto>> LoadOwningDepartmentsAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in _owningDepartmentAllocationRepository.GetQueryable().AsNoTracking()
                where userIds.Contains(a.UserId) && a.IsActive && !a.MarkedForDeletion
                join d in _owningDepartmentRepository.GetQueryable() on a.OwningDepartmentId equals d.Id
                join g in _designationRepository.GetQueryable() on a.DesignationId equals (int?)g.Id into designations
                from g in designations.DefaultIfEmpty()
                orderby d.OwningDepartmentName
                select new
                {
                    a.UserId,
                    Department = new AssetUserOwningDepartmentDto
                    {
                        OwningDepartmentId = a.OwningDepartmentId,
                        OwningDepartmentName = d.OwningDepartmentName,
                        DesignationId = a.DesignationId,
                        DesignationName = g == null ? null : g.DesignationName
                    }
                })
            .ToListAsync(cancellationToken)).ToLookup(a => a.UserId, a => a.Department);

    // List shape: one row per (user, zone) straight from SQL (GROUP BY before the join), so a whole zone of many
    // wards is read as a single zone instead of every ward row. A row is one (zone, ward) pair, so the group's
    // row count is the number of wards allocated in that zone.
    private async Task<ILookup<int, AssetUserZoneDto>> LoadZonesAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in _zoneAllocationRepository.GetQueryable().AsNoTracking()
                    .Where(a => userIds.Contains(a.UserId) && a.IsActive && !a.MarkedForDeletion)
                    .GroupBy(a => new { a.UserId, a.ZoneId })
                    .Select(g => new { g.Key.UserId, g.Key.ZoneId, WardCount = g.Count() })
                join z in _zoneRepository.GetQueryable() on a.ZoneId equals z.Id
                orderby z.SequenceNo, z.ZoneNo
                select new
                {
                    a.UserId,
                    Zone = new AssetUserZoneDto
                    {
                        ZoneId = z.Id,
                        ZoneNo = z.ZoneNo,
                        ZoneDescription = z.Description,
                        AllocatedWardCount = a.WardCount
                    }
                })
            .ToListAsync(cancellationToken)).ToLookup(a => a.UserId, a => a.Zone);

    // List shape: one row per (user, stage) straight from SQL (DISTINCT before the join) — StageAccessControl has
    // no unique key, so a stage can have more than one active row for the user.
    private async Task<ILookup<int, AssetUserStageDto>> LoadStagesAsync(
        List<int> userIds, CancellationToken cancellationToken)
        => (await (
                from a in UserStageAccessRows(userIds)
                    .Select(a => new { UserId = a.UserId!.Value, a.StageId })
                    .Distinct()
                join s in _stageRepository.GetQueryable() on a.StageId equals s.Id
                orderby s.StageOrder, s.StageName
                select new
                {
                    a.UserId,
                    Stage = new AssetUserStageDto
                    {
                        StageId = s.Id,
                        StageCode = s.StageCode,
                        StageName = s.StageName
                    }
                })
            .ToListAsync(cancellationToken)).ToLookup(a => a.UserId, a => a.Stage);

    // PRIVATE: validation

    // OwningDepartmentId -> DesignationId. The table holds one designation per department, so a department
    // listed twice must carry the same designation both times.
    private static Dictionary<int, int?> ToDepartmentMap(List<OwningDepartmentAllocationItemDto>? items)
    {
        var map = new Dictionary<int, int?>();
        foreach (var item in items ?? [])
        {
            if (item == null)
                throw new ArgumentException("OwningDepartments contains an empty item.");
            if (item.OwningDepartmentId <= 0 || item.DesignationId <= 0)
                throw new ArgumentException("OwningDepartments must contain only positive ids.");

            if (map.TryGetValue(item.OwningDepartmentId, out var designationId))
            {
                if (designationId != item.DesignationId)
                    throw new ArgumentException(
                        $"Owning department {item.OwningDepartmentId} is listed with different designations; a user has one designation per department.");
                continue;
            }

            map[item.OwningDepartmentId] = item.DesignationId;
        }

        return map;
    }

    // The stages to allocate; a stage listed more than once is allocated once.
    private static HashSet<int> ToStageSet(List<StageAccessAllocationItemDto>? items)
    {
        var stageIds = new HashSet<int>();
        foreach (var item in items ?? [])
        {
            if (item == null)
                throw new ArgumentException("StageAccess contains an empty item.");
            if (item.StageId <= 0)
                throw new ArgumentException("StageAccess must contain only positive ids.");

            stageIds.Add(item.StageId);
        }

        return stageIds;
    }

    // ZoneId -> the wards to allocate in it, or null for the whole zone (no WardIds sent). A zone listed more
    // than once gets the union of its wards; if any of its items asks for the whole zone, the whole zone wins.
    private static Dictionary<int, HashSet<int>?> ToZoneMap(List<ZoneAllocationItemDto>? items)
    {
        var map = new Dictionary<int, HashSet<int>?>();
        foreach (var item in items ?? [])
        {
            if (item == null)
                throw new ArgumentException("ZoneAllocations contains an empty item.");
            if (item.ZoneId <= 0 || (item.WardIds?.Any(id => id <= 0) ?? false))
                throw new ArgumentException("ZoneAllocations must contain only positive zone and ward ids.");

            var wholeZone = item.WardIds is not { Count: > 0 };
            if (!map.TryGetValue(item.ZoneId, out var wardIds))
                map[item.ZoneId] = wholeZone ? null : new HashSet<int>(item.WardIds!);
            else if (wardIds != null)
            {
                if (wholeZone)
                    map[item.ZoneId] = null;
                else
                    wardIds.UnionWith(item.WardIds!);
            }
        }

        return map;
    }

    private async Task EnsureUserExistsAsync(int userId, CancellationToken cancellationToken)
    {
        if (userId <= 0)
            throw new ArgumentException("Valid UserId is required.");

        // Inactive (locked) users are allowed — the Asset User screen creates a user and then locks
        // it when "Active" is unchecked, and its scoping must still be saved.
        var exists = await _userRepository.GetQueryable()
            .AnyAsync(u => u.Id == userId && !u.MarkedForDeletion, cancellationToken);

        if (!exists)
            throw new KeyNotFoundException($"User with ID {userId} was not found.");
    }

    // Departments/designations being newly allocated must exist and be active. Values the user currently has
    // (a live row) are not re-checked, so a master deactivated after it was allocated doesn't block an
    // unrelated save of the same user. Re-adding a value that was removed (a retired row) is a new grant and is
    // checked like one: access to a master that has since been deactivated or deleted is not handed out again.
    // Every designation must belong to its department.
    private async Task EnsureDepartmentsAssignableAsync(
        Dictionary<int, int?> requested, List<UserOwningDepartmentAllocationEntity> rows, CancellationToken cancellationToken)
    {
        var live = rows.Where(r => IsLive(r)).ToDictionary(r => r.OwningDepartmentId);

        var newDepartmentIds = requested.Keys.Where(id => !live.ContainsKey(id)).ToList();
        if (newDepartmentIds.Count > 0)
        {
            var found = await _owningDepartmentRepository.GetQueryable()
                .Where(d => newDepartmentIds.Contains(d.Id) && d.IsActive && !d.MarkedForDeletion)
                .Select(d => d.Id)
                .ToListAsync(cancellationToken);
            ThrowIfMissing(newDepartmentIds, found, "Owning department(s)");
        }

        var designationIds = requested.Values.OfType<int>().Distinct().ToList();
        if (designationIds.Count == 0)
            return;

        var designations = (await _designationRepository.GetQueryable()
                .Where(g => designationIds.Contains(g.Id))
                .Select(g => new { g.Id, g.OwningDepartmentId, Assignable = g.IsActive && !g.MarkedForDeletion })
                .ToListAsync(cancellationToken))
            .ToDictionary(g => g.Id);

        var newDesignationIds = requested
            .Where(r => r.Value != null && (!live.TryGetValue(r.Key, out var row) || row.DesignationId != r.Value))
            .Select(r => r.Value!.Value)
            .Distinct()
            .ToList();
        ThrowIfMissing(newDesignationIds, designations.Values.Where(g => g.Assignable).Select(g => g.Id), "Designation(s)");

        foreach (var (departmentId, designationId) in requested)
        {
            if (designationId is { } id && designations.TryGetValue(id, out var designation) && designation.OwningDepartmentId != departmentId)
                throw new ArgumentException($"Designation {id} does not belong to owning department {departmentId}.");
        }
    }

    // Same rules for zones and wards (only the zones / (zone, ward) pairs the user currently has skip the active
    // check), and resolves the request to the (ZoneId, WardId) rows the user must end up with: a whole zone
    // becomes every ward of it that is active now; listed wards must belong to their zone.
    private async Task<HashSet<(int ZoneId, int WardId)>> ResolveZoneWardsAsync(
        Dictionary<int, HashSet<int>?> requested, List<UserZoneAllocationEntity> rows, CancellationToken cancellationToken)
    {
        var result = new HashSet<(int ZoneId, int WardId)>();
        if (requested.Count == 0)
            return result;

        var live = rows.Where(r => IsLive(r)).Select(r => (r.ZoneId, r.WardId)).ToHashSet();
        var liveZoneIds = live.Select(r => r.ZoneId).ToHashSet();

        var newZoneIds = requested.Keys.Where(id => !liveZoneIds.Contains(id)).ToList();
        if (newZoneIds.Count > 0)
        {
            var found = await _zoneRepository.GetQueryable()
                .Where(z => newZoneIds.Contains(z.Id) && z.IsActive)
                .Select(z => z.Id)
                .ToListAsync(cancellationToken);
            ThrowIfMissing(newZoneIds, found, "Zone(s)");
        }

        // Every ward of the whole zones, plus each listed ward wherever it belongs (to report a wrong zone)
        var wholeZoneIds = requested.Where(r => r.Value == null).Select(r => r.Key).ToList();
        var listedWardIds = requested.Values.OfType<HashSet<int>>().SelectMany(w => w).Distinct().ToList();
        var wards = await _wardRepository.GetQueryable()
            .Where(w => wholeZoneIds.Contains(w.ZoneId) || listedWardIds.Contains(w.Id))
            .Select(w => new { w.Id, w.ZoneId, w.IsActive })
            .ToListAsync(cancellationToken);
        var wardsById = wards.ToDictionary(w => w.Id);

        var newWardIds = requested
            .Where(r => r.Value != null)
            .SelectMany(r => r.Value!.Where(wardId => !live.Contains((r.Key, wardId))))
            .Distinct()
            .ToList();
        ThrowIfMissing(newWardIds, wards.Where(w => w.IsActive).Select(w => w.Id), "Ward(s)");

        foreach (var (zoneId, wardIds) in requested)
        {
            if (wardIds == null)
            {
                var zoneWardIds = wards.Where(w => w.ZoneId == zoneId && w.IsActive).Select(w => w.Id).ToList();
                if (zoneWardIds.Count == 0)
                    throw new ArgumentException($"Zone {zoneId} has no active wards to allocate.");

                result.UnionWith(zoneWardIds.Select(wardId => (zoneId, wardId)));
                continue;
            }

            foreach (var wardId in wardIds)
            {
                if (wardsById.TryGetValue(wardId, out var ward) && ward.ZoneId != zoneId)
                    throw new ArgumentException($"Ward {wardId} does not belong to zone {zoneId}.");

                result.Add((zoneId, wardId));
            }
        }

        return result;
    }

    // Same rule for stages: a stage the user currently has (an active row) is not re-checked; a stage being newly
    // allocated, or re-added after it was removed, must exist, be active and not be marked for deletion.
    private async Task EnsureStagesAssignableAsync(
        HashSet<int> requested, List<GrievanceStageAccessControlEntity> rows, CancellationToken cancellationToken)
    {
        var liveStageIds = rows.Where(r => r.IsActive).Select(r => r.StageId).ToHashSet();

        var newStageIds = requested.Where(id => !liveStageIds.Contains(id)).ToList();
        if (newStageIds.Count == 0)
            return;

        var found = await _stageRepository.GetQueryable()
            .Where(s => newStageIds.Contains(s.Id) && s.IsActive && !s.MarkedForDeletion)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);
        ThrowIfMissing(newStageIds, found, "Stage(s)");
    }

    private static void ThrowIfMissing(List<int> requested, IEnumerable<int> found, string label)
    {
        var missing = requested.Except(found).ToList();
        if (missing.Count > 0)
            throw new ArgumentException($"{label} not found or inactive: {string.Join(", ", missing)}");
    }
}
