import { describe, expect, it } from 'vitest';
import { applicationDetailTabFromParam } from './applicationDetailTabTypes';

describe('application detail tab route state', () => {
  it('resolves URL slugs, including labels with spaces', () => {
    expect(applicationDetailTabFromParam('logs-and-traces')).toBe('Logs and traces');
    expect(applicationDetailTabFromParam('configuration')).toBe('Configuration');
  });

  it('defaults unknown or missing tabs to Metrics', () => {
    expect(applicationDetailTabFromParam(null)).toBe('Metrics');
    expect(applicationDetailTabFromParam('not-a-tab')).toBe('Metrics');
  });
});
