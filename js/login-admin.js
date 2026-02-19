import { database } from './config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const unityId = document.getElementById('unityId').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
    
    try {
        const adminsRef = ref(database, 'admins');
        const snapshot = await get(adminsRef);
        
        if (!snapshot.exists()) {
            throw new Error('No admins found in database');
        }
        
        const allAdmins = snapshot.val();
        
        let adminFound = null;
        let adminId = null;
        
        for (const [id, admin] of Object.entries(allAdmins)) {
            if (admin.unityId === unityId && admin.username === username) {
                adminFound = admin;
                adminId = id;
                break;
            }
        }
        
        if (!adminFound) {
            throw new Error('Invalid Unity ID or username');
        }
        
        if (adminFound.password !== password) {
            throw new Error('Incorrect password');
        }
        
        sessionStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('unityId', unityId);
        sessionStorage.setItem('adminId', adminId);
        sessionStorage.setItem('username', username);
        
        window.location.href = 'home.html';
        
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});