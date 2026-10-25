using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Village Master CRUD operations
/// </summary>
public interface IPayrollVillageMasterService : ICommonCrudService<PayrollVillageMasterEntity, PayrollVillageMasterDto, CreatePayrollVillageMasterDto, UpdatePayrollVillageMasterDto, PayrollVillageMasterQueryParameters, int>
{
}
