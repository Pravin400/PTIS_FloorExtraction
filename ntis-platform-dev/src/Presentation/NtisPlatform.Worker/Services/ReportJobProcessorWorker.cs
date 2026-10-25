using Microsoft.EntityFrameworkCore;
using NtisPlatform.Application.Interfaces.HtmlReport;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Worker.Services;

/// <summary>
/// Background worker service for processing HTML Report generation jobs asynchronously.
/// </summary>
public class ReportJobProcessorWorker : BackgroundService
{
    private readonly ILogger<ReportJobProcessorWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;

    public ReportJobProcessorWorker(
        ILogger<ReportJobProcessorWorker> logger,
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Report Job Processor Worker starting at: {time}", DateTimeOffset.Now);

        var pollIntervalSeconds = _configuration.GetValue<int>("ReportingWorker:PollIntervalSeconds", 2);
        var reportCode = _configuration.GetValue<string>("ReportingWorker:ReportCode");
        _logger.LogInformation("Report Job Processor Config - Poll Interval: {PollIntervalSeconds}s", pollIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _serviceProvider.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<ReportingDbContext>();
                var now = DateTime.UtcNow;

                // Poll for the oldest Queued or stranded Processing job
                var eligibleJobs = db.HtmlReportJobs
                    .Where(j => !j.CancellationRequested
                        && j.AttemptCount < j.MaxAttemptCount
                        && (j.Status == "Queued" || (j.Status == "Processing" && j.LeaseExpiresAt < now))
                        && (j.NextAttemptDate == null || j.NextAttemptDate <= now))
                    .AsQueryable();
                if (!string.IsNullOrWhiteSpace(reportCode))
                    eligibleJobs = eligibleJobs.Where(j => j.ReportCode == reportCode);
                var job = await eligibleJobs.OrderBy(j => j.CreatedDate)
                    .FirstOrDefaultAsync(stoppingToken);

                if (job != null)
                {
                    _logger.LogInformation("Found queued report job {JobId} for report {ReportCode}. Claiming...", job.Id, job.ReportCode);

                    job.Status = "Processing";
                    job.Stage = "Processing";
                    job.StartedDate ??= now;
                    job.LeaseId = Guid.NewGuid();
                    job.LeaseExpiresAt = now.AddMinutes(5);
                    job.AttemptCount++;

                    try
                    {
                        await db.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation("Successfully claimed report job {JobId}. Rendering...", job.Id);
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        _logger.LogWarning("Report job {JobId} was already claimed by another worker. Skipping.", job.Id);
                        continue;
                    }

                    var reportService = scope.ServiceProvider.GetRequiredService<IHtmlReportService>();
                    try
                    {
                        await reportService.ProcessQueuedJobAsync(job.Id, stoppingToken);
                        _logger.LogInformation("Report job {JobId} completed successfully.", job.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing report job {JobId}", job.Id);

                        job.Status = job.AttemptCount >= job.MaxAttemptCount ? "Failed" : "Queued";
                        job.Stage = job.Status;
                        job.ErrorMessage = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                        job.NextAttemptDate = now.AddSeconds(10);
                        await db.SaveChangesAsync(stoppingToken);
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(pollIntervalSeconds), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Report Job Processor Worker main loop");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Report Job Processor Worker stopping at: {time}", DateTimeOffset.Now);
    }
}
