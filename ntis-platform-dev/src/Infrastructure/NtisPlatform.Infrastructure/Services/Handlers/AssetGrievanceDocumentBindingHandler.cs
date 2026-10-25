using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NtisPlatform.Core.Entities;
using NtisPlatform.Core.Interfaces;
using NtisPlatform.Infrastructure.Data;

namespace NtisPlatform.Infrastructure.Services.Handlers;

public sealed class AssetGrievanceDocumentBindingHandler : IDocumentBindingHandler
{
    private readonly ApplicationDbContext _context;
    
    public AssetGrievanceDocumentBindingHandler(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public string ReferenceTableName => "AssetGrievanceDocument";
    
    public bool Handles(string referenceTableName)
        => string.Equals(referenceTableName, "AssetGrievanceDocument", StringComparison.OrdinalIgnoreCase);
        
    public async Task<bool> ReferenceExistsAsync(int referenceTableId, CancellationToken cancellationToken)
        => await _context.AssetGrievanceDocuments.AnyAsync(x => x.Id == referenceTableId, cancellationToken);
        
    public async Task<bool> ReferenceExistsAsync(int referenceTableId, string? referencePropertyName, CancellationToken cancellationToken)
        => await ReferenceExistsAsync(referenceTableId, cancellationToken);
        
    public async Task OnAfterUploadAsync(int documentId, int bindingId, int referenceTableId, int uploadedBy, CancellationToken cancellationToken)
    {
        var doc = await _context.AssetGrievanceDocuments.FirstOrDefaultAsync(x => x.Id == referenceTableId, cancellationToken);
        if (doc != null)
        {
            doc.DocumentBindingId = bindingId;
            doc.UpdatedBy = uploadedBy;
            doc.UpdatedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
    
    public async Task OnBeforeDeleteAsync(DocumentBindingEntity binding, int deletedBy, CancellationToken cancellationToken)
    {
        if (binding.ReferenceTableId.HasValue)
        {
            var doc = await _context.AssetGrievanceDocuments.FirstOrDefaultAsync(x => x.Id == binding.ReferenceTableId.Value, cancellationToken);
            if (doc != null)
            {
                doc.DocumentBindingId = null;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
