using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using NtisPlatform.Application.DTOs.PropertyCertificate;
using NtisPlatform.Application.Interfaces;

namespace NtisPlatform.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time tax calculation progress and completion events.
/// Clients (browser UI) connect to this hub to receive live updates without polling.
/// </summary>
public class TaxCalculationHub : Hub
{
    public async Task SubscribeToSociety(int societyDetailId)
    {
        if (societyDetailId > 0)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"society:{societyDetailId}");
        }
    }

    public async Task UnsubscribeFromSociety(int societyDetailId)
    {
        if (societyDetailId > 0)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"society:{societyDetailId}");
        }
    }

    public async Task SubscribeToWing(int wingDetailId)
    {
        if (wingDetailId > 0)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"wing:{wingDetailId}");
        }
    }

    public async Task SubscribeToProperty(int propertyId)
    {
        if (propertyId > 0)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"property:{propertyId}");
        }
    }

    public async Task SubscribeToUser()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        }
    }
}

/// <summary>
/// Broadcasts tax calculation events to connected SignalR clients.
/// </summary>
public class SignalRTaxCalculationNotifier : ITaxCalculationNotifier
{
    private readonly IHubContext<TaxCalculationHub> _hubContext;
    private readonly ILogger<SignalRTaxCalculationNotifier> _logger;

    public SignalRTaxCalculationNotifier(
        IHubContext<TaxCalculationHub> hubContext,
        ILogger<SignalRTaxCalculationNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyProgressAsync(TaxCalculationProgressDto progress, CancellationToken cancellationToken = default)
    {
        try
        {
            if (progress.SocietyDetailId.HasValue && progress.SocietyDetailId.Value > 0)
            {
                await _hubContext.Clients
                    .Group($"society:{progress.SocietyDetailId.Value}")
                    .SendAsync("OnTaxRecalculationProgress", progress, cancellationToken);
            }

            if (progress.WingDetailId.HasValue && progress.WingDetailId.Value > 0)
            {
                await _hubContext.Clients
                    .Group($"wing:{progress.WingDetailId.Value}")
                    .SendAsync("OnTaxRecalculationProgress", progress, cancellationToken);
            }

            // Also broadcast to All connected clients to guarantee delivery across pages
            await _hubContext.Clients.All
                .SendAsync("OnTaxRecalculationProgress", progress, cancellationToken);

            _logger.LogDebug("Broadcasted tax calculation progress for Job {JobId}: {Processed}/{Total} ({Percent}%)",
                progress.JobId, progress.ProcessedUnits, progress.TotalUnits, progress.PercentComplete);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast SignalR tax calculation progress for Job {JobId}", progress.JobId);
        }
    }

    public async Task NotifyCompletedAsync(TaxCalculationCompletedDto completed, CancellationToken cancellationToken = default)
    {
        try
        {
            if (completed.SocietyDetailId.HasValue && completed.SocietyDetailId.Value > 0)
            {
                await _hubContext.Clients
                    .Group($"society:{completed.SocietyDetailId.Value}")
                    .SendAsync("OnTaxRecalculationCompleted", completed, cancellationToken);
            }

            if (completed.WingDetailId.HasValue && completed.WingDetailId.Value > 0)
            {
                await _hubContext.Clients
                    .Group($"wing:{completed.WingDetailId.Value}")
                    .SendAsync("OnTaxRecalculationCompleted", completed, cancellationToken);
            }

            // Also broadcast to All connected clients to trigger table / grid auto-refresh
            await _hubContext.Clients.All
                .SendAsync("OnTaxRecalculationCompleted", completed, cancellationToken);

            _logger.LogInformation("Broadcasted tax calculation completion for Job {JobId}: Succeeded={Succeeded}, Failed={Failed}",
                completed.JobId, completed.SucceededCount, completed.FailedCount);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast SignalR tax calculation completion for Job {JobId}", completed.JobId);
        }
    }
}
