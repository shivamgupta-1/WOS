import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiDomain } from '../../types/domain';
import DomainsPage from './DomainsPage';

const apiMocks = vi.hoisted(() => ({
  getErrorMessage: vi.fn(() => 'Request failed'),
  useGetDomainsQuery: vi.fn(),
  useCreateDomainMutation: vi.fn(),
  useLazyGetDomainQuery: vi.fn(),
  useUpdateDomainMutation: vi.fn(),
  useDeleteDomainMutation: vi.fn(),
  createDomain: vi.fn(),
  loadDomain: vi.fn(),
  updateDomain: vi.fn(),
  deleteDomain: vi.fn(),
}));

vi.mock('../../api/opsApi', () => apiMocks);

const domains: ApiDomain[] = [
  { id: 'domain-z', domainName: 'Zeta' },
  { id: 'domain-p', domainName: 'Payments' },
  { id: 'domain-a', domainName: 'Analytics' },
];

function LocationSearch() {
  const location = useLocation();
  return <output aria-label="Current search parameters">{location.search}</output>;
}

function renderDomains(initialEntry = '/domains') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DomainsPage />
      <LocationSearch />
    </MemoryRouter>,
  );
}

describe('DomainsPage', () => {
  beforeEach(() => {
    apiMocks.createDomain.mockClear();
    apiMocks.loadDomain.mockClear();
    apiMocks.updateDomain.mockClear();
    apiMocks.deleteDomain.mockClear();
    apiMocks.getErrorMessage.mockReturnValue('Request failed');
    apiMocks.useGetDomainsQuery.mockReturnValue({
      data: domains,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    apiMocks.createDomain.mockImplementation(() => ({ unwrap: () => Promise.resolve({ id: 'domain-new', domainName: 'Identity' }) }));
    apiMocks.loadDomain.mockImplementation((id: string) => ({
      unwrap: () => Promise.resolve({ id, domainName: 'Payments' }),
    }));
    apiMocks.updateDomain.mockImplementation((domain: ApiDomain) => ({ unwrap: () => Promise.resolve(domain) }));
    apiMocks.deleteDomain.mockImplementation(() => ({ unwrap: () => Promise.resolve() }));
    apiMocks.useCreateDomainMutation.mockReturnValue([apiMocks.createDomain, { isLoading: false }]);
    apiMocks.useLazyGetDomainQuery.mockReturnValue([apiMocks.loadDomain, { isLoading: false }]);
    apiMocks.useUpdateDomainMutation.mockReturnValue([apiMocks.updateDomain, { isLoading: false }]);
    apiMocks.useDeleteDomainMutation.mockReturnValue([apiMocks.deleteDomain, { isLoading: false }]);
  });

  it('filters by a URL-backed query and keeps the filtered list searchable', async () => {
    const user = userEvent.setup();
    renderDomains('/domains?q=pay');

    expect(screen.getByRole('row', { name: /Payments/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Analytics/ })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Search domains' }));
    await user.type(screen.getByRole('textbox', { name: 'Search domains' }), 'ana');

    expect(screen.getByRole('row', { name: /Analytics/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Current search parameters')).toHaveTextContent('?q=ana');
  });

  it('sorts the table and stores descending order in the URL', async () => {
    const user = userEvent.setup();
    renderDomains();
    const table = screen.getByRole('table', { name: 'Configured domains' });

    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Analytics');
    await user.click(screen.getByRole('button', { name: /Sort by domain name/ }));

    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Zeta');
    expect(screen.getByLabelText('Current search parameters')).toHaveTextContent('?sort=desc');
  });

  it('creates a trimmed domain name and reports success', async () => {
    const user = userEvent.setup();
    renderDomains();
    await user.type(screen.getByRole('textbox', { name: 'Domain name' }), '  Identity  ');
    await user.click(screen.getByRole('button', { name: 'Create domain' }));

    expect(apiMocks.createDomain).toHaveBeenCalledWith({ name: 'Identity' });
    expect(await screen.findByText('Domain created.')).toHaveAttribute('role', 'status');
  });

  it('loads the latest domain name before editing and saves changes', async () => {
    const user = userEvent.setup();
    renderDomains();
    const row = screen.getByRole('row', { name: /Payments/ });
    await user.click(within(row).getByRole('button', { name: 'Edit' }));
    const input = await screen.findByRole('textbox', { name: 'Domain name for Payments' });
    await user.clear(input);
    await user.type(input, 'Billing');
    await user.click(within(row).getByRole('button', { name: 'Save' }));

    expect(apiMocks.loadDomain).toHaveBeenCalledWith('domain-p');
    expect(apiMocks.updateDomain).toHaveBeenCalledWith({ id: 'domain-p', domainName: 'Billing' });
    expect(await screen.findByText('Domain updated.')).toHaveAttribute('role', 'status');
  });

  it('offers retry for an unavailable domain list', async () => {
    const refetch = vi.fn();
    apiMocks.useGetDomainsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    const user = userEvent.setup();
    renderDomains();

    expect(screen.getByRole('alert')).toHaveTextContent('Domains could not be loaded');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows a distinct empty state when no domains have been created', () => {
    apiMocks.useGetDomainsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderDomains();

    expect(screen.getByRole('heading', { name: 'No domains configured' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps the last domain data visible when a refresh fails', () => {
    apiMocks.useGetDomainsQuery.mockReturnValue({
      data: domains,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderDomains();

    expect(screen.getByRole('heading', { name: 'Refresh failed' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Payments/ })).toBeInTheDocument();
  });

  it('requires confirmation before deleting a domain', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderDomains();
    const row = screen.getByRole('row', { name: /Payments/ });
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    expect(confirm).toHaveBeenCalledWith('Delete the Payments domain?');
    expect(apiMocks.deleteDomain).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('shows a loading skeleton while the first domain response is pending', () => {
    apiMocks.useGetDomainsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    renderDomains();

    expect(screen.getByRole('status', { name: 'Loading domains' })).toBeInTheDocument();
  });
});
