using AutoMapper;
using NtisPlatform.Application.DTOs.Master;
using NtisPlatform.Core.Entities.Master;

namespace NtisPlatform.Application.Mappings;

public class AssetFieldDefinitionMappingProfile : Profile
{
    public AssetFieldDefinitionMappingProfile()
    {
        CreateMap<AssetFieldDefinitionEntity, AssetFieldDefinitionDto>();

        CreateMap<CreateAssetFieldDefinitionDto, AssetFieldDefinitionEntity>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedDate, o => o.Ignore())
            .ForMember(d => d.UpdatedDate, o => o.Ignore())
            .ForMember(d => d.UpdatedBy, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletion, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletionDate, o => o.Ignore())
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.CreatedBy))
            .ForMember(d => d.FieldGroup, o => o.MapFrom(s => TrimToNull(s.FieldGroup)))
            .ForMember(d => d.OptionsJson, o => o.MapFrom(s => BlankToNull(s.OptionsJson)));

        CreateMap<UpdateAssetFieldDefinitionDto, AssetFieldDefinitionEntity>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedDate, o => o.Ignore())
            .ForMember(d => d.CreatedBy, o => o.Ignore())
            .ForMember(d => d.UpdatedDate, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletion, o => o.Ignore())
            .ForMember(d => d.MarkedForDeletionDate, o => o.Ignore())
            .ForMember(d => d.UpdatedBy, o => o.MapFrom(s => s.UpdatedBy))
            .ForMember(d => d.FieldGroup, o => o.MapFrom(s => TrimToNull(s.FieldGroup)))
            .ForMember(d => d.OptionsJson, o => o.MapFrom(s => BlankToNull(s.OptionsJson)));
    }

    // FieldGroup feeds the field-groups dropdown, so store it trimmed and keep blank groups as NULL.
    private static string? TrimToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    // CK_AssetFieldDefinition_OptionsJson only allows NULL or ISJSON = 1, and ISJSON('') = 0,
    // so a cleared options box is stored as NULL ("no options").
    private static string? BlankToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
