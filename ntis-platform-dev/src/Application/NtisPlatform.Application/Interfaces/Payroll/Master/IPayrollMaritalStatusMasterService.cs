using NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Marital Status Master CRUD operations
/// </summary>
public interface IPayrollMaritalStatusMasterService : ICommonCrudService<PayrollMaritalStatusMasterEntity, PayrollMaritalStatusMasterDto, CreatePayrollMaritalStatusMasterDto, UpdatePayrollMaritalStatusMasterDto, PayrollMaritalStatusMasterQueryParameters, int>
{
}
