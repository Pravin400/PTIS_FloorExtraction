using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.DTOs.Master.ScreenFieldValidation;
using NtisPlatform.Application.Interfaces.Master;
using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;
namespace NtisPlatform.Application.Services.Master;

public class ScreenFieldValidationService : IScreenFieldValidationService
{
    private readonly IRepository<ScreenFieldValidationEntity> _screenFieldValidationRepo;
    private readonly IRepository<ScreenButtonPermissionEntity> _screenButtonPermissionRepo;

    public ScreenFieldValidationService(
        IRepository<ScreenFieldValidationEntity> screenFieldValidationRepo,
        IRepository<ScreenButtonPermissionEntity> screenButtonPermissionRepo)
    {
        _screenFieldValidationRepo = screenFieldValidationRepo;
        _screenButtonPermissionRepo = screenButtonPermissionRepo;
    }

    public async Task<List<ScreenFieldValidationCustomDto>> GetAllAsync(
        ScreenFieldValidationQueryParameters queryParameters,CancellationToken ct = default)
    {
        var result = new Dictionary<int, ScreenFieldValidationCustomDto>();

        // Field Validation Data
        var fieldRows = await _screenFieldValidationRepo.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive &&
                x.ScreenMaster!.IsActive &&
                x.ScreenFieldMaster!.IsActive &&
                x.ScreenFieldMaster.FieldType!.IsActive &&
                x.ScreenMaster!.DepartmentId == queryParameters.DepartmentId &&
                x.ScreenMaster.ModuleId == queryParameters.ModuleId &&
                (queryParameters.ScreenId == 0 || x.ScreenId == queryParameters.ScreenId))
            .Select(x => new
            {
                x.ScreenId,
                ScreenName = x.ScreenMaster!.ScreenName,
                ScreenNameLocal = x.ScreenMaster.ScreenNameLocal,
                Field = new FieldValidationDetailsDto
                {
                    FieldCode = x.ScreenFieldMaster!.FieldCode,
                    FieldName = x.ScreenFieldMaster.FieldName,
                    FieldTypeName = x.ScreenFieldMaster.FieldType!.FieldTypeName,
                    MinLength = x.MinLength,
                    MaxLength = x.MaxLength,
                    ValidationExpression = x.ValidationExpression,
                    ErrorMessage = x.ErrorMessage,
                    IsVisible = x.IsVisible,
                    IsMandatory = x.IsMandatory,
                    IsReadonly = x.IsReadonly
                }
            })
            .ToListAsync(ct);

        // Button Permission Data
        var buttonRows = await _screenButtonPermissionRepo.GetQueryable().AsNoTracking()
            .Where(x => x.IsActive &&
                x.ScreenMaster!.IsActive &&
                x.ScreenButtonMaster!.IsActive &&
                x.ScreenButtonMaster.ButtonTypeMaster!.IsActive &&
                x.ScreenMaster!.DepartmentId == queryParameters.DepartmentId &&
                x.ScreenMaster.ModuleId == queryParameters.ModuleId &&
                (queryParameters.ScreenId == 0 || x.ScreenId == queryParameters.ScreenId))
            .Select(x => new
            {
                x.ScreenId,
                ScreenName = x.ScreenMaster!.ScreenName,
                ScreenNameLocal = x.ScreenMaster.ScreenNameLocal,
                Button = new ButtonPermissionDetailsDto
                {
                    ButtonCode = x.ScreenButtonMaster!.ButtonCode,
                    ButtonName = x.ScreenButtonMaster.ButtonName,
                    ButtonTypeName = x.ScreenButtonMaster.ButtonTypeMaster!.ButtonTypeName,
                    IsVisible = x.IsVisible ?? true,
                    IsEnabled = x.IsEnabled ?? true
                }
            })
            .ToListAsync(ct);

        // Merge Field Data
        foreach (var row in fieldRows)
        {
            if (!result.TryGetValue(row.ScreenId, out var screen))
            {
                screen = new ScreenFieldValidationCustomDto
                {
                    ScreenId = row.ScreenId,
                    ScreenName = row.ScreenName,
                    ScreenNameLocal = row.ScreenNameLocal
                };
                result.Add(row.ScreenId, screen);
            }
            if (!screen.FieldValidationDetails.Any(x => x.FieldCode == row.Field.FieldCode))
            {
                screen.FieldValidationDetails.Add(row.Field);
            }
        }

        // Merge Button Data
        foreach (var row in buttonRows)
        {
            if (!result.TryGetValue(row.ScreenId, out var screen))
            {
                screen = new ScreenFieldValidationCustomDto
                {
                    ScreenId = row.ScreenId,
                    ScreenName = row.ScreenName,
                    ScreenNameLocal = row.ScreenNameLocal
                };
                result.Add(row.ScreenId, screen);
            }
            if (!screen.ButtonPermissionDetails.Any(x => x.ButtonCode == row.Button.ButtonCode))
            {
                screen.ButtonPermissionDetails.Add(row.Button);
            }
        }

        // Final Response
        return result.Values
            .Where(x => x.FieldValidationDetails.Any() || x.ButtonPermissionDetails.Any())
            .Select(x =>
            {
                x.FieldValidationDetails = x.FieldValidationDetails.OrderBy(f => f.FieldCode).ToList();
                x.ButtonPermissionDetails = x.ButtonPermissionDetails.OrderBy(b => b.ButtonCode).ToList();
                return x;
            })
            .OrderBy(x => x.ScreenId)
            .ToList();
    }
}
