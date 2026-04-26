import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    databaseURL: "https://test-data-747c4-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function runTests() {
    const results = document.getElementById('results');
    results.innerHTML = '<div style="color: #999;">Connecting to Firebase...</div>';

    for (const { name, fn } of tests) {
        try {
            await fn();
            passed++;
            results.innerHTML += `<div class="pass">PASS: ${name}</div>`;
        } catch (e) {
            failed++;
            results.innerHTML += `<div class="fail">FAIL: ${name} — ${e.message}</div>`;
        }
    }

    document.getElementById('summary').textContent =
        `${passed + failed} tests run: ${passed} passed, ${failed} failed`;
    document.getElementById('summary').className = failed === 0 ? 'pass' : 'fail';
}

const UNITY_A = 'UNITY-GLOBHEALTH-2025';
const UNITY_B = 'UNITY-FINTECH-2025';


// =============================================
// Multi-Tenancy: Entity Isolation
// =============================================

test('Isolation: entities filtered by unityId return only matching records', async () => {
    const snap = await get(ref(database, 'entities'));
    const all = Object.values(snap.val());
    const unityA = all.filter(e => e.unityId === UNITY_A);
    const unityB = all.filter(e => e.unityId === UNITY_B);

    assertTrue(unityA.length > 0, 'Unity A should have entities');
    assertTrue(unityB.length > 0, 'Unity B should have entities');

    const leakedA = unityA.filter(e => e.unityId !== UNITY_A);
    const leakedB = unityB.filter(e => e.unityId !== UNITY_B);

    assertEqual(leakedA.length, 0, 'No Unity B entities in Unity A results');
    assertEqual(leakedB.length, 0, 'No Unity A entities in Unity B results');
});

test('Isolation: meetings filtered by unityId return only matching records', async () => {
    const snap = await get(ref(database, 'meetings'));
    const all = Object.values(snap.val());
    const unityA = all.filter(m => m.unityId === UNITY_A);
    const unityB = all.filter(m => m.unityId === UNITY_B);

    assertTrue(unityA.length > 0, 'Unity A should have meetings');
    assertTrue(unityB.length > 0, 'Unity B should have meetings');

    const leakedA = unityA.filter(m => m.unityId !== UNITY_A);
    const leakedB = unityB.filter(m => m.unityId !== UNITY_B);

    assertEqual(leakedA.length, 0, 'No Unity B meetings in Unity A results');
    assertEqual(leakedB.length, 0, 'No Unity A meetings in Unity B results');
});


// =============================================
// Multi-Tenancy: Participant Integrity
// =============================================

test('Integrity: meeting participants belong to the same unity as the meeting', async () => {
    const [entitiesSnap, meetingsSnap] = await Promise.all([
        get(ref(database, 'entities')),
        get(ref(database, 'meetings'))
    ]);

    const entities = Object.values(entitiesSnap.val());
    const meetings = Object.values(meetingsSnap.val());

    const entityUnityMap = {};
    entities.forEach(e => { entityUnityMap[e.id] = e.unityId; });

    let crossUnityParticipants = 0;
    meetings.forEach(meeting => {
        if (meeting.participants) {
            meeting.participants.forEach(pId => {
                if (entityUnityMap[pId] && entityUnityMap[pId] !== meeting.unityId) {
                    crossUnityParticipants++;
                }
            });
        }
    });

    assertEqual(crossUnityParticipants, 0, 'No participant should belong to a different unity than their meeting');
});


// =============================================
// Data Integrity: Approval States
// =============================================

test('Integrity: all entity approval fields have valid values', async () => {
    const snap = await get(ref(database, 'entities'));
    const entities = Object.values(snap.val());
    const validStates = ['pending', 'approved', 'rejected', 'removed'];

    const invalid = entities.filter(e => !validStates.includes(e.approval));
    assertEqual(invalid.length, 0, `All entities should have valid approval states, found ${invalid.length} invalid`);
});

test('Integrity: confirmed meetings have all participants approved', async () => {
    const snap = await get(ref(database, 'meetings'));
    const meetings = Object.values(snap.val());
    const confirmed = meetings.filter(m => m.status === 'confirmed');

    let inconsistent = 0;
    confirmed.forEach(meeting => {
        if (meeting.approvals) {
            const allApproved = Object.values(meeting.approvals).every(v => v === 'approved');
            if (!allApproved) inconsistent++;
        }
    });

    assertEqual(inconsistent, 0, 'All confirmed meetings should have every participant approved');
});

window.onload = runTests;