using NtisPlatform.Application.DTOs.PolicyMast;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

public interface IPolicyMastService : ICommonCrudService<PolicyMastEntity, PolicyMastDto, CreatePolicyMastDto, UpdatePolicyMastDto, PolicyMastQueryParameters, int>
{
}
