import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useGetOverviewQuery } from '../../api/opsApi';
import { CardHeader, EmptyState, PageHeader, Segmented, StatusPill } from '../../components/ops/Primitives';
import type { HealthStatus } from '../../types/domain';
import type { ShellContext } from './OperationsShell';
import { filterApplications, groupApplications } from './overviewSelectors';
import type { OverviewGroupBy, OverviewStatusFilter } from './overviewSelectors';

type ViewMode = 'grid' | 'table';

function readableStatus(status: HealthStatus) {
  return status === 'unknown' ? 'No data' : status.charAt(0).toUpperCase() + status.slice(1);
}

function responseLabel(value: number | null) {
  return value == null ? '—' : `${value.toLocaleString()} ms`;
}

export default function OverviewPage() {
  const { search, domain, applicationsView, setApplicationsView, gridFullscreen, setGridFullscreen } = useOutletContext<ShellContext>();
  const [statusFilter, setStatusFilter] = useState<OverviewStatusFilter>('all');
  const [groupBy, setGroupBy] = useState<OverviewGroupBy>('domain');
  const { data, isLoading, isFetching, isError, refetch } = useGetOverviewQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });

  const filteredApplications = useMemo(
    () => filterApplications(data?.applications ?? [], { search, domain, status: statusFilter }),
    [data?.applications, domain, search, statusFilter],
  );
  const groups = useMemo(
    () => groupApplications(filteredApplications, groupBy),
    [filteredApplications, groupBy],
  );
  const slowestResponses = useMemo(
    () => filteredApplications
      .filter((application) => application.responseTimeMs != null)
      .sort((left, right) => (right.responseTimeMs ?? 0) - (left.responseTimeMs ?? 0))
      .slice(0, 4),
    [filteredApplications],
  );
  const slowestMaximum = slowestResponses[0]?.responseTimeMs ?? 1;
  const kpis = data?.kpis;
  const kpiItems = [
    { label: 'Applications monitored', value: isLoading ? '—' : kpis?.total ?? 0, caption: 'Registered with the health API', tone: 'neutral' },
    { label: 'Healthy', value: isLoading ? '—' : kpis?.healthy ?? 0, caption: 'Operating normally', tone: 'healthy' },
    { label: 'Degraded', value: kpis?.degraded ?? '—', caption: kpis?.degraded == null ? 'Not reported by the health API' : 'Needs attention', tone: 'degraded' },
    { label: 'Down', value: isLoading ? '—' : kpis?.down ?? 0, caption: 'Service disruption', tone: 'down' },
    { label: 'SLO attainment', value: kpis?.sloAttainmentPct == null ? '—' : `${kpis.sloAttainmentPct.toFixed(2)}%`, caption: 'Not reported by the health API', tone: 'neutral' },
    { label: 'Open incidents', value: isLoading ? '—' : kpis?.openIncidents ?? 0, caption: 'Across monitored applications', tone: 'neutral' },
  ];

  function summaryForGroup(applications: typeof filteredApplications) {
    const down = applications.filter((application) => application.status === 'down').length;
    const degraded = applications.filter((application) => application.status === 'degraded').length;
    const unknown = applications.filter((application) => application.status === 'unknown').length;
    if (down === 0 && degraded === 0 && unknown === 0) return <StatusPill status="healthy">All healthy</StatusPill>;
    return (
      <span className="group-problem-summary">
        {down > 0 && <span className="problem-down">{down} down</span>}
        {degraded > 0 && <span className="problem-degraded">{degraded} degraded</span>}
        {unknown > 0 && <span className="problem-unknown">{unknown} no data</span>}
      </span>
    );
  }

  return (
    <div className={`overview-page redesigned-overview${gridFullscreen ? ' is-grid-fullscreen-layout' : ''}`}>
      <PageHeader
        eyebrow="LIVE OPERATIONS"
        title="Health overview"
        subtitle="Current health and reliability across your monitored applications."
        actions={(
          <>
            <span className="last-check-label">{data?.lastUpdated ? `Last check ${new Date(data.lastUpdated).toLocaleString()}` : 'Waiting for first health check'}</span>
            <button className="button button-secondary" type="button" disabled={isFetching} onClick={() => void refetch()}>
              {isFetching ? 'Checking…' : 'Check now'}
            </button>
          </>
        )}
      />

      <section className="kpi-strip" aria-label="Portfolio key performance indicators">
        {kpiItems.map((item) => (
          <article className={`kpi-strip-cell tone-${item.tone}`} key={item.label}>
            <span className="kpi-strip-label"><span className="kpi-status-dot" />{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.caption}</small>
          </article>
        ))}
      </section>

      {isError ? (
        <section className="error-state" role="alert">
          <strong>Health data could not be loaded.</strong>
          <span>Check the connection and try again.</span>
          <button className="button button-secondary" type="button" onClick={() => void refetch()}>Retry</button>
        </section>
      ) : (
        <div className="overview-layout redesigned-overview-layout">
          <section className="surface application-surface" aria-labelledby="applications-heading">
            <div className="overview-toolbar">
              <div className="overview-toolbar-title">
                <div><h2 id="applications-heading">Applications</h2><span>{filteredApplications.length} of {data?.applications.length ?? 0}</span></div>
                <label className="status-filter">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OverviewStatusFilter)}>
                    <option value="all">All statuses</option>
                    <option value="healthy">Healthy</option>
                    <option value="degraded">Degraded</option>
                    <option value="down">Down</option>
                  </select>
                </label>
              </div>
              <div className="overview-toolbar-controls">
                <Segmented
                  label="Group applications by"
                  value={groupBy}
                  options={[{ value: 'domain', label: 'Group by domain' }, { value: 'status', label: 'Group by status' }]}
                  onChange={setGroupBy}
                />
                <Segmented
                  label="Application list view"
                  value={applicationsView as ViewMode}
                  options={[{ value: 'grid', label: 'Grid' }, { value: 'table', label: 'Table' }]}
                  onChange={(value) => setApplicationsView(value)}
                />
                {gridFullscreen && <button className="button button-secondary" type="button" onClick={() => setGridFullscreen(false)}>Exit full screen</button>}
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <EmptyState icon="⌕">No applications match these filters.</EmptyState>
            ) : applicationsView === 'grid' ? (
              <div className="overview-groups">
                {groups.map((group) => (
                  <details className="overview-group" key={group.name} open>
                    <summary>
                      <span className="group-caret" aria-hidden="true">›</span>
                      <span className="group-icon" aria-hidden="true">{groupBy === 'domain' ? '◇' : '●'}</span>
                      <strong>{group.name}</strong>
                      <span className="group-count">{group.applications.length}</span>
                      {summaryForGroup(group.applications)}
                    </summary>
                    <div className="application-card-grid">
                      {group.applications.map((application) => (
                        <Link className={`overview-application-card card-status-${application.status}`} to={`/applications/${application.id}`} key={application.id}>
                          <div className="overview-card-heading">
                            <span className="app-monogram">{application.name.charAt(0).toUpperCase()}</span>
                            <span className="overview-card-title"><strong>{application.name}</strong><small>Owner team not reported</small></span>
                            <span className="overview-card-arrow" aria-hidden="true">↗</span>
                          </div>
                          <div className="application-card-status">
                            <StatusPill status={application.status}>{readableStatus(application.status)}</StatusPill>
                            {application.trend.length > 1 && (
                              <span className="response-sparkline" aria-label="Recent response-time trend">
                                {application.trend.slice(-12).map((point, index) => <i key={`${index}-${point}`} style={{ height: `${Math.max(4, Math.min(20, point / Math.max(...application.trend) * 20))}px` }} />)}
                              </span>
                            )}
                          </div>
                          <div className="overview-card-metrics">
                            <span><small>Response</small><strong>{responseLabel(application.responseTimeMs)}</strong></span>
                            <span><small>Last checked</small><strong>{application.lastUpdated ? new Date(application.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No data'}</strong></span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="overview-table-scroll">
                <table className="overview-table">
                  <thead><tr><th scope="col">Application</th><th scope="col">Status</th><th scope="col">Response</th><th scope="col">Availability 24h</th><th scope="col">Owner</th><th scope="col">Last checked</th></tr></thead>
                  <tbody>
                    {filteredApplications.map((application) => (
                      <tr key={application.id}>
                        <td><Link to={`/applications/${application.id}`}>{application.name}</Link></td>
                        <td><StatusPill status={application.status}>{readableStatus(application.status)}</StatusPill></td>
                        <td className="numeric-cell">{responseLabel(application.responseTimeMs)}</td>
                        <td className="numeric-cell">{application.availabilityPct == null ? '—' : `${application.availabilityPct.toFixed(2)}%`}</td>
                        <td>Owner team not reported</td>
                        <td>{application.lastUpdated ? new Date(application.lastUpdated).toLocaleString() : 'No data'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="overview-side-column">
            <section className="surface side-card" aria-label="Incidents">
              <CardHeader title="Incidents" description="Issues requiring attention" trailing={<span className="small-count">{data?.incidents.length ?? 0}</span>} />
              {data?.incidents.length ? (
                <div className="incident-list">
                  {data.incidents.map((incident) => (
                    <Link className="incident-item" to={`/applications/${incident.appId}`} key={incident.id}>
                      <span className={`severity-marker${incident.severity ? ` severity-${incident.severity.toLowerCase()}` : ''}`} aria-hidden="true" />
                      <span className="incident-body">
                        <span className="incident-meta"><strong>{incident.severity ?? 'OPEN'}</strong><time dateTime={incident.startedAt}>{new Date(incident.startedAt).toLocaleString()}</time></span>
                        <strong className="incident-title">{incident.title}</strong>
                        <span className="incident-team">Owner team not reported</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : <EmptyState icon="✓">Nothing needs attention right now.</EmptyState>}
              <Link className="side-card-link" to="/#active-incidents">View all incidents <span aria-hidden="true">→</span></Link>
            </section>

            <section className="surface side-card" aria-label="Slowest responses">
              <CardHeader title="Slowest responses" description="Latest health-check response times" />
              {slowestResponses.length ? (
                <ol className="slowest-response-list">
                  {slowestResponses.map((application) => (
                    <li key={application.id}>
                      <Link to={`/applications/${application.id}`}><span>{application.name}</span><strong>{responseLabel(application.responseTimeMs)}</strong></Link>
                      <span className="response-bar"><i style={{ width: `${Math.max(4, (application.responseTimeMs ?? 0) / slowestMaximum * 100)}%` }} /></span>
                    </li>
                  ))}
                </ol>
              ) : <EmptyState>No response-time data reported.</EmptyState>}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
