using BookStore.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace BookStore.Permissions;

public class BookStorePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(BookStorePermissions.GroupName);

        var files = myGroup.AddPermission(BookStorePermissions.Files, L("Permission:Files"));
        files.AddChild(BookStorePermissions.FilesUpload, L("Permission:Files.Upload"));

        var books = myGroup.AddPermission(BookStorePermissions.Books, L("Permission:Books"));
        books.AddChild(BookStorePermissions.BooksCreate, L("Permission:Books.Create"));
        books.AddChild(BookStorePermissions.BooksUpdate, L("Permission:Books.Update"));
        books.AddChild(BookStorePermissions.BooksDelete, L("Permission:Books.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<BookStoreResource>(name);
    }
}
