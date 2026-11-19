import { useMemo } from 'react';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useGetDomainsQuery,
} from '../../api/opsApi';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import type { ApiDomain } from '../../types/domain';
import { DomainCreatePanel } from './DomainCreatePanel';
import { DomainRow } from './DomainRow';
import './DomainsPage.css';

type SortDirection = 'asc' | 'desc';
const emptyDomains: ApiDomain[] = [];

function isSortDirection(value: string | null): value is SortDirection {
  return value === 'asc' || value === 'desc';
}

function sortDomains(domains: ApiDomain[], direction: SortDirection) {
  return [...domains].sort((left, right) => {
    const result = left.domainName.localeCompare(right.domainName, undefined, { numeric: true, sensitivity: 'base' });
    return direction === 'asc' ? result : -result;
  });
}

export default function DomainsPage() {
  const { data, isLoading, isError, refetch } = useGetDomainsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const domains = data ?? emptyDomains;
  const query = searchParams.get('q') ?? '';
  const rawSortDirection = searchParams.get('sort');
  const sortDirection: SortDirection = isSortDirection(rawSortDirection) ? rawSortDirection : 'asc';
  const visibleDomains = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sortDomains(
      domains.filter((domain) => domain.domainName.toLocaleLowerCase().includes(normalizedQuery)),
      sortDirection,
    );
  }, [domains, query, sortDirection]);
  const hasLoadedDomains = data !== undefined;

  function updateSearch(value: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set('q', value);
    else nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }

  function toggleSort() {
    const nextParams = new URLSearchParams(searchParams);
    const nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    if (nextDirection === 'asc') nextParams.delete('sort');
    else nextParams.set('sort', nextDirection);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="domains-v2">
      <nav className="domains-v2-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span aria-current="page">Domains</span>
      </nav>

      <PageHeader
        eyebrow="Administration"
        title="Domains"
        description="Manage the domain groups used to organize monitored applications."
        className="domains-v2-page-header"
        actions={hasLoadedDomains ? (
          <Badge variant="neutral">{domains.length} {domains.length === 1 ? 'domain' : 'domains'}</Badge>
        ) : undefined}
      />

      <div className="domains-v2-layout">
        <section className="surface domains-v2-list" aria-labelledby="domains-list-heading">
          <header className="domains-v2-section-header">
            <div>
              <h2 id="domains-list-heading">Configured domains</h2>
              <p>{hasLoadedDomains ? `${visibleDomains.length} shown` : 'Domain groups in this workspace'}</p>
            </div>
            <Input
              aria-label="Search domains"
              placeholder="Filter by name"
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              wrapperClassName="domains-v2-search"
            />
          </header>

          {isError && hasLoadedDomains && (
            <ErrorState
              title="Refresh failed"
              description="Showing the last successful domain data. Try again to update the list."
              retryLabel="Retry"
              onRetry={() => void refetch()}
              className="domains-v2-stale-error"
            />
          )}

          {isLoading ? (
            <div className="domains-v2-loading" role="status" aria-label="Loading domains">
              {Array.from({ length: 5 }, (_, index) => <Skeleton variant="line" key={index} />)}
            </div>
          ) : isError && !hasLoadedDomains ? (
            <ErrorState
              title="Domains could not be loaded"
              description="Check the connection and try again."
              retryLabel="Retry"
              onRetry={() => void refetch()}
              className="domains-v2-list-error"
            />
          ) : domains.length === 0 ? (
            <EmptyState
              title="No domains configured"
              description="Create a domain group to organize monitored applications."
              className="domains-v2-empty"
            />
          ) : visibleDomains.length === 0 ? (
            <EmptyState
              title="No matching domains"
              description={`No domain names match "${query}".`}
              action={<Button variant="ghost" size="sm" onClick={() => updateSearch('')}>Clear filter</Button>}
              className="domains-v2-empty"
            />
          ) : (
            <div className="domains-v2-table-wrap">
              <table className="domains-v2-table">
                <caption className="sr-only">Configured domains</caption>
                <thead>
                  <tr>
                    <th scope="col" aria-sort={sortDirection === 'asc' ? 'ascending' : 'descending'}>
                      <button
                        type="button"
                        onClick={toggleSort}
                        aria-label={`Sort by domain name, currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                      >
                        Domain name <ArrowUpDown aria-hidden="true" size={14} />
                      </button>
                    </th>
                    <th scope="col">Domain ID</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDomains.map((domain) => <DomainRow key={domain.id} domain={domain} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <DomainCreatePanel />
      </div>
    </div>
  );
}
