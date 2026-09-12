using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BookStore.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Content;

namespace BookStore.Files;

[Authorize(BookStorePermissions.Files)]
public class FileAppService : BookStoreAppService, IFileAppService
{
    private static readonly ConcurrentDictionary<string, byte[]> Files = new();

    public Task<ListResultDto<FileDescriptorDto>> GetListAsync()
    {
        var items = Files
            .Select(file => new FileDescriptorDto { Name = file.Key, Size = file.Value.LongLength })
            .OrderBy(file => file.Name)
            .ToList();

        return Task.FromResult(new ListResultDto<FileDescriptorDto>(items));
    }

    public Task<IRemoteStreamContent> GetContentAsync(string name)
    {
        if (!Files.TryGetValue(name, out var content))
        {
            throw new UserFriendlyException($"There is no file named {name}.");
        }

        return Task.FromResult<IRemoteStreamContent>(
            new RemoteStreamContent(new MemoryStream(content), name, "application/octet-stream"));
    }

    [Authorize(BookStorePermissions.FilesUpload)]
    public async Task<FileDescriptorDto> UploadAsync(IRemoteStreamContent file)
    {
        using var buffer = new MemoryStream();
        await file.GetStream().CopyToAsync(buffer);

        var name = file.FileName ?? "unnamed";
        Files[name] = buffer.ToArray();

        return new FileDescriptorDto { Name = name, Size = buffer.Length };
    }
}
