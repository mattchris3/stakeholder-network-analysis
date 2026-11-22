// Loads one Unity's data: Firebase first, the bundled demo snapshot if
// Firebase is slow, unreachable or empty. The demo never shows a blank page.
import { get, ref } from 'firebase/database';
import { database } from './firebase';
import type { Entity, Meeting, Unity, UnityData } from './types';
import snapshot from '../data/demo-snapshot.json';

const FIREBASE_TIMEOUT_MS = 6000;

type Tables = { unities: Record<string, Unity>; entities: Record<string, Entity>; meetings: Record<string, Meeting> };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firebase timed out')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function fromFirebase(): Promise<Tables> {
  const [unities, entities, meetings] = await withTimeout(
    Promise.all(['unities', 'entities', 'meetings'].map((path) => get(ref(database, path)))),
    FIREBASE_TIMEOUT_MS,
  );
  return {
    unities: unities.val() ?? {},
    entities: entities.val() ?? {},
    meetings: meetings.val() ?? {},
  };
}

function select(tables: Tables, unityId: string, source: UnityData['source']): UnityData {
  return {
    unity: tables.unities[unityId] ?? null,
    entities: Object.values(tables.entities).filter((e) => e?.unityId === unityId),
    meetings: Object.values(tables.meetings).filter((m) => m?.unityId === unityId),
    source,
  };
}

const cache = new Map<string, Promise<UnityData>>();

export function loadUnity(unityId: string): Promise<UnityData> {
  let pending = cache.get(unityId);
  if (!pending) {
    pending = fromFirebase()
      .then((tables) => select(tables, unityId, 'firebase'))
      .then((data) => (data.entities.length > 0 ? data : select(snapshot as Tables, unityId, 'snapshot')))
      .catch((error) => {
        console.warn('Using the bundled demo data:', error);
        return select(snapshot as Tables, unityId, 'snapshot');
      });
    cache.set(unityId, pending);
  }
  return pending;
}

export function clearUnityCache() {
  cache.clear();
}
