/**
 * Decides which hero video the home page may stream. The intro is 5.6MiB and
 * the loop 3.6MiB at 1440×1440; phones never display more than ~800 device
 * pixels of it, and data-saver users should not pay for it at all.
 */
export type HeroVideoVariant = 'full' | 'compact' | 'none';

export interface MediaPolicyInput {
  saveData: boolean;
  effectiveType?: string;
  compactViewport: boolean;
}

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g']);

export function heroVideoVariant({
  saveData,
  effectiveType,
  compactViewport,
}: MediaPolicyInput): HeroVideoVariant {
  if (saveData) return 'none';
  if (effectiveType && SLOW_CONNECTIONS.has(effectiveType)) return 'none';
  return compactViewport ? 'compact' : 'full';
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/** Browser-only. Reads Network Information (Chromium) and the design breakpoint. */
export function readMediaPolicy(): MediaPolicyInput {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  return {
    saveData: connection?.saveData === true,
    effectiveType: connection?.effectiveType,
    compactViewport: matchMedia('(max-width: 42rem)').matches,
  };
}
