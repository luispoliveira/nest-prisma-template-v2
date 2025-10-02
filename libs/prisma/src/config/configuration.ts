import { EnvironmentEnum } from '@lib/common';

export const configuration = () => ({
  environment: process.env.NODE_ENV || EnvironmentEnum.DEVELOPMENT,
  logPrisma: process.env.LOG_PRISMA === 'true',
  databaseUrl: process.env.DATABASE_URL,
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    dir: process.env.BACKUP_DIR || './backups',
    ftp: {
      enabled: process.env.BACKUP_FTP_ENABLED === 'true',
      host: process.env.BACKUP_FTP_HOST,
      port: process.env.BACKUP_FTP_PORT,
      user: process.env.BACKUP_FTP_USER,
      remoteDir: process.env.BACKUP_FTP_REMOTE_DIR || '/',
    },
  },
});
