import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  getErrorMessage,
  useCreateApplicationMutation,
  useGetDomainsQuery,
  useLazyGetAwsInstanceMetricsQuery,
} from '../../api/opsApi';
import { clearOnboardingDraft, saveOnboardingDraft } from '../../features/onboarding/onboardingSlice';
import { onboardingSchema } from '../../features/onboarding/schemas';
import type { OnboardingValues } from '../../features/onboarding/schemas';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import Dropdown from '../../components/Dropdown/Dropdown';

const defaultValues: OnboardingValues = {
  name: '',
  url: '',
  domainId: '',
  description: '',
  email: '',
  teamslink: '',
  failureThreshold: 2,
};

type AwsSetupValues = { instanceId: string };

const defaultAwsSetupValues: AwsSetupValues = { instanceId: '' };
const awsInstanceIdPattern = /^i-[a-fA-F0-9]{8,17}$/;

const applicationFields: Array<keyof OnboardingValues> = [
  'name',
  'url',
  'domainId',
  'description',
  'email',
  'teamslink',
  'failureThreshold',
];

function readSessionDraft(): Partial<OnboardingValues> | null {
  try {
    const saved = window.sessionStorage.getItem('opsintel-onboarding-draft');
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    const result = onboardingSchema.partial().safeParse(parsed);
    if (!result.success) return null;
    return {
      ...(result.data.name !== undefined ? { name: result.data.name } : {}),
      ...(result.data.url !== undefined ? { url: result.data.url } : {}),
      ...(result.data.domainId !== undefined ? { domainId: result.data.domainId } : {}),
      ...(result.data.description !== undefined ? { description: result.data.description } : {}),
      ...(result.data.email !== undefined ? { email: result.data.email } : {}),
      ...(result.data.teamslink !== undefined ? { teamslink: result.data.teamslink } : {}),
      ...(result.data.failureThreshold !== undefined ? { failureThreshold: result.data.failureThreshold } : {}),
    };
  } catch {
    return null;
  }
}

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduxDraft = useAppSelector((state) => state.onboarding.draft);
  const [restoredDraft] = useState(() => reduxDraft ?? readSessionDraft());
  const { data: domains = [], isLoading: isLoadingDomains, isError: domainsFailed } = useGetDomainsQuery();
  const [createApplication, { isLoading: isCreating }] = useCreateApplicationMutation();
  const [submitError, setSubmitError] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [awsSetupValues, setAwsSetupValues] = useState<AwsSetupValues>(() => {
    try {
      const saved = window.sessionStorage.getItem('opsintel-cloudwatch-draft');
      if (!saved) return defaultAwsSetupValues;
      const parsed: unknown = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return defaultAwsSetupValues;
      const draft = parsed as Partial<AwsSetupValues>;
      return {
        instanceId: typeof draft.instanceId === 'string' ? draft.instanceId : '',
      };
    } catch {
      return defaultAwsSetupValues;
    }
  });
  const [cloudWatchError, setCloudWatchError] = useState('');
  const [fetchAwsInstanceMetrics, awsMetricsResult] = useLazyGetAwsInstanceMetricsQuery();
  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...defaultValues, ...restoredDraft },
  });
  const values = useWatch({ control });

  useEffect(() => {
    if (restoredDraft && !reduxDraft) dispatch(saveOnboardingDraft(restoredDraft));
  }, [dispatch, reduxDraft, restoredDraft]);

  useEffect(() => {
    if (!values) return;
    dispatch(saveOnboardingDraft(values));
    try {
      window.sessionStorage.setItem('opsintel-onboarding-draft', JSON.stringify(values));
    } catch (error) {
      console.warn('Unable to persist the application onboarding draft.', error);
    }
  }, [dispatch, values]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('opsintel-cloudwatch-draft', JSON.stringify(awsSetupValues));
    } catch (error) {
      console.warn('Unable to persist the AWS setup draft.', error);
    }
  }, [awsSetupValues]);

  function saveDraft() {
    dispatch(saveOnboardingDraft(values));
    try {
      window.sessionStorage.setItem('opsintel-onboarding-draft', JSON.stringify(values));
      window.sessionStorage.setItem('opsintel-cloudwatch-draft', JSON.stringify(awsSetupValues));
      setDraftNotice('Draft saved for this browser session.');
    } catch {
      setDraftNotice('Draft could not be stored in this browser session.');
    }
  }

  function cancelOnboarding() {
    dispatch(clearOnboardingDraft());
    window.sessionStorage.removeItem('opsintel-onboarding-draft');
    window.sessionStorage.removeItem('opsintel-cloudwatch-draft');
    navigate('/');
  }

  async function submitApplication(values: OnboardingValues) {
    setSubmitError('');
    try {
      const application = await createApplication({
        ...values,
        awsInstanceId: awsSetupValues.instanceId.trim(),
      }).unwrap();
      dispatch(clearOnboardingDraft());
      window.sessionStorage.removeItem('opsintel-onboarding-draft');
      window.sessionStorage.removeItem('opsintel-cloudwatch-draft');
      navigate(`/applications/${application.id}`);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  }

  async function continueToCloudWatch() {
    const isApplicationValid = await trigger(applicationFields);
    if (isApplicationValid) setStep(2);
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      void continueToCloudWatch();
      return;
    }
    if (!awsInstanceIdPattern.test(awsSetupValues.instanceId.trim())) {
      setCloudWatchError('Enter a valid EC2 instance ID, such as i-0123456789abcdef0.');
      return;
    }
    void handleSubmit(submitApplication)();
  }

  function fetchAwsMetrics() {
    const instanceId = awsSetupValues.instanceId.trim();
    if (!awsInstanceIdPattern.test(instanceId)) {
      setCloudWatchError('Enter a valid EC2 instance ID, such as i-0123456789abcdef0.');
      return;
    }
    setCloudWatchError('');
    void fetchAwsInstanceMetrics(instanceId);
  }

  return (
    <div className="onboarding-page">
      <div className="breadcrumbs"><Link to="/">Dashboard</Link><span aria-hidden="true">/</span><span>Onboarding</span></div>
      <div className="page-heading redesigned-page-heading onboarding-heading">
        <div><div className="eyebrow">APPLICATION SETUP · STEP {step} OF 2</div><h1>Onboard an application</h1><p>{step === 1 ? 'Add the service details and configure its health-check alerts.' : 'Associate an AWS EC2 instance to view its available CloudWatch metrics.'}</p></div>
        <button className="button button-secondary" type="button" onClick={saveDraft}>Save draft</button>
      </div>
      <div className="onboarding-layout">
        <section className="surface wizard-surface" aria-label="Application onboarding form">
          <div className="onboarding-steps" aria-label={`Onboarding progress, step ${step} of 2`}>
            <div className={`onboarding-step${step === 1 ? ' is-active' : ' is-complete'}`} aria-current={step === 1 ? 'step' : undefined}><span>1</span><strong>Application details</strong></div>
            <div className={`onboarding-step${step === 2 ? ' is-active' : ''}`} aria-current={step === 2 ? 'step' : undefined}><span>2</span><strong>AWS instance</strong></div>
          </div>
          <form className="form-grid onboarding-form redesigned-onboarding-form" onSubmit={handleFormSubmit} noValidate>
          {step === 1 ? (
            <>
              <div className="onboarding-section-intro full-width"><h2>Application details</h2><p>Set the endpoint and ownership details used by HTTP health checks.</p></div>
              <label className="form-field full-width" htmlFor="application-name">
                <span className="form-field-label">Application name <span className="required-mark">*</span></span>
                <input id="application-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
                {errors.name && <span className="field-error" role="alert">{errors.name.message}</span>}
              </label>
              <label className="form-field full-width" htmlFor="application-url">
                <span className="form-field-label">Health URL <span className="required-mark">*</span></span>
                <input id="application-url" type="url" placeholder="https://service.example.com/health" {...register('url')} aria-invalid={Boolean(errors.url)} />
                {errors.url && <span className="field-error" role="alert">{errors.url.message}</span>}
              </label>
              <label className="form-field" htmlFor="application-domain">
                <span className="form-field-label">Domain <span className="required-mark">*</span></span>
                <Controller
                  name="domainId"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      ariaLabel="Domain"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={isLoadingDomains ? 'Loading domains...' : 'Select a domain'}
                      disabled={isLoadingDomains || domains.length === 0}
                      invalid={Boolean(errors.domainId)}
                      options={domains.map((domain) => ({ value: domain.id, label: domain.domainName }))}
                    />
                  )}
                />
                {errors.domainId && <span className="field-error" role="alert">{errors.domainId.message}</span>}
                {domains.length === 0 && !isLoadingDomains && <small><Link to="/domains">Create a domain</Link> before onboarding an application.</small>}
                {domainsFailed && <span className="field-error" role="alert">Domains could not be loaded. Refresh and try again.</span>}
              </label>
              <label className="form-field" htmlFor="owner-email">
                <span className="form-field-label">Owner email <span className="required-mark">*</span></span>
                <input id="owner-email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
                {errors.email && <span className="field-error" role="alert">{errors.email.message}</span>}
              </label>
              <label className="form-field" htmlFor="failure-threshold">
                <span className="form-field-label">Failed probes before DOWN</span>
                <input id="failure-threshold" type="number" min={1} max={10} {...register('failureThreshold', { valueAsNumber: true })} aria-invalid={Boolean(errors.failureThreshold)} />
                {errors.failureThreshold && <span className="field-error" role="alert">{errors.failureThreshold.message}</span>}
                <small>Default: 2 consecutive failed health checks.</small>
              </label>
              <label className="form-field full-width" htmlFor="application-description">
                <span className="form-field-label">Description</span>
                <textarea id="application-description" rows={3} {...register('description')} />
              </label>
              <label className="form-field full-width" htmlFor="teams-link">
                <span className="form-field-label">Alert Group/Channel (Teams Workflow URL) <span className="required-mark">*</span></span>
                <input id="teams-link" type="url" placeholder="https://..." {...register('teamslink')} aria-invalid={Boolean(errors.teamslink)} />
                {errors.teamslink && <span className="field-error" role="alert">{errors.teamslink.message}</span>}
              </label>
              <label className="form-field" htmlFor="cloud-provider">
                <span className="form-field-label">Cloud provider</span>
                <select id="cloud-provider" defaultValue="aws" aria-describedby="cloud-provider-note">
                  <option value="aws">AWS</option>
                </select>
                <small id="cloud-provider-note">AWS is the only supported cloud provider right now.</small>
              </label>
              {submitError && <p className="form-submit-error full-width" role="alert">{submitError}</p>}
              {draftNotice && <p className="draft-notice full-width" role="status">{draftNotice}</p>}
              <div className="wizard-actions full-width">
                <button className="button button-secondary" type="button" onClick={cancelOnboarding}>Cancel</button>
                <button className="button button-primary" type="button" onClick={() => void continueToCloudWatch()} disabled={isLoadingDomains || domains.length === 0 || domainsFailed}>Continue to AWS setup</button>
              </div>
            </>
          ) : (
            <>
              <div className="onboarding-section-intro full-width"><h2>AWS instance</h2><p>Connect an EC2 instance for metrics on the application details page.</p></div>
              <div className="cloudwatch-note full-width" role="note">
                <strong>Enter an EC2 instance ID to preview AWS metrics.</strong>
                <span>The API uses the AWS credentials and region configured on the server. The instance ID is saved with this application and used to request its available CloudWatch metrics.</span>
              </div>
              <label className="form-field full-width" htmlFor="aws-instance-id">
                <span className="form-field-label">EC2 instance ID <span className="required-mark">*</span></span>
                <input
                  id="aws-instance-id"
                  autoComplete="off"
                  placeholder="i-0123456789abcdef0"
                  required
                  value={awsSetupValues.instanceId}
                  onChange={(event) => {
                    setAwsSetupValues({ instanceId: event.target.value });
                    setCloudWatchError('');
                  }}
                  aria-invalid={Boolean(cloudWatchError)}
                />
              </label>
              <button className="button button-secondary" type="button" onClick={fetchAwsMetrics} disabled={awsMetricsResult.isFetching}>
                {awsMetricsResult.isFetching ? 'Fetching metrics...' : 'Fetch AWS metrics'}
              </button>
              {cloudWatchError && <p className="form-submit-error full-width" role="alert">{cloudWatchError}</p>}
              {awsMetricsResult.error && awsMetricsResult.originalArgs === awsSetupValues.instanceId.trim() && (
                <p className="form-submit-error full-width" role="alert">{getErrorMessage(awsMetricsResult.error)}</p>
              )}
              {awsMetricsResult.currentData && awsMetricsResult.originalArgs === awsSetupValues.instanceId.trim() && (
                <section className="cloudwatch-note full-width" aria-label="AWS metrics preview" aria-live="polite">
                  <strong>Metrics for {awsMetricsResult.currentData.application.instanceId}</strong>
                  <span>Region: {awsMetricsResult.currentData.application.region}; instance state: {awsMetricsResult.currentData.application.state}</span>
                  <div className="aws-metrics-preview">
                    <span>CPU: {awsMetricsResult.currentData.metrics.cpu ?? 'No data'}{awsMetricsResult.currentData.metrics.cpu == null ? '' : '%'}</span>
                    <span>Memory: {awsMetricsResult.currentData.metrics.memory ?? 'No data'}{awsMetricsResult.currentData.metrics.memory == null ? '' : '%'}</span>
                    <span>Disk: {awsMetricsResult.currentData.metrics.disk ?? 'No data'}{awsMetricsResult.currentData.metrics.disk == null ? '' : '%'}</span>
                    <span>Network in: {awsMetricsResult.currentData.metrics.networkIn ?? 'No data'} bytes</span>
                    <span>Network out: {awsMetricsResult.currentData.metrics.networkOut ?? 'No data'} bytes</span>
                  </div>
                </section>
              )}
              {submitError && <p className="form-submit-error full-width" role="alert">{submitError}</p>}
              {draftNotice && <p className="draft-notice full-width" role="status">{draftNotice}</p>}
              <div className="wizard-actions full-width">
                <button className="button button-secondary" type="button" onClick={() => { setStep(1); setCloudWatchError(''); }}>Previous</button>
                <button className="button button-secondary" type="button" onClick={cancelOnboarding}>Cancel</button>
                <button className="button button-primary" type="submit" disabled={isCreating || !awsInstanceIdPattern.test(awsSetupValues.instanceId.trim())}>
                  {isCreating ? 'Creating...' : 'Create application'}
                </button>
              </div>
            </>
          )}
          </form>
        </section>
        <aside className="surface onboarding-summary" aria-label="Application setup summary">
          <header className="onboarding-summary-header">
            <span className="aws-mark" aria-hidden="true">A</span>
            <div><strong>AWS setup</strong><small>Cloud integration</small></div>
            <span className="summary-selected">Selected</span>
          </header>
          <div className="onboarding-summary-block">
            <span className="summary-label">APPLICATION</span>
            <strong>{values.name?.trim() || 'Application name'}</strong>
            <span className="summary-value">{values.url?.trim() || 'Health-check URL'}</span>
          </div>
          <div className="onboarding-summary-block">
            <span className="summary-label">ORGANIZATION</span>
            <strong>{domains.find((item) => item.id === values.domainId)?.domainName || 'Domain not selected'}</strong>
            <span className="summary-value">{values.email?.trim() || 'Owner email'}</span>
          </div>
          <div className="onboarding-summary-facts">
            <span><span>Failed probes</span><strong>{values.failureThreshold ?? 2} consecutive</strong></span>
            <span><span>Cloud provider</span><strong>AWS</strong></span>
            <span><span>EC2 instance</span><strong>{awsSetupValues.instanceId.trim() || 'Not added yet'}</strong></span>
            <span><span>Alert channel</span><strong>{values.teamslink?.trim() ? 'Teams workflow added' : 'Not configured'}</strong></span>
          </div>
          <p className="onboarding-summary-note">CloudWatch permissions and region are configured on the API server. This form does not collect AWS credentials.</p>
        </aside>
      </div>
      {restoredDraft && <button type="button" className="text-action clear-draft" onClick={() => { dispatch(clearOnboardingDraft()); window.sessionStorage.removeItem('opsintel-onboarding-draft'); window.sessionStorage.removeItem('opsintel-cloudwatch-draft'); window.location.reload(); }}>Discard saved draft</button>}
    </div>
  );
}
