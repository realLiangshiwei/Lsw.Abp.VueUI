using System;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.SettingManagement;
using Volo.Abp.Settings;
using Volo.Abp.Users;

namespace DocumentationSamples;

public class PrintingSettingDefinitionProvider : SettingDefinitionProvider
{
    public const string DefaultCopies = "Documentation.Printing.DefaultCopies";

    public override void Define(ISettingDefinitionContext context)
    {
        context.Add(new SettingDefinition(DefaultCopies, "1", isVisibleToClients: true));
    }
}

public class PrintingSettingsDto
{
    [Range(1, 20)]
    public int Copies { get; set; }
}

[Authorize("AbpIdentity.Users")]
public class PrintingSettingsAppService : ApplicationService
{
    private readonly ISettingManager _settings;

    public PrintingSettingsAppService(ISettingManager settings)
    {
        _settings = settings;
    }

    public async Task<PrintingSettingsDto> GetAsync()
    {
        var value = await _settings.GetOrNullForUserAsync(PrintingSettingDefinitionProvider.DefaultCopies, CurrentUser.GetId());
        return new PrintingSettingsDto { Copies = int.Parse(value ?? "1", CultureInfo.InvariantCulture) };
    }

    public async Task<PrintingSettingsDto> UpdateAsync(PrintingSettingsDto input)
    {
        await _settings.SetForUserAsync(CurrentUser.GetId(), PrintingSettingDefinitionProvider.DefaultCopies, input.Copies.ToString(CultureInfo.InvariantCulture));
        return await GetAsync();
    }

    public Task ResetAsync() => _settings.SetForUserAsync(CurrentUser.GetId(), PrintingSettingDefinitionProvider.DefaultCopies, null);
}
