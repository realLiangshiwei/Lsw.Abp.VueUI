import { createInjector } from '@lsw-abpvue/core';
import type { ClaimTypeDto } from '@lsw-abpvue/identity-pro/proxy';
import { describe, expect, it, vi } from 'vitest';
import { IDENTITY_PRO_CLAIMS_PAGE } from '../tokens/claims-page.token.js';
import {
  DEFAULT_CLAIMS_CREATE_FORM_PROPS,
  DEFAULT_CLAIMS_EDIT_FORM_PROPS,
  DEFAULT_CLAIMS_ENTITY_ACTIONS,
  DEFAULT_CLAIMS_ENTITY_PROPS,
  DEFAULT_CLAIMS_TOOLBAR_ACTIONS,
} from './claims.js';

const record: ClaimTypeDto = {
  id: 'type',
  name: 'team',
  isStatic: false,
  required: true,
  valueType: 0,
  creationTime: '',
};
describe('commercial claim type defaults', () => {
  it('publishes the six commercial sortable columns and all four value type labels', () => {
    expect(DEFAULT_CLAIMS_ENTITY_PROPS.map(prop => prop.name)).toEqual([
      'name',
      'valueType',
      'description',
      'regex',
      'required',
      'isStatic',
    ]);
    expect(DEFAULT_CLAIMS_ENTITY_PROPS.every(prop => prop.sortable)).toBe(true);
    const valueType = DEFAULT_CLAIMS_ENTITY_PROPS.find(prop => prop.name === 'valueType');
    for (const [value, label] of ['String', 'Int', 'Boolean', 'DateTime'].entries()) {
      expect(
        valueType?.valueResolver({
          record: { ...record, valueType: value },
          getInjected: () => undefined,
        }),
      ).toBe(label);
    }
  });

  it('includes every field, the expression description hint, and numeric value type choices', async () => {
    expect(DEFAULT_CLAIMS_CREATE_FORM_PROPS.map(prop => prop.name)).toEqual([
      'name',
      'required',
      'regex',
      'regexDescription',
      'description',
      'valueType',
    ]);
    expect(DEFAULT_CLAIMS_EDIT_FORM_PROPS).toBe(DEFAULT_CLAIMS_CREATE_FORM_PROPS);
    const options = DEFAULT_CLAIMS_CREATE_FORM_PROPS.find(prop => prop.name === 'valueType');
    expect(options?.defaultValue).toBe(0);
    expect(await options?.options?.({ record, getInjected: () => undefined })).toEqual([
      { label: 'String', value: 0 },
      { label: 'Int', value: 1 },
      { label: 'Boolean', value: 2 },
      { label: 'DateTime', value: 3 },
    ]);
    expect(
      DEFAULT_CLAIMS_CREATE_FORM_PROPS.find(prop => prop.name === 'regexDescription')?.formText,
    ).toBe('AbpIdentity::RegexDescriptionFormText');
  });

  it('hides static editing, retains static deletion action, and dispatches typed commands', async () => {
    const commands = {
      add: vi.fn(),
      edit: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    };
    const injector = createInjector([{ provide: IDENTITY_PRO_CLAIMS_PAGE, useValue: commands }]);
    const data = { record, getInjected: injector.get.bind(injector) };
    try {
      const edit = DEFAULT_CLAIMS_ENTITY_ACTIONS.find(action => action.text === 'AbpUi::Edit');
      const remove = DEFAULT_CLAIMS_ENTITY_ACTIONS.find(action => action.text === 'AbpUi::Delete');
      expect(edit?.visible({ ...data, record: { ...record, isStatic: true } })).toBe(false);
      expect(remove?.visible({ ...data, record: { ...record, isStatic: true } })).toBe(true);
      expect(edit?.permission).toBe('AbpIdentity.ClaimTypes.Update');
      expect(remove?.permission).toBe('AbpIdentity.ClaimTypes.Delete');
      for (const action of DEFAULT_CLAIMS_ENTITY_ACTIONS) await action.action(data);
      await DEFAULT_CLAIMS_TOOLBAR_ACTIONS[0]?.action({ ...data, record: [record] });
      expect(commands.edit).toHaveBeenCalledExactlyOnceWith(record);
      expect(commands.remove).toHaveBeenCalledExactlyOnceWith(record);
      expect(commands.add).toHaveBeenCalledOnce();
    } finally {
      injector.destroy();
    }
  });
});
