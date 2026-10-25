using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NtisPlatform.Application.DTOs.Grievance;

namespace NtisPlatform.Application.Interfaces.GrievanceInterface;

public interface IGrievancePhotoService
{
    Task<IEnumerable<GrievancePhotoDto>> GetPhotosByGrievanceIdAsync(int grievanceId, CancellationToken cancellationToken = default);
    Task<int> UploadPhotoAsync(UploadGrievancePhotoDto dto, int userId, CancellationToken cancellationToken = default);
    Task<List<int>> UploadMultiplePhotosAsync(UploadMultipleGrievancePhotosDto dto, int userId, CancellationToken cancellationToken = default);
    Task DeletePhotoAsync(int id, int userId, CancellationToken cancellationToken = default);
    Task<(System.IO.Stream? FileStream, string FileName, string MimeType)> ViewPhotoAsync(int id, CancellationToken cancellationToken = default);
}
