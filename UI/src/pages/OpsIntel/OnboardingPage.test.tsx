import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import store from '../../redux/store';
import { clearOnboardingDraft } from '../../features/onboarding/onboardingSlice';
import OnboardingPage from './OnboardingPage';

const queryMocks = vi.hoisted(() => ({
  useGetDomainsQuery: vi.fn(),
  createApplication: vi.fn(),
}));

vi.mock('../../api/opsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/opsApi')>();
  return {
    ...actual,
    getErrorMessage: () => 'Request failed',
    useCreateApplicationMutation: () => [queryMocks.createApplication, { isLoading: false }],
    useGetDomainsQuery: queryMocks.useGetDomainsQuery,
    useLazyGetAwsInstanceMetricsQuery: () => [vi.fn(), { isFetching: false }],
  };
});

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function renderOnboarding() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <OnboardingPage />
        <CurrentPath />
      </MemoryRouter>
    </Provider>,
  );
}

describe('onboarding wizard', () => {
  beforeEach(() => {
    window.sessionStorage.getItem = vi.fn(() => null);
    store.dispatch(clearOnboardingDraft());
    queryMocks.createApplication.mockClear();
    queryMocks.createApplication.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'application-1' }),
    });
    queryMocks.useGetDomainsQuery.mockReturnValue({
      data: [{ id: 'domain-1', domainName: 'Platform' }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('keeps the user on the details step until required fields are valid', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.click(screen.getByRole('button', { name: 'Continue to AWS setup' }));

    expect(await screen.findByText('Enter an application name with at least 2 characters.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Application details' })).toBeInTheDocument();
    expect(screen.getByText('AWS setup')).toBeInTheDocument();
  });

  it('requires a valid instance ID before allowing application creation', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.type(screen.getByLabelText(/Application name/i), 'Checkout API');
    await user.type(screen.getByLabelText(/Health URL/i), 'https://checkout.example.com/health');
    await user.click(screen.getByRole('button', { name: 'Domain' }));
    await user.click(screen.getByRole('option', { name: 'Platform' }));
    await user.type(screen.getByLabelText(/Owner email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/Alert Group\/Channel/i), 'https://example.com/workflow');
    await user.click(screen.getByRole('button', { name: 'Continue to AWS setup' }));

    expect(await screen.findByRole('heading', { name: 'AWS instance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AWS instance' })).toHaveFocus();
    const createButton = screen.getByRole('button', { name: 'Create application' });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/EC2 instance ID/i), { target: { value: 'i-0123456789abcdef0' } });
    expect(createButton).toBeEnabled();
  });

  it('creates the application with the validated form and AWS instance details', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.type(screen.getByLabelText(/Application name/i), 'Checkout API');
    await user.type(screen.getByLabelText(/Health URL/i), 'https://checkout.example.com/health');
    await user.click(screen.getByRole('button', { name: 'Domain' }));
    await user.click(screen.getByRole('option', { name: 'Platform' }));
    await user.type(screen.getByLabelText(/Owner email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/Alert Group\/Channel/i), 'https://example.com/workflow');
    await user.click(screen.getByRole('button', { name: 'Continue to AWS setup' }));
    await screen.findByRole('heading', { name: 'AWS instance' });
    await user.type(screen.getByLabelText(/EC2 instance ID/i), 'i-0123456789abcdef0');
    await user.click(screen.getByRole('button', { name: 'Create application' }));

    expect(queryMocks.createApplication).toHaveBeenCalledWith({
      name: 'Checkout API',
      url: 'https://checkout.example.com/health',
      domainId: 'domain-1',
      description: '',
      email: 'owner@example.com',
      teamslink: 'https://example.com/workflow',
      failureThreshold: 2,
      awsInstanceId: 'i-0123456789abcdef0',
    });
    expect(await screen.findByLabelText('Current path')).toHaveTextContent('/applications/application-1');
  });

  it('shows a skeleton while domains load and offers a retry on failure', async () => {
    queryMocks.useGetDomainsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { rerender } = renderOnboarding();
    expect(screen.getByRole('status', { name: 'Loading domains' })).toBeInTheDocument();

    const refetch = vi.fn();
    queryMocks.useGetDomainsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <OnboardingPage />
          <CurrentPath />
        </MemoryRouter>
      </Provider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Domains could not be loaded.');
  });
});
