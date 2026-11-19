import { Controller, useFormContext } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import Dropdown from '../../components/Dropdown/Dropdown';
import type { ApiDomain } from '../../types/domain';
import type { OnboardingValues } from '../../features/onboarding/schemas';

interface OnboardingDetailsStepProps {
  domains: ApiDomain[];
  isLoadingDomains: boolean;
  domainsFailed: boolean;
  onRetryDomains: () => void;
  submitError: string;
  draftNotice: string;
  onCancel: () => void;
  onContinue: () => void;
}

export function OnboardingDetailsStep({
  domains,
  isLoadingDomains,
  domainsFailed,
  onRetryDomains,
  submitError,
  draftNotice,
  onCancel,
  onContinue,
}: OnboardingDetailsStepProps) {
  const { register, control, formState: { errors } } = useFormContext<OnboardingValues>();

  return (
    <>
      <header className="onboarding-v2-step-intro">
        <h2 id="onboarding-step-heading" tabIndex={-1}>Application details</h2>
        <p>Set the endpoint and ownership details used by HTTP health checks.</p>
      </header>
      <div className="onboarding-v2-fields">
        <Input
          label="Application name *"
          required
          wrapperClassName="onboarding-v2-field onboarding-v2-full"
          {...(errors.name?.message ? { error: errors.name.message } : {})}
          {...register('name')}
        />
        <Input
          label="Health URL *"
          required
          type="url"
          placeholder="https://service.example.com/health"
          wrapperClassName="onboarding-v2-field onboarding-v2-full"
          {...(errors.url?.message ? { error: errors.url.message } : {})}
          {...register('url')}
        />
        <div className="onboarding-v2-field">
          <label htmlFor="application-domain">Domain *</label>
          {isLoadingDomains ? (
            <div className="onboarding-v2-domain-loading" role="status" aria-label="Loading domains">
              <Skeleton variant="line" />
            </div>
          ) : (
            <Controller
              name="domainId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  className="onboarding-v2-domain-select"
                  ariaLabel="Domain"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select a domain"
                  disabled={domains.length === 0 || domainsFailed}
                  invalid={Boolean(errors.domainId)}
                  options={domains.map((domain) => ({ value: domain.id, label: domain.domainName }))}
                />
              )}
            />
          )}
          {errors.domainId?.message && <span className="onboarding-v2-field-error" role="alert">{errors.domainId.message}</span>}
          {domains.length === 0 && !isLoadingDomains && !domainsFailed && (
            <small><Link to="/domains">Create a domain</Link> before onboarding an application.</small>
          )}
          {domainsFailed && (
            <div className="onboarding-v2-domain-error" role="alert">
              <span>Domains could not be loaded.</span>
              <Button type="button" variant="secondary" size="sm" onClick={onRetryDomains}>Retry</Button>
            </div>
          )}
        </div>
        <Input
          label="Owner email *"
          required
          type="email"
          autoComplete="email"
          wrapperClassName="onboarding-v2-field"
          {...(errors.email?.message ? { error: errors.email.message } : {})}
          {...register('email')}
        />
        <Input
          label="Failed probes before DOWN"
          type="number"
          min={1}
          max={10}
          hint="Default: 2 consecutive failed health checks."
          wrapperClassName="onboarding-v2-field"
          {...(errors.failureThreshold?.message ? { error: errors.failureThreshold.message } : {})}
          {...register('failureThreshold', { valueAsNumber: true })}
        />
        <label className="onboarding-v2-field onboarding-v2-full" htmlFor="application-description">
          <span>Description</span>
          <textarea id="application-description" rows={3} {...register('description')} />
        </label>
        <Input
          label="Alert Group/Channel (Teams Workflow URL) *"
          required
          type="url"
          placeholder="https://..."
          wrapperClassName="onboarding-v2-field onboarding-v2-full"
          {...(errors.teamslink?.message ? { error: errors.teamslink.message } : {})}
          {...register('teamslink')}
        />
        <label className="onboarding-v2-field" htmlFor="cloud-provider">
          <span>Cloud provider</span>
          <select id="cloud-provider" defaultValue="aws" aria-describedby="cloud-provider-note">
            <option value="aws">AWS</option>
          </select>
          <small id="cloud-provider-note">AWS is the only supported cloud provider right now.</small>
        </label>
      </div>
      {submitError && <p className="onboarding-v2-error" role="alert">{submitError}</p>}
      {draftNotice && <p className="onboarding-v2-notice" role="status">{draftNotice}</p>}
      <footer className="onboarding-v2-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          variant="primary"
          onClick={onContinue}
          disabled={isLoadingDomains || domains.length === 0 || domainsFailed}
        >
          Continue to AWS setup
        </Button>
      </footer>
    </>
  );
}
