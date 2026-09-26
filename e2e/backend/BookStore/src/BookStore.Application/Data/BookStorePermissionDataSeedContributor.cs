using System.Linq;
using System.Threading.Tasks;
using BookStore.Permissions;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;

namespace BookStore.Data;

/// <summary>
/// Grants the application's own permissions to the admin role. ABP seeds the admin role
/// with every permission that existed when the role was created; one added later reaches
/// nobody, and the tests that use this backend would fail with a 403 that has nothing to
/// do with what they are testing.
///
/// The permission cache is per process, so a backend that was running while this ran has
/// to be restarted before it answers differently.
/// </summary>
public class BookStorePermissionDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IPermissionDataSeeder _permissions;
    private readonly IIdentityRoleRepository _roles;

    public BookStorePermissionDataSeedContributor(
        IPermissionDataSeeder permissions,
        IIdentityRoleRepository roles)
    {
        _permissions = permissions;
        _roles = roles;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        var admin = (await _roles.GetListAsync()).FirstOrDefault(role => role.IsStatic);
        if (admin == null)
        {
            return;
        }

        await _permissions.SeedAsync(
            RolePermissionValueProvider.ProviderName,
            admin.Name,
            new[]
            {
                BookStorePermissions.Books,
                BookStorePermissions.BooksCreate,
                BookStorePermissions.BooksUpdate,
                BookStorePermissions.BooksDelete,
                BookStorePermissions.Files,
                BookStorePermissions.FilesUpload,
            },
            context.TenantId);
    }
}
