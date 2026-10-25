using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities.WaterBill.Master;

namespace NtisPlatform.Application.Interfaces.WaterBill.Master.PenaltyRule;

public interface IWaterPenaltyRuleValidationService
{
    Task<ValidationResult> ValidateRuleAsync(
        WaterPenaltyRuleMasterEntity rule,
        long? excludeRuleId = null,
        CancellationToken cancellationToken = default);

    Task<WaterPenaltyRuleValidationResultDto> ValidateConflictAsync(
        WaterPenaltyRuleValidationRequestDto request,
        CancellationToken cancellationToken = default);
}
