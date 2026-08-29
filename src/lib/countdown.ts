const DAY_MS = 86_400_000;

const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function calendarDaysUntil(now: Date, target: Date): number {
  const toUtcDay = (date: Date) => {
    const parts = Object.fromEntries(
      seoulDate.formatToParts(date).map(({ type, value }) => [type, value]),
    );

    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
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
};

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
    };
  }

  if (now >= dayTwo) {
    return {
      phase: 'day-two-live',
      primaryLabel: 'TONIGHT',
      showClock: false,
      ...emptyClock,
      accessibleLabel: '두 번째 고양 공연이 시작되었습니다',
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
  };
}
