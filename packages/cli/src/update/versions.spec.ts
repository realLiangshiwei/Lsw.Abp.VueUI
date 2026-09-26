import { describe, expect, it } from 'vitest';
import { compareVersions, parseRange } from './versions.js';

describe('compareVersions', () => {
  it('orders by major, minor and patch', () => {
    expect(compareVersions('0.2.0', '0.1.9')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '0.99.99')).toBeGreaterThan(0);
    expect(compareVersions('0.1.2', '0.1.10')).toBeLessThan(0);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('a prerelease is older than the release it leads to', () => {
    expect(compareVersions('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
    expect(compareVersions('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0);
  });

  it('orders prereleases numerically where they are numbers', () => {
    expect(compareVersions('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0);
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareVersions('1.0.0-rc', '1.0.0-rc.1')).toBeLessThan(0);
  });
});

describe('parseRange', () => {
  it('reads a version and the modifier in front of it', () => {
    expect(parseRange('^0.1.0')).toEqual({ modifier: '^', version: '0.1.0' });
    expect(parseRange('~1.2.3')).toEqual({ modifier: '~', version: '1.2.3' });
    expect(parseRange('1.2.3')).toEqual({ modifier: '', version: '1.2.3' });
    expect(parseRange('0.0.0-dev.abc123')).toEqual({
      modifier: '',
      version: '0.0.0-dev.abc123',
    });
  });

  it('reads nothing out of a range that is not one version', () => {
    // Anything here is a decision the project made on purpose, and rewriting it would
    // be the command deciding something it was not asked to.
    for (const range of ['latest', 'file:../core', 'workspace:^', '>=1 <2', '1.x']) {
      expect(parseRange(range)).toBeUndefined();
    }
  });
});
