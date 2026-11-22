// Security rules tests. They run against the local Firebase emulator, never
// the live database:
//
//   npm run test:rules
//
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

let env: RulesTestEnvironment;

const U = 'UNITY-TEST-2026';
const OTHER = 'UNITY-OTHER-2026';

const anon = () => env.authenticatedContext('anon', { firebase: { sign_in_provider: 'anonymous' } }).database();
const as = (uid: string) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'password' } }).database();
const nobody = () => env.unauthenticatedContext().database();

const entity = (id: string, ownerUid: string, extra: Record<string, unknown> = {}) => ({
  id, unityId: U, name: id, fullName: id, ownerUid, approval: 'approved', status: 'active', ...extra,
});
const meeting = (id: string, host: string, participants: string[], extra: Record<string, unknown> = {}) => ({
  id, unityId: U, title: 'Planning', date: '2026-03-01', type: 'strategy', format: 'virtual', location: 'Virtual',
  purpose: 'Agree the plan.', outcome: 'Plan agreed.', participants, hostId: host, status: 'pending',
  approvals: Object.fromEntries(participants.map((p) => [p, p === host ? 'approved' : 'pending'])),
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-unity',
    database: { rules: readFileSync('database.rules.json', 'utf8'), host: '127.0.0.1', port: 9000 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.database().ref().set({
      admins: { A1: { username: 'old', password: 'plaintext' } },
      unities: {
        [U]: { unityId: U, name: 'Test network', ownerUid: 'admin', acceptingMembers: true, accessCode: 'ABC1234' },
        [OTHER]: { unityId: OTHER, name: 'Other network', ownerUid: 'otherAdmin' },
      },
      users: {
        admin: { role: 'admin', unityId: U },
        otherAdmin: { role: 'admin', unityId: OTHER },
        alice: { role: 'member', unityId: U, orgId: 'ALICE-1' },
        bob: { role: 'member', unityId: U, orgId: 'BOB-1' },
        carol: { role: 'member', unityId: U, orgId: 'CAROL-1' },
        pat: { role: 'member', unityId: U, orgId: 'PAT-1' },
      },
      entities: {
        'ALICE-1': entity('ALICE-1', 'alice'),
        'BOB-1': entity('BOB-1', 'bob'),
        'CAROL-1': entity('CAROL-1', 'carol'),
        'PAT-1': entity('PAT-1', 'pat', { approval: 'pending', status: 'inactive' }),
      },
      meetings: {
        M1: meeting('M1', 'ALICE-1', ['ALICE-1', 'BOB-1']),
      },
    });
  });
});

describe('reading', () => {
  it('needs a sign-in', async () => {
    await assertFails(nobody().ref('meetings').once('value'));
    await assertFails(nobody().ref('entities').once('value'));
  });

  it('lets demo (anonymous) visitors read the network', async () => {
    await assertSucceeds(anon().ref('meetings').once('value'));
    await assertSucceeds(anon().ref('entities').once('value'));
    await assertSucceeds(anon().ref('unities').once('value'));
  });

  it('never exposes the old admins table', async () => {
    await assertFails(as('admin').ref('admins').once('value'));
    await assertFails(anon().ref('admins').once('value'));
  });

  it('lets people read only their own account link', async () => {
    await assertSucceeds(as('alice').ref('users/alice').once('value'));
    await assertFails(as('alice').ref('users/bob').once('value'));
  });
});

describe('demo visitors', () => {
  it('cannot write anything', async () => {
    await assertFails(anon().ref('meetings/M1/approvals/BOB-1').set('approved'));
    await assertFails(anon().ref('entities/X-1').set(entity('X-1', 'anon', { approval: 'pending', status: 'inactive' })));
    await assertFails(anon().ref('unities/U-NEW').set({ unityId: 'U-NEW', name: 'x', ownerUid: 'anon' }));
  });
});

describe('applying to join', () => {
  const application = (uid: string, extra: Record<string, unknown> = {}) => ({
    'entities/NEW-1': entity('NEW-1', uid, { approval: 'pending', status: 'inactive', ...extra }),
    [`users/${uid}`]: { role: 'member', unityId: U, orgId: 'NEW-1' },
  });

  it('creates a pending organisation and the account link in one write', async () => {
    await assertSucceeds(as('newbie').ref().update(application('newbie')));
  });

  it('cannot apply as already approved', async () => {
    await assertFails(as('newbie').ref().update(application('newbie', { approval: 'approved', status: 'active' })));
  });

  it("cannot link an account to someone else's organisation", async () => {
    await assertFails(as('mallory').ref('users/mallory').set({ role: 'member', unityId: U, orgId: 'ALICE-1' }));
  });

  it('cannot make itself an admin', async () => {
    await assertFails(as('mallory').ref('users/mallory').set({ role: 'admin', unityId: U }));
  });

  it("is refused when the network isn't accepting members", async () => {
    await env.withSecurityRulesDisabled((ctx) => ctx.database().ref(`unities/${U}/acceptingMembers`).set(false));
    await assertFails(as('newbie').ref().update(application('newbie')));
  });
});

describe('creating a network', () => {
  it('creates the network and its admin link together', async () => {
    await assertSucceeds(
      as('founder').ref().update({
        'unities/UNITY-NEW-2026': { unityId: 'UNITY-NEW-2026', name: 'New', ownerUid: 'founder' },
        'users/founder': { role: 'admin', unityId: 'UNITY-NEW-2026' },
      }),
    );
  });

  it("cannot take over someone else's network", async () => {
    await assertFails(as('mallory').ref(`unities/${U}/ownerUid`).set('mallory'));
    await assertFails(as('mallory').ref(`unities/${U}/name`).set('Hijacked'));
  });
});

describe('admins', () => {
  it('approve applications in their own network', async () => {
    await assertSucceeds(as('admin').ref('entities/PAT-1').update({ approval: 'approved', status: 'active' }));
  });

  it("can't touch another network's members", async () => {
    await assertFails(as('otherAdmin').ref('entities/PAT-1').update({ approval: 'approved', status: 'active' }));
  });

  it('edit their network settings', async () => {
    await assertSucceeds(as('admin').ref(`unities/${U}/focusAreas`).set(['Health', 'Data']));
  });
});

describe('members', () => {
  it('edit their own profile', async () => {
    await assertSucceeds(as('alice').ref('entities/ALICE-1/description').set('We coordinate.'));
  });

  it("can't approve themselves or edit others", async () => {
    await assertFails(as('pat').ref('entities/PAT-1').update({ approval: 'approved', status: 'active' }));
    await assertFails(as('alice').ref('entities/BOB-1/description').set('Hacked'));
  });
});

describe('meetings', () => {
  it('can be logged by an approved member as host', async () => {
    await assertSucceeds(as('alice').ref('meetings/M2').set(meeting('M2', 'ALICE-1', ['ALICE-1', 'CAROL-1'])));
  });

  it("can't be logged on someone else's behalf, or pre-confirmed", async () => {
    await assertFails(as('alice').ref('meetings/M2').set(meeting('M2', 'BOB-1', ['BOB-1', 'CAROL-1'])));
    await assertFails(
      as('alice').ref('meetings/M2').set(meeting('M2', 'ALICE-1', ['ALICE-1', 'CAROL-1'], { status: 'confirmed' })),
    );
    await assertFails(
      as('alice').ref('meetings/M2').set(
        meeting('M2', 'ALICE-1', ['ALICE-1', 'CAROL-1'], { approvals: { 'ALICE-1': 'approved', 'CAROL-1': 'approved' } }),
      ),
    );
  });

  it("can't be logged by a member who isn't approved yet", async () => {
    await assertFails(as('pat').ref('meetings/M2').set(meeting('M2', 'PAT-1', ['PAT-1', 'ALICE-1'])));
  });

  it('are verified by each participant for themselves', async () => {
    await assertSucceeds(as('bob').ref('meetings/M1').update({ 'approvals/BOB-1': 'approved', status: 'confirmed' }));
  });

  it('let a participant dispute, then withdraw the dispute', async () => {
    await assertSucceeds(as('bob').ref('meetings/M1/approvals/BOB-1').set('disputed'));
    await assertSucceeds(as('bob').ref('meetings/M1/approvals/BOB-1').set('pending'));
  });

  it('keep verification permanent', async () => {
    await assertSucceeds(as('bob').ref('meetings/M1/approvals/BOB-1').set('approved'));
    await assertFails(as('bob').ref('meetings/M1/approvals/BOB-1').set('disputed'));
  });

  it("don't let anyone decide for another participant", async () => {
    await assertFails(as('alice').ref('meetings/M1/approvals/BOB-1').set('approved'));
    await assertFails(as('carol').ref('meetings/M1/approvals/BOB-1').set('approved'));
  });

  it("can't be rewritten or deleted after logging", async () => {
    await assertFails(as('alice').ref('meetings/M1/title').set('Something else'));
    await assertFails(as('alice').ref('meetings/M1/participants/1').set('CAROL-1'));
    await assertFails(as('alice').ref('meetings/M1').remove());
  });
});
