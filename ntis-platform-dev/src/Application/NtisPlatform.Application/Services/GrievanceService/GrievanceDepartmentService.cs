using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceDepartmentMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievanceDepartmentService : BaseCommonCrudService<
    GrievanceDepartmentMasterEntity,
    GrievanceDepartmentDto,
    CreateGrievanceDepartmentDto,
    UpdateGrievanceDepartmentDto,
    GrievanceDepartmentQueryParameters,
    int>, IGrievanceDepartmentService
{
    private readonly IRepository<DepartmentMasterEntity, int> _coreDepartmentRepository;
    private readonly IRepository<UserDepartmentAllocationEntity, int> _userDepartmentAllocationRepository;

    public GrievanceDepartmentService(
        IRepository<GrievanceDepartmentMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IRepository<DepartmentMasterEntity, int> coreDepartmentRepository,
        IRepository<UserDepartmentAllocationEntity, int> userDepartmentAllocationRepository)
        : base(repository, unitOfWork, mapper)
    {
        _coreDepartmentRepository = coreDepartmentRepository;
        _userDepartmentAllocationRepository = userDepartmentAllocationRepository;
    }

    protected override IQueryable<GrievanceDepartmentMasterEntity> ApplyIncludes(IQueryable<GrievanceDepartmentMasterEntity> query)
    {
        return query.Include(x => x.CoreDepartment);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievanceDepartmentMasterEntity entity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(entity.DepartmentName))
        {
            var nameUpper = entity.DepartmentName.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.DepartmentName != null && x.DepartmentName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.DepartmentName != null && x.DepartmentName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.DepartmentName), "Department name must be unique.");
                }
            }
        }

        // Validate CoreDepartmentId: must exist and not already be linked
        if (entity.CoreDepartmentId.HasValue)
        {
            var coreExists = await _coreDepartmentRepository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(x => x.Id == entity.CoreDepartmentId.Value && x.IsActive, cancellationToken);

            if (!coreExists)
                return ValidationResult.Failure(nameof(entity.CoreDepartmentId), "CoreDepartmentId does not exist or is inactive.");

            var alreadyLinked = await _repository.GetQueryable()
                .AsNoTracking()
                .AnyAsync(x => x.CoreDepartmentId == entity.CoreDepartmentId.Value, cancellationToken);

            if (alreadyLinked)
                return ValidationResult.Failure(nameof(entity.CoreDepartmentId), "This core department is already linked to a grievance department.");
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievanceDepartmentMasterEntity currentEntity, GrievanceDepartmentMasterEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(updatedEntity.DepartmentName))
        {
            var nameUpper = updatedEntity.DepartmentName.Trim().ToUpper();
            var currentNameUpper = currentEntity?.DepartmentName?.Trim()?.ToUpper();

            if (string.Equals(nameUpper, currentNameUpper, StringComparison.OrdinalIgnoreCase))
            {
                return ValidationResult.Success();
            }

            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.DepartmentName != null && x.DepartmentName.Trim().ToUpper() == nameUpper, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.DepartmentName != null && x.DepartmentName.Trim().ToUpper() == nameUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.DepartmentName), "Department name must be unique.");
                }
            }
        }

        return ValidationResult.Success();
    }

    /// <inheritdoc/>
    public async Task<List<CoreDepartmentInfoDto>> GetAvailableCoreDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        // Get all CoreDepartmentIds already linked in GRV
        var linkedIds = await _repository.GetQueryable()
            .AsNoTracking()
            .Where(x => x.CoreDepartmentId.HasValue)
            .Select(x => x.CoreDepartmentId!.Value)
            .ToListAsync(cancellationToken);

        // Return CORE departments that are active and not yet linked
        var available = await _coreDepartmentRepository.GetQueryable()
            .AsNoTracking()
            .Where(x => x.IsActive && !linkedIds.Contains(x.Id))
            .OrderBy(x => x.DepartmentName)
            .Select(x => new CoreDepartmentInfoDto
            {
                Id = x.Id,
                DepartmentCode = x.DepartmentCode,
                DepartmentName = x.DepartmentName,
                DepartmentNameLocal = x.DepartmentNameLocal,
                DepartmentIcon = x.DepartmentIcon
            })
            .ToListAsync(cancellationToken);

        return available;
    }

    /// <inheritdoc/>
    public async Task<GrievanceDepartmentDto> ProvisionFromCoreDepartmentAsync(
        int coreDepartmentId, int? createdBy, CancellationToken cancellationToken = default)
    {
        // Validate core department exists
        var coreDept = await _coreDepartmentRepository.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == coreDepartmentId && x.IsActive, cancellationToken)
            ?? throw new InvalidOperationException($"CoreDepartmentId {coreDepartmentId} does not exist or is inactive.");

        // Check not already linked
        bool alreadyLinked = await _repository.GetQueryable()
            .AsNoTracking()
            .AnyAsync(x => x.CoreDepartmentId == coreDepartmentId, cancellationToken);

        if (alreadyLinked)
            throw new InvalidOperationException($"CoreDepartmentId {coreDepartmentId} is already linked to a grievance department.");

        // Create the GRV department inheriting names from the core department
        var entity = new GrievanceDepartmentMasterEntity
        {
            DepartmentName = coreDept.DepartmentName ?? coreDept.DepartmentCode ?? $"Department_{coreDepartmentId}",
            DepartmentNameLocal = coreDept.DepartmentNameLocal,
            CoreDepartmentId = coreDepartmentId,
            IsActive = true,
            CreatedBy = createdBy,
            CreatedDate = DateTime.Now
        };

        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<GrievanceDepartmentDto>(entity);
    }

    /// <inheritdoc/>
    public async Task<List<GrievanceDepartmentDto>> GetGrievanceDepartmentsByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        // 1. Get active core department IDs allocated to this user in CORE.UserDepartmentAllocation
        var coreDeptIds = await _userDepartmentAllocationRepository.GetQueryable()
            .AsNoTracking()
            .Where(da => da.UserId == userId && da.IsActive)
            .Select(da => da.DepartmentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (!coreDeptIds.Any())
        {
            return new List<GrievanceDepartmentDto>();
        }

        // 2. Fetch active GRV grievance departments linked to those core departments
        var grvDepts = await _repository.GetQueryable()
            .AsNoTracking()
            .Include(g => g.CoreDepartment)
            .Where(g => g.IsActive && g.CoreDepartmentId.HasValue && coreDeptIds.Contains(g.CoreDepartmentId.Value))
            .OrderBy(g => g.DepartmentName)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<GrievanceDepartmentDto>>(grvDepts);
    }

    /// <inheritdoc/>
    public async Task<List<GrievanceDepartmentUserDto>> GetAllocatedUsersByGrievanceDepartmentIdAsync(
        int grievanceDepartmentId, CancellationToken cancellationToken = default)
    {
        // 1. Resolve grievance department and its CoreDepartmentId
        var grvDept = await _repository.GetQueryable()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == grievanceDepartmentId, cancellationToken);

        if (grvDept == null || !grvDept.CoreDepartmentId.HasValue)
        {
            return new List<GrievanceDepartmentUserDto>();
        }

        int coreDepartmentId = grvDept.CoreDepartmentId.Value;

        // 2. Fetch active users allocated to that core department in CORE.UserDepartmentAllocation
        var users = await _userDepartmentAllocationRepository.GetQueryable()
            .AsNoTracking()
            .Include(da => da.User)
            .Where(da => da.DepartmentId == coreDepartmentId && da.IsActive && da.User != null && da.User.IsActive && !da.User.MarkedForDeletion)
            .Select(da => new GrievanceDepartmentUserDto
            {
                UserId = da.User!.Id,
                UserName = da.User.UserName,
                FirstName = da.User.FirstName,
                MiddleName = da.User.MiddleName,
                LastName = da.User.LastName,
                UserCode = da.User.UserCode,
                Email = da.User.Email,
                MobileNo = da.User.MobileNo,
                EmployeeTypeID = da.User.EmployeeTypeID,
                IsActive = da.User.IsActive
            })
            .Distinct()
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync(cancellationToken);

        return users;
    }
}
