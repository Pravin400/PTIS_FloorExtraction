using NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll State Master CRUD operations
/// </summary>
public interface IPayrollStateMasterService : ICommonCrudService<PayrollStateMasterEntity, PayrollStateMasterDto, CreatePayrollStateMasterDto, UpdatePayrollStateMasterDto, PayrollStateMasterQueryParameters, int>
{
}
