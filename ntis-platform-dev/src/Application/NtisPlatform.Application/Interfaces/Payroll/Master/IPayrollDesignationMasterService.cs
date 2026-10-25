using NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Designation Master CRUD operations
/// </summary>
public interface IPayrollDesignationMasterService : ICommonCrudService<PayrollDesignationMasterEntity, PayrollDesignationMasterDto, CreatePayrollDesignationMasterDto, UpdatePayrollDesignationMasterDto, PayrollDesignationMasterQueryParameters, int>
{
}
