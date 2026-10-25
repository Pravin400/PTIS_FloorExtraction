namespace NtisPlatform.Core.Models;

/// <summary>
/// Raw database snapshot used by the Automation sub-grid service mapper.
/// </summary>
public  class SubGridDataProjection
{
    public int WorkflowStageId { get; set; }
    public string WorkflowStageName { get; set; } = string.Empty;
    public int ZoneId { get; set; }
    public string ZoneName { get; set; } = string.Empty;
    public string ZoneNo { get; set; } = string.Empty;
    public int? WardId { get; set; }
    public string? WardNo { get; set; }
    public int TotalCount { get; set; }

    public List<SubGridPropertyProjection> Properties { get; set; } = new();
    public List<SubGridCountProjection> DetailCounts { get; set; } = new();
    public List<SubGridDocumentProjection> Documents { get; set; } = new();
    public List<SubGridDocumentProjection> PlanDocuments { get; set; } = new();
    public List<SubGridPropertyMapProjection> PropertyMaps { get; set; } = new();
    public List<SubGridNewPropertyDetailProjection> NewDetails { get; set; } = new();
    public List<SubGridOldPropertyDetailProjection> OldDetails { get; set; } = new();
    public List<SubGridTaxValueProjection> NewRvValues { get; set; } = new();
    public List<SubGridTaxValueProjection> NewCurrentTaxes { get; set; } = new();
    public List<SubGridTaxValueProjection> NewPendingTaxes { get; set; } = new();
    public List<SubGridTaxValueProjection> OldCurrentTaxes { get; set; } = new();
    public List<SubGridTaxValueProjection> OldPendingTaxes { get; set; } = new();
    public List<int> ApplyTaxesPropertyIds { get; set; } = new();
    public List<SubGridAssessmentDetailProjection> AssessmentDetails { get; set; } = new();
}

/// <summary>
/// Raw property row for the sub-grid.
/// </summary>
public  class SubGridPropertyProjection
{
    public int Id { get; set; }
    public int WardId { get; set; }
    public string WardNo { get; set; } = string.Empty;
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string TypeDescription { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public string OccupierName { get; set; } = string.Empty;
    public string MobileNo { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string FlatOrShopName { get; set; } = string.Empty;
    public string WingName { get; set; } = string.Empty;
    public string AssessmentStatusName { get; set; } = string.Empty;
}

public class SubGridCountProjection : NtisPlatform.Core.Models.AutomationDashboard.AutomationDashboardPropertyKeyDto
{
    public int Count { get; set; }
}

public class SubGridDocumentProjection : NtisPlatform.Core.Models.AutomationDashboard.AutomationDashboardPropertyKeyDto
{
    public string? DocumentGuid { get; set; }
}

public  class SubGridPropertyMapProjection
{
    public int PropertyIdNew { get; set; }
    public int? PropertyIdOld { get; set; }
}

public  class SubGridNewPropertyDetailProjection
{
    public int Id { get; set; }
    public decimal Area { get; set; }
    public string Use { get; set; } = string.Empty;
}

public  class SubGridOldPropertyDetailProjection
{
    public int Id { get; set; }
    public decimal Area { get; set; }
    public string Use { get; set; } = string.Empty;
    public double OldRV { get; set; }
}

public class SubGridTaxValueProjection : NtisPlatform.Core.Models.AutomationDashboard.AutomationDashboardPropertyKeyDto
{
    public decimal Amount { get; set; }
}

public class SubGridAssessmentDetailProjection : NtisPlatform.Core.Models.AutomationDashboard.AutomationDashboardPropertyKeyDto
{
    public DateTime? PartOCDate { get; set; }
    public short? ApplyTaxesFrom { get; set; }
}

/// <summary>
/// Internal projection for filtering sub-grid properties.
/// </summary>
public class SubGridPropertyFilterProjection
{
    public int PropertyId { get; set; }
    public int? PropertyAssessmentStatusId { get; set; }
    public int WardId { get; set; }
    public string? WardNo { get; set; }
    public int? CategoryId { get; set; }
    public int? PropertyTypeId { get; set; }
    public int ZoneId { get; set; }
    public string? ZoneNo { get; set; }
    public string? ZoneName { get; set; }
    public bool IsPropertyOpenPlot { get; set; }
    public string? PropertyNo { get; set; }
    public string? PartitionNo { get; set; }
    public string? OwnerName { get; set; }
    public string? OccupierName { get; set; }
    public string? MobileNo { get; set; }
    public string? AlternateMobileNo { get; set; }
    public string? OccupierMobileNo { get; set; }
    public string? Address { get; set; }
    public string? FlatOrShopName { get; set; }
    public string? UPICId { get; set; }
}
