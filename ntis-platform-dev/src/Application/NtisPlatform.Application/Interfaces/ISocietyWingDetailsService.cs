using NtisPlatform.Application.DTOs;
using NtisPlatform.Application.DTOs.Master.SocietyWingDetails;
using NtisPlatform.Application.Models;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Interfaces;

public interface ISocietyWingDetailsService : ICommonCrudService<SocietyWingDetailsEntity, SocietyWingDetailsDto, CreateSocietyWingDetailsDto, UpdateSocietyWingDetailsDto, SocietyWingDetailsQueryParameters, int>
{
    /// <summary>
    /// Retrieves properties by SocietyDetailId and PropertyNo from PropertyMast.
    /// Returns PropertyID, SocietyDetailId, concatenated PropertyNo-PartitionNo, OwnerName, OccupierName.
    /// </summary>
    Task<PagedResult<WingPropertyDetailsDto>> GetAllAsync(WingPropertyDetailsQueryParameters queryParameters, CancellationToken cancellationToken = default);
}
