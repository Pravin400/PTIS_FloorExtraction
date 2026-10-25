using NtisPlatform.Application.DTOs.DeleteFlat;

namespace NtisPlatform.Application.Interfaces;

public interface IDeleteFlatService
{
    Task<DeleteFlatResponseDto> SoftDeleteFlatAsync(DeleteFlatRequestDto requestDto, int currentUserId, CancellationToken cancellationToken = default);
}
