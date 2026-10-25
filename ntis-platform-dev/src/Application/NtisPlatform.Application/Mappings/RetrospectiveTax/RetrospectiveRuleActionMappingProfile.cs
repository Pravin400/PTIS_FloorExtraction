using AutoMapper;
using NtisPlatform.Application.DTOs.RetrospectiveTax.RetrospectiveRuleAction;
using NtisPlatform.Core.Entities.RetrospectiveTax;

namespace NtisPlatform.Application.Mappings.RetrospectiveTax;

public class RetrospectiveRuleActionMappingProfile : Profile
{
    public RetrospectiveRuleActionMappingProfile()
    {
        CreateMap<RetrospectiveRuleActionEntity, RetrospectiveRuleActionDto>();

        CreateMap<CreateRetrospectiveRuleActionDto, RetrospectiveRuleActionEntity>()
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdateRetrospectiveRuleActionDto, RetrospectiveRuleActionEntity>()
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            // An update that leaves the mode or the rate basis out keeps what the action has; it is never reset to
            // SINGLE / YEAR_WISE (that would turn a CC_THEN_OC_MERGE or CURRENT_YEAR rule into another calculation).
            .ForMember(dest => dest.TaxCalculationMode, opt => opt.Condition((src, dest, srcMember) => !string.IsNullOrEmpty(srcMember)))
            .ForMember(dest => dest.RateMode, opt => opt.Condition((src, dest, srcMember) => !string.IsNullOrEmpty(srcMember)));
    }
}
