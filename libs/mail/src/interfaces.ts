export type MailProvider = 'brevo';

export interface MailModuleOptions {
  provider: MailProvider;
  apiKey?: string;
  defaultFrom?: { email: string; name?: string };
}

export interface MailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailDto {
  to: MailRecipient[];
  subject: string;
  html?: string;
  text?: string;
  from?: { email: string; name?: string };
  replyTo?: string;
  templateId?: number;
  params?: Record<string, any>;
}

export interface SendEmailInterface {
  sendEmail(_payload: SendEmailDto): Promise<any>;
}
