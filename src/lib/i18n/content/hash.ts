import { createHash } from 'node:crypto';
import type { TranslatableText } from './source-text';

const MARKDOWN_LINK = /\]\((https?:\/\/[^)\s]+)\)/g;

/** Build-time only. Never import this from a client bundle. */
export function translatableHash(text: TranslatableText): string {
  const normalized = [text.title, text.summary, text.body ?? '']
    .map((part) =>
      part
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .trim(),
    )
    .join('\n\u0000\n');
  return createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex')
    .slice(0, 16);
}

/**
 * Every citation a body carries. The Korean source attaches a link to each
 * claim, so a translation that drops one turns a sourced statement into an
 * unsourced one.
 */
export function urlsIn(body: string): string[] {
  return [...body.matchAll(MARKDOWN_LINK)]
    .map((match) => match[1] ?? '')
    .filter(Boolean)
    .sort();
}
