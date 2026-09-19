using BookStore.Localization;
using Volo.Abp.Features;
using Volo.Abp.Localization;
using Volo.Abp.Validation.StringValues;

namespace BookStore.Features;

/// <summary>
/// One feature of every value type the feature dialog can render. The open source modules
/// only ever define toggles, so free text and selection would otherwise go untested.
/// </summary>
public class BookStoreFeatureDefinitionProvider : FeatureDefinitionProvider
{
    public override void Define(IFeatureDefinitionContext context)
    {
        var group = context.AddGroup(BookStoreFeatures.GroupName, L("Feature:BookStore"));

        var printing = group.AddFeature(
            BookStoreFeatures.Printing,
            defaultValue: "false",
            displayName: L("Feature:Printing"),
            description: L("Feature:PrintingDescription"),
            valueType: new ToggleStringValueType());

        printing.CreateChild(
            BookStoreFeatures.MaxCopies,
            defaultValue: "10",
            displayName: L("Feature:MaxCopies"),
            valueType: new FreeTextStringValueType(new NumericValueValidator(1, 100)));

        printing.CreateChild(
            BookStoreFeatures.PaperSize,
            defaultValue: "A4",
            displayName: L("Feature:PaperSize"),
            valueType: new SelectionStringValueType
            {
                ItemSource = new StaticSelectionStringValueItemSource(
                    new LocalizableSelectionStringValueItem
                    {
                        Value = "A4",
                        DisplayText = new LocalizableStringInfo("BookStore", "Feature:PaperSize.A4")
                    },
                    new LocalizableSelectionStringValueItem
                    {
                        Value = "Letter",
                        DisplayText = new LocalizableStringInfo("BookStore", "Feature:PaperSize.Letter")
                    })
            });
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<BookStoreResource>(name);
    }
}
