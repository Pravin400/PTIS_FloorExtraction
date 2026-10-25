using AutoMapper;
using NtisPlatform.Application.DTOs.PolicyMast;
using NtisPlatform.Core.Entities;

namespace NtisPlatform.Application.Mappings;

public class PolicyMastMappingProfile : Profile
{
    public PolicyMastMappingProfile()
    {
        CreateMap<PolicyConditionDetailsEntity, PolicyConditionDetailsDto>();

        CreateMap<PolicyConditionInputDto, PolicyConditionDetailsEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.PolicyId, opt => opt.Ignore())
            .ForMember(dest => dest.Policy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore());

        CreateMap<PolicyMastEntity, PolicyMastDto>();

        CreateMap<CreatePolicyMastDto, PolicyMastEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.PolicyConditionDetails, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore());

        CreateMap<UpdatePolicyMastDto, PolicyMastEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.PolicyConditionDetails, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletion, opt => opt.Ignore())
            .ForMember(dest => dest.MarkedForDeletionDate, opt => opt.Ignore());
    }
}
