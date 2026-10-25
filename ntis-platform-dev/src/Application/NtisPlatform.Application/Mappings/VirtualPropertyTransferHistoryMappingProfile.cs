using AutoMapper;
using NtisPlatform.Application.DTOs.VirtualPropertyTransferHistory;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

public class VirtualPropertyTransferHistoryMappingProfile : Profile
{
    public VirtualPropertyTransferHistoryMappingProfile()
    {
        CreateMap<VirtualPropertyTransferHistoryEntity, VirtualPropertyTransferHistoryDto>()
            .ForMember(dest => dest.WingDetailIds, opt => opt.Ignore())
            .ForMember(dest => dest.SocityDetailMastIds, opt => opt.Ignore());

        CreateMap<CreateVirtualPropertyTransferHistoryDto, VirtualPropertyTransferHistoryEntity>();

        CreateMap<UpdateVirtualPropertyTransferHistoryDto, VirtualPropertyTransferHistoryEntity>();
    }
}
