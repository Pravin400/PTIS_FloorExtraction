using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievancePhotoType;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

public interface IGrievancePhotoTypeService : ICommonCrudService<
    GrievancePhotoTypeEntity,
    GrievancePhotoTypeDto,
    CreateGrievancePhotoTypeDto,
    UpdateGrievancePhotoTypeDto,
    GrievancePhotoTypeQueryParameters,
    int>
{
}
