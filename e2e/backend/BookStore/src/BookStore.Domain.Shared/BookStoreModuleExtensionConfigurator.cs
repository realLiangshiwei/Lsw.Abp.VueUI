using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Identity;
using Volo.Abp.ObjectExtending;
using Volo.Abp.Threading;

namespace BookStore;

/// <summary>
/// Object extensions used as a test fixture for the Vue UI.
///
/// The point is coverage, not realism: every property here exists to exercise one
/// branch of the frontend mapping from objectExtensions to table columns and form
/// fields. Keep them in sync with the mapping tests.
/// </summary>
public static class BookStoreModuleExtensionConfigurator
{
    private static readonly OneTimeRunner OneTimeRunner = new OneTimeRunner();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            ConfigureExistingProperties();
            ConfigureExtraProperties();
        });
    }

    private static void ConfigureExistingProperties()
    {
    }

    private static void ConfigureExtraProperties()
    {
        ObjectExtensionManager.Instance.Modules()
            .ConfigureIdentity(identity =>
            {
                identity.ConfigureUser(user =>
                {
                    // string, required, min and max length, visible everywhere
                    user.AddOrUpdateProperty<string>("SocialSecurityNumber", p =>
                    {
                        p.Attributes.Add(new RequiredAttribute());
                        p.Attributes.Add(new StringLengthAttribute(64) { MinimumLength = 4 });
                        p.UI.OnTable.IsVisible = true;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });

                    // int with a range
                    user.AddOrUpdateProperty<int>("Age", p =>
                    {
                        p.Attributes.Add(new RangeAttribute(0, 150));
                        p.DefaultValue = 0;
                        p.UI.OnTable.IsVisible = true;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });

                    // bool, table only. Nullable on purpose: ABP requires a value for a
                    // non-nullable extension property, and no form here can give it one.
                    user.AddOrUpdateProperty<bool?>("IsExternal", p =>
                    {
                        p.DefaultValue = false;
                        p.UI.OnTable.IsVisible = true;
                        p.UI.OnCreateForm.IsVisible = false;
                        p.UI.OnEditForm.IsVisible = false;
                    });

                    // date, forms only
                    user.AddOrUpdateProperty<DateTime?>("HireDate", p =>
                    {
                        p.UI.OnTable.IsVisible = false;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });

                    // enum
                    user.AddOrUpdateProperty<EmployeeTitle>("Title", p =>
                    {
                        p.DefaultValue = EmployeeTitle.Engineer;
                        p.UI.OnTable.IsVisible = true;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });

                    // regular expression, edit form only
                    user.AddOrUpdateProperty<string>("Website", p =>
                    {
                        p.Attributes.Add(new RegularExpressionAttribute(@"^https?://.+"));
                        p.UI.OnTable.IsVisible = false;
                        p.UI.OnCreateForm.IsVisible = false;
                        p.UI.OnEditForm.IsVisible = true;
                    });

                    // permission gated, with help text under the field
                    user.AddOrUpdateProperty<string>("InternalNote", p =>
                    {
                        p.Attributes.Add(new StringLengthAttribute(256));
                        p.Policy.Permissions.PermissionNames = new[] { "AbpIdentity.Users.Update" };
                        p.UI.OnTable.IsVisible = false;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });
                });

                identity.ConfigureRole(role =>
                {
                    role.AddOrUpdateProperty<string>("Department", p =>
                    {
                        p.Attributes.Add(new StringLengthAttribute(128));
                        p.UI.OnTable.IsVisible = true;
                        p.UI.OnCreateForm.IsVisible = true;
                        p.UI.OnEditForm.IsVisible = true;
                    });
                });
            });
    }
}

public enum EmployeeTitle
{
    Engineer = 0,
    Manager = 1,
    Director = 2
}
