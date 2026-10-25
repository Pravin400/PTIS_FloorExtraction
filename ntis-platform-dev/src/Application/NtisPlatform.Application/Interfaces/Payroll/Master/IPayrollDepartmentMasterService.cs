using NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Department Master CRUD operations
/// </summary>
public interface IPayrollDepartmentMasterService : ICommonCrudService<PayrollDepartmentMasterEntity, PayrollDepartmentMasterDto, CreatePayrollDepartmentMasterDto, UpdatePayrollDepartmentMasterDto, PayrollDepartmentMasterQueryParameters, int>
{
}
