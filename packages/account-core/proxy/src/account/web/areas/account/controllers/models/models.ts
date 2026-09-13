import type { LoginResultType } from './login-result-type.enum.js';

export interface AbpLoginResult {
  result: LoginResultType;
  description?: string | undefined;
}

export interface UserLoginInfo {
  userNameOrEmailAddress: string;
  password: string;
  rememberMe?: boolean | undefined;
}
