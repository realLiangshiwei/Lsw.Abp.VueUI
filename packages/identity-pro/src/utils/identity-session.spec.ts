import { describe, expect, it } from 'vitest';
import type { CurrentUserDto } from '@lsw-abpvue/core';
import type { IdentitySessionDto } from '@lsw-abpvue/identity-pro/proxy';
import { isCurrentIdentitySession } from './identity-session.js';
const user = { id: 'user-a', sessionId: 'current-session' } as CurrentUserDto;
const session: IdentitySessionDto = {
  id: 'record-a',
  sessionId: 'current-session',
  userId: 'user-a',
  isCurrent: false,
  signedIn: '2026-10-20T10:00:00Z',
};
describe('current identity session resolution', () => {
  it('recognizes the current session from its authenticated session id when the detail flag is false', () => {
    expect(isCurrentIdentitySession(session, user)).toBe(true);
  });
  it('retains the matching current list marker when session details omit it', () => {
    expect(
      isCurrentIdentitySession(
        { ...session, sessionId: undefined },
        { ...user, sessionId: null },
        { ...session, isCurrent: true },
      ),
    ).toBe(true);
  });
  it('does not log out the operator for a current marker belonging to another user', () => {
    expect(isCurrentIdentitySession({ ...session, userId: 'other', isCurrent: true }, user)).toBe(
      false,
    );
  });
  it('does not accept the marker of a different list record', () => {
    expect(
      isCurrentIdentitySession({ ...session, sessionId: 'other' }, user, {
        ...session,
        id: 'different',
        isCurrent: true,
      }),
    ).toBe(false);
  });
});
