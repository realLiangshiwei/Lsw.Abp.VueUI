using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace BookStore.Books;

/// <summary>
/// The entity the CRUD page generator is measured against. Same shape as the one in
/// ABP's BookStore tutorial, so the generated page can be compared with the React
/// template's hand-written one.
/// </summary>
public class Book : AuditedAggregateRoot<Guid>
{
    protected Book()
    {
    }

    public Book(Guid id)
        : base(id)
    {
    }

    public string Name { get; set; } = string.Empty;

    public BookType Type { get; set; }

    public DateTime PublishDate { get; set; }

    public float Price { get; set; }
}
