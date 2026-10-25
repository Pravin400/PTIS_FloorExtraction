using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Employee Type Master CRUD operations
/// </summary>
public interface IPayrollEmployeeTypeMasterService : ICommonCrudService<PayrollEmployeeTypeMasterEntity, PayrollEmployeeTypeMasterDto, CreatePayrollEmployeeTypeMasterDto, UpdatePayrollEmployeeTypeMasterDto, PayrollEmployeeTypeMasterQueryParameters, int>
{
}
