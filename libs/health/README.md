# Health Library

A comprehensive health monitoring library for NestJS applications with support for multiple services and detailed diagnostics.

## Features

### 🏥 Comprehensive Health Checks

- **Database**: PostgreSQL/Prisma health monitoring
- **Redis**: Connection and ping tests
- **MongoDB**: Connection verification
- **System**: Memory usage, disk space, and system metrics
- **External Services**: HTTP endpoint availability
- **Custom Indicators**: Extensible framework for custom checks

### 🎯 Multiple Endpoints

- `/health` - Complete health check with all configured services
- `/health/detailed` - Detailed health status with custom formatting
- `/health/liveness` - Simple liveness probe for Kubernetes
- `/health/readiness` - Readiness probe with essential service checks
- `/health/system` - System information and metrics

### ⚙️ Configurable

- Environment-based configuration
- Enable/disable individual checks
- Customizable thresholds
- Timeout configuration
- Multiple external URLs support

### 📊 Rich Diagnostics

- Response times for each check
- Memory usage details
- System information
- Error reporting with context
- Graceful degradation

## Installation

The health library is already included in this workspace. Dependencies:

```bash
yarn add ioredis mongodb @nestjs/terminus @nestjs/axios
```

## Configuration

Configure health checks using environment variables:

```env
# Database Health Check
HEALTH_CHECK_DATABASE_ENABLED=true
HEALTH_CHECK_DATABASE_TIMEOUT=5000

# Redis Health Check
HEALTH_CHECK_REDIS_ENABLED=true
HEALTH_CHECK_REDIS_TIMEOUT=3000
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB Health Check
HEALTH_CHECK_MONGODB_ENABLED=true
HEALTH_CHECK_MONGODB_TIMEOUT=5000
MONGO_DATABASE_URL=mongodb://localhost:27017/mydb

# Memory Health Check
HEALTH_CHECK_MEMORY_ENABLED=true
HEALTH_CHECK_MEMORY_HEAP_THRESHOLD=157286400  # 150MB
HEALTH_CHECK_MEMORY_RSS_THRESHOLD=314572800   # 300MB

# Disk Health Check
HEALTH_CHECK_DISK_ENABLED=true
HEALTH_CHECK_DISK_PATH=/
HEALTH_CHECK_DISK_THRESHOLD=0.9  # 90%

# External Services Health Check
HEALTH_CHECK_EXTERNAL_ENABLED=true
HEALTH_CHECK_EXTERNAL_URLS=https://www.google.com,https://api.github.com
HEALTH_CHECK_EXTERNAL_TIMEOUT=5000
```

## Usage

### Basic Import

```typescript
import { HealthModule } from "@lib/health";

@Module({
  imports: [HealthModule],
})
export class AppModule {}
```

### Custom Health Indicators

Create custom health indicators by extending the base class:

```typescript
import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult } from "@nestjs/terminus";

@Injectable()
export class MyCustomHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.checkMyService();
    const result = this.getStatus(key, isHealthy, {
      customData: "value",
    });

    if (!isHealthy) {
      throw new HealthCheckError("Custom check failed", result);
    }

    return result;
  }
}
```

## API Endpoints

### GET /health

Complete health check with all enabled services.

**Response Example:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "duration": "12ms"
    },
    "redis": {
      "status": "up",
      "host": "localhost",
      "port": 6379,
      "duration": "8ms"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "duration": "12ms"
    }
  }
}
```

### GET /health/detailed

Detailed health status with custom formatting.

**Response Example:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "timestamp": "2025-07-01T10:30:00.000Z",
      "duration": "12ms"
    }
  },
  "error": {},
  "details": {}
}
```

### GET /health/liveness

Simple liveness probe.

**Response Example:**

```json
{
  "status": "ok",
  "timestamp": "2025-07-01T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### GET /health/readiness

Readiness probe with essential checks.

**Response Example:**

```json
{
  "status": "ready",
  "timestamp": "2025-07-01T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "duration": "15ms"
    }
  }
}
```

### GET /health/system

System information and metrics.

**Response Example:**

```json
{
  "system": {
    "status": "up",
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "architecture": "arm64",
    "cpus": 8,
    "totalMemory": "8192MB",
    "freeMemory": "2048MB",
    "uptime": "3600s",
    "loadAverage": [1.2, 1.1, 1.0]
  }
}
```

## Kubernetes Integration

The health endpoints are designed for Kubernetes health checks:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: my-app
      livenessProbe:
        httpGet:
          path: /health/liveness
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /health/readiness
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

## Monitoring Integration

The health endpoints can be monitored by various tools:

- **Prometheus**: Scrape the endpoints for metrics
- **Grafana**: Create dashboards from health data
- **New Relic**: Monitor endpoint availability
- **DataDog**: Track health check metrics

## Error Handling

The library provides detailed error information:

```json
{
  "status": "error",
  "info": {},
  "error": {
    "redis": {
      "status": "down",
      "error": "Connection timeout",
      "duration": "3000ms",
      "host": "localhost",
      "port": 6379
    }
  },
  "details": {}
}
```

## Performance Considerations

- Health checks run in parallel when possible
- Configurable timeouts prevent hanging requests
- Failed checks don't block other checks
- Lightweight system metrics collection
- Connection pooling for database checks

## Best Practices

1. **Configure appropriate timeouts** - Balance responsiveness vs reliability
2. **Enable only needed checks** - Reduce overhead by disabling unused services
3. **Set realistic thresholds** - Memory and disk thresholds should match your environment
4. **Monitor health endpoints** - Set up alerting on health check failures
5. **Use readiness checks** - Don't route traffic to unhealthy instances
6. **Log health failures** - The service automatically logs failed checks

## Troubleshooting

### Common Issues

1. **Redis connection failures**
   - Check Redis is running and accessible
   - Verify REDIS_HOST and REDIS_PORT configuration
   - Check network connectivity

2. **Database timeouts**
   - Increase HEALTH_CHECK_DATABASE_TIMEOUT
   - Check database connection pool settings
   - Monitor database performance

3. **Memory threshold alerts**
   - Adjust HEALTH_CHECK_MEMORY_HEAP_THRESHOLD
   - Monitor application memory usage
   - Check for memory leaks

4. **Disk space warnings**
   - Adjust HEALTH_CHECK_DISK_THRESHOLD
   - Monitor disk usage trends
   - Implement log rotation

### Debug Mode

Enable debug logging to troubleshoot issues:

```env
LOG_LEVEL=debug
```

This will provide detailed logs for each health check execution.

## Contributing

When adding new health indicators:

1. Extend the `HealthIndicator` class
2. Implement proper error handling
3. Add configuration options
4. Include response time measurements
5. Add tests for the new indicator
6. Update documentation

## License

This library is part of the nest-prisma-template-v2 project.
