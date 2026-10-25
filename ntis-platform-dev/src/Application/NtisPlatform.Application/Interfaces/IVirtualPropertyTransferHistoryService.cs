using NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;
using NtisPlatform.Application.Interfaces;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

public interface IVirtualPropertyTransferHistoryService : ICommonCrudService<VirtualPropertyTransferHistoryEntity, VirtualPropertyTransferHistoryDto, CreateVirtualPropertyTransferHistoryDto, UpdateVirtualPropertyTransferHistoryDto, VirtualPropertyTransferHistoryQueryParameters, int>
{
    Task<ApiResponse<List<VirtualPropertyTransferHistoryDto>>> BatchTransferAsync(BatchTransferRequestDto request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves virtual property transfer history matching the specified filter criteria.
    /// </summary>
    Task<ApiResponse<List<VirtualPropertyTransferHistoryDto>>> GetHistoryAsync(GetVirtualPropertyTransferHistoryRequestDto request, CancellationToken cancellationToken = default);
}
