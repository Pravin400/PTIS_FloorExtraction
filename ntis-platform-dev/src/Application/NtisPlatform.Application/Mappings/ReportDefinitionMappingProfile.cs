using AutoMapper;
using NtisPlatform.Application.DTOs.Report;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mappings;

public class ReportDefinitionMappingProfile : Profile
{
    public ReportDefinitionMappingProfile()
    {
        CreateMap<ReportDefinitionEntity, ReportDefinitionDto>();

        CreateMap<CreateReportDefinitionDto, ReportDefinitionEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.TemplateVersion, opt => opt.Ignore())
            .ForMember(dest => dest.IsBuiltIn, opt => opt.Ignore())
            .ForMember(dest => dest.SupportedPageSizesJson, opt => opt.Ignore())
            .ForMember(dest => dest.DefaultHtmlTemplateVersionId, opt => opt.Ignore());

        CreateMap<UpdateReportDefinitionDto, ReportDefinitionEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.TemplateVersion, opt => opt.Ignore())
            .ForMember(dest => dest.IsBuiltIn, opt => opt.Ignore())
            .ForMember(dest => dest.SupportedPageSizesJson, opt => opt.Ignore())
            .ForMember(dest => dest.DefaultHtmlTemplateVersionId, opt => opt.Ignore());
    }
}
