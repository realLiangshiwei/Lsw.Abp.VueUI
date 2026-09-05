import { describe, expect, it } from 'vitest';
import { computed, effect } from 'vue';
import { useAbpForm } from './use-abp-form.js';
import { compare, maxLength, required } from './validators.js';

const login = () =>
  useAbpForm({
    userName: { value: '', validators: [required(), maxLength(8)] },
    password: { value: '' },
    confirmPassword: { value: '', validators: [compare('password')] },
  });

describe('a control', () => {
  it('reports the errors of every validator that failed', () => {
    const form = login();
    form.controls.userName.value = 'much too long';

    expect(form.controls.userName.errors.map(error => error.rule)).toEqual(['maxLength']);
    expect(form.controls.userName.invalid).toBe(true);
  });

  it('is reactive: a computed over it recomputes when the value changes', () => {
    const form = login();
    const valid = computed(() => form.controls.userName.valid);

    expect(valid.value).toBe(false);
    form.controls.userName.value = 'admin';
    expect(valid.value).toBe(true);
  });

  it('becomes dirty when written to and stays clean when patched', () => {
    const form = login();

    form.controls.userName.patch('admin');
    expect(form.controls.userName.dirty).toBe(false);

    form.controls.userName.value = 'admin';
    expect(form.controls.userName.dirty).toBe(true);
  });

  it('is touched only once something says so', () => {
    const form = login();

    expect(form.controls.userName.touched).toBe(false);
    form.controls.userName.markAsTouched();
    expect(form.controls.userName.touched).toBe(true);
  });

  it('goes back to where it started on reset', () => {
    const form = useAbpForm({ userName: { value: 'admin' } });

    form.controls.userName.value = 'someone else';
    form.controls.userName.reset();

    expect(form.controls.userName.value).toBe('admin');
    expect(form.controls.userName.dirty).toBe(false);
  });

  it('takes a new starting point when reset is given one', () => {
    const form = useAbpForm({ userName: { value: 'admin' } });

    form.controls.userName.reset('editor');
    form.controls.userName.value = 'someone else';
    form.controls.userName.reset();

    expect(form.controls.userName.value).toBe('editor');
  });
});

describe('a validator that looks at another field', () => {
  it('sees the current value of that field', () => {
    const form = login();

    form.controls.password.value = '1q2w3E*';
    form.controls.confirmPassword.value = '1q2w3E*';
    expect(form.controls.confirmPassword.valid).toBe(true);

    form.controls.password.value = 'changed';
    expect(form.controls.confirmPassword.valid).toBe(false);
  });
});

describe('a form', () => {
  it('collects the values under the names the backend expects', () => {
    const form = login();
    form.patch({ userName: 'admin', password: '1q2w3E*' });

    expect(form.value).toEqual({ userName: 'admin', password: '1q2w3E*', confirmPassword: '' });
  });

  it('is invalid while any control is', () => {
    const form = login();
    expect(form.invalid).toBe(true);

    form.controls.userName.value = 'admin';
    expect(form.valid).toBe(true);
  });

  it('marks everything touched when validated, so the errors become visible', () => {
    const form = login();

    expect(form.validate()).toBe(false);
    expect(form.controls.password.touched).toBe(true);
  });

  it('finds a control by name for code that does not know the shape', () => {
    const form = login();

    expect(form.get('userName')?.name).toBe('userName');
    expect(form.get('nothingLikeThat')).toBeUndefined();
  });

  it('recomputes its value when a control changes', () => {
    const form = login();
    let seen = '';
    effect(() => {
      seen = String(form.value.userName);
    });

    form.controls.userName.value = 'admin';

    expect(seen).toBe('admin');
  });
});

describe('server errors', () => {
  it('land on the control the server named', () => {
    const form = login();
    form.patch({ userName: 'admin' });

    form.setServerErrors([{ message: 'That name is taken.', members: ['userName'] }]);

    expect(form.controls.userName.errors).toEqual([
      { rule: 'server', key: 'That name is taken.', params: [] },
    ]);
  });

  it('match the C# property name and a nested member path', () => {
    const form = login();

    form.setServerErrors([
      { message: 'Taken.', members: ['UserName'] },
      { message: 'Too weak.', members: ['Input.Password'] },
    ]);

    expect(form.controls.userName.invalid).toBe(true);
    expect(form.controls.password.invalid).toBe(true);
  });

  it('are kept where they can be seen when they match no control', () => {
    const form = login();

    form.setServerErrors([
      { message: 'Something about the whole request.', members: [] },
      { message: 'About a field we do not have.', members: ['tenantId'] },
    ]);

    expect(form.unmatchedServerErrors).toEqual([
      'Something about the whole request.',
      'About a field we do not have.',
    ]);
  });

  it('go away as soon as the user edits the field they were about', () => {
    const form = login();
    form.setServerErrors([{ message: 'Taken.', members: ['userName'] }]);

    form.controls.userName.value = 'admin';

    expect(form.controls.userName.errors).toEqual([]);
  });

  it('are replaced, not added to, by the next failed request', () => {
    const form = login();
    form.patch({ userName: 'admin' });

    form.setServerErrors([{ message: 'Taken.', members: ['userName'] }]);
    form.setServerErrors([{ message: 'Still taken.', members: ['userName'] }]);

    expect(form.controls.userName.errors).toHaveLength(1);
  });

  it('survive nothing at all being passed', () => {
    const form = login();
    form.patch({ userName: 'admin' });

    form.setServerErrors([{ message: 'Taken.', members: ['userName'] }]);
    form.setServerErrors(undefined);

    expect(form.controls.userName.errors).toEqual([]);
    expect(form.unmatchedServerErrors).toEqual([]);
  });
});
