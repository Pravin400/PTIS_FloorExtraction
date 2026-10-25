using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflow;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceWorkflowMappingProfile : Profile
{
    public GrievanceWorkflowMappingProfile()
    {
        CreateMap<GrievanceWorkflowEntity, GrievanceWorkflowDto>()
            .ForMember(dest => dest.StatesCount, opt => opt.MapFrom(src => src.States != null ? src.States.Count(s => s.IsActive) : 0))
            .ForMember(dest => dest.TransitionsCount, opt => opt.MapFrom(src => src.Transitions != null ? src.Transitions.Count(t => t.IsActive) : 0));

        CreateMap<CreateGrievanceWorkflowDto, GrievanceWorkflowEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.States, opt => opt.Ignore())
            .ForMember(dest => dest.Transitions, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievanceWorkflowDto, GrievanceWorkflowEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.States, opt => opt.Ignore())
            .ForMember(dest => dest.Transitions, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
