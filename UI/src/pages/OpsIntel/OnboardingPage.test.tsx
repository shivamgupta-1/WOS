import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import store from '../../redux/store';
import { clearOnboardingDraft } from '../../features/onboarding/onboardingSlice';
import OnboardingPage from './OnboardingPage';

vi.mock('../../api/opsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/opsApi')>();
  return {
    ...actual,
    getErrorMessage: () => 'Request failed',
    useCreateApplicationMutation: () => [vi.fn(), { isLoading: false }],
    useGetDomainsQuery: () => ({ data: [{ id: 'domain-1', domainName: 'Platform' }], isLoading: false, isError: false }),
    useLazyGetAwsInstanceMetricsQuery: () => [vi.fn(), { isFetching: false }],
  };
});

function renderOnboarding() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('onboarding wizard', () => {
  beforeEach(() => {
    window.sessionStorage.getItem = vi.fn(() => null);
    store.dispatch(clearOnboardingDraft());
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
    const createButton = screen.getByRole('button', { name: 'Create application' });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/EC2 instance ID/i), { target: { value: 'i-0123456789abcdef0' } });
    expect(createButton).toBeEnabled();
  });
});
