import { ConfigService } from "@nestjs/config";

export class ConfigUtil {
  static getRequiredConfig<T = string>(
    configService: ConfigService,
    key: string,
    transform?: (value: string) => T,
  ): T {
    const value = configService.get<string>(key);

    if (value === undefined || value === null || value === "") {
      throw new Error(`Required configuration key "${key}" is missing or empty`);
    }

    return transform ? transform(value) : (value as unknown as T);
  }

  static getOptionalConfig<T = string>(
    configService: ConfigService,
    key: string,
    defaultValue: T,
    transform?: (value: string) => T,
  ): T {
    const value = configService.get<string>(key);

    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    return transform ? transform(value) : (value as unknown as T);
  }

  static getNumberConfig(configService: ConfigService, key: string, defaultValue?: number): number {
    const value = configService.get<string>(key);

    if (value === undefined || value === null || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required number configuration key "${key}" is missing`);
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`Configuration key "${key}" must be a valid number`);
    }

    return numValue;
  }

  static getBooleanConfig(
    configService: ConfigService,
    key: string,
    defaultValue?: boolean,
  ): boolean {
    const value = configService.get<string>(key);

    if (value === undefined || value === null || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required boolean configuration key "${key}" is missing`);
    }

    return value.toLowerCase() === "true" || value === "1";
  }

  static getArrayConfig<T = string>(
    configService: ConfigService,
    key: string,
    separator: string = ",",
    defaultValue?: T[],
    transform?: (value: string) => T,
  ): T[] {
    const value = configService.get<string>(key);

    if (value === undefined || value === null || value === "") {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Required array configuration key "${key}" is missing`);
    }

    return value
      .split(separator)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => (transform ? transform(item) : (item as unknown as T)));
  }

  static getDatabaseUrl(configService: ConfigService): string {
    return this.getRequiredConfig(configService, "DATABASE_URL");
  }

  static getRedisUrl(configService: ConfigService): string {
    return this.getRequiredConfig(configService, "REDIS_URL");
  }

  static getJwtSecret(configService: ConfigService): string {
    return this.getRequiredConfig(configService, "JWT_SECRET");
  }

  static getJwtExpiresIn(configService: ConfigService): string {
    return this.getOptionalConfig(configService, "JWT_EXPIRES_IN", "1h");
  }

  static getAppPort(configService: ConfigService): number {
    return this.getNumberConfig(configService, "PORT", 3000);
  }

  static isProduction(configService: ConfigService): boolean {
    const env = configService.get<string>("NODE_ENV", "development");
    return env === "production";
  }

  static isDevelopment(configService: ConfigService): boolean {
    const env = configService.get<string>("NODE_ENV", "development");
    return env === "development";
  }

  static isTest(configService: ConfigService): boolean {
    const env = configService.get<string>("NODE_ENV", "development");
    return env === "test";
  }
}
