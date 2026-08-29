/* global console, process */
import { URL, fileURLToPath } from 'node:url';

const httpsOriginError =
  'PUBLIC_SITE_URL must be an absolute HTTPS URL for a production deployment';

export function validateProductionOrigin(value) {
  if (!value) {
    throw new Error('PUBLIC_SITE_URL is required for a production deployment');
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname) return url.toString();
  } catch {
    // Normalize invalid URLs to the same operator-facing preflight error.
  }

  throw new Error(httpsOriginError);
}

export const assertProductionOrigin = validateProductionOrigin;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(
    `Validated production origin: ${validateProductionOrigin(process.env.PUBLIC_SITE_URL)}`,
  );
}
