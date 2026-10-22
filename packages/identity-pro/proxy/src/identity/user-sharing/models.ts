import type { EntityDto, PagedAndSortedResultRequestDto } from '@lsw-abpvue/core';
import type { UserInvitationStatus } from '../user-invitations/user-invitation-status.enum.js';

export interface GetPendingInvitationsInput extends PagedAndSortedResultRequestDto {
  filter?: string | undefined;
}

export interface InviteUsersInput {
  appName?: string | undefined;
  emailAddress: string[];
  assignedRoles?: string[] | undefined;
}

export interface InviteUsersSummaryDto {
  newInvitations: number;
  resentInvitations: number;
}

export interface ResendInvitationInput extends EntityDto<string> {
  appName?: string | undefined;
}

export interface UserSharingInvitationDto extends EntityDto<string> {
  inviteeEmail?: string | undefined;
  invitationDate: string;
  assignedRoles?: string[] | undefined;
  status: UserInvitationStatus;
}
