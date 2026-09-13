export interface UserData {
  id?: string | undefined;
  tenantId?: string | null | undefined;
  userName?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  isActive?: boolean | undefined;
  email?: string | undefined;
  emailConfirmed?: boolean | undefined;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed?: boolean | undefined;
  extraProperties?: Record<string, unknown> | undefined;
}
