export const configuration = () => ({
  sibs: {
    baseUrl:
      process.env.SIBS_BASE_URL || 'https://spg.qly.site1.sibs.pt/api/v2',
    token: process.env.SIBS_TOKEN,
    clientId: process.env.SIBS_CLIENT_ID,
    terminalId: process.env.SIBS_TERMINAL_ID,
    entity: process.env.SIBS_ENTITY,
    webhookSecret: process.env.SIBS_WEBHOOK_SECRET,
  },
});
