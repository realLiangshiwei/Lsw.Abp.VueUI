import { defineService, defineToken, inject, type ServiceOf } from '@lsw-abpvue/core';
import { interpolate } from '@lsw-abpvue/utils';

/** A plain configuration token with a built-in default the host can override. */
export const GREETING_TEMPLATE = defineToken<string>('GREETING_TEMPLATE', {
  factory: () => 'Hello {0}.',
});

export const GreeterService = defineService('GreeterService', () => {
  const template = inject(GREETING_TEMPLATE);
  return { greet: (name: string) => interpolate(template, [name]) };
});
export type GreeterService = ServiceOf<typeof GreeterService>;

export const useGreeter = () => inject(GreeterService);
