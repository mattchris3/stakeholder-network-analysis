import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://test-data-747c4-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function deleteAllData() {
  try {
    console.log('DELETING ALL DATA FROM DATABASE...\n');
    
    await remove(ref(database, 'unities'));
    console.log('Deleted all unities');
    
    await remove(ref(database, 'admins'));
    console.log('Deleted all admins');
    
    await remove(ref(database, 'entities'));
    console.log('Deleted all entities');
    
    await remove(ref(database, 'meetings'));
    console.log('Deleted all meetings');
    
    console.log('\nDatabase is now empty!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllData();