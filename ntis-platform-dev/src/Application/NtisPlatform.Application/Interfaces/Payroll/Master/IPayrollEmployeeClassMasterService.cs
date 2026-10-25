using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Employee Class Master CRUD operations
/// </summary>
public interface IPayrollEmployeeClassMasterService : ICommonCrudService<PayrollEmployeeClassMasterEntity, PayrollEmployeeClassMasterDto, CreatePayrollEmployeeClassMasterDto, UpdatePayrollEmployeeClassMasterDto, PayrollEmployeeClassMasterQueryParameters, int>
{
}
