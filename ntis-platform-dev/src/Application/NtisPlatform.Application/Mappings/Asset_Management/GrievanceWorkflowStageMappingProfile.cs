using AutoMapper;
using NtisPlatform.Application.DTOs.Asset_Management;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Mappings.Asset_Management
{
    public class GrievanceWorkflowStageMappingProfile : Profile
    {
        public GrievanceWorkflowStageMappingProfile()
        {
            CreateMap<GrievanceWorkflowStageMasterEntity, GrievanceWorkflowStageMasterDto>();

            CreateMap<CreateGrievanceWorkflowStageMasterDto, GrievanceWorkflowStageMasterEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletion, opt => opt.MapFrom(_ => false))
                .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());

            CreateMap<UpdateGrievanceWorkflowStageMasterDto, GrievanceWorkflowStageMasterEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());

            CreateMap<GrievanceStageAccessControlEntity, GrievanceStageAccessControlDto>()
                .ForMember(dest => dest.StageCode, opt => opt.MapFrom(src => src.Stage != null ? src.Stage.StageCode : null))
                .ForMember(dest => dest.StageName, opt => opt.MapFrom(src => src.Stage != null ? src.Stage.StageName : null))
                .ForMember(dest => dest.DesignationName, opt => opt.Ignore())
                .ForMember(dest => dest.DesignationCode, opt => opt.Ignore())
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : null));

            CreateMap<CreateGrievanceStageAccessControlDto, GrievanceStageAccessControlEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletion, opt => opt.MapFrom(_ => false))
                .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.Stage, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

            CreateMap<UpdateGrievanceStageAccessControlDto, GrievanceStageAccessControlEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
                .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
                .ForMember(dest => dest.Stage, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());
        }
    }
}