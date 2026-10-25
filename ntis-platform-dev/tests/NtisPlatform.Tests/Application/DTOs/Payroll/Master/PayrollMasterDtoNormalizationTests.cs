using NtisPlatform.Application.DTOs.Payroll.Master.BloodGroupMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DepartmentMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DesignationMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeClassMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeStatusMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.EmployeeTypeMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.GenderMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.MaritalStatusMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.QualificationMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.RelationshipMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.StateMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.DistrictMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.TalukaMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.VillageMaster;
using NtisPlatform.Application.DTOs.Payroll.Master.ZoneDivisionMaster;
using Xunit;

namespace NtisPlatform.Tests.Application.DTOs.Payroll.Master;

/// <summary>
/// Unit tests verifying property assignment across Municipal Payroll Master Create and Update DTOs
/// using standard auto-implemented properties (matching BankMasterDTO format).
/// </summary>
public class PayrollMasterDtoNormalizationTests
{
    #region Batch 1 Masters

    [Fact]
    public void DepartmentMasterDto_Assigns_Properties()
    {
        var createDto = new CreatePayrollDepartmentMasterDto
        {
            DepartmentCode = "ADM",
            DepartmentName = "Administration",
            DepartmentNameMarathi = "प्रशासन",
            Description = "Administration Dept"
        };

        Assert.Equal("ADM", createDto.DepartmentCode);
        Assert.Equal("Administration", createDto.DepartmentName);
        Assert.Equal("प्रशासन", createDto.DepartmentNameMarathi);
        Assert.Equal("Administration Dept", createDto.Description);
    }

    [Fact]
    public void DesignationMasterDto_Assigns_Properties()
    {
        var createDto = new CreatePayrollDesignationMasterDto
        {
            DesignationCode = "CLK",
            DesignationName = "Clerk",
            DesignationNameMarathi = "लिपिक",
            Description = "Head clerk position"
        };

        Assert.Equal("CLK", createDto.DesignationCode);
        Assert.Equal("Clerk", createDto.DesignationName);
        Assert.Equal("लिपिक", createDto.DesignationNameMarathi);
        Assert.Equal("Head clerk position", createDto.Description);
    }

    [Fact]
    public void EmployeeClassMasterDto_Assigns_Properties()
    {
        var employeeClass = new CreatePayrollEmployeeClassMasterDto
        {
            ClassCode = "A",
            ClassName = "Class A",
            ClassNameMarathi = "वर्ग अ",
            Description = "Class A description"
        };
        Assert.Equal("A", employeeClass.ClassCode);
        Assert.Equal("Class A", employeeClass.ClassName);
        Assert.Equal("वर्ग अ", employeeClass.ClassNameMarathi);
        Assert.Equal("Class A description", employeeClass.Description);
    }

    [Fact]
    public void EmployeeStatusMasterDto_Assigns_Properties()
    {
        var employeeStatus = new CreatePayrollEmployeeStatusMasterDto
        {
            EmployeeStatusCode = "ACT",
            EmployeeStatus = "Active",
            EmployeeStatusMarathi = "सक्रिय",
            Description = "Active status"
        };
        Assert.Equal("ACT", employeeStatus.EmployeeStatusCode);
        Assert.Equal("Active", employeeStatus.EmployeeStatus);
        Assert.Equal("सक्रिय", employeeStatus.EmployeeStatusMarathi);
        Assert.Equal("Active status", employeeStatus.Description);
    }

    [Fact]
    public void EmployeeTypeMasterDto_Assigns_Properties()
    {
        var employeeType = new CreatePayrollEmployeeTypeMasterDto
        {
            EmployeeTypeCode = "PERM",
            EmployeeTypeName = "Permanent",
            EmployeeTypeNameMarathi = "कायमस्वरूपी"
        };
        Assert.Equal("PERM", employeeType.EmployeeTypeCode);
        Assert.Equal("Permanent", employeeType.EmployeeTypeName);
        Assert.Equal("कायमस्वरूपी", employeeType.EmployeeTypeNameMarathi);
    }

    #endregion

    #region Batch 2 Masters

    [Fact]
    public void BloodGroupMasterDto_Assigns_Properties()
    {
        var bloodGroup = new CreatePayrollBloodGroupMasterDto
        {
            BloodGroupCode = "O+",
            BloodGroupName = "O Positive"
        };
        Assert.Equal("O+", bloodGroup.BloodGroupCode);
        Assert.Equal("O Positive", bloodGroup.BloodGroupName);

        var updateDto = new UpdatePayrollBloodGroupMasterDto
        {
            BloodGroupCode = "AB+",
            BloodGroupName = "AB Positive"
        };
        Assert.Equal("AB+", updateDto.BloodGroupCode);
        Assert.Equal("AB Positive", updateDto.BloodGroupName);
    }

    [Fact]
    public void GenderMasterDto_Assigns_Properties()
    {
        var gender = new CreatePayrollGenderMasterDto
        {
            GenderCode = "M",
            GenderName = "Male",
            GenderNameRegional = "पुरुष"
        };
        Assert.Equal("M", gender.GenderCode);
        Assert.Equal("Male", gender.GenderName);
        Assert.Equal("पुरुष", gender.GenderNameRegional);
    }

    [Fact]
    public void MaritalStatusMasterDto_Assigns_Properties()
    {
        var maritalStatus = new CreatePayrollMaritalStatusMasterDto
        {
            MaritalStatusCode = "MAR",
            MaritalStatusName = "Married",
            MaritalStatusNameRegional = "विवाहित"
        };
        Assert.Equal("MAR", maritalStatus.MaritalStatusCode);
        Assert.Equal("Married", maritalStatus.MaritalStatusName);
        Assert.Equal("विवाहित", maritalStatus.MaritalStatusNameRegional);
    }

    [Fact]
    public void QualificationMasterDto_Assigns_Properties()
    {
        var qualification = new CreatePayrollQualificationMasterDto
        {
            QualificationCode = "BTECH",
            QualificationName = "B.Tech",
            QualificationNameRegional = "बी.टेक"
        };
        Assert.Equal("BTECH", qualification.QualificationCode);
        Assert.Equal("B.Tech", qualification.QualificationName);
        Assert.Equal("बी.टेक", qualification.QualificationNameRegional);
    }

    [Fact]
    public void RelationshipMasterDto_Assigns_Properties()
    {
        var relationship = new CreatePayrollRelationshipMasterDto
        {
            RelationshipCode = "SPOUSE",
            RelationshipName = "Spouse",
            RelationshipNameRegional = "जोडीदार"
        };
        Assert.Equal("SPOUSE", relationship.RelationshipCode);
        Assert.Equal("Spouse", relationship.RelationshipName);
        Assert.Equal("जोडीदार", relationship.RelationshipNameRegional);
    }

  #endregion


    #region Geographic Masters (Batch 3)

    [Fact]
    public void StateMasterDto_Assigns_Properties()
    {
        var state = new CreatePayrollStateMasterDto
        {
            StateCode = "MH",
            StateName = "Maharashtra",
            StateNameRegional = "महाराष्ट्र"
        };
        Assert.Equal("MH", state.StateCode);
        Assert.Equal("Maharashtra", state.StateName);
        Assert.Equal("महाराष्ट्र", state.StateNameRegional);
    }

    [Fact]
    public void DistrictMasterDto_Assigns_Properties()
    {
        var district = new CreatePayrollDistrictMasterDto
        {
            StateId = 1,
            DistrictCode = "PUN",
            DistrictName = "Pune",
            DistrictNameRegional = "पुणे"
        };
        Assert.Equal(1, district.StateId);
        Assert.Equal("PUN", district.DistrictCode);
        Assert.Equal("Pune", district.DistrictName);
        Assert.Equal("पुणे", district.DistrictNameRegional);
    }

    [Fact]
    public void TalukaMasterDto_Assigns_Properties()
    {
        var taluka = new CreatePayrollTalukaMasterDto
        {
            DistrictId = 1,
            TalukaCode = "HAV",
            TalukaName = "Haveli",
            TalukaNameRegional = "हवेली",
            IsCity = true
        };
        Assert.Equal(1, taluka.DistrictId);
        Assert.Equal("HAV", taluka.TalukaCode);
        Assert.Equal("Haveli", taluka.TalukaName);
        Assert.Equal("हवेली", taluka.TalukaNameRegional);
        Assert.True(taluka.IsCity);
    }

    [Fact]
    public void VillageMasterDto_Assigns_Properties()
    {
        var village = new CreatePayrollVillageMasterDto
        {
            TalukaId = 1,
            VillageCode = "SHI",
            VillageName = "Shivane",
            VillageNameRegional = "शिवणे",
            PINCode = "411023"
        };
        Assert.Equal(1, village.TalukaId);
        Assert.Equal("SHI", village.VillageCode);
        Assert.Equal("Shivane", village.VillageName);
        Assert.Equal("शिवणे", village.VillageNameRegional);
        Assert.Equal("411023", village.PINCode);
    }

    [Fact]
    public void ZoneDivisionMasterDto_Assigns_Properties()
    {
        var zone = new CreatePayrollZoneDivisionMasterDto
        {
            ZoneDivisionCode = "HQ",
            ZoneDivisionName = "Headquarters",
            ZoneDivisionNameRegional = "मुख्यालय",
            Address = "Central Office"
        };
        Assert.Equal("HQ", zone.ZoneDivisionCode);
        Assert.Equal("Headquarters", zone.ZoneDivisionName);
        Assert.Equal("मुख्यालय", zone.ZoneDivisionNameRegional);
        Assert.Equal("Central Office", zone.Address);
    }

    #endregion

}