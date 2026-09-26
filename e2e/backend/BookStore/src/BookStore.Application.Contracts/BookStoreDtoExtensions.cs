using BookStore.Books;
using Volo.Abp.ObjectExtending;
using Volo.Abp.ObjectExtending.Modularity;
using Volo.Abp.Threading;

namespace BookStore;

public static class BookStoreDtoExtensions
{
    private static readonly OneTimeRunner OneTimeRunner = new OneTimeRunner();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            // What `BookStoreModuleExtensionConfigurator` declared for BookStore.Book,
            // applied to the DTOs the API answers with. Without this the property is on
            // the entity and invisible to any client, which is exactly the case the
            // frontend's object extension mapping exists for.
            ModuleExtensionConfigurationHelper.ApplyEntityConfigurationToApi(
                "BookStore",
                "Book",
                getApiTypes: new[] { typeof(BookDto) },
                createApiTypes: new[] { typeof(CreateUpdateBookDto) },
                updateApiTypes: new[] { typeof(CreateUpdateBookDto) });
        });
    }
}
