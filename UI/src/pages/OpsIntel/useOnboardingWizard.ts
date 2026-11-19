import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
import {
  applicationFields,
  awsInstanceIdPattern,
  defaultOnboardingValues,
  readAwsDraft,
  readSessionDraft,
} from './onboardingDraft';

export function useOnboardingWizard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const reduxDraft = useAppSelector((state) => state.onboarding.draft);
  const [restoredDraft] = useState(() => reduxDraft ?? readSessionDraft());
  const {
    data: domains = [],
    isLoading: isLoadingDomains,
    isError: domainsFailed,
    refetch: retryDomains,
  } = useGetDomainsQuery();
  const [createApplication, { isLoading: isCreating }] = useCreateApplicationMutation();
  const [submitError, setSubmitError] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const previousStep = useRef(step);
  const [awsSetupValues, setAwsSetupValues] = useState(readAwsDraft);
  const [cloudWatchError, setCloudWatchError] = useState('');
  const [fetchAwsInstanceMetrics, awsMetricsResult] = useLazyGetAwsInstanceMetricsQuery();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...defaultOnboardingValues, ...restoredDraft },
  });
  const watchedValues = useWatch({ control: form.control });
  const values = watchedValues ?? defaultOnboardingValues;

  useEffect(() => {
    if (restoredDraft && !reduxDraft) dispatch(saveOnboardingDraft(restoredDraft));
  }, [dispatch, reduxDraft, restoredDraft]);

  useEffect(() => {
    if (!watchedValues) return;
    dispatch(saveOnboardingDraft(watchedValues));
    try {
      window.sessionStorage.setItem('opsintel-onboarding-draft', JSON.stringify(watchedValues));
    } catch (error) {
      console.warn('Unable to persist the application onboarding draft.', error);
    }
  }, [dispatch, watchedValues]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem('opsintel-cloudwatch-draft', JSON.stringify(awsSetupValues));
    } catch (error) {
      console.warn('Unable to persist the AWS setup draft.', error);
    }
  }, [awsSetupValues]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    document.getElementById('onboarding-step-heading')?.focus();
  }, [step]);

  function saveDraft() {
    dispatch(saveOnboardingDraft(watchedValues));
    try {
      window.sessionStorage.setItem('opsintel-onboarding-draft', JSON.stringify(watchedValues));
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

  async function submitApplication(applicationValues: OnboardingValues) {
    setSubmitError('');
    try {
      const application = await createApplication({
        ...applicationValues,
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
    const isApplicationValid = await form.trigger(applicationFields);
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
    void form.handleSubmit(submitApplication)();
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

  function updateAwsInstanceId(instanceId: string) {
    setAwsSetupValues({ instanceId });
    setCloudWatchError('');
  }

  function returnToDetails() {
    setStep(1);
    setCloudWatchError('');
  }

  function discardSavedDraft() {
    dispatch(clearOnboardingDraft());
    window.sessionStorage.removeItem('opsintel-onboarding-draft');
    window.sessionStorage.removeItem('opsintel-cloudwatch-draft');
    window.location.reload();
  }

  const currentInstanceId = awsSetupValues.instanceId.trim();
  const isCurrentMetricsResult = awsMetricsResult.originalArgs === currentInstanceId;

  return {
    form,
    values,
    domains,
    isLoadingDomains,
    domainsFailed,
    retryDomains,
    isCreating,
    submitError,
    draftNotice,
    step,
    restoredDraft,
    instanceId: awsSetupValues.instanceId,
    isInstanceIdValid: awsInstanceIdPattern.test(currentInstanceId),
    cloudWatchError,
    metricsLoading: awsMetricsResult.isFetching,
    metrics: isCurrentMetricsResult ? awsMetricsResult.currentData : undefined,
    metricsError: isCurrentMetricsResult && awsMetricsResult.error
      ? getErrorMessage(awsMetricsResult.error)
      : '',
    saveDraft,
    cancelOnboarding,
    continueToCloudWatch,
    handleFormSubmit,
    fetchAwsMetrics,
    updateAwsInstanceId,
    returnToDetails,
    discardSavedDraft,
  };
}
