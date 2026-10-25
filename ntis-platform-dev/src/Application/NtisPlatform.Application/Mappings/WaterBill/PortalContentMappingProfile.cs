using AutoMapper;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Application.Mappings.WaterBill;

public class PortalContentMappingProfile : Profile
{
    public PortalContentMappingProfile()
    {
        CreateMap<PortalContentEntity, PortalContentDto>();

        CreateMap<CreatePortalContentDto, PortalContentEntity>()
            .ForMember(dest => dest.Department, opt => opt.Ignore());

        CreateMap<UpdatePortalContentDto, PortalContentEntity>()
            .ForMember(dest => dest.Department, opt => opt.Ignore());
    }
}
