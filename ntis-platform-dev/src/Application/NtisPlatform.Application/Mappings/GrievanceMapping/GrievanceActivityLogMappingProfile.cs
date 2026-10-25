using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceActivityLog;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceActivityLogMappingProfile : Profile
{
    public GrievanceActivityLogMappingProfile()
    {
        CreateMap<GrievanceActivityLogEntity, GrievanceActivityLogDto>()
            .ForMember(dest => dest.GrievanceNo, opt => opt.MapFrom(src => src.GrievanceApplication != null ? src.GrievanceApplication.GrievanceNo : null))
            .ForMember(dest => dest.FromStateName, opt => opt.MapFrom(src => src.FromState != null ? src.FromState.StateName : null))
            .ForMember(dest => dest.ToStateName, opt => opt.MapFrom(src => src.ToState != null ? src.ToState.StateName : null))
            .ForMember(dest => dest.TransitionName, opt => opt.MapFrom(src => src.Transition != null ? src.Transition.TransitionName : null))
            .ForMember(dest => dest.ActionByUserName, opt => opt.MapFrom(src => src.ActionByUser != null ? (src.ActionByUser.FirstName + " " + src.ActionByUser.LastName).Trim() : null))
            .ForMember(dest => dest.AssignedToUserName, opt => opt.MapFrom(src => src.AssignedToUser != null ? (src.AssignedToUser.FirstName + " " + src.AssignedToUser.LastName).Trim() : null));
    }
}
