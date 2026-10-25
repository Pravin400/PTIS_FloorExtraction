using NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.ReadingSourceMaster;

public interface IReadingSourceMasterService
    : ICommonCrudService<ReadingSourceMasterEntity, ReadingSourceMasterDto, CreateReadingSourceMasterDto, UpdateReadingSourceMasterDto, ReadingSourceMasterQueryParameters, int>
{
}
