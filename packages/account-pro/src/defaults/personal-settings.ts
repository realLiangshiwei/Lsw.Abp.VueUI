import { DEFAULT_PERSONAL_SETTINGS_FORM_PROPS } from '@lsw-abpvue/account';
import { FormProp, PropType } from '@lsw-abpvue/components';
import { ConfigStateService } from '@lsw-abpvue/core';
import { ProfileService, type ProfileDto } from '@lsw-abpvue/account-pro/proxy';

export const DEFAULT_ACCOUNT_PRO_PERSONAL_SETTINGS_FORM_PROPS = [
  ...DEFAULT_PERSONAL_SETTINGS_FORM_PROPS.map(
    prop =>
      new FormProp<ProfileDto>({
        ...prop,
        readonly: data => {
          if (!data) return false;
          const key =
            prop.name === 'userName'
              ? 'IsUserNameUpdateEnabled'
              : prop.name === 'email'
                ? 'IsEmailUpdateEnabled'
                : undefined;
          return Boolean(
            key &&
            data
              .getInjected(ConfigStateService)
              .snapshot()
              .setting.values[`Abp.Identity.User.${key}`]?.toLowerCase() === 'false',
          );
        },
      }),
  ),
  new FormProp<ProfileDto>({
    name: 'timezone',
    type: PropType.Enum,
    displayName: 'AbpSettingManagement::Menu:TimeZone',
    visible: data =>
      Boolean(
        data?.record.supportsMultipleTimezone &&
        data.getInjected(ConfigStateService).snapshot().clock.kind === 'Utc',
      ),
    options: data =>
      data
        .getInjected(ProfileService)
        .getTimezones()
        .then(items => items.map(item => ({ value: item.value ?? '', label: item.name ?? '' }))),
  }),
];
