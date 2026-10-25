using NtisPlatform.Core.Interfaces;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace NtisPlatform.Core.Entities.GrievanceEntities;

/// <summary>
/// Grievance photo business table (GRV.GrievancePhoto).
/// Stores photo records for Grievances with a link to document storage.
/// </summary>
public class GrievancePhotoEntity : BaseEntity, IHardDeletable
{
    protected GrievancePhotoEntity() { }

    public static GrievancePhotoEntity Create(
        int grievanceApplicationId,
        int photoTypeId,
        string? remarks = null)
    {
        return new GrievancePhotoEntity
        {
            GrievanceApplicationId = grievanceApplicationId,
            PhotoTypeId = photoTypeId,
            Remarks = remarks,
            IsLatest = true,
            IsActive = true
        };
    }

    public int GrievanceApplicationId { get; private set; }
    public int PhotoTypeId { get; private set; }
    public int? DocumentBindingId { get; private set; }
    
    public bool IsLatest { get; private set; } = true;
    public string? Remarks { get; private set; }

    private bool _markedForDeletion = false;
    private DateTime? _markedForDeletionDate;

    public bool MarkedForDeletion => _markedForDeletion;
    public DateTime? MarkedForDeletionDate => _markedForDeletionDate;

    bool IHardDeletable.MarkedForDeletion
    {
        get => _markedForDeletion;
        set => _markedForDeletion = value;
    }

    DateTime? IHardDeletable.MarkedForDeletionDate
    {
        get => _markedForDeletionDate;
        set => _markedForDeletionDate = value;
    }

    public GrievancePhotoTypeEntity? PhotoType { get; private set; }
    public GrievanceApplicationEntity? GrievanceApplication { get; private set; }
    public DocumentBindingEntity? DocumentBinding { get; private set; }

    public void LinkDocumentBinding(int documentBindingId)
    {
        if (documentBindingId <= 0)
            throw new ArgumentException("Document binding ID must be greater than zero.", nameof(documentBindingId));

        DocumentBindingId = documentBindingId;
    }

    public void MarkAsSuperseded()
    {
        IsLatest = false;
    }

    public void MarkForDeletion()
    {
        if (_markedForDeletion)
            throw new InvalidOperationException("Photo is already marked for deletion.");

        _markedForDeletion = true;
        _markedForDeletionDate = DateTime.Now;
        IsActive = false;
        IsLatest = false;
    }

    public void RestoreFromDeletion()
    {
        if (!_markedForDeletion)
            throw new InvalidOperationException("Photo is not marked for deletion.");

        _markedForDeletion = false;
        _markedForDeletionDate = null;
        IsActive = true;
    }

    public void RestoreFromSuperseding()
    {
        IsLatest = true;
    }

    public void UnlinkDocumentBinding()
    {
        DocumentBindingId = null;
    }

    public void SetRemarks(string? remarks)
    {
        if (!string.IsNullOrWhiteSpace(remarks) && remarks.Length > 500)
            throw new ArgumentException("Remarks cannot exceed 500 characters.", nameof(remarks));
            
        Remarks = remarks;
    }
}
