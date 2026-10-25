using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Employee Status Master CRUD operations
/// </summary>
public interface IPayrollEmployeeStatusMasterService : ICommonCrudService<PayrollEmployeeStatusMasterEntity, PayrollEmployeeStatusMasterDto, CreatePayrollEmployeeStatusMasterDto, UpdatePayrollEmployeeStatusMasterDto, PayrollEmployeeStatusMasterQueryParameters, int>
{
}
