import type { ExtensibleEntityDto } from '@lsw-abpvue/core';
import type { PaymentRequestState } from './payment-request-state.enum.js';
import type { PaymentType } from './payment-type.enum.js';

export interface PaymentRequestProductDto {
  paymentRequestId: string;
  code?: string | undefined;
  name?: string | undefined;
  unitPrice: number;
  count: number;
  totalPrice: number;
  paymentType: PaymentType;
  planId: string;
  extraProperties?: Record<string, unknown> | undefined;
}

export interface PaymentRequestWithDetailsDto extends ExtensibleEntityDto<string> {
  products?: PaymentRequestProductDto[] | undefined;
  currency?: string | undefined;
  state: PaymentRequestState;
  failReason?: string | undefined;
  emailSendDate?: string | null | undefined;
  gateway?: string | undefined;
  externalSubscriptionId?: string | undefined;
  totalPrice: number;
  creationTime: string;
}
