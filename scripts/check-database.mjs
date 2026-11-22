// Read-only health check of the Firebase Realtime Database.
//
//   npm run db:check
//
// Checks that the database answers, that the data is consistent (no meeting
// points at a missing or foreign organisation, confirmed means approved by
// everyone), and that private paths are not readable by the public.
// It never writes data. It signs in anonymously, the way the app's demo does,
// and checks that signed-in reads work.

const DB = (process.env.VITE_FIREBASE_DATABASE_URL ?? 'https://test-data-747c4-default-rtdb.firebaseio.com').replace(/\/$/, '');
const API_KEY = process.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyD3sfAfeOyqy5mbsDxHd1uFBRLVN0ZP1Iw';

const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail = '') => results.push({ ok: false, name, detail });
const warn = (name, detail = '') => results.push({ ok: 'warn', name, detail });

async function read(path, token) {
  const url = `${DB}/${path}.json${token ? `?auth=${token}` : ''}`;
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  return { status: res.status, ms: Date.now() - started, body: await res.json().catch(() => null) };
}

async function anonymousToken() {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? res.statusText);
  return json.idToken;
}

async function main() {
  console.log(`Checking ${DB}\n`);

  // 1. Public access: private paths must be closed.
  for (const path of ['admins', 'users']) {
    const r = await read(path);
    if (r.status === 200 && r.body !== null) fail(`"${path}" is closed to the public`, 'readable without signing in');
    else pass(`"${path}" is closed to the public`);
  }
  const publicData = await read('meetings');
  if (publicData.status === 200) warn('Network data needs a sign-in', 'meetings are readable without signing in');
  else pass('Network data needs a sign-in');

  // 2. Signed-in reads (as the app does).
  let token;
  if (API_KEY) {
    try {
      token = await anonymousToken();
      pass('Anonymous sign-in works', 'used by the demo');
    } catch (e) {
      fail('Anonymous sign-in works', e.message);
    }
  } else {
    warn('Anonymous sign-in works', 'skipped: set VITE_FIREBASE_API_KEY to test it');
  }

  const tables = {};
  for (const path of ['unities', 'entities', 'meetings']) {
    const r = await read(path, token);
    if (r.status !== 200 || r.body === null) {
      fail(`Read ${path}`, `HTTP ${r.status}`);
      tables[path] = {};
    } else {
      tables[path] = r.body;
      pass(`Read ${path}`, `${Object.keys(r.body).length} records in ${r.ms} ms`);
    }
  }

  // 3. Integrity.
  const { unities, entities, meetings } = tables;
  const problems = [];
  for (const [id, e] of Object.entries(entities)) {
    if (e.id !== id) problems.push(`organisation ${id}: id field is "${e.id}"`);
    if (!unities[e.unityId]) problems.push(`organisation ${id}: unknown network ${e.unityId}`);
    if (!['approved', 'pending', 'rejected', 'removed'].includes(e.approval)) problems.push(`organisation ${id}: approval "${e.approval}"`);
  }
  for (const [id, m] of Object.entries(meetings)) {
    const parts = m.participants ?? [];
    if (!unities[m.unityId]) problems.push(`meeting ${id}: unknown network ${m.unityId}`);
    if (m.hostId && !parts.includes(m.hostId)) problems.push(`meeting ${id}: host ${m.hostId} isn't a participant`);
    for (const p of parts) {
      if (!entities[p]) problems.push(`meeting ${id}: participant ${p} doesn't exist`);
      else if (entities[p].unityId !== m.unityId) problems.push(`meeting ${id}: participant ${p} is in another network`);
    }
    const allApproved = parts.length > 0 && parts.every((p) => m.approvals?.[p] === 'approved');
    if (m.status === 'confirmed' && !allApproved) problems.push(`meeting ${id}: confirmed but not verified by everyone`);
    if (m.status !== 'confirmed' && allApproved) problems.push(`meeting ${id}: verified by everyone but still "${m.status}"`);
  }
  if (problems.length === 0) pass('Data is consistent', `${Object.keys(meetings).length} meetings, ${Object.keys(entities).length} organisations`);
  else fail('Data is consistent', `${problems.length} problems:\n      ${problems.slice(0, 15).join('\n      ')}`);

  // 4. Test leftovers that visitors would see.
  const looksLikeTest = (s = "") => /\btest/i.test(s);
  const leftovers = [
    ...Object.values(meetings).filter((m) => looksLikeTest(m.title)).map((m) => `meeting ${m.id} "${m.title}"`),
    ...Object.values(entities).filter((e) => looksLikeTest(e.name)).map((e) => `organisation ${e.id} "${e.name}"`),
  ];
  if (leftovers.length === 0) pass('No test records');
  else warn('No test records', leftovers.join(', '));

  // Report
  const icon = { true: '✓', false: '✗', warn: '!' };
  for (const r of results) console.log(`${icon[r.ok]} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  const failed = results.filter((r) => r.ok === false).length;
  console.log(`\n${failed === 0 ? 'Healthy' : `${failed} check(s) failed`}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Could not reach the database:', e.message);
  process.exit(1);
});
