import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StatusDot } from '../../components/ui/StatusDot';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import type { ApplicationSummary } from '../../types/domain';
import { dateTimeLabel, readableStatus, responseLabel, serviceStatus } from './overviewFormatters';

export function OverviewApplicationTable({ applications }: { applications: ApplicationSummary[] }) {
  const columns = useMemo<TableColumn<ApplicationSummary>[]>(() => [
    {
      id: 'application',
      header: 'Application',
      sortLabel: 'application',
      sortValue: (application) => application.name,
      cell: (application) => (
        <Link
          aria-label={`${application.name}, ${application.domainName}`}
          className="overview-v2-application-name"
          to={`/applications/${application.id}`}
        >
          <strong>{application.name}</strong>
          <small>{application.domainName}</small>
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortLabel: 'status',
      sortValue: (application) => application.status,
      cell: (application) => <StatusDot status={serviceStatus(application.status)} label={readableStatus(application.status)} />,
    },
    {
      id: 'response',
      header: 'Response',
      sortLabel: 'response time',
      sortValue: (application) => application.responseTimeMs,
      align: 'right',
      cell: (application) => responseLabel(application.responseTimeMs),
    },
    {
      id: 'availability',
      header: 'Availability 24h',
      sortLabel: 'availability',
      sortValue: (application) => application.availabilityPct,
      align: 'right',
      cell: (application) => application.availabilityPct == null ? '—' : `${application.availabilityPct.toFixed(2)}%`,
    },
    {
      id: 'owner',
      header: 'Owner',
      sortLabel: 'owner',
      sortValue: (application) => application.owner,
      cell: (application) => application.owner || 'Owner not provided',
    },
    {
      id: 'lastChecked',
      header: 'Last checked',
      sortLabel: 'last checked',
      sortValue: (application) => application.lastUpdated,
      cell: (application) => application.lastUpdated
        ? dateTimeLabel(application.lastUpdated)
        : 'No data',
    },
  ], []);

  return (
    <Table
      caption="Applications by health status, response time, and availability"
      columns={columns}
      rows={applications}
      getRowKey={(application) => application.id}
      initialSort={{ id: 'application', direction: 'asc' }}
      className="overview-v2-table"
      emptyState="No applications found."
    />
  );
}
