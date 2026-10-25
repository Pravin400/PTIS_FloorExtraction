using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.GeographyTypeMaster;

public interface IGeographyTypeMasterService
    : ICommonCrudService<GeographyTypeMasterEntity, GeographyTypeMasterDto, CreateGeographyTypeMasterDto, UpdateGeographyTypeMasterDto, GeographyTypeMasterQueryParameters, int>
{
}
