namespace BookStore.Permissions;

public static class BookStorePermissions
{
    public const string GroupName = "BookStore";


    /// <summary>The file store the proxy generator's tests use.</summary>
    public const string Files = GroupName + ".Files";

    public const string FilesUpload = Files + ".Upload";

    /// <summary>The entity the CRUD page generator is measured against.</summary>
    public const string Books = GroupName + ".Books";

    public const string BooksCreate = Books + ".Create";

    public const string BooksUpdate = Books + ".Update";

    public const string BooksDelete = Books + ".Delete";
}
