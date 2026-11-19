import { useMemo } from 'react';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusDot } from '../../components/ui/StatusDot';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import type { ApiIncidentPeriod, ApplicationDetail } from '../../types/domain';
import type { HistoryBar, HistoryDays } from './applicationDetailSelectors';
import { dateTimeLabel, readableStatus, serviceStatus } from './overviewFormatters';

interface ApplicationDetailOverviewProps {
  application: ApplicationDetail;
  awsInstanceState: string;
  historyDays: HistoryDays;
  historyBars: HistoryBar[];
  isFetching: boolean;
  onHistoryDaysChange: (days: HistoryDays) => void;
}

export function ApplicationDetailOverview({
  application,
  awsInstanceState,
  historyDays,
  historyBars,
  isFetching,
  onHistoryDaysChange,
}: ApplicationDetailOverviewProps) {
  const errorReports = useMemo(
    () => application.history
      .filter((period) => period.status === 'DOWN')
      .sort((left, right) => new Date(right.startAt).getTime() - new Date(left.startAt).getTime()),
    [application.history],
  );
  const openIncidents = application.history.filter((period) => period.status === 'DOWN' && period.endAt === null);
  const healthyBars = historyBars.filter((bar) => bar.status === 'healthy').length;
  const downBars = historyBars.filter((bar) => bar.status === 'down').length;
  const unknownBars = historyBars.length - healthyBars - downBars;
  const columns = useMemo<TableColumn<ApiIncidentPeriod>[]>(() => [
    {
      id: 'started',
      header: 'Started',
      sortLabel: 'start time',
      sortValue: (period) => period.startAt,
      cell: (period) => dateTimeLabel(period.startAt),
    },
    {
      id: 'ended',
      header: 'Ended',
      sortLabel: 'end time',
      sortValue: (period) => period.endAt,
      cell: (period) => period.endAt ? dateTimeLabel(period.endAt) : 'Ongoing',
    },
    {
      id: 'details',
      header: 'Details',
      cell: (period) => period.errorMessage ?? 'Health check failed',
    },
  ], []);
  const summaryStatus = serviceStatus(application.status);

  return (
    <div className="detail-v2-overview">
      <section className="detail-v2-summary-strip" aria-label="Application health summary">
        <div>
          <span>Application status</span>
          <StatusDot status={summaryStatus} label={application.status === 'unknown' ? 'Not checked' : readableStatus(application.status)} />
          <small>Latest health check</small>
        </div>
        <div>
          <span>Response time</span>
          <strong>{application.responseTimeMs == null ? '—' : `${application.responseTimeMs.toLocaleString()} ms`}</strong>
          <small>Latest API health check</small>
        </div>
        <div>
          <span>HTTP status</span>
          <strong>{application.statusCode ?? '—'}</strong>
          <small>Recorded response code</small>
        </div>
        <div>
          <span>Open incidents</span>
          <strong>{openIncidents.length}</strong>
          <small>Live API incident history</small>
        </div>
        <div>
          <span>AWS instance</span>
          <Badge variant={awsInstanceState === 'Unavailable' ? 'danger' : 'neutral'}>{awsInstanceState}</Badge>
          <small>{application.awsInstanceId ?? 'No EC2 instance configured'}</small>
        </div>
      </section>

      <section className="surface detail-v2-history" aria-labelledby="status-history-heading">
        <header className="detail-v2-section-heading">
          <div>
            <h2 id="status-history-heading">Status history</h2>
            <p>{historyDays === 1 ? 'Hourly' : 'Daily'} health-check status for the last {historyDays} {historyDays === 1 ? 'day' : 'days'}</p>
            <span className="detail-v2-history-summary">
              {healthyBars} healthy {historyDays === 1 ? 'hours' : 'days'} · {downBars} disrupted · {unknownBars} no data
            </span>
          </div>
          <div className="detail-v2-range-tabs" role="group" aria-label="History time range">
            {([
              { days: 1, label: 'Last 1 day' },
              { days: 7, label: 'Last 7 days' },
              { days: 30, label: 'Last 30 days' },
            ] as const).map(({ days, label }) => (
              <button
                key={days}
                type="button"
                aria-pressed={historyDays === days}
                onClick={() => onHistoryDaysChange(days)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        {isFetching && <span className="visually-hidden" role="status">Fetching {historyDays}-day application history</span>}
        <div className="detail-v2-history-content">
          <div
            className="detail-v2-history-bars"
            role="list"
            aria-label={historyDays === 1 ? 'Hourly application status for the last 24 hours' : `Daily application status for the last ${historyDays} days`}
            style={{ gridTemplateColumns: `repeat(${historyBars.length}, minmax(0, 1fr))` }}
          >
            {historyBars.map((bar) => {
              const start = new Date(bar.date);
              const end = new Date(start.getTime() + (historyDays === 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
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
                  className={`detail-v2-history-bar is-${bar.status}`}
                  role="listitem"
                  aria-label={`${label}: ${description}`}
                  title={`${label}: ${description}`}
                />
              );
            })}
          </div>
          <div className="detail-v2-history-range">
            <span>{historyDays === 1 ? '24 hours ago' : `${historyDays} days ago`}</span>
            <span>Now</span>
          </div>
          <div className="detail-v2-history-legend" aria-label="Status legend">
            <span><i className="is-healthy" />Healthy</span>
            <span><i className="is-down" />Disrupted</span>
            <span><i className="is-unknown" />No data</span>
          </div>
        </div>
      </section>

      <section className="surface detail-v2-errors" aria-labelledby="error-reports-heading">
        <header className="detail-v2-section-heading">
          <div>
            <h2 id="error-reports-heading">Error reports</h2>
            <p>Recorded health-check failures in the last {historyDays} {historyDays === 1 ? 'day' : 'days'}</p>
          </div>
          <Badge variant={errorReports.length ? 'danger' : 'neutral'}>{errorReports.length}</Badge>
        </header>
        {errorReports.length > 0 ? (
          <Table
            caption="Recorded health-check failures"
            columns={columns}
            rows={errorReports}
            getRowKey={(period) => period.id}
            initialSort={{ id: 'started', direction: 'desc' }}
            className="detail-v2-error-table"
            emptyState="No error reports."
          />
        ) : (
          <EmptyState
            title="No error reports"
            description={`No DOWN periods were recorded in the last ${historyDays} ${historyDays === 1 ? 'day' : 'days'}.`}
            className="detail-v2-empty"
          />
        )}
      </section>
    </div>
  );
}
