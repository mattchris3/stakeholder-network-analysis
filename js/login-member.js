import { database } from './config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

document.getElementById('memberLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const unityId = document.getElementById('unityId').value.trim();
    const memberId = document.getElementById('memberId').value.trim();
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
    
    try {
        const entitiesRef = ref(database, 'entities');
        const snapshot = await get(entitiesRef);
        
        if (!snapshot.exists()) {
            throw new Error('No organizations found in database');
        }
        
        const allEntities = snapshot.val();
        
        let entityFound = null;
        
        for (const [id, entity] of Object.entries(allEntities)) {
            if (entity.unityId === unityId && entity.id === memberId) {
                entityFound = entity;
                break;
            }
        }
        
        if (!entityFound) {
            throw new Error('Invalid Unity ID or Member ID');
        }
        
        if (entityFound.status !== 'active') {
            throw new Error('Your organization is not active. Please contact the administrator.');
        }
        
        sessionStorage.setItem('userRole', 'member');
        sessionStorage.setItem('unityId', unityId);
        sessionStorage.setItem('orgId', memberId);
        sessionStorage.setItem('orgName', entityFound.name);
        
        window.location.href = 'home.html';
        
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});