import { mapEnumToOptions } from '@lsw-abpvue/core';

export enum PaymentType {
  OneTime = 0,
  Subscription = 1,
}

export const paymentTypeOptions = mapEnumToOptions(PaymentType);
