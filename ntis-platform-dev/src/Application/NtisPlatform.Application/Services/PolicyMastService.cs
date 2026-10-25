using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.PolicyMast;
using NtisPlatform.Application.Enums;
using NtisPlatform.Application.Exceptions;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services;

public class PolicyMastService : BaseCommonCrudService<PolicyMastEntity, PolicyMastDto, CreatePolicyMastDto, UpdatePolicyMastDto, PolicyMastQueryParameters, int>, IPolicyMastService
{
    public PolicyMastService(IRepository<PolicyMastEntity, int> repository, IUnitOfWork unitOfWork, IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    protected override IQueryable<PolicyMastEntity> ApplyIncludes(IQueryable<PolicyMastEntity> query)
        => query.Include(p => p.PolicyConditionDetails.OrderBy(c => c.SequenceNo));

    public override async Task<PolicyMastDto> CreateAsync(CreatePolicyMastDto createDto, CancellationToken cancellationToken = default)
    {
        var entity = _mapper.Map<PolicyMastEntity>(createDto);

        var validation = await ValidateForCreateAsync(entity, cancellationToken);
        if (!validation.IsValid)
            throw new ValidationException("Validation failed for create operation", validation.ToDictionary(), OperationType.Create);

        foreach (var input in createDto.PolicyConditionDetails ?? new())
        {
            if (input.Id.HasValue)
                throw new ValidationException(nameof(input.Id), "Condition Id must be null when creating a policy.", OperationType.Create);

            entity.PolicyConditionDetails.Add(_mapper.Map<PolicyConditionDetailsEntity>(input));
        }

        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDto(entity);
    }

    public override async Task<PolicyMastDto?> UpdateAsync(int id, UpdatePolicyMastDto updateDto, CancellationToken cancellationToken = default)
    {
        var entity = await ApplyIncludes(_repository.GetQueryable())
            .FirstOrDefaultAsync(p => p.Id == id && !p.MarkedForDeletion, cancellationToken);
        if (entity == null)
            return null;

        _mapper.Map(updateDto, entity);

        if (updateDto.PolicyConditionDetails != null)
        {
            var existing = entity.PolicyConditionDetails.ToDictionary(c => c.Id);
            var kept = new HashSet<int>();
            foreach (var input in updateDto.PolicyConditionDetails)
            {
                if (input.Id is int childId)
                {
                    if (!existing.TryGetValue(childId, out var child))
                        throw new ValidationException(nameof(input.Id), $"Condition {childId} does not belong to policy {id}.", OperationType.Update);
_mapper.Map(input, child);
                    child.UpdatedBy = updateDto.UpdatedBy;
                    child.UpdatedDate = DateTime.Now;
                    kept.Add(childId);
                }
                else
                {
                    entity.PolicyConditionDetails.Add(_mapper.Map<PolicyConditionDetailsEntity>(input));
                }
            }
             foreach (var child in existing.Values.Where(c => !kept.Contains(c.Id)))
                child.IsActive = false;
        }

        await _repository.UpdateAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDto(entity);
    }

    private PolicyMastDto ToDto(PolicyMastEntity entity)
    {
        var dto = _mapper.Map<PolicyMastDto>(entity);
        dto.PolicyConditionDetails = dto.PolicyConditionDetails.OrderBy(c => c.SequenceNo).ToList();
        return dto;
    }

    public override async Task<PolicyMastDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await ApplyIncludes(_repository.GetQueryable())
            .FirstOrDefaultAsync(p => p.Id == id && !p.MarkedForDeletion, cancellationToken);
        if (entity == null)
            return null;

        var dto = _mapper.Map<PolicyMastDto>(entity);
        dto.PolicyConditionDetails = dto.PolicyConditionDetails.OrderBy(c => c.SequenceNo).ToList();
        return dto;
    }
}
