import { ref } from 'vue';
import { defineService, inject } from '@lsw-abpvue/core';
import { ToolbarAction } from '@lsw-abpvue/components';
import { IdentityComponents, type IdentityConfigOptions } from '@lsw-abpvue/identity';
import type { IdentityUserDto } from '@lsw-abpvue/identity/proxy';
import { ToasterService } from '@lsw-abpvue/theme-shared';
import { ReportService } from './report-service';

const ReportCommand = defineService('ReportCommand', () => {
  const reports = inject(ReportService);
  const toaster = inject(ToasterService);
  const busy = ref(false);
  return {
    async run(): Promise<void> {
      if (busy.value) return;
      busy.value = true;
      try {
        const report = await reports.get(new Date().getFullYear());
        toaster.info(
          { key: 'BookStore::ReportTotal', defaultValue: 'Report total: {0}' },
          undefined,
          { messageLocalizationParams: [String(report.total)] },
        );
      } catch {
        /* The request error handlers report the failure. */
      } finally {
        busy.value = false;
      }
    },
  };
});
export const reportToolbar = {
  toolbarActionContributors: {
    [IdentityComponents.Users]: [
      actions =>
        actions.addTail(
          ToolbarAction.create<readonly IdentityUserDto[]>({
            text: 'BookStore::Report',
            permission: 'AbpIdentity.Users',
            icon: 'bi bi-bar-chart',
            action: data => data.getInjected(ReportCommand).run(),
          }),
        ),
    ],
  },
} satisfies IdentityConfigOptions;
