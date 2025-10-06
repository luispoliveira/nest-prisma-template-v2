export class CreateCheckoutDto {
  amount: { value: number; currency: string };

  merchant: { terminalId: string; merchantTransactionId: string };

  transactionID: string;

  transactionSignature: string;

  formContext: string;

  expiry: string;

  tokenList: any[];

  paymentMethodList: string[];

  execution: { startTime: string; endTime: string };

  returnStatus: {
    statusCode: string;
    statusMsg: string;
    statusDescription: string;
  };
}
