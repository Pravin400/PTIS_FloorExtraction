using Microsoft.Extensions.Logging;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;

namespace NtisPlatform.Infrastructure.Services.Handlers;

/// <summary>
/// Authorization handler for PTIS (Property Tax Information System) documents.
/// Checks if a user can access documents bound to Property entities.
/// </summary>
public class PtisDocumentAuthorizationHandler : IDocumentAuthorizationHandler
{
    // PTIS department ID - should match DepartmentMaster.Id for "PTIS"
    // This value should ideally come from configuration, but for now we accept it via constructor
    public int DepartmentId { get; private set; }

    private readonly ILogger<PtisDocumentAuthorizationHandler> _logger;

    public PtisDocumentAuthorizationHandler(
        int ptisDepartmentId,
        ILogger<PtisDocumentAuthorizationHandler> logger)
    {
        DepartmentId = ptisDepartmentId;
        _logger = logger;
    }

    public async Task<bool> CanAccessAsync(
        DocumentBindingEntity binding,
        int userId,
        CancellationToken cancellationToken)
    {
        // Validate user is authenticated
        if (userId <= 0)
        {
            _logger.LogWarning("Invalid user ID {UserId} requesting document access", userId);
            return false;
        }

        // Validate binding is for PTIS
        int? deptId = binding.AuthDepartmentId ?? (binding.DepartmentId > 0 ? binding.DepartmentId : null);
        if (deptId != DepartmentId)
        {
            _logger.LogWarning(
                "Authorization handler for PTIS (DeptId={HandlerDeptId}) received binding for different department {BindingDeptId}",
                DepartmentId, deptId);
            return false;
        }

        // Extract property ID from binding's auth reference or reference table ID
        int? propertyId = binding.AuthReferenceId ?? (binding.ReferenceTableId > 0 ? binding.ReferenceTableId : null);
        if (!propertyId.HasValue || propertyId.Value <= 0)
        {
            _logger.LogWarning("Document binding {BindingId} has invalid Property reference", binding.Id);
            return false;
        }

        _logger.LogInformation(
            "PTIS document access check: User {UserId} requesting Property {PropertyId} document (BindingId={BindingId})",
            userId, propertyId.Value, binding.Id);

        // Authenticated users with valid property binding are granted read/view access
        return await Task.FromResult(true);
    }

    public async Task<bool> CanModifyAsync(
        DocumentBindingEntity binding,
        int userId,
        CancellationToken cancellationToken)
    {
        // Validate user is authenticated
        if (userId <= 0)
        {
            _logger.LogWarning("Invalid user ID {UserId} requesting document modification", userId);
            return false;
        }

        // Validate binding is for PTIS
        int? deptId = binding.AuthDepartmentId ?? (binding.DepartmentId > 0 ? binding.DepartmentId : null);
        if (deptId != DepartmentId)
        {
            _logger.LogWarning(
                "Authorization handler for PTIS (DeptId={HandlerDeptId}) received binding for different department {BindingDeptId}",
                DepartmentId, deptId);
            return false;
        }

        // Extract property ID from binding's auth reference or reference table ID
        int? propertyId = binding.AuthReferenceId ?? (binding.ReferenceTableId > 0 ? binding.ReferenceTableId : null);
        if (!propertyId.HasValue || propertyId.Value <= 0)
        {
            _logger.LogWarning("Document binding {BindingId} has invalid Property reference", binding.Id);
            return false;
        }

        // Dedicated write/delete authorization: deny-by-default for non-uploaders
        _logger.LogInformation(
            "PTIS document modify check: User {UserId} requesting modification of Property {PropertyId} document (BindingId={BindingId})",
            userId, propertyId.Value, binding.Id);

        return await Task.FromResult(false);
    }
}
