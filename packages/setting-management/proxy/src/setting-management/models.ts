export interface EmailSettingsDto {
  smtpHost?: string | undefined;
  smtpPort: number;
  smtpUserName?: string | undefined;
  smtpPassword?: string | undefined;
  smtpDomain?: string | undefined;
  smtpEnableSsl: boolean;
  smtpUseDefaultCredentials: boolean;
  defaultFromAddress?: string | undefined;
  defaultFromDisplayName?: string | undefined;
}

export interface SendTestEmailInput {
  senderEmailAddress: string;
  targetEmailAddress: string;
  subject: string;
  body?: string | undefined;
}

export interface UpdateEmailSettingsDto {
  smtpHost?: string | undefined;
  smtpPort?: number | undefined;
  smtpUserName?: string | undefined;
  smtpPassword?: string | undefined;
  smtpDomain?: string | undefined;
  smtpEnableSsl?: boolean | undefined;
  smtpUseDefaultCredentials?: boolean | undefined;
  defaultFromAddress: string;
  defaultFromDisplayName: string;
}
