import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase web config for the demo project. None of these values are secrets:
// they identify the project, and the database's security rules decide who may
// read or write. Point a copy at your own project in .env.local (see .env.example).
const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyD3sfAfeOyqy5mbsDxHd1uFBRLVN0ZP1Iw',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'test-data-747c4.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'test-data-747c4',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:1098255931033:web:beebe38ab9104e100a0a08',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL ?? 'https://test-data-747c4-default-rtdb.firebaseio.com/',
};

export const app = initializeApp(config);
export const database = getDatabase(app);

/** Accounts need a web API key. With it blanked out, the demo still works, read-only. */
export const authEnabled = Boolean(config.apiKey);
export const auth: Auth | null = authEnabled ? getAuth(app) : null;
