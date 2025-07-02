# Health Library - Quick Start Guide

## 🚀 Getting Started

The enhanced health library provides comprehensive health monitoring for your NestJS application with deep integration for Prisma and queue systems.

### Basic Integration

```typescript
import { HealthModule } from "@lib/health";

@Module({
  imports: [
    // ... other modules
    HealthModule,
  ],
})
export class AppModule {}
```

### Available Endpoints

Once integrated, the following health endpoints are automatically available:

#### Core Health Checks

- `GET /health` - Basic health status
- `GET /health/enhanced` - Comprehensive health check with metadata
- `GET /health/detailed` - Detailed service breakdown

#### Kubernetes Probes

- `GET /health/liveness` - Application liveness probe
- `GET /health/readiness` - Application readiness probe

#### Specialized Monitoring

- `GET /health/database` - Database health and performance
- `GET /health/queues` - Queue system health and metrics
- `GET /health/metrics` - System performance metrics
- `GET /health/alerts` - Active alerts and warnings
- `GET /health/performance` - Aggregated performance data

## 📊 Example Responses

### Enhanced Health Check

```bash
curl http://localhost:3000/api/health/enhanced
```

```json
{
  "status": "ok",
  "info": {
    "redis": {
      "status": "up",
      "host": "localhost",
      "port": 6379,
      "duration": "7ms"
    },
    "memory": {
      "status": "up"
    },
    "database": {
      "status": "up"
    }
  },
  "details": { ... },
  "metadata": {
    "version": "1.0.0",
    "uptime": 123456,
    "timestamp": "2025-07-02T10:45:11.250Z"
  }
}
```

### Database Health

```bash
curl http://localhost:3000/api/health/database
```

```json
{
  "database": {
    "status": "connected",
    "connectionCount": 1,
    "activeQueries": 0,
    "version": "PostgreSQL 17.5...",
    "databaseSize": "8787 kB",
    "uptime": 65616170,
    "migrationStatus": {
      "current": "20250701163232_add_session_table",
      "pending": 0,
      "lastMigration": "2025-07-01T16:32:32.579Z"
    },
    "responseTime": "16ms"
  }
}
```

### System Metrics

```bash
curl http://localhost:3000/api/health/metrics
```

```json
{
  "uptime": 41978,
  "memoryUsage": {
    "heapUsed": 70404488,
    "heapTotal": 75743232,
    "external": 23633572,
    "rss": 121438208
  },
  "cpuUsage": {
    "user": 989165,
    "system": 252119
  },
  "loadAverage": [9.36, 4.98, 3.84]
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Redis Configuration
HEALTH_REDIS_HOST=localhost
HEALTH_REDIS_PORT=6379
HEALTH_REDIS_PASSWORD=optional

# MongoDB Configuration
HEALTH_MONGO_URI=mongodb://localhost:27017/myapp

# Health Check Settings
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_MEMORY_HEAP_THRESHOLD=200000000
HEALTH_CHECK_DISK_THRESHOLD=0.9
```

### Custom Configuration

```typescript
import { HealthModule } from "@lib/health";

@Module({
  imports: [
    HealthModule.forRoot({
      redis: {
        host: "localhost",
        port: 6379,
        timeout: 5000,
      },
      database: {
        timeout: 3000,
        includeSlowQueries: true,
      },
      alerts: {
        enabled: true,
        severity: "medium",
      },
    }),
  ],
})
export class AppModule {}
```

## 🔧 Custom Health Indicators

### Creating Custom Indicators

```typescript
import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";

@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.checkCustomService();

    const result = this.getStatus(key, isHealthy, {
      customMetric: "value",
      responseTime: "10ms",
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError("Custom service failed", result);
  }

  private async checkCustomService(): Promise<boolean> {
    // Implement your custom health check logic
    return true;
  }
}
```

### Using Custom Indicators

```typescript
import { EnhancedHealthService } from "@lib/health";

@Injectable()
export class CustomHealthService {
  constructor(
    private readonly healthService: EnhancedHealthService,
    private readonly customIndicator: CustomHealthIndicator,
  ) {}

  async checkCustomHealth() {
    return this.healthService.check([() => this.customIndicator.isHealthy("custom")]);
  }
}
```

## 🚨 Monitoring & Alerting

### Setting Up Alerts

```typescript
import { EnhancedHealthService } from "@lib/health";

@Injectable()
export class MonitoringService {
  constructor(private readonly healthService: EnhancedHealthService) {}

  async checkForAlerts() {
    const alerts = await this.healthService.getAlerts();

    for (const alert of alerts.alerts) {
      if (alert.severity === "critical") {
        await this.sendNotification(alert);
      }
    }
  }

  private async sendNotification(alert: any) {
    // Implement your notification logic (email, Slack, etc.)
  }
}
```

### Performance Monitoring

```typescript
@Injectable()
export class PerformanceMonitoringService {
  constructor(private readonly healthService: EnhancedHealthService) {}

  async getPerformanceReport() {
    const metrics = await this.healthService.getPerformanceMetrics();

    return {
      timestamp: new Date(),
      system: metrics.system,
      services: metrics.services,
      trends: this.calculateTrends(metrics),
    };
  }
}
```

## 🐳 Kubernetes Integration

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestjs-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: nestjs-app:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /api/health/liveness
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health/readiness
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

## 📈 Best Practices

### 1. Health Check Design

- Keep health checks lightweight and fast
- Use appropriate timeouts for external dependencies
- Implement graceful degradation for non-critical services
- Monitor health check performance itself

### 2. Alert Management

- Configure appropriate alert thresholds
- Implement alert escalation strategies
- Use structured logging for health events
- Set up notification channels for critical alerts

### 3. Performance Monitoring

- Regularly review performance trends
- Set up automated performance alerts
- Monitor resource usage patterns
- Plan capacity based on health metrics

### 4. Production Deployment

- Use readiness probes for traffic routing
- Configure liveness probes for container restarts
- Monitor health endpoints continuously
- Set up dashboards for health visualization

## 🔗 Integration Examples

### With Logging

```typescript
import { Logger } from "@nestjs/common";

@Injectable()
export class HealthMonitoringService {
  private readonly logger = new Logger(HealthMonitoringService.name);

  async monitorHealth() {
    const health = await this.healthService.checkHealth();

    if (health.status !== "ok") {
      this.logger.warn("Health check failed", { health });
    }

    return health;
  }
}
```

### With Metrics Collection

```typescript
import { Counter, Histogram } from "prom-client";

@Injectable()
export class MetricsService {
  private readonly healthCheckCounter = new Counter({
    name: "health_checks_total",
    help: "Total number of health checks",
    labelNames: ["status"],
  });

  async recordHealthCheck(status: string) {
    this.healthCheckCounter.inc({ status });
  }
}
```

This enhanced health library provides everything you need for comprehensive application monitoring in production environments!
