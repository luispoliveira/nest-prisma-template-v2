export interface HealthCheckDetails {
  status: "up" | "down";
  message?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: "ok" | "error" | "partial";
  info: Record<string, HealthCheckDetails>;
  error: Record<string, HealthCheckDetails>;
  details: Record<string, HealthCheckDetails>;
}

export interface LivenessResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface ReadinessResponse {
  status: "ready" | "not_ready";
  timestamp: string;
  checks: Record<string, HealthCheckDetails>;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
}

export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  architecture: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
}
