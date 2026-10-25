namespace NtisPlatform.Application.Interfaces;

/// <summary>
/// Best-effort trigger for PTIS.usp_ProcessCdcChanges(@ProcessingType='MASTER') — called by master-data
/// CRUD services right after their own save commits, so the Add Taxes "master data changed" banner
/// reflects an in-app edit within seconds. Direct SQL-script edits (which never call this) are still
/// picked up by CdcMasterProcessorWorker's periodic safety-net poll.
/// </summary>
public interface ICdcMasterProcessorTrigger
{
    Task TriggerAsync(CancellationToken cancellationToken = default);
}
