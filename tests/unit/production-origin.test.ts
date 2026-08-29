import { expect, test } from 'vitest';

import {
  assertProductionOrigin,
  validateProductionOrigin,
} from '../../scripts/assert-production-origin.mjs';

test.each([
  [undefined, 'PUBLIC_SITE_URL is required for a production deployment'],
  ['http://fan-guide.example', 'PUBLIC_SITE_URL must be an absolute HTTPS URL'],
  ['ftp://fan-guide.example', 'PUBLIC_SITE_URL must be an absolute HTTPS URL'],
  ['not a URL', 'PUBLIC_SITE_URL must be an absolute HTTPS URL'],
])('rejects an invalid production origin: %s', (value, message) => {
  expect(() => assertProductionOrigin(value)).toThrow(message);
});

test('accepts an absolute HTTPS production origin without deploying', () => {
  expect(validateProductionOrigin('https://fan-guide.example')).toBe(
    'https://fan-guide.example/',
  );
});
