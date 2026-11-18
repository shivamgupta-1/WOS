export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type Tier = 1 | 2 | 3;
export type Severity = 'SEV1' | 'SEV2' | 'SEV3';

export interface ApiApplication {
  id: string;
  name: string;
  url: string;
  teamslink: string;
  email: string;
  description: string;
  domainId: string;
  failureThreshold: number;
  awsInstanceId: string | null;
}

export interface ApiDomain {
  id: string;
  domainName: string;
}

export interface ApiHealthRecord {
  id: string;
  applicationId: string;
  responseTime: number | null;
  statusCode: number | null;
  status: string;
  consecutiveFailures: number;
  lastUpdated: string;
}

export interface ApiIncidentPeriod {
  id: string;
  status: string;
  startAt: string;
  endAt: string | null;
  errorMessage: string | null;
}

export interface ApiIncidentHistory {
  application: { id: string; name: string };
  days: number;
  history: ApiIncidentPeriod[];
  incidents: ApiIncidentPeriod[];
}

export interface AwsInstanceMetricsResponse {
  application: {
    instanceId: string;
    name: string | null;
    state: string;
    instanceType: string | null;
    privateIp: string | null;
    publicIp: string | null;
    region: string;
  };
  metrics: {
    cpu: number | null;
    memory: number | null;
    disk: number | null;
    networkIn: number | null;
    networkOut: number | null;
  };
}

export interface ApplicationSummary {
  id: string;
  name: string;
  status: HealthStatus;
  healthScore: number | null;
  availabilityPct: number | null;
  responseTimeMs: number | null;
  errorRatePct: number | null;
  trend: number[];
  owner: string;
  tier: Tier | null;
  domainName: string;
  lastUpdated: string | null;
}

export interface OverviewKpis {
  total: number;
  healthy: number;
  degraded: number | null;
  down: number;
  sloAttainmentPct: number | null;
  openIncidents: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity | null;
  startedAt: string;
  team: string;
  appId: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  domainId: string;
  failureThreshold: number;
  awsInstanceId: string | null;
  url: string;
  teamslink: string;
  email: string;
  description: string;
  statusCode: number | null;
  incidents: Incident[];
  history: ApiIncidentPeriod[];
}

export interface OverviewResponse {
  kpis: OverviewKpis;
  applications: ApplicationSummary[];
  incidents: Incident[];
  lastUpdated: string | null;
}

export interface CreateApplicationRequest {
  name: string;
  url: string;
  teamslink: string;
  email: string;
  description: string;
  domainId: string;
  failureThreshold: number;
  awsInstanceId: string | null;
}

export interface UpdateApplicationRequest extends CreateApplicationRequest {
  id: string;
}

export interface DomainRequest {
  name: string;
}
