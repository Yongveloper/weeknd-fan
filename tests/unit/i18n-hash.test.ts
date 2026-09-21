import { describe, expect, it } from 'vitest';
import { translatableHash, urlsIn } from '../../src/lib/i18n/content/hash';
import { parseMarkdownSource } from '../../src/lib/i18n/content/source-text';
import {
  jsonTranslatableText,
  translatableJsonFields,
} from '../../scripts/i18n-hash.mjs';

const RAW = `---
title: 입장
summary: 타 공연 후기에서 반복된 경험입니다.
status: practical
lastVerifiedAt: 2026-08-29
sources:
  - news-ohmynews-2025-04
order: 32
section: tips
---

- 대화역 3번 출구. — [오마이뉴스](https://example.test/a)
- 보관함 부족. — [후기](https://example.test/b)
`;

describe('parseMarkdownSource', () => {
  it('takes only the translatable fields and the body', () => {
    const parsed = parseMarkdownSource(RAW, 'guides/32-tips-entry');
    expect(parsed.title).toBe('입장');
    expect(parsed.summary).toBe('타 공연 후기에서 반복된 경험입니다.');
    expect(parsed.body).toContain('대화역 3번 출구');
    expect(parsed.body).not.toContain('lastVerifiedAt');
  });

  it('fails loudly when a field is not a single-line scalar', () => {
    expect(() =>
      parseMarkdownSource('---\ntitle: >\n  folded\nsummary: x\n---\n', 'x'),
    ).toThrow('Expected a single-line title in x');
  });

  it('fails loudly without frontmatter', () => {
    expect(() => parseMarkdownSource('no fences', 'y')).toThrow(
      'Missing frontmatter: y',
    );
  });
});

describe('translatableHash', () => {
  it('is stable across trailing whitespace and line endings', () => {
    const a = translatableHash({ title: 'x', summary: 'y', body: 'a\nb' });
    const b = translatableHash({
      title: 'x',
      summary: 'y',
      body: 'a  \r\nb\n',
    });
    expect(a).toBe(b);
  });

  it('changes when the prose changes', () => {
    const a = translatableHash({ title: 'x', summary: 'y', body: 'a' });
    const b = translatableHash({ title: 'x', summary: 'y', body: 'A' });
    expect(a).not.toBe(b);
  });

  it('does not depend on fields outside the translatable set', () => {
    const parsed = parseMarkdownSource(RAW, 'id');
    const withNewDate = parseMarkdownSource(
      RAW.replace('2026-08-29', '2026-09-30'),
      'id',
    );
    expect(translatableHash(parsed)).toBe(translatableHash(withNewDate));
  });

  it('is short enough to paste into frontmatter', () => {
    expect(translatableHash({ title: 'x', summary: 'y' })).toHaveLength(16);
  });
});

describe('translatableJsonFields', () => {
  it('does not hash concert.venue', () => {
    const base = {
      body: '',
      venue: '고양종합운동장',
      ageRestriction: '만 19세 이상',
      shows: [{ dateLabel: '2026.10.07 WED' }],
    };
    const changed = { ...base, venue: 'Somewhere Else Stadium' };
    expect(translatableJsonFields('concert', base)).toEqual(
      translatableJsonFields('concert', changed),
    );
  });

  it('does not hash sources.transcript', () => {
    const base = { name: 'NOL 티켓', transcript: '원본 문자 내용' };
    const changed = { ...base, transcript: '완전히 다른 문자 내용' };
    expect(translatableJsonFields('sources', base)).toEqual(
      translatableJsonFields('sources', changed),
    );
    expect(translatableJsonFields('sources', base)).toEqual([]);
  });

  it('still hashes a sources translation source: name via jsonTranslatableText', () => {
    const base = { name: 'NOL 티켓', transcript: 'x' };
    const changed = { name: 'NOL Ticket', transcript: 'x' };
    expect(
      translatableHash(jsonTranslatableText('sources', base, 'id')),
    ).not.toBe(
      translatableHash(jsonTranslatableText('sources', changed, 'id')),
    );
  });
});

describe('urlsIn', () => {
  it('collects markdown link targets in a stable order', () => {
    expect(
      urlsIn('[b](https://example.test/b) [a](https://example.test/a)'),
    ).toEqual(['https://example.test/a', 'https://example.test/b']);
  });

  it('ignores relative links', () => {
    expect(urlsIn('[x](/goyang/)')).toEqual([]);
  });
});
