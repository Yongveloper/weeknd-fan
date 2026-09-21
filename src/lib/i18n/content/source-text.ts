export type TranslatableText = {
  title: string;
  summary: string;
  body?: string;
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Pulls only what a translator rewrites. Trust-contract fields
 * (status, lastVerifiedAt, sources, order, section) are deliberately
 * excluded so a routine source-date refresh never marks a translation
 * stale.
 */
export function parseMarkdownSource(raw: string, id: string): TranslatableText {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new Error(`Missing frontmatter: ${id}`);
  const frontmatter = match[1] ?? '';
  return {
    title: scalar(frontmatter, 'title', id),
    summary: scalar(frontmatter, 'summary', id),
    body: match[2] ?? '',
  };
}

// YAML block scalar indicators (`>`, `|`, with an optional chomping/indent
// modifier) with nothing else on the line. A folded or literal block value
// like `title: >` matches the "single non-space char" scalar regex below,
// so it must be rejected explicitly rather than accepted as a one-character
// title.
const BLOCK_SCALAR = /^[|>][+-]?\d*$/;

function scalar(frontmatter: string, key: string, id: string): string {
  const line = new RegExp(`^${key}: (\\S.*)$`, 'm').exec(frontmatter);
  const value = line?.[1]?.trim();
  if (!value || BLOCK_SCALAR.test(value)) {
    throw new Error(`Expected a single-line ${key} in ${id}`);
  }
  return value;
}
