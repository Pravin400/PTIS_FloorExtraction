using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Blood Group Master CRUD operations
/// </summary>
public interface IPayrollBloodGroupMasterService : ICommonCrudService<PayrollBloodGroupMasterEntity, PayrollBloodGroupMasterDto, CreatePayrollBloodGroupMasterDto, UpdatePayrollBloodGroupMasterDto, PayrollBloodGroupMasterQueryParameters, int>
{
}
