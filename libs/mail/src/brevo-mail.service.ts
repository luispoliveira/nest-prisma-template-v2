import {
  SendSmtpEmail,
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";
import { MailModuleOptions, SendEmailDto, SendEmailInterface } from "./interfaces";

export class BrevoMailService implements SendEmailInterface {
  #client: TransactionalEmailsApi;

  constructor(private opts: MailModuleOptions) {
    this.#client = new TransactionalEmailsApi();
    if (!opts.apiKey) throw new Error("Brevo API key is required");

    this.#client.setApiKey(TransactionalEmailsApiApiKeys.apiKey, opts.apiKey);
  }

  async sendEmail(payload: SendEmailDto) {
    const body: SendSmtpEmail = {
      sender: payload.from || this.opts.defaultFrom,
      to: payload.to,
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    };

    if (payload.templateId) body.templateId = payload.templateId;
    if (payload.params) body.params = payload.params;
    if (payload.replyTo) body.replyTo = { email: payload.replyTo };

    return await this.#client.sendTransacEmail(body);
  }
}
