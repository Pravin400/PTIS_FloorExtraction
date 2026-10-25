using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NtisPlatform.Application.Configuration;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Interfaces.GrievanceInterface;
using NtisPlatform.Core.Entities.GrievanceEntities;
using NtisPlatform.Infrastructure.Data;
using NtisPlatform.Infrastructure.Services.WhatsApp.Templates;

namespace NtisPlatform.Infrastructure.Services.WhatsApp.NotificationHandlers;

/// <summary>
/// Domain-level notification handler for Grievance events using modular WhatsApp templates.
/// Supports dynamic ON/OFF toggling directly from [Core].[ConfigValueMaster] without restarting the app.
/// </summary>
public class GrievanceWhatsAppNotificationService : IGrievanceWhatsAppNotificationService
{
    private readonly IWhatsAppClient _whatsAppClient;
    private readonly WhatsAppSettings _settings;
    private readonly IWhatsAppTemplateBuilder<GrievanceApplicationEntity> _submissionTemplate;
    private readonly ApplicationDbContext? _context;
    private readonly IMemoryCache? _memoryCache;
    private readonly ILogger<GrievanceWhatsAppNotificationService> _logger;

    public GrievanceWhatsAppNotificationService(
        IWhatsAppClient whatsAppClient,
        IOptions<WhatsAppSettings> options,
        IWhatsAppTemplateBuilder<GrievanceApplicationEntity> submissionTemplate,
        ILogger<GrievanceWhatsAppNotificationService> logger,
        ApplicationDbContext? context = null,
        IMemoryCache? memoryCache = null)
    {
        _whatsAppClient = whatsAppClient;
        _settings = options.Value;
        _submissionTemplate = submissionTemplate;
        _logger = logger;
        _context = context;
        _memoryCache = memoryCache;
    }

    /// <inheritdoc />
    public async Task<bool> SendGrievanceSubmissionWhatsAppNotificationAsync(
        GrievanceApplicationEntity application,
        CancellationToken cancellationToken = default)
    {
        if (application == null)
            throw new ArgumentNullException(nameof(application));

        try
        {
            if (!await IsWhatsAppEnabledAsync(cancellationToken))
            {
                _logger.LogInformation(
                    "[GrievanceWhatsApp] WhatsApp notifications are disabled in database ([Core].[ConfigValueMaster]). Skipping notification for Grievance {GrievanceNo}",
                    application.GrievanceNo);
                return false;
            }

            var request = _submissionTemplate.Build(application, _settings);
            if (request == null)
            {
                _logger.LogInformation(
                    "[GrievanceWhatsApp] Submission WhatsApp notification skipped for Grievance {GrievanceNo}. (Citizen phone missing or template '{EventKey}' not configured)",
                    application.GrievanceNo, _submissionTemplate.EventKey);
                return false;
            }

            var result = await _whatsAppClient.SendTemplateMessageAsync(request, cancellationToken);
            return result.IsSuccess;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GrievanceWhatsApp] Failed to dispatch submission notification for Grievance {GrievanceNo}", application.GrievanceNo);
            return false;
        }
    }

    /// <summary>
    /// Checks whether WhatsApp notifications are enabled in database ([Core].[ConfigValueMaster]).
    /// Database is the runtime source of truth.
    /// Results are cached for 5 seconds to ensure administrative changes take effect immediately.
    /// </summary>
    private async Task<bool> IsWhatsAppEnabledAsync(CancellationToken cancellationToken)
    {
        if (_context == null)
        {
            return _settings.IsEnabled;
        }

        const string cacheKey = "GrievanceWhatsApp_Db_IsEnabled";
        if (_memoryCache != null && _memoryCache.TryGetValue(cacheKey, out bool isCachedEnabled))
        {
            return isCachedEnabled;
        }

        try
        {
            // Query Core.ConfigCategoryMaster -> Core.ConfigKeyMaster -> Core.ConfigValueMaster
            var dbRecord = await (
                from cat in _context.ConfigCategoryMasters.AsNoTracking()
                where cat.CategoryCode.ToUpper() == "WHATSAPP"
                join key in _context.ConfigKeyMasters.AsNoTracking() on cat.Id equals key.CategoryId
                where key.ConfigCode.ToUpper() == "IS_ENABLED"
                join val in _context.ConfigValueMasters.AsNoTracking() on key.Id equals val.ConfigKeyId
                select new
                {
                    CatActive = cat.IsActive,
                    KeyActive = key.IsActive,
                    ValActive = val.IsActive,
                    Value = val.Value
                }
            ).FirstOrDefaultAsync(cancellationToken);

            bool isEnabled = false;

            if (dbRecord != null)
            {
                // If any hierarchy level (Category, Key, or Value) is deactivated in DB, it is DISABLED.
                if (!dbRecord.CatActive || !dbRecord.KeyActive || !dbRecord.ValActive)
                {
                    isEnabled = false;
                }
                else if (string.IsNullOrWhiteSpace(dbRecord.Value))
                {
                    isEnabled = false;
                }
                else
                {
                    var trimmed = dbRecord.Value.Trim();
                    if (bool.TryParse(trimmed, out var parsedBool))
                    {
                        isEnabled = parsedBool;
                    }
                    else if (string.Equals(trimmed, "1", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(trimmed, "yes", StringComparison.OrdinalIgnoreCase))
                    {
                        isEnabled = true;
                    }
                    else
                    {
                        isEnabled = false;
                    }
                }
            }

            if (_memoryCache != null)
            {
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(5))
                    .SetSize(1);
                _memoryCache.Set(cacheKey, isEnabled, cacheOptions);
            }

            return isEnabled;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[GrievanceWhatsApp] Failed to query WhatsApp configuration from database tables. Defaulting to disabled.");
            return false;
        }
    }
}
