using AutoMapper;
using NtisPlatform.Application.DTOs.WaterBill;
using NtisPlatform.Core.Entities.WaterBill;

namespace NtisPlatform.Application.Mappings.WaterBill;

public class CitizenServiceMappingProfile : Profile
{
    public CitizenServiceMappingProfile()
    {
        CreateMap<CitizenServiceEntity, CitizenServiceDto>()
            .ReverseMap()
            .ForMember(dest => dest.Department, opt => opt.Ignore());

        CreateMap<CreateCitizenServiceDto, CitizenServiceEntity>()
            .ForMember(dest => dest.Department, opt => opt.Ignore());

        CreateMap<UpdateCitizenServiceDto, CitizenServiceEntity>()
            .ForMember(dest => dest.Department, opt => opt.Ignore());
    }
}
