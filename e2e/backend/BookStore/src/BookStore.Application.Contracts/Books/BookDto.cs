using System;
using Volo.Abp.Application.Dtos;

namespace BookStore.Books;

/// <summary>
/// Extensible on purpose: the generated page has to pick up whatever
/// <c>ObjectExtensions</c> declares for a book without being generated again.
/// </summary>
public class BookDto : ExtensibleAuditedEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;

    public BookType Type { get; set; }

    public DateTime PublishDate { get; set; }

    public float Price { get; set; }
}
