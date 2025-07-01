import { PrismaService } from "@lib/prisma";
import { ConfigService } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { Test, TestingModule } from "@nestjs/testing";
import { HealthService } from "../health.service";
import { MongoHealthIndicator } from "../indicators/mongo-health.indicator";
import { RedisHealthIndicator } from "../indicators/redis-health.indicator";
import { SystemHealthIndicator } from "../indicators/system-health.indicator";

describe("HealthService", () => {
  let service: HealthService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      providers: [
        HealthService,
        RedisHealthIndicator,
        MongoHealthIndicator,
        SystemHealthIndicator,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLiveness", () => {
    it("should return liveness status", () => {
      const result = service.getLiveness();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: process.env.npm_package_version,
      });
    });
  });

  describe("getSystemInfo", () => {
    it("should return system information", () => {
      const result = service.getSystemInfo();

      expect(result).toHaveProperty("system");
      expect(result.system).toHaveProperty("status", "up");
      expect(result.system).toHaveProperty("nodeVersion");
      expect(result.system).toHaveProperty("platform");
      expect(result.system).toHaveProperty("cpus");
    });
  });

  describe("getReadiness", () => {
    it("should return ready status when checks pass", async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          "healthChecks.database.enabled": true,
          "healthChecks.redis.enabled": false,
          "healthChecks.database.timeout": 5000,
        };
        return config[key];
      });

      // Mock successful database check
      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.getReadiness();

      expect(result.status).toBe("ready");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("checks");
    });
  });

  describe("checkHealth", () => {
    it("should run health checks based on configuration", async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          "healthChecks.database.enabled": true,
          "healthChecks.redis.enabled": false,
          "healthChecks.mongodb.enabled": false,
          "healthChecks.memory.enabled": true,
          "healthChecks.disk.enabled": true,
          "healthChecks.external.enabled": false,
          "healthChecks.database.timeout": 5000,
          "healthChecks.memory.heapThresholdBytes": 150 * 1024 * 1024,
          "healthChecks.memory.rssThresholdBytes": 300 * 1024 * 1024,
          "healthChecks.disk.path": "/",
          "healthChecks.disk.thresholdPercent": 0.9,
        };
        return config[key];
      });

      mockPrismaService.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const result = await service.checkHealth();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("info");
    });
  });
});
