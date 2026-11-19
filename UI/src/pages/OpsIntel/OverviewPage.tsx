import { Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useGetDomainsQuery, useGetOverviewQuery } from '../../api/opsApi';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { OverviewApplications } from './OverviewApplications';
import { OverviewAside } from './OverviewAside';
import type { ShellContext } from './OperationsShell';
import { filterApplications, groupApplications } from './overviewSelectors';
import type { OverviewGroupBy, OverviewStatusFilter } from './overviewSelectors';
import { dateTimeLabel } from './overviewFormatters';
import './OverviewPage.css';

export default function OverviewPage() {
  const { applicationsView, setApplicationsView, gridFullscreen } = useOutletContext<ShellContext>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('All domains');
  const [statusFilter, setStatusFilter] = useState<OverviewStatusFilter>('all');
  const [groupBy, setGroupBy] = useState<OverviewGroupBy>('domain');
  const { data: domains = [] } = useGetDomainsQuery();
  const { data, isLoading, isFetching, isError, refetch } = useGetOverviewQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filteredApplications = useMemo(
    () => filterApplications(data?.applications ?? [], { search, domain, status: statusFilter }),
    [data?.applications, domain, search, statusFilter],
  );
  const groups = useMemo(
    () => groupApplications(filteredApplications, gridFullscreen ? 'domain' : groupBy),
    [filteredApplications, gridFullscreen, groupBy],
  );
  const kpis = data?.kpis;
  const unavailable = isLoading || (isError && !data);
  const kpiItems = [
    { label: 'Applications monitored', value: unavailable ? '—' : kpis?.total ?? 0, caption: 'Registered with the health API', tone: 'neutral' },
    { label: 'Healthy', value: unavailable ? '—' : kpis?.healthy ?? 0, caption: 'Operating normally', tone: 'healthy' },
    { label: 'Degraded', value: unavailable ? '—' : kpis?.degraded ?? '—', caption: kpis?.degraded == null ? 'Not reported by the health API' : 'Needs attention', tone: 'degraded' },
    { label: 'Down', value: unavailable ? '—' : kpis?.down ?? 0, caption: 'Service disruption', tone: 'down' },
    { label: 'SLO attainment', value: unavailable || kpis?.sloAttainmentPct == null ? '—' : `${kpis.sloAttainmentPct.toFixed(2)}%`, caption: kpis?.sloAttainmentPct == null ? 'Not reported by the health API' : 'Current reporting period', tone: 'neutral' },
    { label: 'Open incidents', value: unavailable ? '—' : kpis?.openIncidents ?? 0, caption: 'Across monitored applications', tone: 'neutral' },
  ];

  return (
    <div className={`overview-v2${gridFullscreen ? ' is-fullscreen' : ''}`}>
      <PageHeader
        title={gridFullscreen ? 'Applications' : 'Health overview'}
        description={gridFullscreen
          ? 'All monitored applications and their current health.'
          : 'Current health and reliability across monitored applications.'}
        className="overview-v2-page-header"
        actions={(
          <div className="overview-v2-page-actions">
            <span className="overview-v2-updated">
              <Clock3 aria-hidden="true" className="size-4" />
              {data?.lastUpdated ? `Updated ${dateTimeLabel(data.lastUpdated)}` : 'Waiting for first health check'}
            </span>
            <Button loading={isFetching} onClick={() => void refetch()}>
              {isFetching ? 'Checking…' : 'Check now'}
            </Button>
          </div>
        )}
      />

      <section className="overview-v2-kpis" aria-label="Portfolio key performance indicators">
        {kpiItems.map((item) => (
          <article className={`overview-v2-kpi tone-${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            {isLoading ? <Skeleton size="lg" className="overview-v2-kpi-skeleton" /> : <strong>{item.value}</strong>}
            <small>{item.caption}</small>
          </article>
        ))}
      </section>

      {isError && data && (
        <ErrorState
          title="Refresh failed"
          description="Showing the last successful data. Try again to update this view."
          retryLabel="Retry"
          onRetry={() => void refetch()}
          className="overview-v2-stale-state"
        />
      )}

      {isError && !data ? (
        <ErrorState
          title="Health data could not be loaded"
          description="Check the connection and try again."
          retryLabel="Retry"
          onRetry={() => void refetch()}
          className="overview-v2-error-state"
        />
      ) : (
        <div className="overview-v2-layout">
          <OverviewApplications
            applications={filteredApplications}
            totalApplications={data?.applications.length ?? 0}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            domains={domains.map((item) => item.domainName)}
            domain={domain}
            onDomainChange={setDomain}
            groups={groups}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            view={applicationsView}
            onViewChange={setApplicationsView}
            loading={isLoading}
            fullscreen={gridFullscreen}
          />
          <OverviewAside
            applications={filteredApplications}
            incidents={data?.incidents ?? []}
            loading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
