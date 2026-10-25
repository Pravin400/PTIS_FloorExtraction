using AutoMapper;
using NtisPlatform.Application.DTOs.PropertySocialDetails;
using NtisPlatform.Application.DTOs.PropertySocialDetailsBulk;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mappings;

public class PropertySocialDetailsMappingProfile : Profile
{
    public PropertySocialDetailsMappingProfile()
    {
        CreateMap<PropertySocialDetailsEntity, PropertySocialDetailsDto>()
            .ForMember(dest => dest.SocialAttributeCode, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeCode : null))
            .ForMember(dest => dest.SocialAttributeName, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeName : null))
            .ForMember(dest => dest.IsPhotoRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsPhotoRequired : false))
            .ForMember(dest => dest.IsDocumentRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsDocumentRequired : false))
            .ForMember(dest => dest.IsCommonAreaAttribute, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsCommonAreaAttribute : false))
            .ForMember(dest => dest.PhotoBindingId, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoGuid, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentGuid, opt => opt.Ignore());

        CreateMap<CreatePropertySocialDetailsDto, PropertySocialDetailsEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.PropertyMast, opt => opt.Ignore())
            .ForMember(dest => dest.SocialAttribute, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentBinding, opt => opt.Ignore())
            .ForMember(dest => dest.WingDetailsMast, opt => opt.Ignore())
            .ForMember(dest => dest.SocietyDetailsMast, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        CreateMap<UpdatePropertySocialDetailsDto, PropertySocialDetailsEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.PropertyMast, opt => opt.Ignore())
            .ForMember(dest => dest.SocialAttribute, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentBinding, opt => opt.Ignore())
            .ForMember(dest => dest.WingDetailsMast, opt => opt.Ignore())
            .ForMember(dest => dest.SocietyDetailsMast, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        CreateMap<PropertySocialDetailsEntity, PropertySocialDetailsBulkDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.SocialAttributeCode, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeCode : null))
            .ForMember(dest => dest.SocialAttributeName, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeName : null))
            .ForMember(dest => dest.PhotoTypeID, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.PhotoTypeId : null))
            .ForMember(dest => dest.IsDocumentRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsDocumentRequired : false))
            .ForMember(dest => dest.IsPhotoRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsPhotoRequired : false));

        // Mappings for Filter and Page-Load DTOs
        CreateMap<PropertySocialDetailsEntity, AppliedSocialAttributeDto>()
            .ForMember(dest => dest.PropertySocialDetailId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.DocumentGuid, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoBindingId, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoGuid, opt => opt.Ignore())
            .ForMember(dest => dest.SocialAttributeCode, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeCode : string.Empty))
            .ForMember(dest => dest.SocialAttributeName, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeName : string.Empty))
            .ForMember(dest => dest.AttributeName, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.SocialAttributeName : string.Empty))
            .ForMember(dest => dest.AttributeMasterId, opt => opt.MapFrom(src => src.SocialAttributeId))
            .ForMember(dest => dest.DataType, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.DataType : string.Empty))
            .ForMember(dest => dest.Unit, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.Unit : null))
            .ForMember(dest => dest.DisplayOrder, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.DisplayOrder : null))
            .ForMember(dest => dest.ParentAttributeId, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.ParentAttributeId : null))
            .ForMember(dest => dest.IsRequiredWhenParentTrue, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsRequiredWhenParentTrue : false))
            .ForMember(dest => dest.IsDiscountApplicable, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsDiscountApplicable : false))
            .ForMember(dest => dest.PhotoTypeId, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.PhotoTypeId : null))
            .ForMember(dest => dest.AttributeCategory, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.AttributeCategory : null))
            .ForMember(dest => dest.IsPhotoRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsPhotoRequired : false))
            .ForMember(dest => dest.IsDocumentRequired, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsDocumentRequired : false))
            .ForMember(dest => dest.IsCommonAreaAttribute, opt => opt.MapFrom(src => src.SocialAttribute != null ? src.SocialAttribute.IsCommonAreaAttribute : false));

        CreateMap<SocialAttributeEntity, NonAppliedSocialAttributeDto>()
            .ForMember(dest => dest.AttributeName, opt => opt.MapFrom(src => src.SocialAttributeName))
            .ForMember(dest => dest.SocialAttributeId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.AttributeMasterId, opt => opt.MapFrom(src => src.Id));

        CreateMap<SocialAttributeEntity, SocialAttributeHierarchyDto>()
            .ForMember(dest => dest.AttributeName, opt => opt.MapFrom(src => src.SocialAttributeName))
            .ForMember(dest => dest.Children, opt => opt.Ignore())
            .ForMember(dest => dest.PropertySocialDetailId, opt => opt.Ignore())
            .ForMember(dest => dest.BitValue, opt => opt.Ignore())
            .ForMember(dest => dest.IntValue, opt => opt.Ignore())
            .ForMember(dest => dest.DecimalValue, opt => opt.Ignore())
            .ForMember(dest => dest.TextValue, opt => opt.Ignore())
            .ForMember(dest => dest.DateValue, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentBindingId, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentGuid, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoBindingId, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoGuid, opt => opt.Ignore())
            .ForMember(dest => dest.Remark, opt => opt.Ignore());
    }
}