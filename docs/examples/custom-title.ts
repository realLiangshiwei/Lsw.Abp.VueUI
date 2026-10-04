import {
  ABP_ROOT_OPTIONS,
  defineService,
  DocumentService,
  inject,
  LocalizationService,
  onServiceDestroy,
  provideAppInitializer,
} from '@lsw-abpvue/core';
import { withTitleStrategy, type TitleStrategy } from '@lsw-abpvue/core/router';

export const CustomTitleStrategy = defineService('CustomTitleStrategy', () => {
  const documentService = inject(DocumentService);
  const localization = inject(LocalizationService);
  const options = inject(ABP_ROOT_OPTIONS);
  let title: string | undefined;
  let stop: (() => void) | undefined;

  function update(): void {
    const name = options.environment.application.name;
    documentService.setTitle(title ? `${name} — ${localization.t(title)}` : name);
  }

  onServiceDestroy(() => stop?.());
  return {
    init: () => {
      stop ??= localization.onLanguageChange(update);
    },
    setTitle: (value: string | undefined) => {
      title = value;
      update();
    },
  } satisfies TitleStrategy & { init(): void };
});

export const customTitleFeature = withTitleStrategy(CustomTitleStrategy);
export const initializeCustomTitle = provideAppInitializer(() => {
  inject(CustomTitleStrategy).init();
});
