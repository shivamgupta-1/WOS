export interface Application {
  instanceId: string;
  name: string | null;
  state: string;
  instanceType: string | null;
  privateIp: string | null;
  publicIp: string | null;
  region: string;
}

export interface Metrics {
  cpu: number | null;
  memory: number | null;
  disk: number | null;
  networkIn: number | null;
  networkOut: number | null;
}

export interface LogEvent {
  timestamp: string;
  message: string;
}

export interface ApplicationHealthResponse {
  application: Application;
  metrics: Metrics;
  logs: LogEvent[];
}
