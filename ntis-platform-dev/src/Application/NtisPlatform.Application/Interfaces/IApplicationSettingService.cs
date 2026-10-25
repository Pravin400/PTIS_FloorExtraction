using NtisPlatform.Application.DTOs.ApplicationSetting;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Service interface for ApplicationSetting CRUD operations
/// </summary>
public interface IApplicationSettingService : ICommonCrudService<ApplicationSettingEntity, ApplicationSettingDto, CreateApplicationSettingDto, UpdateApplicationSettingDto, ApplicationSettingQueryParameters, int>
{
    Task<List<ApplicationSettingModuleDto>> GetSettingsAsync(int? moduleId = null, CancellationToken cancellationToken = default);
}
