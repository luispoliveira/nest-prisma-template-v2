export const configuration = () => ({
  mail: {
    brevoApiKey: process.env.BREVO_API_KEY,
    defaultFromEmail: process.env.MAIL_DEFAULT_FROM_EMAIL,
    defaultFromName: process.env.MAIL_DEFAULT_FROM_NAME,
  },
});
