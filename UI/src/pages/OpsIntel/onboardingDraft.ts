import { onboardingSchema } from '../../features/onboarding/schemas';
import type { OnboardingValues } from '../../features/onboarding/schemas';

export const defaultOnboardingValues: OnboardingValues = {
  name: '',
  url: '',
  domainId: '',
  description: '',
  email: '',
  teamslink: '',
  failureThreshold: 2,
};

export type AwsSetupValues = { instanceId: string };
export const defaultAwsSetupValues: AwsSetupValues = { instanceId: '' };
export const awsInstanceIdPattern = /^i-[a-fA-F0-9]{8,17}$/;
export const applicationFields: Array<keyof OnboardingValues> = [
  'name',
  'url',
  'domainId',
  'description',
  'email',
  'teamslink',
  'failureThreshold',
];

export function readSessionDraft(): Partial<OnboardingValues> | null {
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

export function readAwsDraft(): AwsSetupValues {
  try {
    const saved = window.sessionStorage.getItem('opsintel-cloudwatch-draft');
    if (!saved) return defaultAwsSetupValues;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || !('instanceId' in parsed)) return defaultAwsSetupValues;
    return { instanceId: typeof parsed.instanceId === 'string' ? parsed.instanceId : '' };
  } catch {
    return defaultAwsSetupValues;
  }
}
