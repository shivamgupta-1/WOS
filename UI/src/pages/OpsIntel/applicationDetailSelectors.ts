import type { ApiIncidentPeriod } from '../../types/domain';

export type HistoryDays = 1 | 7 | 30;

type HistoryBar = {
  date: string;
  status: 'healthy' | 'down' | 'unknown';
};

const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function getHistoryBars(history: ApiIncidentPeriod[], now: Date, days: HistoryDays): HistoryBar[] {
  const currentTime = now.getTime();
  const isHourly = days === 1;
  const interval = isHourly ? dayInMilliseconds / 24 : dayInMilliseconds;
  const barCount = isHourly ? 24 : days;
  const historyStart = currentTime - barCount * interval;
  const periods = history.map((period) => ({
    status: period.status,
    startAt: new Date(period.startAt).getTime(),
    endAt: period.endAt ? new Date(period.endAt).getTime() : currentTime,
  }));

  return Array.from({ length: barCount }, (_, index) => {
    const barStart = historyStart + index * interval;
    const rangeStart = barStart;
    const rangeEnd = Math.min(barStart + interval, currentTime);
    const overlappingPeriods = periods
      .filter((period) => period.startAt < rangeEnd && period.endAt > rangeStart)
      .sort((left, right) => left.startAt - right.startAt);
    const hasDowntime = overlappingPeriods.some((period) => period.status === 'DOWN');

    let coveredUntil = rangeStart;
    if (!hasDowntime) {
      for (const period of overlappingPeriods) {
        if (period.status !== 'UP') continue;
        const periodStart = Math.max(period.startAt, rangeStart);
        const periodEnd = Math.min(period.endAt, rangeEnd);
        if (periodStart > coveredUntil) break;
        coveredUntil = Math.max(coveredUntil, periodEnd);
      }
    }

    return {
      date: new Date(barStart).toISOString(),
      status: hasDowntime ? 'down' : coveredUntil >= rangeEnd ? 'healthy' : 'unknown',
    };
  });
}
