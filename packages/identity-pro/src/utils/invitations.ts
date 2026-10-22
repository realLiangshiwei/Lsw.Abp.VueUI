import { Validators } from '@lsw-abpvue/theme-shared';
import type { IdentityRoleDto, InviteUsersInput } from '@lsw-abpvue/identity-pro/proxy';

export function parseInvitationEmails(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,;\n]+/)
        .map(email => email.trim())
        .filter(Boolean),
    ),
  ];
}

export function createInvitationInput(
  emails: string,
  roleNames: readonly string[],
  availableRoles: readonly Pick<IdentityRoleDto, 'name'>[],
  appName: string,
): InviteUsersInput | undefined {
  const emailAddress = parseInvitationEmails(emails);
  const validateEmail = Validators.email();
  if (
    !emailAddress.length ||
    emailAddress.some(email => validateEmail(email, { valueOf: () => undefined }))
  )
    return undefined;
  const assignable = new Set(
    availableRoles.map(role => role.name).filter((name): name is string => Boolean(name)),
  );
  if (roleNames.some(name => !assignable.has(name))) return undefined;
  return { appName, emailAddress, assignedRoles: [...new Set(roleNames)] };
}
