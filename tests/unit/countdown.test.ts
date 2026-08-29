import { describe, expect, it } from 'vitest';
import { getCountdownState } from '../../src/lib/countdown';

const schedule = {
  dayOneStart: '2026-10-07T19:45:00+09:00',
  dayTwoStart: '2026-10-08T19:45:00+09:00',
  archivePublished: false,
};

describe('getCountdownState', () => {
  it('counts toward day one before the first show', () => {
    const state = getCountdownState({
      ...schedule,
      now: new Date('2026-08-29T19:45:00+09:00'),
    });

    expect(state.phase).toBe('before-day-one');
    expect(state.primaryLabel).toBe('D-39');
    expect(state.showClock).toBe(false);
  });

  it('switches to day two as soon as day one starts', () => {
    const state = getCountdownState({
      ...schedule,
      now: new Date('2026-10-07T20:00:00+09:00'),
    });

    expect(state.phase).toBe('before-day-two');
    expect(state.primaryLabel).toBe('D-1');
    expect(state.showClock).toBe(true);
  });

  it('uses D-DAY on the Seoul calendar date before showtime', () => {
    const state = getCountdownState({
      ...schedule,
      now: new Date('2026-10-07T09:00:00+09:00'),
    });

    expect(state.primaryLabel).toBe('D-DAY');
  });

  it('does not claim the archive before the editor publishes it', () => {
    const state = getCountdownState({
      ...schedule,
      now: new Date('2026-10-08T20:00:00+09:00'),
    });

    expect(state.phase).toBe('day-two-live');
    expect(state.primaryLabel).toBe('TONIGHT');
  });

  it('changes to the archive only after publication', () => {
    const state = getCountdownState({
      ...schedule,
      archivePublished: true,
      now: new Date('2026-10-08T23:00:00+09:00'),
    });

    expect(state.phase).toBe('archive');
    expect(state.primaryLabel).toBe('WE WERE HERE');
  });
});
