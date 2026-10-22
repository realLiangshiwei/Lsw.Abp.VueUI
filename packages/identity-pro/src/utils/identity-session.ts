import type { CurrentUserDto } from '@lsw-abpvue/core';
import type { IdentitySessionDto } from '@lsw-abpvue/identity-pro/proxy';
export function isCurrentIdentitySession(
  session: IdentitySessionDto,
  currentUser: CurrentUserDto,
  listed?: IdentitySessionDto,
): boolean {
  if (session.userId !== currentUser.id) return false;
  return Boolean(
    session.isCurrent ||
    (currentUser.sessionId && session.sessionId === currentUser.sessionId) ||
    (listed && listed.id === session.id && listed.userId === session.userId && listed.isCurrent),
  );
}
