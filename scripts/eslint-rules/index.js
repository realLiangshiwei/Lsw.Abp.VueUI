import { noInjectAfterAwait } from './no-inject-after-await.js';

/** Rules that encode this repository's own invariants. Wired up in `eslint.config.js`. */
export default {
  meta: { name: 'abp' },
  rules: { 'no-inject-after-await': noInjectAfterAwait },
};
