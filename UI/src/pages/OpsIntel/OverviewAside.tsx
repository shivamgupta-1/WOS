import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import type { ApplicationSummary, Incident } from '../../types/domain';
import { dateTimeLabel, responseLabel, slowestApplications } from './overviewFormatters';

interface OverviewAsideProps {
  applications: ApplicationSummary[];
  incidents: Incident[];
  loading: boolean;
}

export function OverviewAside({ applications, incidents, loading }: OverviewAsideProps) {
  const slowestResponses = useMemo(() => slowestApplications(applications), [applications]);
  const slowestMaximum = slowestResponses[0]?.responseTimeMs ?? 1;

  return (
    <aside className="overview-v2-aside">
      <Card aria-labelledby="overview-incidents-heading" className="overview-v2-side-card">
        <CardHeader className="overview-v2-card-header">
          <div>
            <CardTitle id="overview-incidents-heading">Incidents</CardTitle>
            <CardDescription>Issues requiring attention</CardDescription>
          </div>
          <Badge variant={incidents.length ? 'warning' : 'neutral'}>{loading ? '—' : incidents.length}</Badge>
        </CardHeader>
        {loading ? (
          <CardContent className="overview-v2-incident-loading" role="status" aria-label="Loading incidents">
            <Skeleton /><Skeleton />
          </CardContent>
        ) : incidents.length > 0 ? (
          <CardContent className="overview-v2-incident-list">
            {incidents.map((incident) => (
              <Link className="overview-v2-incident" to={`/applications/${incident.appId}`} key={incident.id}>
                <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-danger" />
                <span>
                  <span className="overview-v2-incident-meta">
                    <Badge variant={incident.severity === 'SEV1' ? 'danger' : incident.severity === 'SEV2' ? 'warning' : 'neutral'}>
                      {incident.severity ?? 'Open'}
                    </Badge>
                    <time dateTime={incident.startedAt}>{dateTimeLabel(incident.startedAt)}</time>
                  </span>
                  <strong>{incident.title}</strong>
                  <small>{incident.team || 'Owner not provided'}</small>
                </span>
              </Link>
            ))}
          </CardContent>
        ) : (
          <CardContent className="overview-v2-side-empty">
            <span>No active incidents</span>
            <small>New incidents will appear here.</small>
          </CardContent>
        )}
      </Card>

      <Card aria-labelledby="overview-response-heading" className="overview-v2-side-card">
        <CardHeader className="overview-v2-card-header">
          <div>
            <CardTitle id="overview-response-heading">Slowest responses</CardTitle>
            <CardDescription>Latest reported health-check times</CardDescription>
          </div>
        </CardHeader>
        {loading ? (
          <CardContent className="overview-v2-response-loading" role="status" aria-label="Loading response times">
            <Skeleton /><Skeleton /><Skeleton />
          </CardContent>
        ) : slowestResponses.length > 0 ? (
          <ol className="overview-v2-response-list">
            {slowestResponses.map((application) => (
              <li key={application.id}>
                <Link to={`/applications/${application.id}`}>
                  <span>{application.name}</span>
                  <strong>{responseLabel(application.responseTimeMs)}</strong>
                </Link>
                <span className="overview-v2-response-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, (application.responseTimeMs ?? 0) / slowestMaximum * 100)}%` }} />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <CardContent className="overview-v2-side-empty">
            <span>No response-time data</span>
            <small>Response times will appear after health checks.</small>
          </CardContent>
        )}
      </Card>
    </aside>
  );
}
