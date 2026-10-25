using NtisPlatform.Application.DTOs.Payroll.Master.QualificationMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Qualification Master CRUD operations
/// </summary>
public interface IPayrollQualificationMasterService : ICommonCrudService<PayrollQualificationMasterEntity, PayrollQualificationMasterDto, CreatePayrollQualificationMasterDto, UpdatePayrollQualificationMasterDto, PayrollQualificationMasterQueryParameters, int>
{
}
