using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace BookStore.Books;

/// <summary>
/// The five endpoints <c>abpv generate</c> recognises by shape: one that lists, one that
/// reads, one that creates, one that updates and one that deletes.
/// </summary>
public interface IBookAppService : IApplicationService
{
    Task<PagedResultDto<BookDto>> GetListAsync(GetBookListInput input);

    Task<BookDto> GetAsync(Guid id);

    Task<BookDto> CreateAsync(CreateUpdateBookDto input);

    Task<BookDto> UpdateAsync(Guid id, CreateUpdateBookDto input);

    Task DeleteAsync(Guid id);
}
