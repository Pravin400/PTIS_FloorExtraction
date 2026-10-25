using NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Interfaces.Payroll.Master;

/// <summary>
/// Service interface for Municipal Payroll Relationship Master CRUD operations
/// </summary>
public interface IPayrollRelationshipMasterService : ICommonCrudService<PayrollRelationshipMasterEntity, PayrollRelationshipMasterDto, CreatePayrollRelationshipMasterDto, UpdatePayrollRelationshipMasterDto, PayrollRelationshipMasterQueryParameters, int>
{
}
