using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.CitizenMaster;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class CitizenMasterMappingProfile : Profile
{
    public CitizenMasterMappingProfile()
    {
        CreateMap<CitizenMasterEntity, CitizenMasterDto>();

        CreateMap<CreateCitizenMasterDto, CitizenMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsVerified, opt => opt.Ignore())
            .ForMember(dest => dest.FailedOtpCount, opt => opt.Ignore())
            .ForMember(dest => dest.LockedUntilAt, opt => opt.Ignore())
            .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OtpLogs, opt => opt.Ignore());

        CreateMap<UpdateCitizenMasterDto, CitizenMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsVerified, opt => opt.Ignore())
            .ForMember(dest => dest.FailedOtpCount, opt => opt.Ignore())
            .ForMember(dest => dest.LockedUntilAt, opt => opt.Ignore())
            .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OtpLogs, opt => opt.Ignore());
    }
}
