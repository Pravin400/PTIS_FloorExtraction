using System.Linq;
using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Application.Services;
using NtisPlatform.Application.Models;
using System.Threading;
using System.Threading.Tasks;

namespace NtisPlatform.Application.Services.GrievanceService;

public class GrievancePhotoTypeService : BaseCommonCrudService<
    GrievancePhotoTypeEntity,
    GrievancePhotoTypeDto,
    CreateGrievancePhotoTypeDto,
    UpdateGrievancePhotoTypeDto,
    GrievancePhotoTypeQueryParameters,
    int>, IGrievancePhotoTypeService
{
    public GrievancePhotoTypeService(
        IRepository<GrievancePhotoTypeEntity, int> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
        : base(repository, unitOfWork, mapper)
    {
    }

    protected override async Task<ValidationResult> ValidateForCreateAsync(
        GrievancePhotoTypeEntity entity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(entity.PhotoTypeCode))
        {
            var codeUpper = entity.PhotoTypeCode.Trim().ToUpper();
            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
                    ? await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
                        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AsNoTracking(queryable),
                        x => x.PhotoTypeCode != null && x.PhotoTypeCode.Trim().ToUpper() == codeUpper, cancellationToken)
                    : queryable.Any(x => x.PhotoTypeCode != null && x.PhotoTypeCode.Trim().ToUpper() == codeUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(entity.PhotoTypeCode), "Photo type code must be unique.");
                }
            }
        }

        return ValidationResult.Success();
    }

    protected override async Task<ValidationResult> ValidateForDeactivationAsync(
        int id, GrievancePhotoTypeEntity currentEntity, GrievancePhotoTypeEntity updatedEntity, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(updatedEntity.PhotoTypeCode))
        {
            var codeUpper = updatedEntity.PhotoTypeCode.Trim().ToUpper();
            var currentCodeUpper = currentEntity?.PhotoTypeCode?.Trim()?.ToUpper();

            if (string.Equals(codeUpper, currentCodeUpper, System.StringComparison.OrdinalIgnoreCase))
            {
                return ValidationResult.Success();
            }

            var queryable = _repository.GetQueryable();
            if (queryable != null)
            {
                bool exists = queryable.Provider is Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
                    ? await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
                        Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AsNoTracking(queryable),
                        x => x.Id != id && x.PhotoTypeCode != null && x.PhotoTypeCode.Trim().ToUpper() == codeUpper, cancellationToken)
                    : queryable.Any(x => x.Id != id && x.PhotoTypeCode != null && x.PhotoTypeCode.Trim().ToUpper() == codeUpper);

                if (exists)
                {
                    return ValidationResult.Failure(nameof(updatedEntity.PhotoTypeCode), "Photo type code must be unique.");
                }
            }
        }

        return ValidationResult.Success();
    }
}
