namespace NtisPlatform.Application.Exceptions;

/// <summary>
/// A lease-rent payment request failed validation, broke a business rule, or lost a race to a
/// concurrent payment. The message is the Payment_* / LeaseRent_* error code. Inherits from
/// <see cref="InvalidOperationException"/> so the global exception middleware still maps it to 400,
/// and the middleware returns its message in every environment (a plain InvalidOperationException's
/// message is replaced by generic text outside Development), so clients can localize the code.
/// </summary>
public class PaymentRuleException : InvalidOperationException
{
    public PaymentRuleException(string errorCode) : base(errorCode) { }

    public PaymentRuleException(string errorCode, Exception innerException)
        : base(errorCode, innerException) { }
}

/// <summary>
/// A lease, demand or cheque a lease-rent payment refers to doesn't exist. The message is the
/// Payment_* / LeaseRent_* error code. Inherits from <see cref="KeyNotFoundException"/> so the global
/// exception middleware still maps it to 404; like <see cref="PaymentRuleException"/>, its message is
/// returned in every environment.
/// </summary>
public class PaymentNotFoundException : KeyNotFoundException
{
    public PaymentNotFoundException(string errorCode) : base(errorCode) { }
}
