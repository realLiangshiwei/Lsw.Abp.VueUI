using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Content;

namespace BookStore.Files;

/// <summary>
/// A file store the proxy generator's tests upload to and download from. It exists so
/// there is one endpoint of each shape -- multipart in, a stream out -- on a backend
/// generated from the open source template, which has none of its own.
/// </summary>
public interface IFileAppService : IApplicationService
{
    Task<ListResultDto<FileDescriptorDto>> GetListAsync();

    Task<IRemoteStreamContent> GetContentAsync(string name);

    Task<FileDescriptorDto> UploadAsync(IRemoteStreamContent file);
}
