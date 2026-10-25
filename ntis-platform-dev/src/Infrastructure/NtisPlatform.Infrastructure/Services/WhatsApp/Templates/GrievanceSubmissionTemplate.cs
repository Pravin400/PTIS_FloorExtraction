using System.Globalization;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.DTOs.WhatsApp;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.Templates;

/// <summary>
/// Template builder for the approved 'grievance_3' template.
/// Dynamically resolves all placeholders from the grievance application entity and WhatsAppSettings.
/// Placeholders:
/// {{1}}: Citizen Name
/// {{2}}: Token No
/// {{3}}: Department Name
/// {{4}}: Grievance Type
/// {{5}}: Formatted Date
/// {{6}}: Current Status (सद्यस्थिती - dynamically loaded from configuration or entity)
/// Button: Dynamic tracking token
/// </summary>
public class GrievanceSubmissionTemplate : IWhatsAppTemplateBuilder<GrievanceApplicationEntity>
{
    public const string DefaultEventKey = "Submission";

    public string EventKey => DefaultEventKey;

    public WhatsAppMessageRequest? Build(GrievanceApplicationEntity application, WhatsAppSettings settings)
    {
        if (application == null || settings == null)
            return null;

        var templateName = settings.GetTemplate(EventKey);
        if (string.IsNullOrWhiteSpace(templateName))
        {
            // Template not configured in appsettings.json
            return null;
        }

        var rawMobile = application.Citizen?.MobileNo;
        if (string.IsNullOrWhiteSpace(rawMobile))
        {
            return null;
        }

        var defaults = settings.Defaults ?? new WhatsAppDefaultsSettings();

        // 1. Citizen Name (dynamic from entity or configured default)
        var citizenName = !string.IsNullOrWhiteSpace(application.Citizen?.Name)
            ? application.Citizen.Name.Trim()
            : defaults.DefaultCitizenName;

        // 2. Token Number (dynamic from entity or formatted with configured prefix)
        var tokenNo = !string.IsNullOrWhiteSpace(application.GrievanceNo)
            ? application.GrievanceNo
            : (!string.IsNullOrWhiteSpace(defaults.GrievancePrefix)
                ? $"{defaults.GrievancePrefix}-{application.Id}"
                : application.Id.ToString());

        // 3. Department Name (Local or default from entity, or configured default)
        var departmentName = !string.IsNullOrWhiteSpace(application.GrievanceDepartment?.DepartmentNameLocal)
            ? application.GrievanceDepartment.DepartmentNameLocal.Trim()
            : (!string.IsNullOrWhiteSpace(application.GrievanceDepartment?.DepartmentName)
                ? application.GrievanceDepartment.DepartmentName.Trim()
                : defaults.DefaultDepartmentName);

        // 4. Grievance Type (dynamic from entity or configured default)
        var grievanceType = !string.IsNullOrWhiteSpace(application.GrievanceType?.GrievanceType)
            ? application.GrievanceType.GrievanceType.Trim()
            : defaults.DefaultGrievanceType;

        // 5. Date formatted in dynamically configured timezone
        var timeZone = ResolveTimeZone(settings.TimeZoneId);
        var istDateTime = TimeZoneInfo.ConvertTime(application.SubmittedDate, TimeZoneInfo.Utc, timeZone);
        var formattedDate = istDateTime.ToString("dd MMMM yyyy", CultureInfo.InvariantCulture);

        // 6. Current Status (सद्यस्थिती) - dynamically loaded from appsettings.json, or falling back to entity workflow state
        var resolvedStatus = !string.IsNullOrWhiteSpace(defaults.DefaultStatus)
            ? defaults.DefaultStatus
            : (!string.IsNullOrWhiteSpace(application.CurrentState?.StateNameLocal)
                ? application.CurrentState.StateNameLocal
                : application.CurrentState?.StateName);

        // Ensure 1 leading space so template placeholder '• सद्यस्थिती:{{6}}' renders cleanly with space
        var currentStatus = string.IsNullOrWhiteSpace(resolvedStatus)
            ? string.Empty
            : (resolvedStatus.StartsWith(" ") ? resolvedStatus : $" {resolvedStatus.Trim()}");

        var language = !string.IsNullOrWhiteSpace(settings.DefaultLanguage)
            ? settings.DefaultLanguage
            : string.Empty;

        return new WhatsAppMessageRequest
        {
            CountryCode = settings.DefaultCountryCode,
            MobileNo = rawMobile,
            TemplateName = templateName,
            Language = language,
            BodyParameters = new[]
            {
                citizenName,
                tokenNo,
                departmentName,
                grievanceType,
                formattedDate,
                currentStatus
            },
            ButtonParameters = new[]
            {
                tokenNo
            },
            Metadata = new Dictionary<string, string>
            {
                ["GrievanceId"] = application.Id.ToString(),
                ["GrievanceNo"] = tokenNo,
                ["EventType"] = EventKey
            }
        };
    }

    private static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
            return TimeZoneInfo.Utc;

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }
}
