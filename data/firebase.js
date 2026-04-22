import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { readFileSync } from 'fs';

const firebaseConfig = {
  databaseURL: "https://test-data-747c4-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function uploadData() {
  try {
    const data = JSON.parse(readFileSync('./data.json', 'utf8'));
    
    console.log('Uploading unities');
    if (data.unities) {
      for (const [unityId, unity] of Object.entries(data.unities)) {
        await set(ref(database, `unities/${unityId}`), unity);
        console.log(`Uploaded unity: ${unityId}`);
      }
    }
    
    console.log('\nUploading admins');
    if (data.admins) {
      for (const [adminId, admin] of Object.entries(data.admins)) {
        await set(ref(database, `admins/${adminId}`), admin);
        console.log(`Uploaded admin: ${adminId}`);
      }
    }
    
    console.log('\nUploading entities');
    if (data.entities) {
      for (const [entityId, entity] of Object.entries(data.entities)) {
        await set(ref(database, `entities/${entityId}`), entity);
        console.log(`Uploaded entity: ${entityId}`);
      }
    }
    
    console.log('\nUploading meetings');
    if (data.meetings) {
      for (const [meetingId, meeting] of Object.entries(data.meetings)) {
        await set(ref(database, `meetings/${meetingId}`), meeting);
        console.log(`Uploaded meeting: ${meetingId}`);
      }
    }

    process.exit(0);
    
  } catch (error) {
    console.error('Error uploading data:', error);
    process.exit(1);
  }
}

uploadData();