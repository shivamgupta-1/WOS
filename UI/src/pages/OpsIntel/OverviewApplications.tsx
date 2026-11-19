import { LayoutGrid, Search, Table2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Dropdown from '../../components/Dropdown/Dropdown';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusDot } from '../../components/ui/StatusDot';
import { Segmented } from '../../components/ops/Primitives';
import type { ApplicationSummary } from '../../types/domain';
import type { OverviewGroupBy, OverviewStatusFilter } from './overviewSelectors';
import { OverviewApplicationTable } from './OverviewApplicationTable';
import { readableStatus, responseLabel, serviceStatus } from './overviewFormatters';
import './OverviewApplications.css';

type ViewMode = 'grid' | 'table';
type ApplicationGroup = { name: string; applications: ApplicationSummary[] };

interface OverviewApplicationsProps {
  applications: ApplicationSummary[];
  totalApplications: number;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  domains: string[];
  domain: string;
  onDomainChange: (value: string) => void;
  groups: ApplicationGroup[];
  statusFilter: OverviewStatusFilter;
  onStatusFilterChange: (status: OverviewStatusFilter) => void;
  groupBy: OverviewGroupBy;
  onGroupByChange: (groupBy: OverviewGroupBy) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  loading: boolean;
  fullscreen: boolean;
}

export function OverviewApplications({
  applications,
  totalApplications,
  searchInput,
  onSearchInputChange,
  domains,
  domain,
  onDomainChange,
  groups,
  statusFilter,
  onStatusFilterChange,
  groupBy,
  onGroupByChange,
  view,
  onViewChange,
  loading,
  fullscreen,
}: OverviewApplicationsProps) {
  const displayedView = fullscreen ? 'grid' : view;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusLegend = [
    { status: 'operational' as const, label: 'Healthy' },
    { status: 'degraded' as const, label: 'Degraded' },
    { status: 'outage' as const, label: 'Down' },
    { status: 'unknown' as const, label: 'No data' },
  ];

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  return (
    <section className="overview-v2-applications" aria-labelledby="applications-heading">
      <header className="overview-v2-section-header">
        <div>
          <h2 id="applications-heading" className={fullscreen ? 'sr-only' : undefined}>Applications</h2>
          <p>{applications.length} shown of {totalApplications}</p>
        </div>
        <div className="overview-v2-toolbar">
          <label className="overview-v2-search">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only">Search applications</span>
            <input
              ref={searchInputRef}
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search applications"
              aria-keyshortcuts="/"
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
          <Dropdown
            ariaLabel="Filter by domain"
            value={domain}
            onChange={onDomainChange}
            options={[
              { value: 'All domains', label: 'All domains' },
              ...domains.map((item) => ({ value: item, label: item })),
            ]}
            className="overview-v2-domain-filter"
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as OverviewStatusFilter)}
            wrapperClassName="overview-v2-status-filter"
          >
            <option value="all">All statuses</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
            <option value="unknown">No data</option>
          </Select>
          {!fullscreen && (
            <>
              <Segmented
                label="Group applications by"
                value={groupBy}
                options={[{ value: 'domain', label: 'Domain' }, { value: 'status', label: 'Status' }]}
                onChange={onGroupByChange}
              />
              <div className="overview-v2-view-toggle" role="group" aria-label="Application view">
                <button
                  type="button"
                  aria-label="Table view"
                  aria-pressed={view === 'table'}
                  title="Table view"
                  onClick={() => onViewChange('table')}
                >
                  <Table2 aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  title="Grid view"
                  onClick={() => onViewChange('grid')}
                >
                  <LayoutGrid aria-hidden="true" className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <div className="overview-v2-loading" role="status" aria-label="Loading applications">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="overview-v2-loading-row" key={index}>
              <Skeleton className="w-40" />
              <Skeleton className="w-20" />
              <Skeleton className="w-16" />
              <Skeleton className="w-24" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications match these filters"
          description="Adjust the search or status filter to see more results."
          className="overview-v2-empty"
        />
      ) : displayedView === 'grid' ? (
        <>
          <ul className="overview-v2-health-legend" aria-label="Application status">
            {statusLegend.map((item) => (
              <li key={item.label}>
                <StatusDot status={item.status} label={item.label} />
              </li>
            ))}
          </ul>
          <div className="overview-v2-board">
            {groups.map((group) => (
              <section className="overview-v2-board-lane" aria-label={group.name} key={group.name}>
                <header className="overview-v2-board-lane-header">
                  <div>
                    <h3>{group.name === 'Unknown' ? 'No domain' : group.name}</h3>
                    <span>{group.applications.length} applications</span>
                  </div>
                </header>
                <div className="overview-v2-board-cards">
                  {group.applications.map((application) => (
                    <Link
                      className="overview-v2-board-card"
                      to={`/applications/${application.id}`}
                      key={application.id}
                    >
                      <strong>{application.name}</strong>
                      <StatusDot
                        status={serviceStatus(application.status)}
                        label={readableStatus(application.status)}
                        className="overview-v2-board-status"
                      />
                      <span className="overview-v2-board-response">
                        <small>Response</small>
                        <strong className="tabular-nums">{responseLabel(application.responseTimeMs)}</strong>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <OverviewApplicationTable applications={applications} />
      )}
    </section>
  );
}
