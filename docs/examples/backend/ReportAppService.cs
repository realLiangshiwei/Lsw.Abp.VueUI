using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;

namespace DocumentationSamples;

public class DocumentationReportDto
{
    public int Total { get; set; }
}

[Authorize("AbpIdentity.Users")]
public class ReportAppService : ApplicationService
{
    private readonly DocumentationCatalogStore _store;

    public ReportAppService(DocumentationCatalogStore store)
    {
        _store = store;
    }

    public Task<DocumentationReportDto> GetAsync([Range(2000, 2100)] int year)
    {
        var key = CurrentTenant.Id?.ToString() ?? "host";
        var total = _store.Tenants.TryGetValue(key, out var books)
            ? books.Values.Count(book => book.Year == year) : 0;
        return Task.FromResult(new DocumentationReportDto { Total = total });
    }
}
