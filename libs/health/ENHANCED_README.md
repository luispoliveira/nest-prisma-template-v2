# Enhanced Health Library

A comprehensive, production-ready health monitoring library for NestJS applications with deep integrations for Prisma database operations and queue systems. This enhanced version provides detailed diagnostics, performance metrics, and real-time monitoring capabilities.

## 🚀 New Features & Enhancements

### 🔄 Enhanced Prisma Integration

- **Connection Pool Monitoring**: Real-time tracking of database connections
- **Query Performance**: Slow query detection and analysis
- **Migration Status**: Automatic migration state monitoring
- **Database Metrics**: Size, uptime, and performance statistics
- **Advanced Error Handling**: Detailed error diagnostics and recovery suggestions

### 📋 Queue System Integration

- **Multi-Queue Support**: Monitor multiple Bull queues simultaneously
- **Performance Metrics**: Processing times, throughput, and error rates
- **Alert System**: Configurable alerts for queue health issues
- **Job Analytics**: Detailed job lifecycle tracking
- **Resource Monitoring**: Memory usage and system impact analysis

### 📊 Advanced Health Monitoring

- **Comprehensive Metrics**: System-wide performance and health indicators
- **Alert Management**: Severity-based alert system with filtering
- **Performance Tracking**: Historical performance data and trends
- **Dependency Mapping**: Detailed dependency health and relationships

## 📋 Available Endpoints

### Core Health Endpoints

- `GET /health` - Basic health check (original functionality)
- `GET /health/enhanced` - Enhanced health check with detailed metrics
- `GET /health/detailed` - Comprehensive health report with diagnostics
- `GET /health/liveness` - Kubernetes liveness probe
- `GET /health/readiness` - Kubernetes readiness probe

### Specialized Endpoints

- `GET /health/metrics` - System performance metrics
- `GET /health/database` - Detailed database health and statistics
- `GET /health/queues` - Queue system health and performance
- `GET /health/alerts` - Current health alerts with filtering
- `GET /health/performance` - Performance metrics across all services
- `GET /health/system` - System information and resources

## 🔧 Configuration

### Environment Variables

```bash
# Database Health
HEALTH_DATABASE_ENABLED=true

# Queue Health
HEALTH_QUEUES_ENABLED=true
HEALTH_QUEUES_NAMES=default,email,notification
HEALTH_QUEUES_CRITICAL=false

# Redis Health
HEALTH_REDIS_ENABLED=true
HEALTH_REDIS_HOST=localhost
HEALTH_REDIS_PORT=6379
HEALTH_REDIS_TIMEOUT=3000
HEALTH_REDIS_CRITICAL=false

# MongoDB Health (optional)
HEALTH_MONGO_ENABLED=false
HEALTH_MONGO_URL=mongodb://localhost:27017
HEALTH_MONGO_TIMEOUT=3000

# System Health
HEALTH_SYSTEM_MEMORY_ENABLED=true
HEALTH_SYSTEM_MEMORY_THRESHOLD=1073741824  # 1GB in bytes
HEALTH_SYSTEM_DISK_ENABLED=true
HEALTH_SYSTEM_DISK_THRESHOLD=0.9  # 90%
HEALTH_SYSTEM_DISK_PATH=/

# External Services
HEALTH_EXTERNAL_URLS=https://api.example.com,https://webhook.site
HEALTH_EXTERNAL_TIMEOUT=3000

# Application Info
APP_VERSION=1.0.0
NODE_ENV=production
```

### Configuration Object

```typescript
import { HealthModule } from "@lib/health";

@Module({
  imports: [
    HealthModule, // Auto-configures with environment variables

    // Or configure specific queues
    HealthModule.forRoot({
      queues: ["default", "email", "notification"],
      database: { enabled: true },
      redis: {
        enabled: true,
        host: "redis.example.com",
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

## 📊 Enhanced Response Examples

### Enhanced Health Check Response

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "connectionCount": 5,
      "activeQueries": 0,
      "databaseSize": "125 MB",
      "uptime": 86400000,
      "version": "PostgreSQL 14.5",
      "migrationStatus": {
        "current": "20231201_add_user_table",
        "pending": 0,
        "lastMigration": "2023-12-01T10:30:00Z"
      },
      "responseTime": "15ms"
    },
    "queues": {
      "status": "up",
      "overallStatus": "healthy",
      "totalJobs": 1250,
      "activeJobs": 3,
      "failedJobs": 12,
      "queues": [
        {
          "name": "default",
          "status": "healthy",
          "stats": {
            "waiting": 0,
            "active": 2,
            "completed": 1000,
            "failed": 5,
            "delayed": 0,
            "paused": 0,
            "total": 1007
          },
          "performance": {
            "averageProcessingTime": 250,
            "throughput": 450,
            "errorRate": 0.005
          }
        }
      ]
    }
  },
  "metadata": {
    "version": "1.0.0",
    "environment": "production",
    "uptime": 86400000,
    "timestamp": "2023-12-01T12:00:00Z",
    "checkDuration": 125
  }
}
```

### Detailed Health Report

```json
{
  "summary": {
    "status": "healthy",
    "timestamp": "2023-12-01T12:00:00Z",
    "uptime": 86400000,
    "version": "1.0.0"
  },
  "services": {
    "database": {
      "connectionPool": {
        "activeConnections": 5,
        "idleConnections": 2,
        "totalConnections": 7,
        "maxConnections": 20
      },
      "slowQueries": [
        {
          "query": "SELECT * FROM users WHERE...",
          "duration": 5200,
          "timestamp": "2023-12-01T11:55:00Z"
        }
      ]
    },
    "queues": {
      "summary": {
        "totalQueues": 3,
        "healthyQueues": 3,
        "unhealthyQueues": 0,
        "warningQueues": 0
      },
      "systemMetrics": {
        "memoryUsage": 256000000,
        "averageProcessingTime": 200
      }
    }
  },
  "metrics": {
    "uptime": 86400000,
    "memoryUsage": {
      "heapUsed": 125000000,
      "heapTotal": 200000000,
      "external": 15000000,
      "rss": 250000000
    },
    "cpuUsage": {
      "user": 1500000,
      "system": 500000
    }
  },
  "alerts": [
    {
      "service": "database",
      "type": "slow_query",
      "severity": "medium",
      "message": "Query execution time exceeded 5 seconds",
      "timestamp": "2023-12-01T11:55:00Z"
    }
  ]
}
```

## 🔍 Queue Health Monitoring

### Queue Status Levels

- **Healthy**: Normal operation, low error rates, good performance
- **Warning**: Elevated error rates, slow processing, or minor issues
- **Unhealthy**: High error rates, critical failures, or service unavailable

### Automatic Alerts

- High failure rates (>10% for unhealthy, >5% for warning)
- Slow processing times (>30 seconds average)
- Large queue backlogs (>1000 waiting jobs)
- Critical system alerts from queue monitoring

### Performance Metrics

- Average processing time per job
- Throughput (jobs per minute/hour)
- Error rates and retry statistics
- Memory usage impact
- Queue size trends

## 📊 Database Health Monitoring

### Enhanced Metrics

- Real-time connection pool statistics
- Active query monitoring
- Slow query detection and logging
- Database size and growth tracking
- Migration status verification

### Performance Indicators

- Query execution times
- Connection utilization
- Database uptime and availability
- Storage usage and optimization

## 🚨 Alert System

### Severity Levels

- **Critical**: Service unavailable or critical functionality impaired
- **High**: Significant performance degradation or reliability issues
- **Medium**: Performance concerns or potential issues
- **Low**: Minor issues or informational alerts

### Alert Types

- Connection failures
- Performance degradation
- Resource exhaustion
- Service timeouts
- Configuration issues

## 🔧 Integration Examples

### Basic Usage

```typescript
// app.module.ts
import { HealthModule } from "@lib/health";

@Module({
  imports: [
    HealthModule, // Auto-discovers queues and databases
  ],
})
export class AppModule {}
```

### Advanced Configuration

```typescript
// app.module.ts
import { HealthModule } from "@lib/health";

@Module({
  imports: [
    HealthModule.forRoot({
      queues: {
        enabled: true,
        names: ["default", "email", "notifications"],
        critical: false,
      },
      database: {
        enabled: true,
        includeSlowQueries: true,
        slowQueryThreshold: 5000, // 5 seconds
      },
      redis: {
        enabled: true,
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        critical: false,
      },
      alerts: {
        enabled: true,
        webhookUrl: process.env.ALERT_WEBHOOK_URL,
      },
    }),
  ],
})
export class AppModule {}
```

### Custom Health Checks

```typescript
import { EnhancedHealthService } from "@lib/health";

@Injectable()
export class CustomHealthService {
  constructor(private enhancedHealth: EnhancedHealthService) {}

  async getApplicationHealth() {
    const health = await this.enhancedHealth.getDetailedHealthReport();

    // Add custom business logic health checks
    const customChecks = await this.performCustomChecks();

    return {
      ...health,
      custom: customChecks,
    };
  }
}
```

## 🎯 Kubernetes Integration

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Health Check Probe

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health/enhanced"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 🔧 Troubleshooting

### Common Issues

1. **Queue Connection Errors**
   - Verify Redis connection settings
   - Check queue registration in modules
   - Ensure proper queue names configuration

2. **Database Health Failures**
   - Check Prisma connection configuration
   - Verify database permissions for health queries
   - Review slow query logs

3. **Memory Threshold Exceeded**
   - Adjust memory thresholds in configuration
   - Monitor application memory leaks
   - Optimize query performance

### Debug Mode

Enable detailed logging:

```typescript
// Set LOG_LEVEL=debug
process.env.LOG_LEVEL = "debug";
```

## 📚 API Reference

### Health Endpoints

- [Enhanced Health Check](#enhanced-health-check)
- [Detailed Health Report](#detailed-health-report)
- [Queue Health](#queue-health)
- [Database Health](#database-health)
- [System Metrics](#system-metrics)

### Configuration Options

- [Module Configuration](#module-configuration)
- [Environment Variables](#environment-variables)
- [Alert Configuration](#alert-configuration)

---

This enhanced health library provides comprehensive monitoring capabilities that integrate seamlessly with your Prisma database operations and Bull queue systems, offering production-ready health monitoring with detailed diagnostics and alerting.
