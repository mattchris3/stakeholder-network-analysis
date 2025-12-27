import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import fs from 'fs';

const firebaseConfig = {
    databaseURL: "https://test-data-747c4-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

async function uploadData() {
    try {
        console.log('Uploading entities...');
        await set(ref(database, 'entities'), data.entities);
        console.log('Entities uploaded successfully');

        console.log('Uploading meetings...');
        await set(ref(database, 'meetings'), data.meetings);
        console.log('Meetings uploaded successfully');

        console.log('All data uploaded to Firebase');
        process.exit(0);
    } catch (error) {
        console.error('Error uploading data:', error);
        process.exit(1);
    }
}

uploadData();