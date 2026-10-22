import { describe, expect, it } from 'vitest';
import { createInvitationInput, parseInvitationEmails } from './invitations.js';
describe('commercial user invitations', () => {
  it('splits commas, semicolons and lines and removes empty duplicate recipients', () => {
    expect(parseInvitationEmails(' a@example.test,; b@example.test\n a@example.test\n')).toEqual([
      'a@example.test',
      'b@example.test',
    ]);
  });
  it('preserves the configured server application name and available role names', () => {
    expect(
      createInvitationInput('a@example.test', ['reader', 'reader'], [{ name: 'reader' }], 'MVC'),
    ).toEqual({ appName: 'MVC', emailAddress: ['a@example.test'], assignedRoles: ['reader'] });
  });
  it.each(['', 'invalid', 'a@b@c', 'a@example.test,bad'])(
    'refuses empty or invalid email sets: %s',
    emails => {
      expect(createInvitationInput(emails, [], [], 'MVC')).toBeUndefined();
    },
  );
  it('accepts a single-label email domain supported by the actual backend validator', () => {
    expect(createInvitationInput('recipient@localhost', [], [], 'Angular')).toEqual({
      appName: 'Angular',
      emailAddress: ['recipient@localhost'],
      assignedRoles: [],
    });
  });
  it('rejects role names outside the current assignable roles', () => {
    expect(createInvitationInput('a@example.test', ['forged'], [], 'MVC')).toBeUndefined();
  });
});
