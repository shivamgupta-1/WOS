import { describe, expect, it } from 'vitest';
import type { ApplicationSummary } from '../../types/domain';
import { filterApplications, groupApplications } from './overviewSelectors';

const applications: ApplicationSummary[] = [
  { id: '1', name: 'Healthy API', status: 'healthy', healthScore: null, availabilityPct: null, responseTimeMs: 15, errorRatePct: null, trend: [], owner: 'private@example.com', tier: null, domainName: 'Core', lastUpdated: null },
  { id: '2', name: 'Broken API', status: 'down', healthScore: null, availabilityPct: null, responseTimeMs: 90, errorRatePct: null, trend: [], owner: 'another@example.com', tier: null, domainName: 'Payments', lastUpdated: null },
  { id: '3', name: 'Slow API', status: 'degraded', healthScore: null, availabilityPct: null, responseTimeMs: 80, errorRatePct: null, trend: [], owner: 'team@example.com', tier: null, domainName: 'Payments', lastUpdated: null },
  { id: '4', name: 'Unknown API', status: 'unknown', healthScore: null, availabilityPct: null, responseTimeMs: null, errorRatePct: null, trend: [], owner: 'nobody@example.com', tier: null, domainName: 'Edge', lastUpdated: null },
];

describe('overview selectors', () => {
  it('filters by search, domain, and health state without searching owner emails', () => {
    expect(filterApplications(applications, { search: 'payments', domain: 'All domains', status: 'all' }).map((item) => item.id)).toEqual(['2', '3']);
    expect(filterApplications(applications, { search: '', domain: 'Payments', status: 'down' }).map((item) => item.id)).toEqual(['2']);
    expect(filterApplications(applications, { search: 'private@example.com', domain: 'All domains', status: 'all' })).toEqual([]);
  });

  it('groups by domain and sorts groups and services by problems first', () => {
    const groups = groupApplications(applications, 'domain');
    expect(groups[0]?.name).toBe('Payments');
    expect(groups[0]?.applications.map((item) => item.status)).toEqual(['down', 'degraded']);
  });

  it('can group the filtered list by status', () => {
    expect(groupApplications(applications, 'status').map((group) => group.name)).toEqual(['Down', 'Degraded', 'Healthy', 'Unknown']);
  });
});
