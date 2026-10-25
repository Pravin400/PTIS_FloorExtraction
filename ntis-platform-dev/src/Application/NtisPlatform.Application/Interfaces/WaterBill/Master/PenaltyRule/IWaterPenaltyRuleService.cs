using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;

public interface IWaterPenaltyRuleService
    : ICommonCrudService<WaterPenaltyRuleMasterEntity, WaterPenaltyRuleDto, CreateWaterPenaltyRuleDto, UpdateWaterPenaltyRuleDto, WaterPenaltyRuleQueryParameters, long>
{
    Task<bool> UpdateStatusAsync(long id, bool isActive, int? updatedBy = null, CancellationToken cancellationToken = default);
    Task<WaterPenaltyRuleValidationResultDto> ValidateConflictAsync(WaterPenaltyRuleValidationRequestDto request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(long id, int userId, CancellationToken cancellationToken = default);
}
