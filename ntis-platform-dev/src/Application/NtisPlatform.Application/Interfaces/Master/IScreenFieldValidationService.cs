using NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;

namespace NtisPlatform.Application.Interfaces.Master;

public interface IScreenFieldValidationService
{
    Task<List<ScreenFieldValidationCustomDto>> GetAllAsync(ScreenFieldValidationQueryParameters queryParameters, CancellationToken ct = default);
}
