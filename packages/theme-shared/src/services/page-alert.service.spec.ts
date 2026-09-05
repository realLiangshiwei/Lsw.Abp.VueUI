import { createInjector } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { PageAlertService } from './page-alert.service.js';

const create = () => createInjector([]).get(PageAlertService);

describe('PageAlertService', () => {
  it('puts the newest alert first', () => {
    const alerts = create();

    alerts.show({ message: 'AbpUi::First' });
    alerts.show({ message: 'AbpUi::Second' });

    expect(alerts.alerts.value.map(alert => alert.message)).toEqual([
      'AbpUi::Second',
      'AbpUi::First',
    ]);
  });

  it('is neutral and dismissible unless the caller says otherwise', () => {
    const alerts = create();

    alerts.show({ message: 'AbpUi::Hello' });

    expect(alerts.alerts.value[0]).toMatchObject({ severity: 'neutral', dismissible: true });
  });

  it('removes by the id it hands back', () => {
    const alerts = create();

    const id = alerts.show({ message: 'AbpUi::Hello' });
    alerts.remove(id);

    expect(alerts.alerts.value).toHaveLength(0);
  });

  it('replaces the alert with an id the caller owns instead of repeating it', () => {
    const alerts = create();

    alerts.show({ id: 'quota', message: 'AbpUi::Nearly' });
    alerts.show({ id: 'quota', message: 'AbpUi::Full' });

    expect(alerts.alerts.value).toHaveLength(1);
    expect(alerts.alerts.value[0]?.message).toBe('AbpUi::Full');
  });

  it('clears everything', () => {
    const alerts = create();

    alerts.show({ message: 'AbpUi::First' });
    alerts.show({ message: 'AbpUi::Second' });
    alerts.clear();

    expect(alerts.alerts.value).toHaveLength(0);
  });
});
