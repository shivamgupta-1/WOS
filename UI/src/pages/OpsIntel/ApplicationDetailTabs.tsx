import { useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import { getErrorMessage, useGetAwsInstanceMetricsQuery } from '../../api/opsApi';
import type { ApiIncidentPeriod, ApplicationDetail } from '../../types/domain';
import { dateTimeLabel } from './overviewFormatters';
import { applicationDetailTabs } from './applicationDetailTabTypes';
import type { ApplicationDetailTab } from './applicationDetailTabTypes';

interface ApplicationDetailTabsProps {
  application: ApplicationDetail;
  activeTab: ApplicationDetailTab;
  awsMetrics: ReturnType<typeof useGetAwsInstanceMetricsQuery>;
  onActiveTabChange: (tab: ApplicationDetailTab) => void;
}

export function ApplicationDetailTabs({
  application,
  activeTab,
  awsMetrics,
  onActiveTabChange,
}: ApplicationDetailTabsProps) {
  const alertColumns = useMemo<TableColumn<ApiIncidentPeriod>[]>(() => [
    { id: 'status', header: 'Status', cell: () => <Badge variant="danger">Disrupted</Badge> },
    { id: 'started', header: 'Started', sortLabel: 'start time', sortValue: (period) => period.startAt, cell: (period) => dateTimeLabel(period.startAt) },
    { id: 'ended', header: 'Ended', sortLabel: 'end time', sortValue: (period) => period.endAt, cell: (period) => period.endAt ? dateTimeLabel(period.endAt) : 'Ongoing' },
    { id: 'details', header: 'Details', cell: (period) => period.errorMessage ?? 'Health check failed' },
  ], []);
  const incidents = useMemo(
    () => application.history.filter((period) => period.status === 'DOWN'),
    [application.history],
  );

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = applicationDetailTabs.indexOf(activeTab);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? applicationDetailTabs.length - 1
        : event.key === 'ArrowRight'
          ? (currentIndex + 1) % applicationDetailTabs.length
          : event.key === 'ArrowLeft'
            ? (currentIndex - 1 + applicationDetailTabs.length) % applicationDetailTabs.length
            : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const nextTab = applicationDetailTabs[nextIndex];
    if (!nextTab) return;
    onActiveTabChange(nextTab);
    document.getElementById(`detail-tab-${nextTab.replaceAll(' ', '-')}`)?.focus();
  }

  return (
    <>
      <div className="detail-v2-tabs" role="tablist" aria-label="Application detail views" onKeyDown={handleTabKeyDown}>
        {applicationDetailTabs.map((tab) => (
          <button
            key={tab}
            id={`detail-tab-${tab.replaceAll(' ', '-')}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="detail-tab-panel"
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => onActiveTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <section
        id="detail-tab-panel"
        className="detail-v2-tab-panel"
        role="tabpanel"
        aria-labelledby={`detail-tab-${activeTab.replaceAll(' ', '-')}`}
      >
        {activeTab === 'Metrics' ? (
          <>
            <header className="detail-v2-panel-heading">
              <div>
                <h2>Service metrics</h2>
                <p>Latest available CloudWatch values · refreshed every minute</p>
              </div>
              <Badge variant="info">Live AWS data</Badge>
            </header>
            {!application.awsInstanceId ? (
              <EmptyState
                title="AWS instance not configured"
                description="Add an EC2 instance ID in Edit application to display live CloudWatch metrics."
              />
            ) : awsMetrics.isLoading ? (
              <div className="detail-v2-metric-loading" role="status" aria-label="Loading AWS metrics">
                {Array.from({ length: 5 }, (_, index) => <Skeleton variant="block" key={index} />)}
              </div>
            ) : awsMetrics.isError ? (
              <ErrorState
                title="AWS metrics unavailable"
                description={getErrorMessage(awsMetrics.error)}
                retryLabel="Retry"
                onRetry={() => void awsMetrics.refetch()}
              />
            ) : awsMetrics.data ? (
              <div className="detail-v2-metrics-layout">
                <div>
                  <p className="detail-v2-aws-context">
                    EC2 {awsMetrics.data.application.instanceId} · {awsMetrics.data.application.name ?? application.name} · {awsMetrics.data.application.region} · {awsMetrics.data.application.state}
                  </p>
                  <div className="detail-v2-metric-grid">
                    {([
                      { label: 'CPU utilization', value: awsMetrics.data.metrics.cpu, unit: '%' },
                      { label: 'Memory used', value: awsMetrics.data.metrics.memory, unit: '%' },
                      { label: 'Disk used', value: awsMetrics.data.metrics.disk, unit: '%' },
                      { label: 'Network in', value: awsMetrics.data.metrics.networkIn, unit: 'bytes' },
                      { label: 'Network out', value: awsMetrics.data.metrics.networkOut, unit: 'bytes' },
                    ]).map(({ label, value, unit }) => (
                      <article className="detail-v2-metric" key={label}>
                        <h3>{label}</h3>
                        <strong>{value == null ? 'No data' : value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                        {value != null && <span>{unit}</span>}
                      </article>
                    ))}
                  </div>
                  <p className="detail-v2-metric-note">These are the latest values returned by CloudWatch, not historical charts. “No data” means no recent value was returned for that metric.</p>
                </div>
                <aside className="detail-v2-instance" aria-label="AWS instance information">
                  <header><h3>EC2 instance</h3><p>Live AWS resource details</p></header>
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
              <EmptyState
                title="No AWS metrics available"
                description="No recent CloudWatch values were returned for this instance."
              />
            )}
          </>
        ) : activeTab === 'Alerts' ? (
          <section className="detail-v2-data-section">
            <header className="detail-v2-panel-heading">
              <div><h2>Recorded health-check incidents</h2><p>DOWN periods returned by the monitoring API</p></div>
              <Badge variant={incidents.length ? 'danger' : 'neutral'}>{incidents.length}</Badge>
            </header>
            {incidents.length > 0 ? (
              <Table
                caption="Recorded application incidents"
                columns={alertColumns}
                rows={incidents}
                getRowKey={(period) => period.id}
                initialSort={{ id: 'started', direction: 'desc' }}
                className="detail-v2-data-table"
              />
            ) : (
              <EmptyState title="No incidents recorded" description="No DOWN periods exist in the live API incident history." />
            )}
          </section>
        ) : activeTab === 'Configuration' ? (
          <section className="detail-v2-data-section">
            <header className="detail-v2-panel-heading">
              <div><h2>Configuration</h2><p>Live application settings from the API</p></div>
            </header>
            <dl className="detail-v2-configuration">
              <div><dt>Application ID</dt><dd className="font-mono">{application.id}</dd></div>
              <div><dt>AWS EC2 instance ID</dt><dd>{application.awsInstanceId ?? 'Not configured'}</dd></div>
              <div><dt>Health-check URL</dt><dd><a href={application.url} target="_blank" rel="noreferrer">{application.url}</a></dd></div>
              <div><dt>Owner email</dt><dd><a href={`mailto:${application.email}`}>{application.email}</a></dd></div>
              <div><dt>Domain</dt><dd>{application.domainName}</dd></div>
              <div><dt>Workflow link</dt><dd><a href={application.teamslink} target="_blank" rel="noreferrer">Open workflow link</a></dd></div>
              <div><dt>Description</dt><dd>{application.description || 'No description provided.'}</dd></div>
              <div><dt>Last health check</dt><dd>{application.lastUpdated ? dateTimeLabel(application.lastUpdated) : 'No check recorded'}</dd></div>
            </dl>
          </section>
        ) : (
          <EmptyState
            title={activeTab === 'Dependencies' ? 'Dependency data is not connected' : activeTab === 'Deployments' ? 'Deployment data is not connected' : 'Logs and traces are not available'}
            description={activeTab === 'Logs and traces'
              ? 'The current API does not provide logs or traces.'
              : 'This view will show live data when a provider is connected.'}
            className="detail-v2-empty-panel"
          />
        )}
      </section>
    </>
  );
}
