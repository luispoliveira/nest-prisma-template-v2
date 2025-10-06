export enum PaymentMethodEnum {
  _REFERENCE = 'REFERENCE',
  _CARD = 'CARD',
  _MBWAY = 'MBWAY',
}

export enum ChannelEnum {
  _WEB = 'web',
  _MOBILE = 'mobile',
}

export class CreateAmountDto {
  value: number;

  currency = 'EUR';
}

export class CreateAddressDto {
  street1: string;

  street2?: string;

  city: string;

  postcode: string;

  country: string;
}

export class CreateCustomerInfoDto {
  customerEmail: string;

  shippingAddress: CreateAddressDto;

  billingAddress: CreateAddressDto;
}

export class CreatePaymentReferenceDto {
  initialDatetime: string;

  finalDatetime: string;

  maxAmount: CreateAmountDto;

  minAmount: CreateAmountDto;

  entity: string;
}

export class CreateTransactionDto {
  description: string;

  amount: CreateAmountDto;

  paymentMethod: PaymentMethodEnum[];

  channel: ChannelEnum;

  merchantTransactionId: string;

  customerInfo?: CreateCustomerInfoDto;

  paymentReference?: CreatePaymentReferenceDto;

  moto?: boolean = false;
}
