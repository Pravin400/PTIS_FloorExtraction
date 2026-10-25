using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Application.Services.GrievanceService;

public class CitizenMasterService : BaseCommonCrudService<CitizenMasterEntity, CitizenMasterDto, CreateCitizenMasterDto, UpdateCitizenMasterDto, CitizenMasterQueryParameters, int>, ICitizenMasterService
{
    public CitizenMasterService(
        IRepository<CitizenMasterEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    public async Task<CitizenMasterDto?> GetByMobileNoAsync(string mobileNo, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(mobileNo))
            return null;

        var normalizedMobile = mobileNo.Trim();
        var queryable = _repository.GetQueryable();

        var entity = queryable.Provider is IAsyncQueryProvider
            ? await queryable.AsNoTracking().FirstOrDefaultAsync(x => x.IsActive && x.MobileNo == normalizedMobile, cancellationToken)
            : queryable.AsNoTracking().FirstOrDefault(x => x.IsActive && x.MobileNo == normalizedMobile);

        return entity == null ? null : _mapper.Map<CitizenMasterDto>(entity);
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        CitizenMasterEntity entity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(entity.MobileNo))
        {
            var normalizedMobile = entity.MobileNo.Trim();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.MobileNo == normalizedMobile, cancellationToken)
                    : queryable.Any(x => x.MobileNo == normalizedMobile);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.MobileNo), "Citizen with this mobile number already exists.");
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, CitizenMasterEntity currentEntity, CitizenMasterEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(updatedEntity.MobileNo))
        {
            var newMobile = updatedEntity.MobileNo.Trim();
            var currentMobile = currentEntity?.MobileNo?.Trim();

            // Skip uniqueness check if MobileNo didn't change
            if (string.Equals(newMobile, currentMobile, StringComparison.OrdinalIgnoreCase))
            {
                return ValidationResult.Success();
            }

            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is IAsyncQueryProvider
                    ? await queryable.AsNoTracking().AnyAsync(x => x.Id != id && x.MobileNo == newMobile, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.MobileNo == newMobile);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.MobileNo), "Citizen with this mobile number already exists.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
