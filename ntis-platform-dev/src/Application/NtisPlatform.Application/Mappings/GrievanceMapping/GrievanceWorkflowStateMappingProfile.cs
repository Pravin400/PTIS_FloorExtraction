using AutoMapper;
using NtisPlatform.Application.DTOs.GrievanceDTO_s.GrievanceWorkflowState;
using NtisPlatform.Core.Entities.GrievanceEntities;

namespace NtisPlatform.Application.Mappings.GrievanceMapping;

public class GrievanceWorkflowStateMappingProfile : Profile
{
    public GrievanceWorkflowStateMappingProfile()
    {
        CreateMap<GrievanceWorkflowStateEntity, GrievanceWorkflowStateDto>()
            .ForMember(dest => dest.WorkflowName, opt => opt.MapFrom(src => src.Workflow != null ? src.Workflow.WorkflowName : null));

        CreateMap<CreateGrievanceWorkflowStateDto, GrievanceWorkflowStateEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.OutgoingTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.IncomingTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.FromActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.ToActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateGrievanceWorkflowStateDto, GrievanceWorkflowStateEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Workflow, opt => opt.Ignore())
            .ForMember(dest => dest.OutgoingTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.IncomingTransitions, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceApplications, opt => opt.Ignore())
            .ForMember(dest => dest.FromActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.ToActivityLogs, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
