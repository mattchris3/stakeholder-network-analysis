// Firebase Authentication.
//
// - Testers: "Try the demo" signs in anonymously. Anonymous users can read the
//   network; the security rules refuse their writes, and the app keeps demo
//   changes in memory.
// - Members and admins: email and password. users/{uid} records which network
//   they belong to and their role; the rules check it on every write.
// - Applying to join or creating a network upgrades the anonymous session to a
//   permanent account (linkWithCredential), so nothing read so far is lost.
import { FirebaseError } from 'firebase/app';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { auth, authEnabled, database } from './firebase';
import type { Role, Session } from './session';
import type { Entity, Unity } from './types';

export interface Profile {
  role: Role;
  unityId: string;
  orgId?: string;
}

export class AuthError extends Error {}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': "That email and password don't match. Check both and try again.",
  'auth/invalid-email': "That doesn't look like an email address.",
  'auth/user-disabled': 'This account has been switched off. Ask your network admin.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute, then try again.',
  'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
  'auth/credential-already-in-use': 'An account already uses that email. Sign in instead.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/network-request-failed': "Couldn't reach the server. Check your connection.",
  'auth/operation-not-allowed': "This sign-in method isn't switched on for the project yet.",
  'auth/admin-restricted-operation': "This sign-in method isn't switched on for the project yet.",
  PERMISSION_DENIED: "The database refused that change. You may not have access to it.",
};

export function friendlyError(e: unknown): string {
  if (e instanceof AuthError) return e.message;
  const code = e instanceof FirebaseError ? e.code : (e as { code?: string })?.code;
  return (code && MESSAGES[code]) || 'Something went wrong. Try again.';
}

function requireAuth() {
  if (!auth) throw new AuthError("Accounts aren't set up on this copy of the app. Try the demo instead.");
  return auth;
}

/** Makes sure there is a Firebase user, signing in anonymously if needed. Reads need one. */
export async function ensureUser(): Promise<User | null> {
  if (!authEnabled || !auth) return null;
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

/** A fresh anonymous session for the demo (signs out any real account first). */
export async function startAnonymous(): Promise<void> {
  if (!authEnabled || !auth) return;
  await auth.authStateReady();
  if (auth.currentUser && !auth.currentUser.isAnonymous) await firebaseSignOut(auth);
  if (!auth.currentUser) await signInAnonymously(auth);
}

export async function loadProfile(uid: string): Promise<Profile | null> {
  const snap = await get(ref(database, `users/${uid}`));
  return snap.exists() ? (snap.val() as Profile) : null;
}

/** Turns a profile into an app session, or explains why the account can't sign in yet. */
export async function sessionFor(user: User): Promise<Session> {
  const profile = await loadProfile(user.uid);
  if (!profile) throw new AuthError("This account isn't linked to a network yet. Apply to join one first.");
  if (profile.role === 'admin') {
    const unity = (await get(ref(database, `unities/${profile.unityId}`))).val() as Unity | null;
    if (!unity) throw new AuthError("We couldn't find your network.");
    return { role: 'admin', unityId: profile.unityId, orgId: 'ADMIN', orgName: 'Network admin', demo: false, email: user.email ?? undefined };
  }
  const entity = (await get(ref(database, `entities/${profile.orgId}`))).val() as Entity | null;
  if (!entity) throw new AuthError("We couldn't find your organisation.");
  if (entity.approval === 'pending') throw new AuthError("Your application is waiting for the network admin's approval.");
  if (entity.approval !== 'approved' || entity.status !== 'active') {
    throw new AuthError("Your organisation isn't an active member of this network.");
  }
  return { role: 'member', unityId: entity.unityId, orgId: entity.id, orgName: entity.name, demo: false, email: user.email ?? undefined };
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const a = requireAuth();
  if (a.currentUser?.isAnonymous) await firebaseSignOut(a);
  const { user } = await signInWithEmailAndPassword(a, email.trim(), password);
  try {
    return await sessionFor(user);
  } catch (e) {
    await firebaseSignOut(a);
    throw e;
  }
}

export async function signOut(): Promise<void> {
  if (auth) await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

/** Upgrades the current anonymous user to an email account, or creates one. */
async function createAccount(email: string, password: string): Promise<User> {
  const a = requireAuth();
  await a.authStateReady();
  const current = a.currentUser;
  if (current?.isAnonymous) {
    const { user } = await linkWithCredential(current, EmailAuthProvider.credential(email.trim(), password));
    return user;
  }
  if (current) await firebaseSignOut(a);
  const { user } = await createUserWithEmailAndPassword(a, email.trim(), password);
  return user;
}

/** Applies to a network: one atomic write of the pending organisation and the account link. */
export async function applyToNetwork(email: string, password: string, entity: Entity): Promise<void> {
  const user = await createAccount(email, password);
  await update(ref(database), {
    [`entities/${entity.id}`]: { ...entity, ownerUid: user.uid },
    [`users/${user.uid}`]: { role: 'member', unityId: entity.unityId, orgId: entity.id },
  });
}

/** Creates a network with the signed-up person as its admin. */
export async function createNetwork(email: string, password: string, unity: Unity): Promise<void> {
  const user = await createAccount(email, password);
  await update(ref(database), {
    [`unities/${unity.unityId}`]: { ...unity, ownerUid: user.uid },
    [`users/${user.uid}`]: { role: 'admin', unityId: unity.unityId },
  });
}
