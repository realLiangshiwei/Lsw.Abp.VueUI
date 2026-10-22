import { describe, expect, it } from 'vitest';
import {
  delegationStatus,
  parseAccountLinkHandoff,
  trustedAccountOrigin,
} from './account-workflows.js';
const now = Date.parse('2026-10-20T12:00:00Z');
const handoff = {
  sourceOrigin: 'https://source.example',
  sourceUserId: '00000000-0000-0000-0000-000000000001',
  targetUserId: '00000000-0000-0000-0000-000000000002',
  sourceTenantId: null,
  targetTenantId: null,
  nonce: '00000000-0000-0000-0000-000000000004',
  issuedAt: now,
};
describe('account workflow boundaries', () => {
  it('accepts only explicitly trusted secure origins', () => {
    expect(trustedAccountOrigin('https://target.example/path', ['https://target.example'])).toBe(
      'https://target.example',
    );
    expect(
      trustedAccountOrigin('https://target.example.evil.test', ['https://target.example']),
    ).toBeUndefined();
    expect(
      trustedAccountOrigin('https://user:password@target.example', ['https://target.example']),
    ).toBeUndefined();
    expect(
      trustedAccountOrigin('http://target.example', ['http://target.example']),
    ).toBeUndefined();
    expect(trustedAccountOrigin('javascript:alert(1)', ['javascript:alert(1)'])).toBeUndefined();
  });
  it('permits explicit loopback development origins without accepting arbitrary http', () => {
    expect(trustedAccountOrigin('http://127.0.0.1:5179', ['http://127.0.0.1:5179'])).toBe(
      'http://127.0.0.1:5179',
    );
    expect(
      trustedAccountOrigin('http://localhost:5180', ['http://localhost:5179']),
    ).toBeUndefined();
  });
  it('projects only bounded navigation intent fields', () => {
    expect(
      parseAccountLinkHandoff(
        JSON.stringify({ ...handoff, arbitrary: 'discarded' }),
        ['https://source.example'],
        now,
      ),
    ).toEqual(handoff);
  });
  it.each([
    null,
    [],
    { ...handoff, sourceOrigin: 'https://evil.test' },
    { ...handoff, sourceUserId: 'guess' },
    { ...handoff, targetTenantId: 'guess' },
    { ...handoff, sourceTenantId: handoff.sourceUserId },
    { ...handoff, sourceTenantId: handoff.sourceUserId, sourceTenantName: 'a'.repeat(129) },
    { ...handoff, sourceTenantId: handoff.sourceUserId, sourceTenantName: 'bad\nname' },
    { ...handoff, sourceTenantId: null, sourceTenantName: 'unexpected' },
    { ...handoff, nonce: '' },
    { ...handoff, nonce: 'a'.repeat(8193) },
    { ...handoff, issuedAt: now - 300001 },
    { ...handoff, issuedAt: now + 30001 },
  ])('refuses malformed or expired handoffs %#', input => {
    expect(
      parseAccountLinkHandoff(JSON.stringify(input), ['https://source.example'], now),
    ).toBeUndefined();
  });
  it('does not throw when a handoff is invalid JSON', () => {
    expect(parseAccountLinkHandoff('{', ['https://source.example'], now)).toBeUndefined();
  });
  it('uses exact inclusive start and exclusive end delegation boundaries', () => {
    expect(delegationStatus('2026-10-20T12:00:01Z', '2026-10-20T13:00:00Z', now)).toBe('Future');
    expect(delegationStatus('2026-10-20T12:00:00Z', '2026-10-20T13:00:00Z', now)).toBe('Active');
    expect(delegationStatus('2026-10-20T11:00:00Z', '2026-10-20T12:00:00Z', now)).toBe('Expired');
    expect(delegationStatus('invalid', 'invalid', now)).toBe('Expired');
  });
});
