import { createInjector } from '@lsw-abpvue/core';
import { describe, expect, it } from 'vitest';
import { ConfirmationStatus } from '../models/confirmation.js';
import { ConfirmationService } from './confirmation.service.js';

const create = () => {
  const injector = createInjector([]);
  return { injector, confirmation: injector.get(ConfirmationService) };
};

describe('ConfirmationService', () => {
  it('publishes the question for the host to render', () => {
    const { confirmation } = create();

    void confirmation.warn('AbpUi::AreYouSure', 'AbpUi::Delete');

    expect(confirmation.current.value).toMatchObject({
      message: 'AbpUi::AreYouSure',
      title: 'AbpUi::Delete',
      severity: 'warning',
    });
  });

  it('resolves with the answer and takes the question down', async () => {
    const { confirmation } = create();

    const answer = confirmation.warn('AbpUi::AreYouSure');
    confirmation.clear(ConfirmationStatus.confirm);

    await expect(answer).resolves.toBe(ConfirmationStatus.confirm);
    expect(confirmation.current.value).toBeNull();
  });

  it('treats an unanswered close as a dismissal', async () => {
    const { confirmation } = create();

    const answer = confirmation.info('AbpUi::AreYouSure');
    confirmation.clear();

    await expect(answer).resolves.toBe(ConfirmationStatus.dismiss);
  });

  it('is dismissible unless the caller says otherwise', () => {
    const { confirmation } = create();

    void confirmation.info('AbpUi::AreYouSure');
    expect(confirmation.current.value?.options.dismissible).toBe(true);

    void confirmation.info('AbpUi::Blocking', undefined, { dismissible: false });
    expect(confirmation.current.value?.options.dismissible).toBe(false);
  });

  it('dismisses the open question when a second one is asked', async () => {
    const { confirmation } = create();

    const first = confirmation.info('AbpUi::First');
    const second = confirmation.info('AbpUi::Second');

    await expect(first).resolves.toBe(ConfirmationStatus.dismiss);
    expect(confirmation.current.value?.message).toBe('AbpUi::Second');

    confirmation.clear(ConfirmationStatus.reject);
    await expect(second).resolves.toBe(ConfirmationStatus.reject);
  });

  it('does not leave a caller waiting when the injector is destroyed', async () => {
    const { injector, confirmation } = create();

    const answer = confirmation.info('AbpUi::AreYouSure');
    injector.destroy();

    await expect(answer).resolves.toBe(ConfirmationStatus.dismiss);
  });
});
