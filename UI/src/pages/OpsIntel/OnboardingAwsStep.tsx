import { Info } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import type { AwsInstanceMetricsResponse } from '../../types/domain';

interface OnboardingAwsStepProps {
  instanceId: string;
  cloudWatchError: string;
  metricsLoading: boolean;
  metricsError: string;
  metrics: AwsInstanceMetricsResponse | undefined;
  submitError: string;
  draftNotice: string;
  isCreating: boolean;
  isInstanceIdValid: boolean;
  onInstanceIdChange: (value: string) => void;
  onFetchMetrics: () => void;
  onPrevious: () => void;
  onCancel: () => void;
}

function metricValue(value: number | null, unit: string) {
  return value == null
    ? 'No data'
    : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`;
}

export function OnboardingAwsStep({
  instanceId,
  cloudWatchError,
  metricsLoading,
  metricsError,
  metrics,
  submitError,
  draftNotice,
  isCreating,
  isInstanceIdValid,
  onInstanceIdChange,
  onFetchMetrics,
  onPrevious,
  onCancel,
}: OnboardingAwsStepProps) {
  return (
    <>
      <header className="onboarding-v2-step-intro">
        <h2 id="onboarding-step-heading" tabIndex={-1}>AWS instance</h2>
        <p>Connect an EC2 instance to view its available CloudWatch metrics.</p>
      </header>
      <div className="onboarding-v2-info" role="note">
        <Info aria-hidden="true" size={18} />
        <div>
          <strong>Enter an EC2 instance ID to preview AWS metrics.</strong>
          <p>The API uses the AWS credentials and region configured on the server. This form does not collect AWS credentials.</p>
        </div>
      </div>
      <div className="onboarding-v2-aws-field">
        <Input
          label="EC2 instance ID *"
          required
          autoComplete="off"
          placeholder="i-0123456789abcdef0"
          value={instanceId}
          onChange={(event) => onInstanceIdChange(event.target.value)}
          hint="Saved with this application and used to request the available CloudWatch metrics."
          {...(cloudWatchError ? { error: cloudWatchError } : {})}
        />
        <Button type="button" variant="secondary" onClick={onFetchMetrics} disabled={metricsLoading}>
          {metricsLoading ? 'Fetching metrics...' : 'Fetch AWS metrics'}
        </Button>
      </div>
      {metricsLoading && (
        <div className="onboarding-v2-metric-loading" role="status" aria-label="Fetching AWS metrics">
          {Array.from({ length: 5 }, (_, index) => <Skeleton variant="block" key={index} />)}
        </div>
      )}
      {metricsError && <p className="onboarding-v2-error" role="alert">{metricsError}</p>}
      {metrics && (
        <section className="onboarding-v2-metrics" aria-label="AWS metrics preview" aria-live="polite">
          <header>
            <div>
              <h3>Metrics for {metrics.application.instanceId}</h3>
              <p>{metrics.application.region} · Instance state: {metrics.application.state}</p>
            </div>
            <Badge variant="info">CloudWatch</Badge>
          </header>
          <dl>
            <div><dt>CPU</dt><dd>{metricValue(metrics.metrics.cpu, '%')}</dd></div>
            <div><dt>Memory</dt><dd>{metricValue(metrics.metrics.memory, '%')}</dd></div>
            <div><dt>Disk</dt><dd>{metricValue(metrics.metrics.disk, '%')}</dd></div>
            <div><dt>Network in</dt><dd>{metricValue(metrics.metrics.networkIn, ' bytes')}</dd></div>
            <div><dt>Network out</dt><dd>{metricValue(metrics.metrics.networkOut, ' bytes')}</dd></div>
          </dl>
          <p>“No data” means CloudWatch returned no recent value for that metric.</p>
        </section>
      )}
      {submitError && <p className="onboarding-v2-error" role="alert">{submitError}</p>}
      {draftNotice && <p className="onboarding-v2-notice" role="status">{draftNotice}</p>}
      <footer className="onboarding-v2-actions">
        <Button type="button" variant="secondary" onClick={onPrevious}>Previous</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={isCreating} disabled={!isInstanceIdValid}>
          Create application
        </Button>
      </footer>
    </>
  );
}
