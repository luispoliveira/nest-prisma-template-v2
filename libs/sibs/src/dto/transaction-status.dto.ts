export class TransactionStatusDto {
  transactionID: string;

  paymentStatus: string;

  paymentMethod?: string;

  paymentReference?: {
    entity: string;
    reference: string;
    amount: { value: number; currency: string };
  };

  execution: {
    startTime: string;
    endTime: string;
  };

  returnStatus: {
    statusCode: string;
    statusMsg: string;
    statusDescription: string;
  };
}
