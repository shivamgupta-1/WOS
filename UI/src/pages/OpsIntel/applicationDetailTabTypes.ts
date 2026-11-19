export const applicationDetailTabs = [
  'Metrics',
  'Dependencies',
  'Logs and traces',
  'Alerts',
  'Deployments',
  'Configuration',
] as const;

export type ApplicationDetailTab = typeof applicationDetailTabs[number];

export function applicationDetailTabFromParam(value: string | null): ApplicationDetailTab {
  return applicationDetailTabs.find(
    (tab) => tab.toLowerCase().replaceAll(' ', '-') === value,
  ) ?? 'Metrics';
}
