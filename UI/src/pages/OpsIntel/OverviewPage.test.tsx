import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OverviewResponse } from '../../types/domain';
import OverviewPage from './OverviewPage';
import OperationsShell from './OperationsShell';

const queryMocks = vi.hoisted(() => ({
  useGetDomainsQuery: vi.fn(),
  useGetOverviewQuery: vi.fn(),
}));

vi.mock('../../api/opsApi', () => queryMocks);

const refetch = vi.fn();
const overview: OverviewResponse = {
  kpis: { total: 1, healthy: 1, degraded: 0, down: 0, sloAttainmentPct: 99.95, openIncidents: 0 },
  applications: [{
    id: 'api-1',
    name: 'Payments API',
    status: 'healthy',
    healthScore: null,
    availabilityPct: 99.95,
    responseTimeMs: 42,
    errorRatePct: null,
    trend: [],
    owner: 'Payments team',
    tier: 1,
    domainName: 'Payments',
    lastUpdated: '2026-11-19T08:00:00.000Z',
  }],
  incidents: [],
  lastUpdated: '2026-11-19T08:00:00.000Z',
};

function renderOverview() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<OperationsShell />}>
          <Route path="/" element={<OverviewPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('OverviewPage', () => {
  beforeEach(() => {
    refetch.mockReset();
    queryMocks.useGetDomainsQuery.mockReturnValue({ data: [] });
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: overview,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    });
  });

  it('shows a loading skeleton before the first health response', () => {
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch,
    });

    renderOverview();

    expect(screen.getByRole('status', { name: 'Loading applications' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading incidents' })).toBeInTheDocument();
    expect(screen.getByText('Applications monitored').closest('article')?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('offers an explicit retry when health data is unavailable', async () => {
    const user = userEvent.setup();
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    });

    renderOverview();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Health data could not be loaded');
  });

  it('keeps navigation available when the application grid has no API data', async () => {
    const user = userEvent.setup();
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    });

    renderOverview();
    await user.click(screen.getByRole('link', { name: 'Applications' }));

    expect(screen.getByRole('heading', { name: 'Applications', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Health data could not be loaded');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit applications view' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(screen.getByRole('heading', { name: 'Health overview', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Health data could not be loaded');
  });

  it('renders application health and reliability in the sortable table by default', () => {
    renderOverview();

    expect(screen.getByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Payments API, Payments' })).toHaveAttribute('href', '/applications/api-1');
    expect(screen.getByRole('cell', { name: 'Healthy' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '42 ms' })).toBeInTheDocument();
  });

  it('switches the dashboard application view between a table and grid', async () => {
    const user = userEvent.setup();
    renderOverview();

    const applicationsRegion = screen.getByRole('region', { name: 'Applications' });
    const viewToggle = within(applicationsRegion).getByRole('group', { name: 'Application view' });
    const tableButton = within(viewToggle).getByRole('button', { name: 'Table view' });
    const gridButton = within(viewToggle).getByRole('button', { name: 'Grid view' });

    expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).toBeInTheDocument();

    await user.click(gridButton);
    expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).not.toBeInTheDocument();
    expect(within(applicationsRegion).getByRole('list', { name: 'Application status' })).toBeInTheDocument();
    expect(within(applicationsRegion).getByRole('region', { name: 'Payments' })).toBeInTheDocument();
    expect(within(applicationsRegion).getByRole('link', { name: /Payments API/ })).toHaveAttribute('href', '/applications/api-1');

    await user.click(tableButton);
    expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).toBeInTheDocument();
  });

  it('keeps application search and domain filtering with the application list', async () => {
    const user = userEvent.setup();
    const platformApplication = {
      ...overview.applications[0],
      id: 'api-2',
      name: 'Ledger API',
      domainName: 'Platform',
    };
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: {
        ...overview,
        kpis: { ...overview.kpis, total: 2 },
        applications: [...overview.applications, platformApplication],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch,
    });
    queryMocks.useGetDomainsQuery.mockReturnValue({
      data: [
        { id: 'domain-payments', domainName: 'Payments' },
        { id: 'domain-platform', domainName: 'Platform' },
      ],
    });

    renderOverview();

    const applicationsRegion = screen.getByRole('region', { name: 'Applications' });
    const searchInput = within(applicationsRegion).getByRole('textbox', { name: 'Search applications' });
    const topbar = screen.getByRole('navigation', { name: 'Primary navigation' }).closest('header');
    expect(topbar).not.toContainElement(searchInput);

    await user.type(searchInput, 'Ledger');
    await waitFor(() => {
      expect(within(applicationsRegion).getByRole('link', { name: /Ledger API/ })).toBeInTheDocument();
      expect(within(applicationsRegion).queryByRole('link', { name: /Payments API/ })).not.toBeInTheDocument();
    });

    await user.clear(searchInput);
    await waitFor(() => {
      expect(within(applicationsRegion).getByRole('link', { name: /Payments API/ })).toBeInTheDocument();
    });
    await user.click(within(applicationsRegion).getByRole('button', { name: 'Filter by domain' }));
    await user.click(screen.getByRole('option', { name: 'Payments' }));
    await waitFor(() => {
      expect(within(applicationsRegion).getByRole('link', { name: /Payments API/ })).toBeInTheDocument();
      expect(within(applicationsRegion).queryByRole('link', { name: /Ledger API/ })).not.toBeInTheDocument();
    });
  });

  it('shows all applications in the grid view without a view switcher', async () => {
    const user = userEvent.setup();
    renderOverview();

    await user.click(screen.getByRole('link', { name: 'Applications' }));

    expect(screen.getByRole('heading', { name: 'Applications', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exit applications view' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Applications', level: 2 })).toHaveClass('sr-only');
    expect(screen.queryByRole('group', { name: 'Group applications by' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Application view' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).not.toBeInTheDocument();
    const applicationsRegion = screen.getByRole('region', { name: 'Applications' });
    expect(within(applicationsRegion).getByRole('link', { name: /Payments API/ })).toHaveAttribute('href', '/applications/api-1');
  });

  it('keeps the last available overview visible when a refresh fails', () => {
    queryMocks.useGetOverviewQuery.mockReturnValue({
      data: overview,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch,
    });

    renderOverview();

    expect(screen.getByRole('heading', { name: 'Refresh failed' })).toBeInTheDocument();
    expect(screen.getByRole('table', {
      name: 'Applications by health status, response time, and availability',
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Payments API, Payments' })).toBeInTheDocument();
  });
});
