import { FormProvider } from 'react-hook-form';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { OnboardingAwsStep } from './OnboardingAwsStep';
import { OnboardingDetailsStep } from './OnboardingDetailsStep';
import { OnboardingSummary } from './OnboardingSummary';
import { useOnboardingWizard } from './useOnboardingWizard';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const wizard = useOnboardingWizard();

  return (
    <div className="onboarding-v2">
      <nav className="onboarding-v2-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <ChevronRight aria-hidden="true" size={14} />
        <span aria-current="page">Onboarding</span>
      </nav>

      <PageHeader
        eyebrow={`Application setup · Step ${wizard.step} of 2`}
        title="Onboard an application"
        description={wizard.step === 1
          ? 'Add service details and configure its health-check alerts.'
          : 'Associate an AWS EC2 instance to view its available CloudWatch metrics.'}
        className="onboarding-v2-page-header"
        actions={<Button variant="secondary" onClick={wizard.saveDraft}>Save draft</Button>}
      />

      <div className="onboarding-v2-layout">
        <section className="surface onboarding-v2-form-surface" aria-label="Application onboarding form">
          <ol className="onboarding-v2-progress" aria-label={`Onboarding progress, step ${wizard.step} of 2`}>
            <li className={wizard.step === 1 ? 'is-active' : 'is-complete'} aria-current={wizard.step === 1 ? 'step' : undefined}>
              <span>1</span><strong>Application details</strong>
            </li>
            <li className={wizard.step === 2 ? 'is-active' : ''} aria-current={wizard.step === 2 ? 'step' : undefined}>
              <span>2</span><strong>AWS instance</strong>
            </li>
          </ol>
          <FormProvider {...wizard.form}>
            <form className="onboarding-v2-form" onSubmit={wizard.handleFormSubmit} noValidate>
              {wizard.step === 1 ? (
                <OnboardingDetailsStep
                  domains={wizard.domains}
                  isLoadingDomains={wizard.isLoadingDomains}
                  domainsFailed={wizard.domainsFailed}
                  onRetryDomains={() => void wizard.retryDomains()}
                  submitError={wizard.submitError}
                  draftNotice={wizard.draftNotice}
                  onCancel={wizard.cancelOnboarding}
                  onContinue={() => void wizard.continueToCloudWatch()}
                />
              ) : (
                <OnboardingAwsStep
                  instanceId={wizard.instanceId}
                  cloudWatchError={wizard.cloudWatchError}
                  metricsLoading={wizard.metricsLoading}
                  metricsError={wizard.metricsError}
                  metrics={wizard.metrics}
                  submitError={wizard.submitError}
                  draftNotice={wizard.draftNotice}
                  isCreating={wizard.isCreating}
                  isInstanceIdValid={wizard.isInstanceIdValid}
                  onInstanceIdChange={wizard.updateAwsInstanceId}
                  onFetchMetrics={wizard.fetchAwsMetrics}
                  onPrevious={wizard.returnToDetails}
                  onCancel={wizard.cancelOnboarding}
                />
              )}
            </form>
          </FormProvider>
        </section>

        <OnboardingSummary
          values={wizard.values}
          domains={wizard.domains}
          instanceId={wizard.instanceId}
        />
      </div>
      {wizard.restoredDraft && (
        <Button type="button" variant="ghost" className="onboarding-v2-discard" onClick={wizard.discardSavedDraft}>
          Discard saved draft
        </Button>
      )}
    </div>
  );
}
