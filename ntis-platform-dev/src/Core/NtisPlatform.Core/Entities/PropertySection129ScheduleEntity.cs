using NtisPlatform.Core.Entities.Master;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Core.Entities;

/// <summary>
/// Year-wise Section 129A demand schedule row. One row per (PropertyId, FinanceYearId):
/// the resolved stage (PolicyCodeId, chained via PolicyCodeMaster.NextPolicyCodeId), the
/// old-GP-tax vs staged-tax comparison, and the final applied amount that also gets
/// mirrored into PTIS.TransMast for that (PropertyId, FinanceYearId, TaxId).
/// </summary>
public class PropertySection129ScheduleEntity : BaseEntity, IHardDeletable
{
    public int PropertyId { get; set; }

    public int PropertyDetailsId { get; set; }

    public int FinanceYearId { get; set; }

    public int PolicyCodeId { get; set; }

    public int TaxId { get; set; }

    public decimal TaxPercentage { get; set; }

    public decimal OldTaxAmount { get; set; }

    /// <summary>The 100%-stage basis amount for this finance year (i.e. what StageTaxAmount would be at 100%) — stored so "Difference from 100%" can be read back without re-deriving it from TaxPercentage (which is 0 for the two OLD_1/OLD_2 rows).</summary>
    public decimal FullBasisTaxAmount { get; set; }

    public decimal StageTaxAmount { get; set; }

    public decimal TaxAmount { get; set; }

    public bool IsCurrent { get; set; }

    public bool IsPropertyChangeDisqualified { get; set; }

    public bool MarkedForDeletion { get; set; } = false;

    public DateTime? MarkedForDeletionDate { get; set; }

    public virtual PropertyEntity? PropertyMast { get; set; }

    public virtual PropertyDetailsEntity? PropertyDetails { get; set; }

    public virtual YearMasterEntity? FinanceYear { get; set; }

    public virtual PolicyCodeMasterEntity? PolicyCodeMaster { get; set; }

    public virtual TaxMasterEntity? Tax { get; set; }
}
