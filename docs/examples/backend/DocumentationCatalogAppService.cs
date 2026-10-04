using System;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.DependencyInjection;
using Volo.Abp.ObjectExtending;

namespace DocumentationSamples;

public class DocumentationCatalogStore : ISingletonDependency
{
    public ConcurrentDictionary<string, ConcurrentDictionary<Guid, DocumentationBookDto>> Tenants { get; } = new();
}

public class DocumentationBookDto : ExtensibleEntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "fiction";
    public decimal Price { get; set; }
    public int Year { get; set; } = DateTime.UtcNow.Year;
}

public class DocumentationBookInput : ExtensibleObject
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(fiction|reference)$")]
    public string Category { get; set; } = "fiction";

    [Range(0, 1000)]
    public decimal Price { get; set; }
}

public class DocumentationBookQuery : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? Category { get; set; }
    [Range(0, 1000)]
    public decimal? MinPrice { get; set; }
}

[Authorize("AbpIdentity.Users")]
public class DocumentationCatalogAppService : ApplicationService
{
    private readonly DocumentationCatalogStore _store;

    public DocumentationCatalogAppService(DocumentationCatalogStore store)
    {
        _store = store;
    }

    private ConcurrentDictionary<Guid, DocumentationBookDto> Books =>
        _store.Tenants.GetOrAdd(CurrentTenant.Id?.ToString() ?? "host", _ => new());

    public Task<PagedResultDto<DocumentationBookDto>> GetListAsync(DocumentationBookQuery input)
    {
        var query = Books.Values.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            query = query.Where(book => book.Name.Contains(input.Filter, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrEmpty(input.Category))
        {
            query = query.Where(book => book.Category == input.Category);
        }
        if (input.MinPrice.HasValue)
        {
            query = query.Where(book => book.Price >= input.MinPrice.Value);
        }
        var filtered = query.ToArray();
        var sort = (input.Sorting ?? "name asc").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var descending = sort.Length > 1 && sort[1].Equals("desc", StringComparison.OrdinalIgnoreCase);
        IOrderedEnumerable<DocumentationBookDto> ordered;
        if ((sort.FirstOrDefault() ?? "name").Equals("price", StringComparison.OrdinalIgnoreCase))
        {
            ordered = descending ? filtered.OrderByDescending(book => book.Price) : filtered.OrderBy(book => book.Price);
        }
        else
        {
            ordered = descending ? filtered.OrderByDescending(book => book.Name) : filtered.OrderBy(book => book.Name);
        }
        var items = ordered.ThenBy(book => book.Id).Skip(input.SkipCount).Take(input.MaxResultCount).ToList();
        return Task.FromResult(new PagedResultDto<DocumentationBookDto>(filtered.Length, items));
    }

    public Task<DocumentationBookDto> GetAsync(Guid id) => Task.FromResult(Find(id));

    public Task<DocumentationBookDto> CreateAsync(DocumentationBookInput input)
    {
        var book = new DocumentationBookDto
        {
            Id = GuidGenerator.Create(),
            Name = input.Name,
            Category = input.Category,
            Price = input.Price
        };
        foreach (var property in input.ExtraProperties)
        {
            book.ExtraProperties[property.Key] = property.Value;
        }
        Books[book.Id] = book;
        return Task.FromResult(book);
    }

    public Task<DocumentationBookDto> UpdateAsync(Guid id, DocumentationBookInput input)
    {
        var existing = Find(id);
        var book = new DocumentationBookDto
        {
            Id = id,
            Name = input.Name,
            Category = input.Category,
            Price = input.Price,
            Year = existing.Year
        };
        foreach (var property in existing.ExtraProperties)
        {
            book.ExtraProperties[property.Key] = property.Value;
        }
        foreach (var property in input.ExtraProperties)
        {
            book.ExtraProperties[property.Key] = property.Value;
        }
        Books[id] = book;
        return Task.FromResult(book);
    }

    public Task DeleteAsync(Guid id)
    {
        if (!Books.TryRemove(id, out _))
        {
            throw new UserFriendlyException("The book no longer exists.");
        }
        return Task.CompletedTask;
    }

    private DocumentationBookDto Find(Guid id) => Books.TryGetValue(id, out var book)
        ? book : throw new UserFriendlyException("The book no longer exists.");
}
