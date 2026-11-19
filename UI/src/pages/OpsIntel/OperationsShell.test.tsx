import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import OperationsShell from './OperationsShell';

vi.mock('../../api/opsApi', () => ({
  useGetDomainsQuery: () => ({ data: [] }),
}));

describe('OperationsShell', () => {
  it('keeps navigation available and restores focus after escaping the applications view', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<OperationsShell />}>
            <Route path="/" element={<h1>Overview</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const applicationsLink = screen.getByRole('link', { name: 'Applications' });

    await user.click(applicationsLink);
    expect(applicationsLink).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Exit applications view' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(applicationsLink).not.toHaveAttribute('aria-current', 'page');
    expect(applicationsLink).toHaveFocus();
  });

  it('places the primary navigation in the top bar with no side navigation', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<OperationsShell />}>
            <Route path="/" element={<h1>Overview</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(navigation.closest('header')).toBeInTheDocument();
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent?.trim())).toEqual([
      'Applications',
      'Dashboard',
      'Onboarding',
      'Domains',
    ]);
    expect(screen.queryByRole('complementary', { name: 'Primary navigation' })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Incidents' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Domains' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Search applications' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Filter by domain' })).not.toBeInTheDocument();
  });
});
