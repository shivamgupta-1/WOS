import { CloudCog } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import type { ApiDomain } from '../../types/domain';
import type { OnboardingValues } from '../../features/onboarding/schemas';

interface OnboardingSummaryProps {
  values: Partial<OnboardingValues>;
  domains: ApiDomain[];
  instanceId: string;
}

export function OnboardingSummary({ values, domains, instanceId }: OnboardingSummaryProps) {
  const selectedDomain = domains.find((domain) => domain.id === values.domainId);

  return (
    <aside className="surface onboarding-v2-summary" aria-label="Application setup summary">
      <header className="onboarding-v2-summary-header">
        <CloudCog aria-hidden="true" size={18} />
        <div><strong>AWS setup</strong><small>Cloud integration</small></div>
        <Badge variant="neutral">Selected</Badge>
      </header>
      <section className="onboarding-v2-summary-block" aria-labelledby="onboarding-summary-application">
        <h3 id="onboarding-summary-application">Application</h3>
        <strong>{values.name?.trim() || 'Not entered'}</strong>
        <span>{values.url?.trim() || 'Health-check URL not entered'}</span>
      </section>
      <section className="onboarding-v2-summary-block" aria-labelledby="onboarding-summary-ownership">
        <h3 id="onboarding-summary-ownership">Ownership</h3>
        <strong>{selectedDomain?.domainName || 'Domain not selected'}</strong>
        <span>{values.email?.trim() || 'Owner email not entered'}</span>
      </section>
      <dl className="onboarding-v2-summary-facts">
        <div><dt>Failed probes</dt><dd>{values.failureThreshold ?? 2} consecutive</dd></div>
        <div><dt>Cloud provider</dt><dd>AWS</dd></div>
        <div><dt>EC2 instance</dt><dd className="onboarding-v2-summary-instance">{instanceId.trim() || 'Not added'}</dd></div>
        <div><dt>Alert channel</dt><dd>{values.teamslink?.trim() ? 'Added' : 'Not configured'}</dd></div>
      </dl>
      <p className="onboarding-v2-summary-note">CloudWatch permissions and region are configured on the API server. This form does not collect AWS credentials.</p>
    </aside>
  );
}
