namespace NtisPlatform.Core.Enums;

/// <summary>
/// Charge type enumeration matching database constraint on WTIS.ChargeHeadMaster.
/// </summary>
public enum ChargeType
{
    Deposit,
    Fee,
    Tax,
    Charge,
    Penalty
}
