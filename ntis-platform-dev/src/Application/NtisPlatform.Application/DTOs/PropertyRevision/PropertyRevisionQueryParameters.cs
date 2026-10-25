using NtisPlatform.Application.Attributes;
using NtisPlatform.Application.DTOs.Queries;
using NtisPlatform.Core.Enums.Revision;

namespace NtisPlatform.Application.DTOs.PropertyRevision;

public class PropertyRevisionQueryParameters : BaseQueryParameters
{
    [Filterable]
    [Sortable]
    public RevisionStatus? Status { get; set; }
}

