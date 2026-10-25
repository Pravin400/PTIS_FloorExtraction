using NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Taluka Master CRUD operations
/// </summary>
public interface IPayrollTalukaMasterService : ICommonCrudService<PayrollTalukaMasterEntity, PayrollTalukaMasterDto, CreatePayrollTalukaMasterDto, UpdatePayrollTalukaMasterDto, PayrollTalukaMasterQueryParameters, int>
{
}
