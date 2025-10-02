import { PrismaModule } from '@lib/prisma';
import { QueueModule } from '@lib/queue';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { configuration } from '../config/configuration';
import { validationSchema } from '../config/validation';
import { EnhancedHealthController } from '../enhanced-health.controller';
import { EnhancedHealthService } from '../enhanced-health.service';
import { HealthController } from '../health.controller';
import { HealthModule } from '../health.module';

describe('Health Library Integration Tests', () => {
  let module: TestingModule;
  let enhancedHealthService: EnhancedHealthService;
  let enhancedHealthController: EnhancedHealthController;
  let healthController: HealthController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          validationSchema,
        }),
        TerminusModule,
        HttpModule,
        PrismaModule,
        QueueModule.register(['default']),
        HealthModule,
      ],
    }).compile();

    enhancedHealthService = module.get<EnhancedHealthService>(
      EnhancedHealthService,
    );
    enhancedHealthController = module.get<EnhancedHealthController>(
      EnhancedHealthController,
    );
    healthController = module.get<HealthController>(HealthController);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Enhanced Health Service', () => {
    it('should be defined', () => {
      expect(enhancedHealthService).toBeDefined();
    });

    it('should perform enhanced health check', async () => {
      const result = await enhancedHealthService.checkHealth();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['ok', 'error', 'shutting_down']).toContain(result.status);
    });

    it('should provide detailed health report', async () => {
      const result = await enhancedHealthService.getDetailedHealthReport();
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.services).toBeDefined();
    });

    it('should provide system metrics', async () => {
      const result = await enhancedHealthService.getHealthMetrics();
      expect(result).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
      expect(result.cpuUsage).toBeDefined();
      expect(result.loadAverage).toBeDefined();
    });

    it('should check readiness', async () => {
      const result = await enhancedHealthService.checkReadiness();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['ready', 'not_ready']).toContain(result.status);
    });

    it('should check liveness', async () => {
      const result = await enhancedHealthService.checkLiveness();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['ok', 'error']).toContain(result.status);
      expect(result.uptime).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('Enhanced Health Controller', () => {
    it('should be defined', () => {
      expect(enhancedHealthController).toBeDefined();
    });

    it('should handle enhanced health check', async () => {
      const result = await enhancedHealthController.checkEnhanced();
      expect(result).toBeDefined();
    });

    it('should handle detailed health check', async () => {
      const result = await enhancedHealthController.getDetailedReport();
      expect(result).toBeDefined();
    });

    it('should handle database health check', async () => {
      const result = await enhancedHealthController.getDatabaseHealth();
      expect(result).toBeDefined();
    });

    it('should handle queue health check', async () => {
      const result = await enhancedHealthController.getQueueHealth();
      expect(result).toBeDefined();
    });

    it('should handle system metrics', async () => {
      const result = await enhancedHealthController.getMetrics();
      expect(result).toBeDefined();
    });

    it('should handle performance metrics', async () => {
      const result = await enhancedHealthController.getPerformanceMetrics();
      expect(result).toBeDefined();
    });

    it('should handle alerts', async () => {
      const result = await enhancedHealthController.getAlerts();
      expect(result).toBeDefined();
    });

    it('should handle readiness check', async () => {
      const result = await enhancedHealthController.checkReadiness();
      expect(result).toBeDefined();
    });

    it('should handle liveness check', async () => {
      const result = await enhancedHealthController.checkLiveness();
      expect(result).toBeDefined();
    });
  });

  describe('Original Health Controller', () => {
    it('should be defined', () => {
      expect(healthController).toBeDefined();
    });

    it('should handle basic health check', async () => {
      const result = await healthController.check();
      expect(result).toBeDefined();
    });

    it('should handle detailed health check', async () => {
      const result = await healthController.detailedCheck();
      expect(result).toBeDefined();
    });
  });

  describe('Health Indicators Integration', () => {
    it('should have all required indicators available', () => {
      const enhancedPrismaIndicator = module.get(
        'EnhancedPrismaHealthIndicator',
        {
          strict: false,
        },
      );
      const queueIndicator = module.get('QueueHealthIndicator', {
        strict: false,
      });
      const redisIndicator = module.get('RedisHealthIndicator', {
        strict: false,
      });
      const mongoIndicator = module.get('MongoHealthIndicator', {
        strict: false,
      });
      const systemIndicator = module.get('SystemHealthIndicator', {
        strict: false,
      });

      expect(enhancedPrismaIndicator).toBeDefined();
      expect(queueIndicator).toBeDefined();
      expect(redisIndicator).toBeDefined();
      expect(mongoIndicator).toBeDefined();
      expect(systemIndicator).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should have proper configuration loaded', () => {
      const configService = module.get('ConfigService');
      expect(configService).toBeDefined();
    });
  });
});
