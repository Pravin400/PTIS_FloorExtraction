using AutoMapper;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocument;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Mappings.Asset_Management;

public class AssetGrievanceDocumentMappingProfile : Profile
{
    public AssetGrievanceDocumentMappingProfile()
    {
        CreateMap<AssetGrievanceDocumentEntity, AssetGrievanceDocumentResponseDto>()
            .ForMember(dest => dest.DocumentTypeName, opt => opt.MapFrom(src => src.DocumentType != null ? src.DocumentType.DocumentTypeName : null))
            .ForMember(dest => dest.DocumentTypeCode, opt => opt.MapFrom(src => src.DocumentType != null ? src.DocumentType.DocumentTypeCode : null))
            .ForMember(dest => dest.DocumentGuid, opt => opt.MapFrom(src => (src.DocumentBinding != null && src.DocumentBinding.Document != null) ? src.DocumentBinding.Document.DocumentGuid : (Guid?)null))
            .ForMember(dest => dest.FileName, opt => opt.MapFrom(src => (src.DocumentBinding != null && src.DocumentBinding.Document != null) ? src.DocumentBinding.Document.FileName : null))
            .ForMember(dest => dest.OriginalFileName, opt => opt.MapFrom(src => (src.DocumentBinding != null && src.DocumentBinding.Document != null) ? src.DocumentBinding.Document.OriginalFileName : null))
            .ForMember(dest => dest.FileExtension, opt => opt.MapFrom(src => (src.DocumentBinding != null && src.DocumentBinding.Document != null) ? src.DocumentBinding.Document.FileExtension : null))
            .ForMember(dest => dest.StoragePath, opt => opt.MapFrom(src => (src.DocumentBinding != null && src.DocumentBinding.Document != null) ? src.DocumentBinding.Document.StoragePath : null));
            
        CreateMap<AssetGrievanceDocumentItemDto, AssetGrievanceDocumentEntity>()
            .ForMember(dest => dest.GrievanceDetailsId, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentBindingId, opt => opt.Ignore())
            .ForMember(dest => dest.IsLatest, opt => opt.Ignore())
            .ForMember(dest => dest.GrievanceDetails, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentType, opt => opt.Ignore())
            .ForMember(dest => dest.DocumentBinding, opt => opt.Ignore());
    }
}