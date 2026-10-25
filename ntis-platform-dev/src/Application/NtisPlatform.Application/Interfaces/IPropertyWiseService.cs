using NtisPlatform.Application.DTOs.propertywise;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

public interface IPropertyWiseService : ICommonCrudService<
    GlobalSurveyWardAllocationEntity,
    PropertyWiseDto,
    CreatePropertyWiseDto,
    UpdatePropertyWiseDto,
    PropertyWiseQueryParameters,
    int>
{
    Task<List<PropertyWiseDto>> CreateAllocationsAsync(CreatePropertyWiseDto createDto, CancellationToken cancellationToken = default);
}