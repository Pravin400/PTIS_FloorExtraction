using AutoMapper;
using NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;
using NtisPlatform.Core.Entities.Payroll.Master;

namespace NtisPlatform.Application.Mappings.Payroll;

/// <summary>
/// AutoMapper profile for Municipal Payroll DesignationMaster entity and DTOs
/// </summary>
public class PayrollDesignationMasterProfile : Profile
{
    public PayrollDesignationMasterProfile()
    {
        // Entity to DTO
        CreateMap<PayrollDesignationMasterEntity, PayrollDesignationMasterDto>();

        // Create DTO to Entity
        CreateMap<CreatePayrollDesignationMasterDto, PayrollDesignationMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

        // Update DTO to Entity
        CreateMap<UpdatePayrollDesignationMasterDto, PayrollDesignationMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));
    }
}
