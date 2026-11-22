// Writes to Firebase. Demo sessions never call these: their changes stay in
// memory, so visitors can try every flow without touching the shared data.
import { ref, set, update } from 'firebase/database';
import { database } from './firebase';
import type { Entity, Meeting, Unity } from './types';

export async function createMeetingRecord(meeting: Meeting): Promise<void> {
  await set(ref(database, `meetings/${meeting.id}`), meeting);
}

export async function saveDecision(meeting: Meeting, orgId: string): Promise<void> {
  await update(ref(database, `meetings/${meeting.id}`), {
    [`approvals/${orgId}`]: meeting.approvals?.[orgId] ?? 'pending',
    status: meeting.status,
  });
}

export async function updateEntityRecord(id: string, patch: Partial<Entity>): Promise<void> {
  await update(ref(database, `entities/${id}`), patch);
}

export async function createEntityRecord(entity: Entity): Promise<void> {
  await set(ref(database, `entities/${entity.id}`), entity);
}

export async function updateUnityRecord(id: string, patch: Partial<Unity>): Promise<void> {
  await update(ref(database, `unities/${id}`), patch);
}
