import type { ApplicationSummary, HealthStatus } from '../../types/domain';
import type { ServiceStatus } from '../../components/ui/StatusDot';

export function readableStatus(status: HealthStatus) {
  return status === 'unknown' ? 'No data' : status.charAt(0).toUpperCase() + status.slice(1);
}

export function serviceStatus(status: HealthStatus): ServiceStatus {
  if (status === 'healthy') return 'operational';
  if (status === 'down') return 'outage';
  return status;
}

export function responseLabel(value: number | null) {
  return value == null ? '—' : `${value.toLocaleString()} ms`;
}

export function dateTimeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Unknown time' : date.toLocaleString();
}

export function slowestApplications(applications: ApplicationSummary[]) {
  return applications
    .filter((application) => application.responseTimeMs != null)
    .sort((left, right) => (right.responseTimeMs ?? 0) - (left.responseTimeMs ?? 0))
    .slice(0, 4);
}
