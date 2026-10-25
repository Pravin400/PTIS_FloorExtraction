using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Service interface for Flat CRUD operations, extending Generic CRUD service (ICommonCrudService).
/// Supports validating active status, marked for deletion checks, and duplicate flat/shop number verification.
/// </summary>
public interface IFlatService : ICommonCrudService<PropertyEntity, FlatDto, CreateFlatDto, UpdateFlatDto, FlatQueryParameters, int>
{
}
