using Volo.Abp.Application.Dtos;

namespace BookStore.Books;

/// <summary>A filter on the list endpoint is what puts a search box on the page.</summary>
public class GetBookListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
}
