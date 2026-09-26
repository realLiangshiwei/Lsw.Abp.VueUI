using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.ObjectExtending;

namespace BookStore.Books;

public class CreateUpdateBookDto : ExtensibleObject
{
    [Required]
    [StringLength(128, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public BookType Type { get; set; } = BookType.Undefined;

    [Required]
    public DateTime PublishDate { get; set; } = DateTime.Now;

    [Required]
    [Range(0, 1000)]
    public float Price { get; set; }
}
