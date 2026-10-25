using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Services;

/// <inheritdoc cref="ICdcMasterProcessorTrigger"/>
public class CdcMasterProcessorTrigger : ICdcMasterProcessorTrigger
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CdcMasterProcessorTrigger> _logger;

    public CdcMasterProcessorTrigger(ApplicationDbContext context, ILogger<CdcMasterProcessorTrigger> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task TriggerAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"EXEC CORE.usp_ProcessCdcChanges @DepartmentCode={"PTIS"}, @ProcessingType={"MASTER"}", cancellationToken);
        }
        catch (Exception ex)
        {
            // Never rethrow — a CDC processing hiccup must not fail the master-data save that
            // triggered it. CdcMasterProcessorWorker's periodic poll will pick this change up later.
            _logger.LogWarning(ex, "CDC master-data processing trigger (usp_ProcessCdcChanges) failed");
        }
    }
}

