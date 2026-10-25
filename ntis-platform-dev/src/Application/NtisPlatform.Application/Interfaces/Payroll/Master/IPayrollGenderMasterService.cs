using NtisPlatform.Application.DTOs.Payroll.Master.GenderMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Gender Master CRUD operations
/// </summary>
public interface IPayrollGenderMasterService : ICommonCrudService<PayrollGenderMasterEntity, PayrollGenderMasterDto, CreatePayrollGenderMasterDto, UpdatePayrollGenderMasterDto, PayrollGenderMasterQueryParameters, int>
{
}
