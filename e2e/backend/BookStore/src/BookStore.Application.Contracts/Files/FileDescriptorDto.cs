using System.ComponentModel.DataAnnotations;

namespace BookStore.Files;

public class FileDescriptorDto
{
    [Required]
    [StringLength(64, MinimumLength = 1)]
    public string Name { get; set; } = default!;

    public long Size { get; set; }
}
