import { defineAbpTestConfig } from '../../scripts/vitest-preset.ts';

export default defineAbpTestConfig({ packageUrl: import.meta.url, environment: 'happy-dom' });
