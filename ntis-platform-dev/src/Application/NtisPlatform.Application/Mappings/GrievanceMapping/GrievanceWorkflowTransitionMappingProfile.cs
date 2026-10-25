using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowTransition;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceWorkflowTransitionMappingProfile : Profile
{
    public GrievanceWorkflowTransitionMappingProfile()
    {
        CreateMap<GrievanceWorkflowTransitionEntity, GrievanceWorkflowTransitionDto>()
            .ForMember(dest => dest.WorkflowName, opt => opt.MapFrom(src => src.Workflow != null ? src.Workflow.WorkflowName : null))
            .ForMember(dest => dest.FromStateName, opt => opt.MapFrom(src => src.FromState != null ? src.FromState.StateName : null))
            .ForMember(dest => dest.ToStateName, opt => opt.MapFrom(src => src.ToState != null ? src.ToState.StateName : null));

        CreateMap<CreateGrievanceWorkflowTransitionDto, GrievanceWorkflowTransitionEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.FromState, opt => opt.Ignore())
            .ForMember(dest => dest.ToState, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievanceWorkflowTransitionDto, GrievanceWorkflowTransitionEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.FromState, opt => opt.Ignore())
            .ForMember(dest => dest.ToState, opt => opt.Ignore())
            .ForMember(dest => dest.ActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
