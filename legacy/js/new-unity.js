import { database } from './config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let unityData = {
    name: '',
    description: '',
    adminUsername: '',
    adminPassword: '',
    unityId: '',
    accessCode: '',
    focusAreas: []
};

document.getElementById('unityInfoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    unityData.name = document.getElementById('unityName').value.trim();
    unityData.description = document.getElementById('unityDescription').value.trim();
    
    if (!unityData.name || !unityData.description) {
        alert('Please fill all required fields');
        return;
    }
    
    switchStep(2);
});

document.getElementById('adminAccountForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const passwordConfirm = document.getElementById('adminPasswordConfirm').value.trim();
    
    if (!username || !password || !passwordConfirm) {
        alert('Please fill all required fields');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('Passwords do not match');
        return;
    }

    if (unityData.focusAreas.length === 0) {
        alert('Please add at least one focus area');
        return;
    }
    
    unityData.adminUsername = username;
    unityData.adminPassword = password;
    
    generateIds();
    switchStep(3);
});

function generateIds() {
    const year = new Date().getFullYear();
    const namePart = unityData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
    
    unityData.unityId = `UNITY-${namePart}-${year}`;
    unityData.accessCode = generateAccessCode();
    
    document.getElementById('reviewUnityName').textContent = unityData.name;
    document.getElementById('reviewUnityDescription').textContent = unityData.description;
    document.getElementById('reviewAdminUsername').textContent = unityData.adminUsername;
    document.getElementById('reviewFocusAreas').textContent = unityData.focusAreas.join(', ');
    document.getElementById('reviewAccessCode').textContent = unityData.accessCode;
}

function generateAccessCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

window.createUnity = async function() {
    const btn = event.target;
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Creating...';
    
    try {
        const exists = await checkUnityExists(unityData.unityId);
        
        if (exists) {
            alert('A unity with this name already exists. Please choose a different name.');
            switchStep(1);
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Create Unity';
            return;
        }
        
        await saveUnityToDatabase();
        
        showSuccess();
        
    } catch (error) {
        alert('Error creating unity: ' + error.message);
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Create Unity';
    }
};

async function checkUnityExists(unityId) {
    const unitiesRef = ref(database, 'unities');
    const snapshot = await get(unitiesRef);
    
    if (!snapshot.exists()) {
        return false;
    }
    
    const allUnities = snapshot.val();
    return allUnities.hasOwnProperty(unityId);
}

async function saveUnityToDatabase() {
    const adminId = `ADMIN-${unityData.unityId}-001`;
    
    const newUnity = {
        unityId: unityData.unityId,
        name: unityData.name,
        description: unityData.description,
        accessCode: unityData.accessCode,
        focusAreas: unityData.focusAreas,
        created: new Date().toISOString().split('T')[0]
    };
    
    const newAdmin = {
        adminId: adminId,
        unityId: unityData.unityId,
        username: unityData.adminUsername,
        password: unityData.adminPassword,
        created: new Date().toISOString().split('T')[0]
    };
    
    await set(ref(database, `unities/${unityData.unityId}`), newUnity);
    await set(ref(database, `admins/${adminId}`), newAdmin);
}

function switchStep(stepNumber) {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('successStep').style.display = 'none';
    
    if (stepNumber === 1) {
        document.getElementById('step1').style.display = 'block';
    } else if (stepNumber === 2) {
        document.getElementById('step2').style.display = 'block';
    } else if (stepNumber === 3) {
        document.getElementById('step3').style.display = 'block';
    } else if (stepNumber === 'success') {
        document.getElementById('successStep').style.display = 'block';
        document.querySelector('.card-footer').style.display = 'none';
    }
}

function showSuccess() {
    document.getElementById('successUnityId').textContent = unityData.unityId;
    document.getElementById('successAccessCode').textContent = unityData.accessCode;
    switchStep('success');
}

window.switchStep = switchStep;

window.copyAccessCode = function() {
    const code = unityData.accessCode;
    navigator.clipboard.writeText(code).then(() => {
        alert('Access code copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy. Code: ' + code);
    });
};

window.goToAdminLogin = function() {
    window.location.href = 'welcome-admin.html';
};

window.addFocusArea = function() {
    const input = document.getElementById('focusAreaInput');
    const value = input.value.trim();
    if (!value) return;
    if (unityData.focusAreas.includes(value)) {
        input.value = '';
        return;
    }
    unityData.focusAreas.push(value);
    input.value = '';
    renderFocusAreaTags();
};

window.removeFocusArea = function(index) {
    unityData.focusAreas.splice(index, 1);
    renderFocusAreaTags();
};

function renderFocusAreaTags() {
    const container = document.getElementById('focusAreaTags');
    container.innerHTML = unityData.focusAreas.map((area, i) => `
        <span style="background:#111d35; color:white; padding:6px 12px; border-radius:20px; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            ${area}
            <i class="fas fa-times" style="cursor:pointer; font-size:11px;" onclick="removeFocusArea(${i})"></i>
        </span>
    `).join('');
}