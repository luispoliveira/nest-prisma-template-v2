export interface SibsMerchant {
  terminalId: string;
  channel: 'web' | 'mobile';
  merchantTransactionId: string;
}

export interface SibsAmount {
  value: number;
  currency: 'EUR';
}

export interface SibsPaymentReference {
  initialDatetime: string;
  finalDatetime: string;
  maxAmount: SibsAmount;
  minAmount: SibsAmount;
  entity: string;
}

export interface SibsTransaction {
  transactionTimestamp: string;
  description: string;
  moto: boolean;
  paymentType: 'PURS';
  amount: SibsAmount;
  paymentMethod: ('REFERENCE' | 'CARD' | 'MBWAY')[];
  paymentReference?: SibsPaymentReference;
}

export interface SibsCustomerAddress {
  street1: string;
  street2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface SibsCustomerInfo {
  customerEmail: string;
  shippingAddress: SibsCustomerAddress;
  billingAddress: SibsCustomerAddress;
}

export interface SibsCustomer {
  customerInfo: SibsCustomerInfo;
}

export interface SibsCheckoutRequest {
  merchant: SibsMerchant;
  transaction: SibsTransaction;
  customer?: SibsCustomer;
}

export interface SibsReturnStatus {
  statusCode: string;
  statusMsg: string;
  statusDescription: string;
}

export interface SibsExecution {
  startTime: string;
  endTime: string;
}

export interface SibsCheckoutResponse {
  amount: SibsAmount;
  merchant: {
    terminalId: string;
    merchantTransactionId: string;
  };
  transactionID: string;
  transactionSignature: string;
  formContext: string;
  expiry: string;
  tokenList: any[];
  paymentMethodList: string[];
  execution: SibsExecution;
  returnStatus: SibsReturnStatus;
}

export interface SibsTransactionStatus {
  transactionID: string;
  paymentStatus: 'Processing' | 'Success' | 'Cancelled' | 'Timeout' | 'Failed';
  paymentMethod?: string;
  paymentReference?: {
    entity: string;
    reference: string;
    amount: SibsAmount;
  };
  execution: SibsExecution;
  returnStatus: SibsReturnStatus;
}

export interface SibsWebhookPayload {
  transactionID: string;
  merchantTransactionId: string;
  paymentStatus: string;
  paymentMethod?: string;
  amount: SibsAmount;
  timestamp: string;
  signature: string;
}
