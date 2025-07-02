import { BullModule, getQueueToken } from "@nestjs/bull";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { Queue } from "bull";
import { EnhancedQueueService } from "../services/enhanced-queue.service";
import { QueueDashboardService } from "../services/queue-dashboard.service";
import { QueueMonitoringService } from "../services/queue-monitoring.service";

describe("Enhanced Queue Library", () => {
  let enhancedQueueService: EnhancedQueueService;
  let monitoringService: QueueMonitoringService;
  let dashboardService: QueueDashboardService;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      addBulk: jest.fn(),
      getJob: jest.fn(),
      getJobs: jest.fn(),
      getWaiting: jest.fn().mockResolvedValue([]),
      getActive: jest.fn().mockResolvedValue([]),
      getCompleted: jest.fn().mockResolvedValue([]),
      getFailed: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      pause: jest.fn(),
      resume: jest.fn(),
      clean: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.test",
        }),
        BullModule.forRoot({
          redis: {
            host: "localhost",
            port: 6379,
          },
        }),
      ],
      providers: [
        EnhancedQueueService,
        QueueMonitoringService,
        QueueDashboardService,
        {
          provide: getQueueToken("test-queue"),
          useValue: mockQueue,
        },
      ],
    }).compile();

    enhancedQueueService = module.get<EnhancedQueueService>(EnhancedQueueService);
    monitoringService = module.get<QueueMonitoringService>(QueueMonitoringService);
    dashboardService = module.get<QueueDashboardService>(QueueDashboardService);

    // Setup queue in enhanced service
    enhancedQueueService["queues"].set("test-queue", mockQueue);
  });

  describe("EnhancedQueueService", () => {
    it("should be defined", () => {
      expect(enhancedQueueService).toBeDefined();
    });

    it("should add a job to the queue", async () => {
      const jobData = {
        payload: { test: "data" },
        metadata: { userId: "123" },
      };

      const mockJob = { id: "job-1", name: "test-job", data: jobData };
      mockQueue.add.mockResolvedValue(mockJob as any);

      const result = await enhancedQueueService.addJob("test-queue", "test-job", jobData);

      expect(mockQueue.add).toHaveBeenCalledWith("test-job", jobData, undefined);
      expect(result).toEqual(mockJob);
    });

    it("should add bulk jobs to the queue", async () => {
      const jobs = [
        {
          name: "job-1",
          data: { payload: { test: "data1" }, metadata: { userId: "1" } },
        },
        {
          name: "job-2",
          data: { payload: { test: "data2" }, metadata: { userId: "2" } },
        },
      ];

      const mockJobs = jobs.map((job, index) => ({
        id: `job-${index + 1}`,
        ...job,
      }));
      mockQueue.addBulk.mockResolvedValue(mockJobs as any);

      const result = await enhancedQueueService.addBulkJobs("test-queue", jobs);

      expect(mockQueue.addBulk).toHaveBeenCalledWith(jobs);
      expect(result).toEqual(mockJobs);
    });

    it("should get queue statistics", async () => {
      mockQueue.getWaiting.mockResolvedValue([1, 2, 3] as any);
      mockQueue.getActive.mockResolvedValue([1] as any);
      mockQueue.getCompleted.mockResolvedValue([1, 2] as any);
      mockQueue.getFailed.mockResolvedValue([1] as any);
      mockQueue.getDelayed.mockResolvedValue([]) as any;

      const stats = await enhancedQueueService.getQueueStats("test-queue");

      expect(stats).toEqual({
        waiting: 3,
        active: 1,
        completed: 2,
        failed: 1,
        delayed: 0,
        paused: 0,
        total: 7,
      });
    });

    it("should check if queue is healthy", async () => {
      mockQueue.isReady.mockReturnValue(true);

      const isHealthy = await enhancedQueueService.isQueueHealthy("test-queue");

      expect(isHealthy).toBe(true);
      expect(mockQueue.isReady).toHaveBeenCalled();
    });

    it("should pause and resume a queue", async () => {
      await enhancedQueueService.pauseQueue("test-queue");
      expect(mockQueue.pause).toHaveBeenCalled();

      await enhancedQueueService.resumeQueue("test-queue");
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it("should clean a queue", async () => {
      const grace = 60000;
      const limit = 100;

      await enhancedQueueService.cleanQueue("test-queue", grace, "completed", limit);

      expect(mockQueue.clean).toHaveBeenCalledWith(grace, "completed", limit);
    });
  });

  describe("QueueMonitoringService", () => {
    it("should be defined", () => {
      expect(monitoringService).toBeDefined();
    });

    it("should start and stop monitoring", () => {
      expect(monitoringService["isMonitoring"]).toBe(false);

      monitoringService.startMonitoring(1000);
      expect(monitoringService["isMonitoring"]).toBe(true);

      monitoringService.stopMonitoring();
      expect(monitoringService["isMonitoring"]).toBe(false);
    });

    it("should record job metrics", () => {
      const metric = {
        queueName: "test-queue",
        jobName: "test-job",
        duration: 1000,
        success: true,
        timestamp: new Date(),
        attempts: 1,
      };

      monitoringService.recordJobMetric(metric);

      expect(monitoringService["performanceMetrics"]).toContain(metric);
    });

    it("should get queue alerts", () => {
      const alert = {
        type: "high_queue_size" as const,
        severity: "medium" as const,
        message: "Test alert",
        timestamp: new Date(),
        queueName: "test-queue",
      };

      monitoringService["alerts"].push(alert);

      const queueAlerts = monitoringService.getQueueAlerts("test-queue");
      expect(queueAlerts).toContain(alert);
    });

    it("should clear alerts", () => {
      const alert = {
        type: "high_queue_size" as const,
        severity: "medium" as const,
        message: "Test alert",
        timestamp: new Date(),
        queueName: "test-queue",
      };

      monitoringService["alerts"].push(alert);
      expect(monitoringService["alerts"]).toHaveLength(1);

      monitoringService.clearAlerts("test-queue");
      expect(monitoringService["alerts"]).toHaveLength(0);
    });

    it("should get performance metrics for a queue", () => {
      const metric = {
        queueName: "test-queue",
        jobName: "test-job",
        duration: 1000,
        success: true,
        timestamp: new Date(),
        attempts: 1,
      };

      monitoringService["performanceMetrics"].push(metric);

      const metrics = monitoringService.getQueuePerformanceMetrics("test-queue", 1);
      expect(metrics).toContain(metric);
    });
  });

  describe("QueueDashboardService", () => {
    it("should be defined", () => {
      expect(dashboardService).toBeDefined();
    });

    it("should get real-time metrics", async () => {
      mockQueue.getWaiting.mockResolvedValue([1, 2] as any);
      mockQueue.getActive.mockResolvedValue([1] as any);
      mockQueue.getCompleted.mockResolvedValue([1, 2, 3] as any);
      mockQueue.getFailed.mockResolvedValue([]) as any;
      mockQueue.getDelayed.mockResolvedValue([]) as any;

      const metrics = await dashboardService.getRealTimeMetrics();

      expect(metrics).toHaveProperty("timestamp");
      expect(metrics).toHaveProperty("totalJobs");
      expect(metrics).toHaveProperty("activeJobs");
      expect(metrics.activeJobs).toBe(1);
    });

    it("should pause and resume queues", async () => {
      const pauseResult = await dashboardService.pauseQueue("test-queue");
      expect(pauseResult).toBe(true);
      expect(mockQueue.pause).toHaveBeenCalled();

      const resumeResult = await dashboardService.resumeQueue("test-queue");
      expect(resumeResult).toBe(true);
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it("should clean queue successfully", async () => {
      const cleanResult = await dashboardService.cleanQueue("test-queue", 60000, "completed", 100);
      expect(cleanResult).toBe(true);
      expect(mockQueue.clean).toHaveBeenCalledWith(60000, "completed", 100);
    });
  });

  describe("Integration Tests", () => {
    it("should work together for job lifecycle", async () => {
      const jobData = {
        payload: { test: "integration" },
        metadata: { userId: "integration-test" },
      };

      const mockJob = { id: "integration-job", name: "integration-test", data: jobData };
      mockQueue.add.mockResolvedValue(mockJob as any);

      // Add job
      const job = await enhancedQueueService.addJob("test-queue", "integration-test", jobData);
      expect(job).toEqual(mockJob);

      // Record metric
      monitoringService.recordJobMetric({
        queueName: "test-queue",
        jobName: "integration-test",
        duration: 500,
        success: true,
        timestamp: new Date(),
        attempts: 1,
      });

      // Check metrics were recorded
      const metrics = monitoringService.getQueuePerformanceMetrics("test-queue", 1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].jobName).toBe("integration-test");
    });

    it("should handle error scenarios gracefully", async () => {
      mockQueue.add.mockRejectedValue(new Error("Queue connection failed"));

      await expect(
        enhancedQueueService.addJob("test-queue", "failing-job", {
          payload: { test: "fail" },
          metadata: {},
        }),
      ).rejects.toThrow("Queue connection failed");
    });
  });
});

// Helper function to create test queue module
export const createTestQueueModule = () => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ".env.test",
      }),
    ],
    providers: [EnhancedQueueService, QueueMonitoringService, QueueDashboardService],
  });
};

// Export test utilities
export { EnhancedQueueService, QueueDashboardService, QueueMonitoringService };
