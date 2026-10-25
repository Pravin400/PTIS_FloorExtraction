using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceApplication;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Services.GrievanceService;

public partial class GrievanceApplicationService
{
    public async Task<GrievanceApplicationDto?> AssignOfficerAsync(
        int grievanceId, AssignGrievanceDto dto, int actionByUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(grievanceId, cancellationToken);
        if (entity == null || !entity.IsActive)
            throw new KeyNotFoundException($"GrievanceApplication with ID '{grievanceId}' was not found.");

        if (_userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(dto.AssignedToUserId, cancellationToken);
            if (user == null || !user.IsActive)
                throw new ValidationException(nameof(dto.AssignedToUserId), "Active staff user does not exist.", OperationType.Update);
        }

        entity.CurrentAssignedToUserId = dto.AssignedToUserId;
        entity.UpdatedBy = actionByUserId;
        entity.UpdatedDate = DateTime.Now;
        await _repository.UpdateAsync(entity, cancellationToken);

        var activityLog = new GrievanceActivityLogEntity
        {
            GrievanceApplicationId = grievanceId,
            FromStateId = entity.CurrentStateId,
            ToStateId = entity.CurrentStateId,
            ActionByUserId = actionByUserId,
            AssignedToUserId = dto.AssignedToUserId,
            Remark = string.IsNullOrWhiteSpace(dto.Remark) ? "Grievance assigned to staff officer." : dto.Remark.Trim(),
            ActionAt = DateTime.Now
        };

        await _activityLogRepository.AddAsync(activityLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(grievanceId, cancellationToken);
    }

    public async Task<GrievanceApplicationDto?> ForwardToDepartmentAsync(
        int grievanceId, ForwardGrievanceDto dto, int actionByUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(grievanceId, cancellationToken);
        if (entity == null || !entity.IsActive)
            throw new KeyNotFoundException($"GrievanceApplication with ID '{grievanceId}' was not found.");

        var dept = await _departmentRepository.GetByIdAsync(dto.ForwardedToDeptId, cancellationToken);
        if (dept == null || !dept.IsActive)
            throw new ValidationException(nameof(dto.ForwardedToDeptId), "Active target department does not exist.", OperationType.Update);

        if (_workflowTransitionRepository != null)
        {
            var transitionQuery = _workflowTransitionRepository.GetQueryable();
            var forwardableTransitions = transitionQuery.Provider is IAsyncQueryProvider
                ? await transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.FromStateId == entity.CurrentStateId && t.IsActive && t.CanForwardToDept).ToListAsync(cancellationToken)
                : transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.FromStateId == entity.CurrentStateId && t.IsActive && t.CanForwardToDept).ToList();

            var allTransitionsFromState = transitionQuery.Provider is IAsyncQueryProvider
                ? await transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.FromStateId == entity.CurrentStateId && t.IsActive).ToListAsync(cancellationToken)
                : transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.FromStateId == entity.CurrentStateId && t.IsActive).ToList();

            if (allTransitionsFromState.Any() && !forwardableTransitions.Any())
            {
                throw new ValidationException(nameof(dto.ForwardedToDeptId), "Department forwarding is not permitted from the current workflow state.", OperationType.Update);
            }
        }

        if (dto.AssignedToUserId.HasValue && _userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(dto.AssignedToUserId.Value, cancellationToken);
            if (user == null || !user.IsActive)
                throw new ValidationException(nameof(dto.AssignedToUserId), "Active staff user does not exist.", OperationType.Update);
        }

        if (dto.UpdatePrimaryDepartment)
        {
            entity.GrievanceDepartmentId = dto.ForwardedToDeptId;
        }

        if (dto.AssignedToUserId.HasValue)
        {
            entity.CurrentAssignedToUserId = dto.AssignedToUserId.Value;
        }

        entity.UpdatedBy = actionByUserId;
        entity.UpdatedDate = DateTime.Now;
        await _repository.UpdateAsync(entity, cancellationToken);

        var activityLog = new GrievanceActivityLogEntity
        {
            GrievanceApplicationId = grievanceId,
            FromStateId = entity.CurrentStateId,
            ToStateId = entity.CurrentStateId,
            ActionByUserId = actionByUserId,
            AssignedToUserId = dto.AssignedToUserId,
            Remark = string.IsNullOrWhiteSpace(dto.Remark) ? $"Grievance forwarded to {dept.DepartmentName}." : dto.Remark.Trim(),
            ActionAt = DateTime.Now
        };

        if (_deptForwardingRepository != null)
        {
            var forwarding = new GrievanceDeptForwardingEntity
            {
                GrievanceApplicationId = grievanceId,
                ActivityLog = activityLog,
                ForwardedToDeptId = dto.ForwardedToDeptId,
                AssignedToUserId = dto.AssignedToUserId,
                ForwardingStatus = "PENDING",
                Remark = dto.Remark?.Trim(),
                ForwardedAt = DateTime.Now,
                IsActive = true,
                CreatedBy = actionByUserId,
                CreatedDate = DateTime.Now
            };
            activityLog.DeptForwardings.Add(forwarding);
            await _deptForwardingRepository.AddAsync(forwarding, cancellationToken);
        }

        await _activityLogRepository.AddAsync(activityLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(grievanceId, cancellationToken);
    }

    public async Task<GrievanceApplicationDto?> TransitionStateAsync(
        int grievanceId, TransitionGrievanceStateDto dto, int actionByUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _repository.GetByIdAsync(grievanceId, cancellationToken);
        if (entity == null || !entity.IsActive)
            throw new KeyNotFoundException($"GrievanceApplication with ID '{grievanceId}' was not found.");

        var targetState = await _workflowStateRepository.GetByIdAsync(dto.ToStateId, cancellationToken);
        if (targetState == null || !targetState.IsActive)
            throw new ValidationException(nameof(dto.ToStateId), "Active destination workflow state does not exist.", OperationType.Update);

        if (targetState.WorkflowId != entity.WorkflowId)
        {
            throw new ValidationException(nameof(dto.ToStateId), $"Destination state '{targetState.StateName}' does not belong to workflow ID '{entity.WorkflowId}'.", OperationType.Update);
        }

        var fromStateId = entity.CurrentStateId;
        int? resolvedTransitionId = dto.TransitionId;

        if (_workflowTransitionRepository != null)
        {
            var transitionQuery = _workflowTransitionRepository.GetQueryable();
            var workflowTransitions = transitionQuery.Provider is IAsyncQueryProvider
                ? await transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.IsActive).ToListAsync(cancellationToken)
                : transitionQuery.AsNoTracking().Where(t => t.WorkflowId == entity.WorkflowId && t.IsActive).ToList();

            var validTransition = workflowTransitions.FirstOrDefault(t => t.FromStateId == fromStateId && t.ToStateId == dto.ToStateId);
            if (validTransition == null)
            {
                throw new ValidationException(nameof(dto.ToStateId), $"Transition from state ID '{fromStateId}' to state ID '{dto.ToStateId}' is not permitted in workflow ID '{entity.WorkflowId}'.", OperationType.Update);
            }

            if (dto.TransitionId.HasValue && dto.TransitionId.Value != validTransition.Id)
            {
                throw new ValidationException(nameof(dto.TransitionId), $"Transition ID '{dto.TransitionId.Value}' does not match the valid transition ID '{validTransition.Id}'.", OperationType.Update);
            }

            resolvedTransitionId ??= validTransition.Id;

            if (validTransition.RemarkRequired && string.IsNullOrWhiteSpace(dto.Remark))
            {
                throw new ValidationException(nameof(dto.Remark), $"Remark is mandatory for transition '{validTransition.TransitionName}'.", OperationType.Update);
            }
        }

        if (dto.AssignedToUserId.HasValue && _userRepository != null)
        {
            var user = await _userRepository.GetByIdAsync(dto.AssignedToUserId.Value, cancellationToken);
            if (user == null || !user.IsActive)
                throw new ValidationException(nameof(dto.AssignedToUserId), "Active staff user does not exist.", OperationType.Update);
        }

        entity.CurrentStateId = dto.ToStateId;

        if (dto.AssignedToUserId.HasValue)
        {
            entity.CurrentAssignedToUserId = dto.AssignedToUserId.Value;
        }

        var upperStateName = targetState.StateName.ToUpperInvariant();
        if (targetState.IsFinal || upperStateName.Contains("RESOLV"))
        {
            entity.ResolvedDate ??= DateTime.Now;
        }
        if (targetState.IsFinal || upperStateName.Contains("CLOSE") || upperStateName.Contains("REJECT"))
        {
            entity.ClosedDate ??= DateTime.Now;
        }

        entity.UpdatedBy = actionByUserId;
        entity.UpdatedDate = DateTime.Now;
        await _repository.UpdateAsync(entity, cancellationToken);

        var activityLog = new GrievanceActivityLogEntity
        {
            GrievanceApplicationId = grievanceId,
            FromStateId = fromStateId,
            ToStateId = dto.ToStateId,
            TransitionId = resolvedTransitionId,
            ActionByUserId = actionByUserId,
            AssignedToUserId = dto.AssignedToUserId ?? entity.CurrentAssignedToUserId,
            Remark = string.IsNullOrWhiteSpace(dto.Remark) ? $"Transitioned to {targetState.StateName}." : dto.Remark.Trim(),
            ActionAt = DateTime.Now
        };

        await _activityLogRepository.AddAsync(activityLog, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(grievanceId, cancellationToken);
    }
}
