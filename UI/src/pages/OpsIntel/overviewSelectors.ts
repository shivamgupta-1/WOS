import type { ApplicationSummary, HealthStatus } from '../../types/domain';

export type OverviewStatusFilter = HealthStatus | 'all';
export type OverviewGroupBy = 'domain' | 'status';

const statusOrder: Record<HealthStatus, number> = {
  down: 0,
  degraded: 1,
  healthy: 2,
  unknown: 3,
};

export function filterApplications(
  applications: ApplicationSummary[],
  options: { search: string; domain: string; status: OverviewStatusFilter },
): ApplicationSummary[] {
  const search = options.search.trim().toLocaleLowerCase();
  return applications.filter((application) =>
    (options.status === 'all' || application.status === options.status)
    && (options.domain === 'All domains' || application.domainName === options.domain)
    && (!search || `${application.name} ${application.domainName}`.toLocaleLowerCase().includes(search)),
  );
}

export function groupApplications(
  applications: ApplicationSummary[],
  groupBy: OverviewGroupBy,
): Array<{ name: string; applications: ApplicationSummary[] }> {
  const groups = new Map<string, ApplicationSummary[]>();
  for (const application of applications) {
    const name = groupBy === 'domain'
      ? application.domainName
      : application.status.charAt(0).toUpperCase() + application.status.slice(1);
    const group = groups.get(name) ?? [];
    group.push(application);
    groups.set(name, group);
  }

  return Array.from(groups, ([name, items]) => ({
    name,
    applications: items.sort((left, right) =>
      statusOrder[left.status] - statusOrder[right.status] || left.name.localeCompare(right.name),
    ),
  })).sort((left, right) => {
    const problems = (group: typeof left) =>
      group.applications.filter((application) => application.status === 'down' || application.status === 'degraded').length;
    const severity = (group: typeof left) => Math.min(...group.applications.map((application) => statusOrder[application.status]));
    return problems(right) - problems(left) || severity(left) - severity(right) || left.name.localeCompare(right.name);
  });
}
