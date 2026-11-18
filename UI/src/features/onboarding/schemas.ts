import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, 'Enter an application name with at least 2 characters.'),
  url: z.string().trim().url('Enter a valid health-check URL.'),
  domainId: z.string().min(1, 'Choose a domain.'),
  description: z.string().trim(),
  email: z.string().trim().email('Enter a valid owner email address.'),
  teamslink: z.string().trim().url('Enter a valid workflow url.'),
  failureThreshold: z.number().int().min(1, 'Failure threshold must be at least 1.').max(10, 'Failure threshold cannot exceed 10.'),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
