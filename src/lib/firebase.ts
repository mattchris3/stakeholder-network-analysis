import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// The Realtime Database URL is not a secret: access is governed by the
// database's security rules, not by hiding the address.
const databaseURL =
  import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'https://test-data-747c4-default-rtdb.firebaseio.com/';

export const app = initializeApp({ databaseURL });
export const database = getDatabase(app);
