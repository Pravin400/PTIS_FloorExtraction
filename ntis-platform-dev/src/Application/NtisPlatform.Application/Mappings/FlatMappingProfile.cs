using AutoMapper;
using NtisPlatform.Application.DTOs.Flat;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

public class FlatMappingProfile : Profile
{
    public FlatMappingProfile()
    {
        CreateMap<PropertyEntity, FlatDto>()
            .ForMember(dest => dest.PropertyId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.WingDetailsId, opt => opt.MapFrom(src => src.WingDetailId))
            .ForMember(dest => dest.FlatShopNumber, opt => opt.MapFrom(src => src.FlatOrShopNo));

        CreateMap<UpdateFlatDto, PropertyEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.FlatOrShopNo, opt => opt.MapFrom(src => src.FlatShopNumber))
            .ForMember(dest => dest.WingDetailId, opt => opt.MapFrom(src => src.WingDetailsId))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        CreateMap<CreateFlatDto, PropertyEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.FlatOrShopNo, opt => opt.MapFrom(src => src.FlatShopNumber))
            .ForMember(dest => dest.WingDetailId, opt => opt.MapFrom(src => src.WingDetailsId))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));
    }
}
