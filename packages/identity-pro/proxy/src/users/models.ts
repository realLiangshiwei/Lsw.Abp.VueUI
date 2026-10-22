export interface UserData {
  id: string;
  tenantId?: string | null | undefined;
  userName?: string | undefined;
  name?: string | undefined;
  surname?: string | undefined;
  isActive: boolean;
  email?: string | undefined;
  emailConfirmed: boolean;
  phoneNumber?: string | undefined;
  phoneNumberConfirmed: boolean;
  extraProperties?: Record<string, unknown> | undefined;
}
