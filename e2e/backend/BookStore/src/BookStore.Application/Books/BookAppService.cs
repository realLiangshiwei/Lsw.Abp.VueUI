using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BookStore.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.ObjectExtending;

namespace BookStore.Books;

/// <summary>
/// Written out rather than inherited from <c>CrudAppService</c>: the shape of the API is
/// what the page generator reads, and writing it out keeps that shape in one file where
/// a reader can see it. Extra properties are mapped explicitly for the same reason --
/// they are what proves a generated page picks up an object extension without being
/// generated again.
/// </summary>
[Authorize(BookStorePermissions.Books)]
public class BookAppService : BookStoreAppService, IBookAppService
{
    private readonly IRepository<Book, Guid> _books;

    public BookAppService(IRepository<Book, Guid> books)
    {
        _books = books;
    }

    public async Task<PagedResultDto<BookDto>> GetListAsync(GetBookListInput input)
    {
        var query = await _books.GetQueryableAsync();

        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            query = query.Where(book => book.Name.Contains(input.Filter));
        }

        var total = query.Count();
        var sorting = string.IsNullOrWhiteSpace(input.Sorting) ? "Name" : input.Sorting;

        var items = query
            .OrderBy(book => sorting.StartsWith("Price", StringComparison.OrdinalIgnoreCase)
                ? (object)book.Price
                : book.Name)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .ToList();

        return new PagedResultDto<BookDto>(total, items.Select(ToDto).ToList());
    }

    public async Task<BookDto> GetAsync(Guid id)
    {
        return ToDto(await _books.GetAsync(id));
    }

    [Authorize(BookStorePermissions.BooksCreate)]
    public async Task<BookDto> CreateAsync(CreateUpdateBookDto input)
    {
        var book = new Book(GuidGenerator.Create());
        Apply(input, book);

        return ToDto(await _books.InsertAsync(book, autoSave: true));
    }

    [Authorize(BookStorePermissions.BooksUpdate)]
    public async Task<BookDto> UpdateAsync(Guid id, CreateUpdateBookDto input)
    {
        var book = await _books.GetAsync(id);
        Apply(input, book);

        return ToDto(await _books.UpdateAsync(book, autoSave: true));
    }

    [Authorize(BookStorePermissions.BooksDelete)]
    public async Task DeleteAsync(Guid id)
    {
        await _books.DeleteAsync(id);
    }

    private static void Apply(CreateUpdateBookDto input, Book book)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new UserFriendlyException("A book needs a name.");
        }

        book.Name = input.Name;
        book.Type = input.Type;
        book.PublishDate = input.PublishDate;
        book.Price = input.Price;

        input.MapExtraPropertiesTo(book, MappingPropertyDefinitionChecks.Destination);
    }

    private static BookDto ToDto(Book book)
    {
        var dto = new BookDto
        {
            Id = book.Id,
            Name = book.Name,
            Type = book.Type,
            PublishDate = book.PublishDate,
            Price = book.Price,
            CreationTime = book.CreationTime,
            CreatorId = book.CreatorId,
            LastModificationTime = book.LastModificationTime,
            LastModifierId = book.LastModifierId,
        };

        book.MapExtraPropertiesTo(dto, MappingPropertyDefinitionChecks.Destination);

        return dto;
    }
}
