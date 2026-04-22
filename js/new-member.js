import { database } from './config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let validUnityId = null;
let validUnityName = null;
let validFocusAreas = [];

document.getElementById('unityVerifyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('unityIdInput').value.trim();

    if (!code) {
        alert('Please enter access code');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Verifying...';

    try {
        const result = await codeValidation(code);

        if (result.valid) {
            validUnityId = result.unityId;
            validFocusAreas = result.focusAreas;
            step2(result.unityName);
        } else {
            alert('Invalid code. Please try again');
        }
    }
    catch (e) {
        alert('error: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Verify & Continue';
    }
});

document.getElementById('orgDetailsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('orgName').value.trim();
    const fullName = document.getElementById('orgFullName').value.trim();
    const sector = document.getElementById('sector').value.trim();
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;
    const duty = document.getElementById('duty').value;
    const type = document.getElementById('orgType').value;
    const size = document.getElementById('orgSize').value;
    const region = document.getElementById('orgRegion').value;
    const focusAreas = Array.from(document.querySelectorAll('.focus-area-check:checked')).map(cb => cb.value);
    const fundingType = document.getElementById('fundingType').value;

    if (!name || !fullName || !sector || !type || !size || !region || !fundingType || focusAreas.length === 0) {
        alert('Please fill all required fields');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting...';

    try {
        const exists = await checkEntityExists(name, fullName);

        if (exists){
            alert('An organization/member with this name already exists in the network');
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Complete Registration';
            return;
        }
        await createEntityRequest(name, fullName, sector, type, size, region, description, duty, location, focusAreas, fundingType);

        showPendingApproval();
    }
    catch (e) {
        alert('Error submitting application: ' + e.message);
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Complete Registration';
    }
});

async function codeValidation(code) {
    const unitiesRef = ref(database, 'unities');
    const snapshot = await get(unitiesRef);

    if(!snapshot.exists()){
        return { valid: false };
    }

    const allUnities = snapshot.val();

    for (const [unityId, unity] of Object.entries(allUnities)) {
        if (unity.accessCode === code.toUpperCase()) {
            return { 
                valid: true, 
                unityId: unityId ,
                unityName: unity.name,
                focusAreas: unity.focusAreas || []
            };
        }
    }

    return { valid: false };
}

async function checkEntityExists(name, fullName) {
    const entitiesRef = ref(database, 'entities');
    const snapshot = await get(entitiesRef);

    if (!snapshot.exists()) {
        return false;
    }

    const allEntities = Object.values(snapshot.val());

    return allEntities.some(entity => 
        entity.unityId === validUnityId && (entity.name.toLowerCase() === name.toLowerCase() || 
        entity.fullName.toLowerCase() === fullName.toLowerCase())
    );
}

async function createEntityRequest(name, fullName, sector, type, size, region, description, duty, location, focusAreas, fundingType) {
    const entitiesRef = ref(database, 'entities');
    const snapshot = await get(entitiesRef);

    let maxId = 0;
    if(snapshot.exists()){
        const allEntities = Object.values(snapshot.val());
        maxId = allEntities.reduce((max, entity) => {
            const num = parseInt(entity.id.split('-')[1]);
            return num > max ? num : max;
        }, 0);
    }

    const shortId = name.toUpperCase().replace(/\s+/g, '');
    const newId = `${shortId}-${String(maxId + 1).padStart(3, '0')}`;

    const newEntity = {
        id: newId,
        unityId: validUnityId,
        name: name,
        fullName: fullName,
        sector: sector,
        focusAreas: focusAreas,
        fundingType: fundingType,
        type,
        size,
        region,
        role: 'member',
        status: 'inactive',
        approval: 'pending',
        description: description || '',
        duty: duty || '',
        location: location || '',
        appliedDate: new Date().toISOString().split('T')[0]
    };

    await set(ref(database, `entities/${newId}`), newEntity)
}

function showPendingApproval() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('pendingStep').style.display = 'block';
    document.querySelector('.card-footer').style.display = 'none';
}

function step2(unityName) {
    validUnityName = unityName;
    document.getElementById('unityNameDisplay').textContent = unityName;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';

    const container = document.getElementById('focusAreaOptions');
    container.innerHTML = validFocusAreas.map(area => `
        <label style="display:flex; align-items:center; gap:8px; padding:8px 14px; background:#f0f2f5; border:1.5px solid #dde3ee; border-radius:20px; cursor:pointer; font-size:13px;">
            <input type="checkbox" value="${area}" class="focus-area-check">
            ${area}
        </label>
    `).join('');
}

window.goToLandingPage = function() {
    window.location.href = 'index.html';
}