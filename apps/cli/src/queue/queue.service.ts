import { QUEUES } from "@lib/queue";
import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bull";
import { Command, Option } from "nestjs-command";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue(QUEUES.DEFAULT) private defaultQueue: Queue) {}

  @Command({
    command: "queue:status",
    describe: "Show queue status and statistics",
  })
  async status() {
    try {
      console.log("\n📊 Queue Status");
      console.log("═".repeat(50));

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.defaultQueue.getWaiting(),
        this.defaultQueue.getActive(),
        this.defaultQueue.getCompleted(),
        this.defaultQueue.getFailed(),
        this.defaultQueue.getDelayed(),
      ]);

      console.log(`📦 Queue: ${QUEUES.DEFAULT}`);
      console.log(`⏳ Waiting: ${waiting.length}`);
      console.log(`🏃 Active: ${active.length}`);
      console.log(`✅ Completed: ${completed.length}`);
      console.log(`❌ Failed: ${failed.length}`);
      console.log(`⏰ Delayed: ${delayed.length}`);

      const isPaused = await this.defaultQueue.isPaused();
      console.log(`📊 Status: ${isPaused ? "🟡 Paused" : "🟢 Running"}`);

      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to get queue status: ${error.message}`);
      console.error("❌ Failed to get queue status:", error.message);
    }
  }

  @Command({
    command: "queue:clean",
    describe: "Clean completed and failed jobs from queue",
  })
  async clean(
    @Option({
      name: "grace",
      describe: "Grace period in ms (default: 5000)",
      type: "number",
      required: false,
      alias: "g",
    })
    grace: number = 5000,
    @Option({
      name: "limit",
      describe: "Maximum number of jobs to clean (default: 100)",
      type: "number",
      required: false,
      alias: "l",
    })
    limit: number = 100,
  ) {
    try {
      console.log("\n🧹 Cleaning queue");
      console.log("═".repeat(50));

      const [completedJobs, failedJobs] = await Promise.all([
        this.defaultQueue.clean(grace, "completed", limit),
        this.defaultQueue.clean(grace, "failed", limit),
      ]);

      console.log(`✅ Cleaned completed jobs: ${completedJobs.length}`);
      console.log(`❌ Cleaned failed jobs: ${failedJobs.length}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to clean queue: ${error.message}`);
      console.error("❌ Failed to clean queue:", error.message);
    }
  }

  @Command({
    command: "queue:pause",
    describe: "Pause job processing",
  })
  async pause() {
    try {
      console.log("\n⏸️  Pausing queue");
      console.log("═".repeat(50));

      await this.defaultQueue.pause();
      console.log("✅ Queue paused successfully");
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to pause queue: ${error.message}`);
      console.error("❌ Failed to pause queue:", error.message);
    }
  }

  @Command({
    command: "queue:resume",
    describe: "Resume job processing",
  })
  async resume() {
    try {
      console.log("\n▶️  Resuming queue");
      console.log("═".repeat(50));

      await this.defaultQueue.resume();
      console.log("✅ Queue resumed successfully");
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to resume queue: ${error.message}`);
      console.error("❌ Failed to resume queue:", error.message);
    }
  }

  @Command({
    command: "queue:jobs",
    describe: "List jobs in queue",
  })
  async listJobs(
    @Option({
      name: "status",
      describe: "Job status (waiting, active, completed, failed, delayed)",
      type: "string",
      required: false,
      alias: "s",
    })
    status: string = "waiting",
    @Option({
      name: "limit",
      describe: "Maximum number of jobs to show (default: 10)",
      type: "number",
      required: false,
      alias: "l",
    })
    limit: number = 10,
  ) {
    try {
      console.log(`\n📋 Jobs (${status})`);
      console.log("═".repeat(80));

      let jobs: any[] = [];
      switch (status) {
        case "waiting":
          jobs = await this.defaultQueue.getWaiting(0, limit - 1);
          break;
        case "active":
          jobs = await this.defaultQueue.getActive(0, limit - 1);
          break;
        case "completed":
          jobs = await this.defaultQueue.getCompleted(0, limit - 1);
          break;
        case "failed":
          jobs = await this.defaultQueue.getFailed(0, limit - 1);
          break;
        case "delayed":
          jobs = await this.defaultQueue.getDelayed(0, limit - 1);
          break;
        default:
          console.log("❌ Invalid status. Use: waiting, active, completed, failed, or delayed");
          return;
      }

      if (jobs.length === 0) {
        console.log(`📭 No ${status} jobs found`);
        return;
      }

      jobs.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job.id}`);
        console.log(`   📝 Name: ${job.name}`);
        console.log(`   📅 Created: ${new Date(job.timestamp).toISOString()}`);
        console.log(`   📊 Attempts: ${job.attemptsMade}/${job.opts.attempts || 1}`);
        console.log(`   📦 Data: ${JSON.stringify(job.data, null, 2).substring(0, 100)}...`);
        if (job.failedReason) {
          console.log(`   ❌ Error: ${job.failedReason}`);
        }
        console.log("");
      });

      console.log("═".repeat(80));
    } catch (error: any) {
      this.logger.error(`Failed to list jobs: ${error.message}`);
      console.error("❌ Failed to list jobs:", error.message);
    }
  }

  @Command({
    command: "queue:retry-failed",
    describe: "Retry all failed jobs",
  })
  async retryFailed() {
    try {
      console.log("\n🔄 Retrying failed jobs");
      console.log("═".repeat(50));

      const failedJobs = await this.defaultQueue.getFailed();
      console.log(`Found ${failedJobs.length} failed jobs`);

      for (const job of failedJobs) {
        await job.retry();
      }

      console.log(`✅ Retried ${failedJobs.length} jobs`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to retry jobs: ${error.message}`);
      console.error("❌ Failed to retry jobs:", error.message);
    }
  }

  @Command({
    command: "queue:add-test-job",
    describe: "Add a test job to the queue",
  })
  async addTestJob(
    @Option({
      name: "delay",
      describe: "Delay in seconds",
      type: "number",
      required: false,
      alias: "d",
    })
    delay: number = 0,
  ) {
    try {
      console.log("\n➕ Adding test job");
      console.log("═".repeat(50));

      const job = await this.defaultQueue.add(
        "test-job",
        {
          message: "This is a test job from CLI",
          timestamp: new Date().toISOString(),
        },
        {
          delay: delay * 1000,
        },
      );

      console.log(`✅ Test job added successfully`);
      console.log(`🆔 Job ID: ${job.id}`);
      console.log(`⏰ Delay: ${delay} seconds`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to add test job: ${error.message}`);
      console.error("❌ Failed to add test job:", error.message);
    }
  }
}
