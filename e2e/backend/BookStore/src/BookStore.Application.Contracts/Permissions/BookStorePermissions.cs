namespace BookStore.Permissions;

public static class BookStorePermissions
{
    public const string GroupName = "BookStore";


    /// <summary>The file store the proxy generator's tests use.</summary>
    public const string Files = GroupName + ".Files";

    public const string FilesUpload = Files + ".Upload";
}
