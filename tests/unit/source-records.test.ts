import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourcePath = (name: string) =>
  join(process.cwd(), 'src/data/sources', `${name}.json`);

describe('official transport sources', () => {
  it('keeps the NOL ticket transport SMS as a non-linkable, dated transcript', async () => {
    const source = JSON.parse(
      await readFile(sourcePath('nol-weeknd-transport-sms'), 'utf8'),
    ) as Record<string, unknown>;

    expect(source).toMatchObject({
      name: 'NOL 티켓 문자 안내',
      kind: 'official',
      medium: 'sms',
      sender: 'NOL 티켓',
      receivedAt: '2026-09-01',
    });
    expect(source).not.toHaveProperty('url');
    expect(source).not.toHaveProperty('lastCheckedAt');
    expect(source.transcript).toContain('카카오 T 유료 셔틀 운행 및 예약 안내');
  });

  it('keeps the Kakao T shuttle reservation as a checked official web source', async () => {
    const source = JSON.parse(
      await readFile(sourcePath('kakao-t-weeknd-shuttle'), 'utf8'),
    ) as Record<string, unknown>;

    expect(source).toEqual({
      name: '카카오 T — The Weeknd 유료 셔틀 예약',
      url: 'https://kko.to/NSrfta0uxT',
      kind: 'official',
      lastCheckedAt: '2026-09-01',
    });
  });
});
