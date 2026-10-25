using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceTypeMaster;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

/// <summary>
/// Service interface for Grievance Type Master CRUD operations
/// </summary>
public interface IGrievanceTypeService : ICommonCrudService<
    GrievanceTypeMasterEntity,
    GrievanceTypeDto,
    CreateGrievanceTypeDto,
    UpdateGrievanceTypeDto,
    GrievanceTypeQueryParameters,
    int>
{
}
