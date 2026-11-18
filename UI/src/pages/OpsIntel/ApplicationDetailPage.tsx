import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getErrorMessage,
  useDeleteApplicationMutation,
  useGetAwsInstanceMetricsQuery,
  useGetApplicationQuery,
  useGetDomainsQuery,
  useUpdateApplicationMutation,
} from '../../api/opsApi';
import type { UpdateApplicationRequest } from '../../types/domain';
import Dropdown from '../../components/Dropdown/Dropdown';
import { getHistoryBars } from './applicationDetailSelectors';
import type { HistoryDays } from './applicationDetailSelectors';

type EditableApplication = Omit<UpdateApplicationRequest, 'id'>;

const tabs = ['Metrics', 'Dependencies', 'Logs and traces', 'Alerts', 'Deployments', 'Configuration'];
const dayInMilliseconds = 24 * 60 * 60 * 1000;

export default function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [historyDays, setHistoryDays] = useState<HistoryDays>(30);
  const { currentData: application, isLoading, isFetching, isError, refetch } = useGetApplicationQuery({
    id,
    days: historyDays,
  }, {
    pollingInterval: 30_000,
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const awsMetrics = useGetAwsInstanceMetricsQuery(application?.awsInstanceId ?? '', {
    pollingInterval: 60_000,
    skip: !application?.awsInstanceId,
    refetchOnMountOrArgChange: true,
  });
  const { data: domains = [] } = useGetDomainsQuery();
  const [updateApplication, { isLoading: isSaving }] = useUpdateApplicationMutation();
  const [deleteApplication, { isLoading: isDeleting }] = useDeleteApplicationMutation();
  const [editValues, setEditValues] = useState<EditableApplication | null>(null);
  const [message, setMessage] = useState('');
  const activeTab = tabs.find((tab) => tab.toLowerCase().replaceAll(' ', '-') === searchParams.get('tab')) ?? 'Metrics';

  function setActiveTab(tab: string) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (tab === 'Metrics') nextSearchParams.delete('tab');
    else nextSearchParams.set('tab', tab.toLowerCase().replaceAll(' ', '-'));
    setSearchParams(nextSearchParams);
  }

  function startEditing() {
    if (!application) return;
    setEditValues({
      name: application.name,
      url: application.url,
      teamslink: application.teamslink,
      email: application.email,
      description: application.description,
      domainId: application.domainId,
      failureThreshold: application.failureThreshold,
      awsInstanceId: application.awsInstanceId,
    });
    setMessage('');
  }

  function updateField<K extends keyof EditableApplication>(field: K, value: EditableApplication[K]) {
    setEditValues((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editValues || !application) return;
    setMessage('');
    try {
      await updateApplication({ id: application.id, ...editValues }).unwrap();
      setEditValues(null);
      await refetch();
      setMessage('Application updated.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function removeApplication() {
    if (!application || !window.confirm(`Delete ${application.name}? This cannot be undone.`)) return;
    setMessage('');
    try {
      await deleteApplication(application.id).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(activeTab);
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextTab = tabs[(currentIndex + offset + tabs.length) % tabs.length];
    if (!nextTab) return;
    setActiveTab(nextTab);
    document.getElementById(`detail-tab-${nextTab.replaceAll(' ', '-')}`)?.focus();
  }

  if (isLoading) return <div className="loading-state" role="status">Loading application details...</div>;
  if (isError || !application) {
    return (
      <section className="error-state" role="alert">
        <strong>Application details unavailable.</strong>
        <span>The application may have been removed or the connection is unavailable.</span>
        <button className="button button-secondary" type="button" onClick={() => void refetch()}>Retry</button>
        <Link className="button button-secondary" to="/">Back to dashboard</Link>
      </section>
    );
  }

  const statusLabel = application.status === 'unknown'
    ? 'Not checked'
    : application.status.charAt(0).toUpperCase() + application.status.slice(1);
  const openIncidents = application.history.filter((period) => period.status === 'DOWN' && period.endAt === null);
  const errorReports = application.history
    .filter((period) => period.status === 'DOWN')
    .sort((left, right) => new Date(right.startAt).getTime() - new Date(left.startAt).getTime());
  const awsInstanceState = awsMetrics.data?.application.state
    ?? (application.awsInstanceId ? awsMetrics.isError ? 'Unavailable' : awsMetrics.isLoading ? 'Loading' : 'No data' : 'Not configured');
  const historyBars = getHistoryBars(application.history, new Date(), historyDays);
  const healthyBars = historyBars.filter((bar) => bar.status === 'healthy').length;
  const downBars = historyBars.filter((bar) => bar.status === 'down').length;
  const unknownBars = historyBars.length - healthyBars - downBars;

  return (
    <div className="detail-page">
      <div className="breadcrumbs"><Link className="detail-back-link" to="/" aria-label="Back to dashboard" title="Back to dashboard">←</Link><span aria-hidden="true">/</span><span>{application.name}</span></div>
      <section className="detail-heading">
        <div className="detail-title-wrap">
          <div className="detail-title-line"><span className={`large-status-dot ${application.status}`} /><h1>{application.name}</h1><span className={`status-label status-${application.status}`}>{statusLabel}</span></div>
          <p>{application.description || 'No description provided.'} <span>·</span> {application.domainName}</p>
          <div className="detail-deploy-meta"><span>Health-check URL <strong>{application.url}</strong></span><span>Owner <strong>{application.email}</strong></span></div>
        </div>
        <div className="detail-actions">
          <button className="button button-secondary" type="button" onClick={startEditing}>Edit application</button>
          <button className="button button-danger" type="button" disabled={isDeleting} onClick={() => void removeApplication()}>{isDeleting ? 'Deleting...' : 'Delete application'}</button>
        </div>
      </section>

      {message && <div className="action-feedback" role="status"><span>{message}</span><button type="button" className="icon-button" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}

      {editValues && (
        <section className="surface application-edit-surface" aria-labelledby="edit-application-heading">
          <div className="surface-heading"><div><h2 id="edit-application-heading">Edit application</h2><p>Changes are saved to the monitoring API.</p></div></div>
          <form className="form-grid" onSubmit={(event) => void saveApplication(event)}>
            <label className="form-field" htmlFor="edit-app-name">Name<input id="edit-app-name" required value={editValues.name} onChange={(event) => updateField('name', event.target.value)} /></label>
            <label className="form-field" htmlFor="edit-app-url">Health-check URL<input id="edit-app-url" type="url" required value={editValues.url} onChange={(event) => updateField('url', event.target.value)} /></label>
            <label className="form-field"><span className="form-field-label">Domain</span><Dropdown ariaLabel="Domain" value={editValues.domainId} onChange={(value) => updateField('domainId', value)} options={domains.map((domain) => ({ value: domain.id, label: domain.domainName }))} /></label>
            <label className="form-field" htmlFor="edit-app-email">Owner email<input id="edit-app-email" type="email" required value={editValues.email} onChange={(event) => updateField('email', event.target.value)} /></label>
            <label className="form-field" htmlFor="edit-app-failure-threshold">Failed probes before DOWN<input id="edit-app-failure-threshold" type="number" min={1} max={10} required value={editValues.failureThreshold} onChange={(event) => updateField('failureThreshold', Number(event.target.value))} /><small>Current setting: {application.failureThreshold} consecutive failures; default is 2.</small></label>
            <label className="form-field" htmlFor="edit-app-aws-instance-id">AWS EC2 instance ID<input id="edit-app-aws-instance-id" value={editValues.awsInstanceId ?? ''} placeholder="i-0123456789abcdef0" pattern="i-[a-fA-F0-9]{8,17}" title="Enter a valid EC2 instance ID." onChange={(event) => updateField('awsInstanceId', event.target.value || null)} /><small>Used to load live AWS metrics; leave blank to disable AWS metrics.</small></label>
            <label className="form-field full-width" htmlFor="edit-app-description">Description<textarea id="edit-app-description" rows={3} value={editValues.description} onChange={(event) => updateField('description', event.target.value)} /></label>
            <label className="form-field full-width" htmlFor="edit-app-teams">Workflow link<input id="edit-app-teams" type="url" required value={editValues.teamslink} onChange={(event) => updateField('teamslink', event.target.value)} /></label>
            <div className="wizard-actions full-width"><button className="button button-secondary" type="button" onClick={() => setEditValues(null)}>Cancel</button><button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button></div>
          </form>
        </section>
      )}

      <section className="detail-summary-grid" aria-label="Application health summary">
        <article className="summary-card"><span>Application status</span><strong className={`summary-status-${application.status}`}>{statusLabel}</strong><span className="summary-caption">Latest HTTP health check</span></article>
        <article className="summary-card"><span>Response time</span><strong>{application.responseTimeMs == null ? '—' : application.responseTimeMs}<small>{application.responseTimeMs == null ? '' : 'ms'}</small></strong><span className="summary-caption">Latest API health check</span></article>
        <article className="summary-card"><span>Latest HTTP status</span><strong>{application.statusCode ?? '—'}</strong><span className="summary-caption">Recorded response code</span></article>
        <article className="summary-card"><span>Open incidents</span><strong>{openIncidents.length}</strong><span className="summary-caption">Live API incident history</span></article>
        <article className="summary-card"><span>AWS instance</span><strong>{awsInstanceState}</strong><span className="summary-caption">{application.awsInstanceId ?? 'No EC2 instance configured'}</span></article>
      </section>

      <section className="surface status-history-surface" aria-labelledby="status-history-heading">
        <div className="surface-heading">
          <div>
            <h2 id="status-history-heading">Status history</h2>
            <p>{historyDays === 1 ? 'Hourly' : 'Daily'} health-check status for the last {historyDays} {historyDays === 1 ? 'day' : 'days'}</p>
            <span className="status-history-summary">{healthyBars} healthy {historyDays === 1 ? 'hours' : 'days'} · {downBars} disrupted · {unknownBars} no data</span>
          </div>
          <div className="history-range-tabs" role="group" aria-label="History time range">
            {([
              { days: 1, label: 'Last 1 day' },
              { days: 7, label: 'Last 7 days' },
              { days: 30, label: 'Last 30 days' },
            ] as const).map(({ days, label }) => (
              <button
                key={days}
                type="button"
                aria-pressed={historyDays === days}
                onClick={() => setHistoryDays(days)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {isFetching && <span className="visually-hidden" role="status">Fetching {historyDays}-day application history</span>}
        <div className="status-history-content">
          <div className="status-history-days" role="list" aria-label={historyDays === 1 ? 'Hourly application status for the last 24 hours' : `Daily application status for the last ${historyDays} days`} style={{ gridTemplateColumns: `repeat(${historyBars.length}, minmax(0, 1fr))` }}>
            {historyBars.map((bar) => {
              const start = new Date(bar.date);
              const end = new Date(start.getTime() + (historyDays === 1 ? dayInMilliseconds / 24 : dayInMilliseconds));
              const label = historyDays === 1
                ? `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}–${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const description = bar.status === 'healthy'
                ? 'Healthy throughout monitored time'
                : bar.status === 'down'
                  ? 'Service was unavailable'
                  : 'No complete health data';
              return (
                <span
                  key={bar.date}
                  className={`status-history-day status-history-${bar.status}`}
                  role="listitem"
                  aria-label={`${label}: ${description}`}
                  title={`${label}: ${description}`}
                />
              );
            })}
          </div>
          <div className="status-history-range"><span>{historyDays === 1 ? '24 hours ago' : `${historyDays} days ago`}</span><span>Now</span></div>
          <div className="status-history-legend" aria-label="Status legend">
            <span><i className="status-history-key status-history-healthy" />Healthy</span>
            <span><i className="status-history-key status-history-down" />Disrupted</span>
            <span><i className="status-history-key status-history-unknown" />No data</span>
          </div>
        </div>
      </section>

      <section className="surface detail-table-surface error-reports-surface" aria-labelledby="error-reports-heading">
        <div className="surface-heading">
          <div><h2 id="error-reports-heading">Error reports</h2><p>Recorded health-check failures in the last {historyDays} {historyDays === 1 ? 'day' : 'days'}</p></div>
          <span className="small-count">{errorReports.length}</span>
        </div>
        {errorReports.length > 0 ? (
          <div className="error-report-list">
            {errorReports.map((report) => (
              <article className="error-report" key={report.id}>
                <span className="error-report-marker" aria-hidden="true" />
                <div className="error-report-content">
                  <strong>{report.errorMessage || 'Health check failed; no error details were recorded.'}</strong>
                  <div className="error-report-times">
                    <span>Started <time dateTime={report.startAt}>{new Date(report.startAt).toLocaleString()}</time></span>
                    <span>{report.endAt ? 'Resolved' : 'Status'} <time dateTime={report.endAt ?? undefined}>{report.endAt ? new Date(report.endAt).toLocaleString() : 'Ongoing'}</time></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><strong>No error reports</strong><span>No DOWN periods were recorded for this application in the last {historyDays} {historyDays === 1 ? 'day' : 'days'}.</span></div>
        )}
      </section>

      <div className="detail-tabs" role="tablist" aria-label="Application detail views" onKeyDown={handleTabKeyDown}>
        {tabs.map((tab) => <button key={tab} id={`detail-tab-${tab.replaceAll(' ', '-')}`} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="detail-tab-panel" tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>
      <section id="detail-tab-panel" className="detail-tab-panel" role="tabpanel" aria-labelledby={`detail-tab-${activeTab.replaceAll(' ', '-')}`}>
        {activeTab === 'Metrics' ? (
          <>
            <div className="section-heading"><div><h2>Service metrics</h2><p>Latest available CloudWatch values · refreshed every minute</p></div><span className="live-range">LIVE AWS DATA</span></div>
            {!application.awsInstanceId ? (
              <div className="empty-state"><strong>AWS instance not configured</strong><span>Add an EC2 instance ID in Edit application to display live CloudWatch metrics.</span></div>
            ) : awsMetrics.isLoading ? (
              <div className="loading-state" role="status">Loading AWS metrics...</div>
            ) : awsMetrics.isError ? (
              <div className="error-state" role="alert"><strong>AWS metrics unavailable.</strong><span>{getErrorMessage(awsMetrics.error)}</span><button className="button button-secondary" type="button" onClick={() => void awsMetrics.refetch()}>Retry</button></div>
            ) : awsMetrics.data ? (
              <div className="detail-metrics-layout">
                <div className="detail-metrics-main">
                  <div className="aws-metric-context">EC2 {awsMetrics.data.application.instanceId} · {awsMetrics.data.application.name ?? application.name} · {awsMetrics.data.application.region} · {awsMetrics.data.application.state}</div>
                  <div className="metric-grid">
                    {([
                      { label: 'CPU utilization', value: awsMetrics.data.metrics.cpu, unit: '%' },
                      { label: 'Memory used', value: awsMetrics.data.metrics.memory, unit: '%' },
                      { label: 'Disk used', value: awsMetrics.data.metrics.disk, unit: '%' },
                      { label: 'Network in', value: awsMetrics.data.metrics.networkIn, unit: 'bytes' },
                      { label: 'Network out', value: awsMetrics.data.metrics.networkOut, unit: 'bytes' },
                    ]).map(({ label, value, unit }) => (
                      <article className="metric-card aws-metric-card" key={label}>
                        <h3>{label}</h3>
                        <div className="metric-current">
                          <strong>{value == null ? 'No data' : value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                          {value != null && <span>{unit}</span>}
                        </div>
                      </article>
                    ))}
                  </div>
                  <p className="aws-metric-note">These are the latest values returned by CloudWatch, not historical charts. “No data” means no recent value was returned for that metric.</p>
                </div>
                <aside className="surface aws-instance-panel" aria-label="AWS instance information">
                  <div className="surface-heading"><div><h2>EC2 instance</h2><p>Live AWS resource details</p></div></div>
                  <dl>
                    <div><dt>Instance ID</dt><dd>{awsMetrics.data.application.instanceId}</dd></div>
                    <div><dt>State</dt><dd>{awsMetrics.data.application.state}</dd></div>
                    <div><dt>Type</dt><dd>{awsMetrics.data.application.instanceType ?? 'Not reported'}</dd></div>
                    <div><dt>Region</dt><dd>{awsMetrics.data.application.region}</dd></div>
                  </dl>
                  <p>Memory and disk values require the CloudWatch Agent on the EC2 instance.</p>
                </aside>
              </div>
            ) : (
              <div className="empty-state"><strong>No AWS metrics available</strong><span>No recent CloudWatch values were returned for this instance.</span></div>
            )}
          </>
        ) : activeTab === 'Dependencies' ? (
          <section className="surface detail-table-surface"><div className="surface-heading"><div><h2>Illustrative dependency sample</h2><p>Example only — not connected to live dependency monitoring</p></div></div><div className="dependency-table" role="table" aria-label="Illustrative dependency sample"><div className="dependency-row dependency-header" role="row"><span role="columnheader">Dependency</span><span role="columnheader">Type</span><span role="columnheader">Status</span><span role="columnheader">Latency</span></div><div className="dependency-row" role="row"><strong role="cell">Primary PostgreSQL</strong><span role="cell">Database</span><span role="cell">Example</span><span role="cell">—</span></div><div className="dependency-row" role="row"><strong role="cell">Identity provider</strong><span role="cell">HTTP service</span><span role="cell">Example</span><span role="cell">—</span></div><div className="dependency-row" role="row"><strong role="cell">Event stream</strong><span role="cell">Kafka</span><span role="cell">Example</span><span role="cell">—</span></div></div></section>
        ) : activeTab === 'Alerts' ? (
          <section className="surface detail-table-surface"><div className="surface-heading"><div><h2>Recorded health-check incidents</h2><p>DOWN periods returned by the monitoring API</p></div></div>{application.history.filter((period) => period.status === 'DOWN').length ? <div className="dependency-table" role="table" aria-label="Recorded application incidents"><div className="dependency-row dependency-header" role="row"><span role="columnheader">Status</span><span role="columnheader">Started</span><span role="columnheader">Ended</span><span role="columnheader">Details</span></div>{application.history.filter((period) => period.status === 'DOWN').map((period) => <div className="dependency-row health-history-row" role="row" key={period.id}><strong role="cell">{period.status}</strong><time role="cell" dateTime={period.startAt}>{new Date(period.startAt).toLocaleString()}</time><span role="cell">{period.endAt ? new Date(period.endAt).toLocaleString() : 'Ongoing'}</span><span role="cell">{period.errorMessage ?? 'Health check failed'}</span></div>)}</div> : <div className="empty-state"><strong>No incidents recorded</strong><span>No DOWN periods exist in the live API incident history.</span></div>}</section>
        ) : activeTab === 'Deployments' ? (
          <section className="surface detail-table-surface"><div className="surface-heading"><div><h2>Illustrative deployment sample</h2><p>Example only — deployment data is not connected</p></div></div><div className="dependency-table" role="table" aria-label="Illustrative deployment sample"><div className="dependency-row dependency-header" role="row"><span role="columnheader">Version</span><span role="columnheader">Environment</span><span role="columnheader">Status</span><span role="columnheader">Deployed</span></div><div className="dependency-row" role="row"><strong role="cell">Example v3.4.2</strong><span role="cell">Production</span><span role="cell">Example</span><span role="cell">—</span></div><div className="dependency-row" role="row"><strong role="cell">Example v3.4.1</strong><span role="cell">Production</span><span role="cell">Example</span><span role="cell">—</span></div><div className="dependency-row" role="row"><strong role="cell">Example v3.4.0</strong><span role="cell">Staging</span><span role="cell">Example</span><span role="cell">—</span></div></div></section>
        ) : activeTab === 'Configuration' ? (
          <section className="surface detail-table-surface"><div className="surface-heading"><div><h2>Configuration</h2><p>Live application settings from the API</p></div></div><dl className="application-links"><div><dt>Application ID</dt><dd>{application.id}</dd></div><div><dt>AWS EC2 instance ID</dt><dd>{application.awsInstanceId ?? 'Not configured'}</dd></div><div><dt>Health-check URL</dt><dd><a href={application.url} target="_blank" rel="noreferrer">{application.url}</a></dd></div><div><dt>Owner email</dt><dd><a href={`mailto:${application.email}`}>{application.email}</a></dd></div><div><dt>Domain</dt><dd>{application.domainName}</dd></div><div><dt>Workflow link</dt><dd><a href={application.teamslink} target="_blank" rel="noreferrer">Open workflow link</a></dd></div><div><dt>Description</dt><dd>{application.description || 'No description provided.'}</dd></div><div><dt>Last health check</dt><dd>{application.lastUpdated ? new Date(application.lastUpdated).toLocaleString() : 'No check recorded'}</dd></div></dl></section>
        ) : (
          <div className="empty-state tab-empty"><span className="empty-mark" aria-hidden="true">◷</span><strong>{activeTab} are not available</strong><span>Logs and traces are not provided by the current API. Connect a telemetry provider to display live data here.</span></div>
        )}
      </section>
    </div>
  );
}
