import { describe, expect, it } from 'vitest';
import type { ApiIncidentPeriod } from '../../types/domain';
import { getHistoryBars } from './applicationDetailSelectors';

const now = new Date('2026-01-31T12:00:00.000Z');

describe('application status history', () => {
  it('keeps periods with no recorded health data as unknown', () => {
    const bars = getHistoryBars([], now, 1);

    expect(bars).toHaveLength(24);
    expect(bars.every((bar) => bar.status === 'unknown')).toBe(true);
  });

  it('marks only fully covered healthy intervals as healthy and downtime as down', () => {
    const history: ApiIncidentPeriod[] = [
      {
        id: 'healthy-period',
        status: 'UP',
        startAt: '2026-01-31T10:00:00.000Z',
        endAt: '2026-01-31T11:00:00.000Z',
        errorMessage: null,
      },
      {
        id: 'down-period',
        status: 'DOWN',
        startAt: '2026-01-31T11:10:00.000Z',
        endAt: '2026-01-31T11:20:00.000Z',
        errorMessage: 'Connection timed out',
      },
    ];
    const bars = getHistoryBars(history, now, 1);

    expect(bars.find((bar) => bar.date === '2026-01-31T10:00:00.000Z')?.status).toBe('healthy');
    expect(bars.find((bar) => bar.date === '2026-01-31T11:00:00.000Z')?.status).toBe('down');
    expect(bars.find((bar) => bar.date === '2026-01-31T09:00:00.000Z')?.status).toBe('unknown');
  });
});
