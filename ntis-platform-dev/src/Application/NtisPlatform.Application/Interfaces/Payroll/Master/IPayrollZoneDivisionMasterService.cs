using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Zone Division Master CRUD operations
/// </summary>
public interface IPayrollZoneDivisionMasterService : ICommonCrudService<PayrollZoneDivisionMasterEntity, PayrollZoneDivisionMasterDto, CreatePayrollZoneDivisionMasterDto, UpdatePayrollZoneDivisionMasterDto, PayrollZoneDivisionMasterQueryParameters, int>
{
}
