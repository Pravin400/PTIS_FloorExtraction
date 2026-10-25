using AutoMapper;
using NtisPlatform.Application.DTOs.Asset_Management.AssetGrievanceDocumentType;
using NtisPlatform.Core.Entities.Asset_Management;

namespace NtisPlatform.Application.Mappings.Asset_Management;

public class AssetGrievanceDocumentTypeMappingProfile : Profile
{
    public AssetGrievanceDocumentTypeMappingProfile()
    {
        CreateMap<AssetGrievanceDocumentTypeEntity, AssetGrievanceDocumentTypeDto>();
        CreateMap<CreateAssetGrievanceDocumentTypeDto, AssetGrievanceDocumentTypeEntity>();
        CreateMap<UpdateAssetGrievanceDocumentTypeDto, AssetGrievanceDocumentTypeEntity>();
    }
}
