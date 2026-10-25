using AutoMapper;
using NtisPlatform.Application.DTOs.WaterBill.Master;
using NtisPlatform.Core.Entities.WaterBill.Master;
using NtisPlatform.Application.DTOs.WaterBill.Master.ChargeHeadMaster;
using NtisPlatform.Application.DTOs.Master.WaterBill;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTypeMaster;
using NtisPlatform.Application.DTOs.WaterBill.Master.ReadingSourceMaster;
using NtisPlatform.Application.DTOs.WaterBill.Master.MeterTestStatusMaster;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyTypeMaster;
using NtisPlatform.Application.DTOs.WaterBill.Master.GeographyUnit;
using NtisPlatform.Core.Entities.Master.WaterBill;
using NtisPlatform.Application.DTOs.WaterBill.Master.PenaltyRule;
using ChargeHeadMasterEntity = NtisPlatform.Core.Entities.WaterBill.Master.ChargeHeadMasterEntity;

namespace NtisPlatform.Application.Mappings.WaterBill.Master;

public class WaterBillMappingProfile : Profile
{
    public WaterBillMappingProfile()
    {


        // BillingFrequencyMaster
        CreateMap<BillingFrequencyMasterEntity, BillingFrequencyMasterDto>();
        CreateMap<CreateBillingFrequencyMasterDto, BillingFrequencyMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateBillingFrequencyMasterDto, BillingFrequencyMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // BillingPeriod
        CreateMap<BillingPeriodEntity, BillingPeriodDto>()
            .ForMember(dest => dest.FinancialYearCode, opt => opt.MapFrom(src => src.FinancialYear != null ? src.FinancialYear.YearCode : null))
            .ForMember(dest => dest.FinancialYear, opt => opt.MapFrom(src => src.FinancialYear != null ? src.FinancialYear.Year.ToString() : null))
            .ForMember(dest => dest.BillingFrequencyCode, opt => opt.MapFrom(src => src.BillingFrequency != null ? src.BillingFrequency.BillingFrequencyCode : null))
            .ForMember(dest => dest.BillingFrequency, opt => opt.MapFrom(src => src.BillingFrequency != null ? src.BillingFrequency.BillingFrequency : null));

        CreateMap<CreateBillingPeriodDto, BillingPeriodEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.FinancialYear, opt => opt.Ignore())
            .ForMember(dest => dest.BillingFrequency, opt => opt.Ignore());

        CreateMap<UpdateBillingPeriodDto, BillingPeriodEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.FinancialYear, opt => opt.Ignore())
            .ForMember(dest => dest.BillingFrequency, opt => opt.Ignore());
        // ConnectionTypeMaster
        CreateMap<ConnectionTypeMasterEntity, ConnectionTypeMasterDto>();
        CreateMap<CreateConnectionTypeMasterDto, ConnectionTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateConnectionTypeMasterDto, ConnectionTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // TariffMaster
        CreateMap<TariffMasterEntity, TariffMasterDto>()
            .ForMember(dest => dest.FinancialYearId, opt => opt.MapFrom(src => src.YearId))
            .ForMember(dest => dest.FinancialYear, opt => opt.MapFrom(src => src.Year != null ? (src.Year.Year != 0 ? src.Year.Year.ToString() : (src.Year.YearCode ?? null)) : null))
            .ForMember(dest => dest.YearCode, opt => opt.MapFrom(src => src.Year != null ? src.Year.YearCode : null))
            .ForMember(dest => dest.ConnectionTypeName, opt => opt.MapFrom(src => src.ConnectionType != null ? src.ConnectionType.ConnectionType : null))
            .ForMember(dest => dest.ConnectionTypeCode, opt => opt.MapFrom(src => src.ConnectionType != null ? src.ConnectionType.ConnectionTypeCode : null))
            .ForMember(dest => dest.ConnectionCategoryName, opt => opt.MapFrom(src => src.ConnectionCategory != null ? src.ConnectionCategory.ConnectionCategory : null))
            .ForMember(dest => dest.ConnectionCategoryCode, opt => opt.MapFrom(src => src.ConnectionCategory != null ? src.ConnectionCategory.ConnectionCategoryCode : null))
            .ForMember(dest => dest.TapSizeName, opt => opt.MapFrom(src => src.TapSize != null ? src.TapSize.TapSize : null))
            .ForMember(dest => dest.TapSizeCode, opt => opt.MapFrom(src => src.TapSize != null ? src.TapSize.TapSizeCode : null))
            .ForMember(dest => dest.SlabsCount, opt => opt.MapFrom(src => src.Slabs != null ? src.Slabs.Count(s => s.IsActive) : 0));

        CreateMap<CreateTariffMasterDto, TariffMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.YearId, opt => opt.MapFrom(src => src.FinancialYearId))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Year, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionType, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionCategory, opt => opt.Ignore())
            .ForMember(dest => dest.TapSize, opt => opt.Ignore())
            .ForMember(dest => dest.Slabs, opt => opt.Ignore());

        CreateMap<UpdateTariffMasterDto, TariffMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.YearId, opt => opt.MapFrom(src => src.FinancialYearId))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.Year, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionType, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionCategory, opt => opt.Ignore())
            .ForMember(dest => dest.TapSize, opt => opt.Ignore())
            .ForMember(dest => dest.Slabs, opt => opt.Ignore());

        // ChargeHeadMaster
        CreateMap<ChargeHeadMasterEntity, ChargeHeadMasterDto>()
            .ForMember(dest => dest.ChargeHeadCode, opt => opt.MapFrom(src => src.Code))
            .ForMember(dest => dest.ChargeHeadName, opt => opt.MapFrom(src => src.Name));
        CreateMap<CreateChargeHeadMasterDto, ChargeHeadMasterEntity>()
            .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.ChargeHeadCode))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.ChargeHeadName))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateChargeHeadMasterDto, ChargeHeadMasterEntity>()
            .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.ChargeHeadCode))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.ChargeHeadName))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // MeterTypeMaster
        CreateMap<MeterTypeMasterEntity, MeterTypeMasterDto>();
        CreateMap<CreateMeterTypeMasterDto, MeterTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateMeterTypeMasterDto, MeterTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // TapSizeMaster
        CreateMap<TapSizeMasterEntity, TapSizeMasterDto>();
        CreateMap<CreateTapSizeMasterDto, TapSizeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateTapSizeMasterDto, TapSizeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // ReadingSourceMaster
        CreateMap<ReadingSourceMasterEntity, ReadingSourceMasterDto>();
        CreateMap<CreateReadingSourceMasterDto, ReadingSourceMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateReadingSourceMasterDto, ReadingSourceMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));


        // MeterTestStatusMaster
        CreateMap<MeterTestStatusMasterEntity, MeterTestStatusMasterDto>();
        CreateMap<CreateMeterTestStatusMasterDto, MeterTestStatusMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateMeterTestStatusMasterDto, MeterTestStatusMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // GeographyTypeMaster
        CreateMap<GeographyTypeMasterEntity, GeographyTypeMasterDto>();
        CreateMap<CreateGeographyTypeMasterDto, GeographyTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        CreateMap<UpdateGeographyTypeMasterDto, GeographyTypeMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

        // GeographyUnit
        CreateMap<GeographyUnitEntity, GeographyUnitDto>()
            .ForMember(dest => dest.GeographyTypeCode, opt => opt.MapFrom(src => src.GeographyType != null ? src.GeographyType.GeographyTypeCode : null))
            .ForMember(dest => dest.GeographyType, opt => opt.MapFrom(src => src.GeographyType != null ? src.GeographyType.GeographyType : null))
            .ForMember(dest => dest.ParentGeographyUnitName, opt => opt.MapFrom(src => src.ParentGeographyUnit != null ? src.ParentGeographyUnit.GeographyUnitName : null));
        CreateMap<CreateGeographyUnitDto, GeographyUnitEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyType, opt => opt.Ignore())
            .ForMember(dest => dest.ParentGeographyUnit, opt => opt.Ignore());
        CreateMap<UpdateGeographyUnitDto, GeographyUnitEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.GeographyType, opt => opt.Ignore())
            .ForMember(dest => dest.ParentGeographyUnit, opt => opt.Ignore());
            
        // ConnectionCategoryMaster
        CreateMap<ConnectionCategoryMasterEntity, ConnectionCategoryMasterDto>()
            .ForMember(dest => dest.BillingFrequencyCode, opt => opt.MapFrom(src => src.BillingFrequency != null ? src.BillingFrequency.BillingFrequencyCode : null))
            .ForMember(dest => dest.BillingFrequency, opt => opt.MapFrom(src => src.BillingFrequency != null ? src.BillingFrequency.BillingFrequency : null));

        CreateMap<CreateConnectionCategoryMasterDto, ConnectionCategoryMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.BillingFrequency, opt => opt.Ignore());

        CreateMap<UpdateConnectionCategoryMasterDto, ConnectionCategoryMasterEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.BillingFrequency, opt => opt.Ignore());
        // TariffSlabDetail
        CreateMap<TariffSlabDetailEntity, TariffSlabDetailDto>()
            .ForMember(dest => dest.TariffName, opt => opt.MapFrom(src => src.Tariff != null ? src.Tariff.TariffName : null))
            .ForMember(dest => dest.GeographyUnitName, opt => opt.MapFrom(src => src.GeographyUnit != null ? src.GeographyUnit.GeographyUnitName : null))
            .ForMember(dest => dest.FormulaCode, opt => opt.MapFrom(src =>
                src.FormulaCode != null && src.FormulaCode.Trim().ToUpper() == "FLAT_RATE"
                    ? "FIXED"
                    : src.FormulaCode));

        CreateMap<CreateTariffSlabDetailDto, TariffSlabDetailEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.FormulaCode, opt => opt.MapFrom(src =>
                src.FormulaCode != null && src.FormulaCode.Trim().ToUpper() == "FLAT_RATE"
                    ? "FIXED"
                    : src.FormulaCode))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Tariff, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore());

        CreateMap<UpdateTariffSlabDetailDto, TariffSlabDetailEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.FormulaCode, opt => opt.MapFrom(src =>
                src.FormulaCode != null && src.FormulaCode.Trim().ToUpper() == "FLAT_RATE"
                    ? "FIXED"
                    : src.FormulaCode))
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.Tariff, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore());

        // TariffChargeDetail
        CreateMap<TariffChargeDetailEntity, TariffChargeDetailDto>()
            .ForMember(dest => dest.TariffName, opt => opt.MapFrom(src => src.Tariff != null ? src.Tariff.TariffName : null))
            .ForMember(dest => dest.ChargeHeadName, opt => opt.MapFrom(src => src.ChargeHead != null ? src.ChargeHead.Name : null))
            .ForMember(dest => dest.GeographyUnitName, opt => opt.MapFrom(src => src.GeographyUnit != null ? src.GeographyUnit.GeographyUnitName : null));

        CreateMap<CreateTariffChargeDetailDto, TariffChargeDetailEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Tariff, opt => opt.Ignore())
            .ForMember(dest => dest.ChargeHead, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore());

        CreateMap<UpdateTariffChargeDetailDto, TariffChargeDetailEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.Tariff, opt => opt.Ignore())
            .ForMember(dest => dest.ChargeHead, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore());

        // WaterPenaltyRuleMaster
        CreateMap<WaterPenaltyRuleMasterEntity, WaterPenaltyRuleDto>()
            .ForMember(dest => dest.FinancialYearName, opt => opt.MapFrom(src => src.FinancialYear != null ? (src.FinancialYear.YearCode ?? src.FinancialYear.Year.ToString()) : null))
            .ForMember(dest => dest.ConnectionCategoryName, opt => opt.MapFrom(src => src.ConnectionCategory != null ? src.ConnectionCategory.ConnectionCategory : null))
            .ForMember(dest => dest.GeographyName, opt => opt.MapFrom(src => src.GeographyUnit != null ? src.GeographyUnit.GeographyUnitName : null))
            .ForMember(dest => dest.ChargeHeadName, opt => opt.MapFrom(src => src.ChargeHead != null ? src.ChargeHead.Name : null));

        CreateMap<CreateWaterPenaltyRuleDto, WaterPenaltyRuleMasterEntity>()
            .ForMember(dest => dest.PenaltyRuleId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.FinancialYear, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionCategory, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore())
            .ForMember(dest => dest.ChargeHead, opt => opt.Ignore());

        CreateMap<UpdateWaterPenaltyRuleDto, WaterPenaltyRuleMasterEntity>()
            .ForMember(dest => dest.PenaltyRuleId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedDate, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
            .ForMember(dest => dest.EffectiveFrom, opt => opt.Condition(src => src.EffectiveFrom.HasValue))
            .ForMember(dest => dest.FinancialYear, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionCategory, opt => opt.Ignore())
            .ForMember(dest => dest.GeographyUnit, opt => opt.Ignore())
            .ForMember(dest => dest.ChargeHead, opt => opt.Ignore());
    }
}
