import { inject } from '@lsw-abpvue/core';
import { TEXT_TEMPLATE_MANAGEMENT_FEATURES } from '@lsw-abpvue/text-template-management/common';

export function textTemplateManagementGuard(): boolean {
  return inject(TEXT_TEMPLATE_MANAGEMENT_FEATURES).value.enable;
}
