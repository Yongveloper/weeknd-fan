const DAY_MS = 86_400_000;
// Asia/Seoul is a fixed UTC+9 with no DST, so shifting the timestamp is enough
// to read the Seoul calendar day. Intl.DateTimeFormat with a timeZone costs
// tens of milliseconds on first construction (ICU tz data), which pushed the
// home page's countdown module evaluation past the 50ms long-task budget.
const SEOUL_OFFSET_MS = 9 * 3_600_000;

function calendarDaysUntil(now: Date, target: Date): number {
  const toUtcDay = (date: Date) => {
    const shifted = new Date(date.getTime() + SEOUL_OFFSET_MS);

    return Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    );
  };

  return Math.max(0, Math.round((toUtcDay(target) - toUtcDay(now)) / DAY_MS));
}

export type CountdownPhase =
  'before-day-one' | 'before-day-two' | 'day-two-live' | 'archive';

export type CountdownInput = {
  now: Date;
  dayOneStart: string;
  dayTwoStart: string;
  archivePublished: boolean;
};

export type CountdownState = {
  phase: CountdownPhase;
  primaryLabel: string;
  showClock: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  accessibleLabel: string;
  captionLabel: string;
};

export function getSelectedShowLabel(input: {
  now: Date;
  showStart: string;
}): string {
  const showStart = new Date(input.showStart);
  if (input.now >= showStart) return 'SHOW DAY';
  const days = calendarDaysUntil(input.now, showStart);
  return days === 0 ? 'D-DAY' : `D-${days}`;
}

const emptyClock = { hours: 0, minutes: 0, seconds: 0 };

export function getCountdownState(input: CountdownInput): CountdownState {
  const now = input.now.getTime();
  const dayOneDate = new Date(input.dayOneStart);
  const dayTwoDate = new Date(input.dayTwoStart);
  const dayOne = dayOneDate.getTime();
  const dayTwo = dayTwoDate.getTime();

  if (input.archivePublished && now >= dayTwo) {
    return {
      phase: 'archive',
      primaryLabel: 'WE WERE HERE',
      showClock: false,
      ...emptyClock,
      accessibleLabel: '양일 공연 기록 보기',
      captionLabel: '',
    };
  }

  if (now >= dayTwo) {
    return {
      phase: 'day-two-live',
      primaryLabel: 'TONIGHT',
      showClock: false,
      ...emptyClock,
      accessibleLabel: '두 번째 고양 공연이 시작되었습니다',
      captionLabel: '',
    };
  }

  const targetDate = now < dayOne ? dayOneDate : dayTwoDate;
  const remaining = Math.max(0, targetDate.getTime() - now);
  const days = calendarDaysUntil(input.now, targetDate);

  return {
    phase: now < dayOne ? 'before-day-one' : 'before-day-two',
    primaryLabel: days === 0 ? 'D-DAY' : `D-${days}`,
    showClock: remaining <= DAY_MS,
    hours: Math.floor((remaining % DAY_MS) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
    accessibleLabel: `고양 공연까지 ${days}일 남았습니다`,
    captionLabel: now < dayOne ? '첫 공연까지' : '둘째 날 공연까지',
  };
}
