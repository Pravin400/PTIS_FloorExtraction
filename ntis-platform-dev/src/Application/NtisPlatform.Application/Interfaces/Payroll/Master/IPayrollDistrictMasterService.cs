using NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll District Master CRUD operations
/// </summary>
public interface IPayrollDistrictMasterService : ICommonCrudService<PayrollDistrictMasterEntity, PayrollDistrictMasterDto, CreatePayrollDistrictMasterDto, UpdatePayrollDistrictMasterDto, PayrollDistrictMasterQueryParameters, int>
{
}
