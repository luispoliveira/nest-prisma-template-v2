import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Client } from "basic-ftp";
import { exec } from "child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { basename, join } from "path";
import { createGzip } from "zlib";

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);

  #pgDumpAvailable: boolean = false;
  #runBackup: boolean = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.#runBackup = this.configService.get("backup").enabled;
    if (!this.#runBackup) {
      this.logger.warn("BackupService is not configured to run backups. Skipping initialization.");
      return;
    }

    await this.#checkPgDumpAvailability();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async backupDatabase() {
    if (!this.#runBackup) {
      this.logger.warn("BackupService is not configured to run backups. Skipping.");
      return;
    }

    if (!this.#pgDumpAvailable) {
      this.logger.warn("pg_dump is not available. Skipping backup.");
      return;
    }

    this.logger.log("Starting database backup...");

    const databaseUrl = this.configService.get("databaseUrl");
    if (!databaseUrl) throw new Error("DATABASE_URL is not defined in environment variables");

    const backupDir = this.configService.get("backup")!.dir;

    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = join(backupDir, `backup-${timestamp}.sql`);
    const gzFile = `${backupFile}.gz`;

    await this.#runBackupCommand(databaseUrl, backupFile);

    await this.#compressBackupFile(backupFile, gzFile);

    unlinkSync(backupFile); // Remove .sql after gzipping

    this.logger.log(`Backup created: ${gzFile}`);

    // FTP upload if enabled
    if (this.configService.get("backup")!.ftp.enabled) await this.#uploadToFtp(gzFile);
  }

  private getDbPassword(databaseUrl: string): string {
    // Extract password from DATABASE_URL
    // Example: postgresql://user:password@host:port/dbname
    const match = databaseUrl.match(/postgres(?:ql)?:\/\/(.*?):(.*?)@/);
    return match ? match[2] : "";
  }

  async #uploadToFtp(filePath: string): Promise<void> {
    const client = new Client();
    try {
      await client.access({
        host: this.configService.get("backup")!.ftp.host,
        port: Number(this.configService.get("backup")!.ftp.port || 21),
        user: this.configService.get("backup")!.ftp.user,
        secure: false,
      });
      const remoteDir = this.configService.get("backup")!.ftp.remoteDir || "/";
      await client.ensureDir(remoteDir);
      await client.uploadFrom(filePath, join(remoteDir, basename(filePath)));
      this.logger.log(`Backup uploaded to FTP: ${remoteDir}/${basename(filePath)}`);
    } catch (err) {
      this.logger.error("FTP upload failed", err);
    } finally {
      client.close();
    }
  }

  async #compressBackupFile(backupFile: string, gzFile: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const input = createReadStream(backupFile);
      const output = createWriteStream(gzFile);
      const gzip = createGzip();
      input.pipe(gzip).pipe(output).on("finish", resolve).on("error", reject);
    });
  }

  async #runBackupCommand(databaseUrl: string, backupFile: string): Promise<void> {
    const databaseName = new URL(databaseUrl).pathname.slice(1);
    const databaseUser = new URL(databaseUrl).username;
    const databaseHost = new URL(databaseUrl).hostname;
    const databasePort = new URL(databaseUrl).port || "5432";

    await new Promise<void>((resolve, reject) => {
      exec(
        `PGPASSWORD=${this.getDbPassword(databaseUrl)} pg_dump --dbname=${databaseName} -U ${databaseUser} -h ${databaseHost} -p ${databasePort} > ${backupFile}`,
        error => {
          if (error) {
            this.logger.error("pg_dump failed", error);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async #checkPgDumpAvailability(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec("pg_dump --version", error => {
        if (error) {
          this.logger.warn(
            "pg_dump is not available. Please ensure PostgreSQL client tools are installed.",
          );
          reject(error);
        } else {
          this.#pgDumpAvailable = true;
          this.logger.debug("pg_dump is available.");
          resolve();
        }
      });
    });
  }
}
