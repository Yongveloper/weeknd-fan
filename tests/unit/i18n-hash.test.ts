import { describe, expect, it } from 'vitest';
import { translatableHash, urlsIn } from '../../src/lib/i18n/content/hash';
import { parseMarkdownSource } from '../../src/lib/i18n/content/source-text';

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
