import { database } from '../config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { currentOrgId, currentUnityId, allEntities, showModal } from '../main.js';

let currentDescription = '';
let currentFocusAreas = [];

export async function displayMemberProfile() {
    const entity = allEntities.find(e => e.id === currentOrgId);
    if (!entity) {
        document.getElementById('profile-details-content').innerHTML = '<p style="color:#f44336; padding:30px;">Profile not found.</p>';
        return;
    }

    currentDescription = entity.description || '';
    currentFocusAreas = entity.focusAreas || [];

    const unitySnap = await get(ref(database, `unities/${currentUnityId}`));
    const unityFocusAreas = unitySnap.exists() ? unitySnap.val().focusAreas || [] : [];

    document.getElementById('profile-details-content').innerHTML = `
        <div style="padding:30px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Member ID</div>
                    <div style="font-size:15px; font-weight:600; color:#111d35;">${entity.id}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Organization</div>
                    <div style="font-size:15px; font-weight:600; color:#111d35;">${entity.fullName}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Sector</div>
                    <div style="font-size:15px; color:#333; text-transform:capitalize;">${entity.sector}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Funding Type</div>
                    <div style="font-size:15px; color:#333; text-transform:capitalize;">${entity.fundingType || 'N/A'}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Location</div>
                    <div style="font-size:15px; color:#333;">${entity.location || 'N/A'}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Type</div>
                    <div style="font-size:15px; color:#333; text-transform:capitalize;">${entity.type || 'N/A'}</div>
                </div>
                <div style="grid-column:1/-1; padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px;">Description</div>
                        <button class="btn btn-primary btn-sm" onclick="window.editDescription()">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                    <div id="profileDescription" style="font-size:15px; color:#333; line-height:1.6;">${entity.description || 'No description provided.'}</div>
                </div>
                <div style="grid-column:1/-1; padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">Focus Areas</div>
                    <div id="memberFocusAreaTags" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Add from available areas</div>
                    <div id="availableFocusAreas" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
                </div>
            </div>
        </div>
    `;

    renderMemberFocusAreas(unityFocusAreas);

    window.editDescription = function() {
        showModal('Edit Description', `
            <textarea id="editDescriptionInput" style="width:100%; min-height:120px; padding:12px; border:1.5px solid #dde3ee; border-radius:8px; font-size:14px; font-family:inherit; resize:vertical;">${currentDescription}</textarea>
        `, [
            { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
            { label: 'Save', style: 'btn-primary', onClick: async () => {
                const newDesc = document.getElementById('editDescriptionInput').value.trim();
                await update(ref(database, `entities/${currentOrgId}`), { description: newDesc });
                currentDescription = newDesc;
                document.getElementById('profileDescription').textContent = newDesc || 'No description provided.';
            }}
        ]);
    };
}

function renderMemberFocusAreas(unityFocusAreas) {
    const tagsContainer = document.getElementById('memberFocusAreaTags');
    const availableContainer = document.getElementById('availableFocusAreas');
    if (!tagsContainer || !availableContainer) return;

    tagsContainer.innerHTML = currentFocusAreas.map((area, i) => `
        <span style="background:#111d35; color:white; padding:6px 12px; border-radius:20px; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
            ${area}
            <i class="fas fa-times" style="cursor:pointer; font-size:11px;" onclick="window.removeMemberFocusArea(${i})"></i>
        </span>
    `).join('');

    const available = unityFocusAreas.filter(a => !currentFocusAreas.includes(a));
    availableContainer.innerHTML = available.length === 0
        ? '<span style="color:#888; font-size:13px;">All focus areas selected</span>'
        : available.map((area, i) => `
            <span style="background:#f0f2f5; color:#333; padding:6px 12px; border-radius:20px; font-size:13px; cursor:pointer; border:1.5px solid #dde3ee; display:inline-flex; align-items:center; gap:6px;" onclick="window.addMemberFocusArea('${area}')">
                <i class="fas fa-plus" style="font-size:10px; color:#1a3a5c;"></i>
                ${area}
            </span>
        `).join('');
}

window.addMemberFocusArea = async function(area) {
    if (currentFocusAreas.includes(area)) return;
    currentFocusAreas.push(area);
    await update(ref(database, `entities/${currentOrgId}`), { focusAreas: currentFocusAreas });
    const unitySnap = await get(ref(database, `unities/${currentUnityId}`));
    const unityFocusAreas = unitySnap.exists() ? unitySnap.val().focusAreas || [] : [];
    renderMemberFocusAreas(unityFocusAreas);
};

window.removeMemberFocusArea = async function(index) {
    currentFocusAreas.splice(index, 1);
    await update(ref(database, `entities/${currentOrgId}`), { focusAreas: currentFocusAreas });
    const unitySnap = await get(ref(database, `unities/${currentUnityId}`));
    const unityFocusAreas = unitySnap.exists() ? unitySnap.val().focusAreas || [] : [];
    renderMemberFocusAreas(unityFocusAreas);
};

export async function displayUnityInfo() {
    const snapshot = await get(ref(database, `unities/${currentUnityId}`));
    if (!snapshot.exists()) {
        document.getElementById('profile-unity-content').innerHTML = '<p style="color:#f44336; padding:30px;">Unity not found.</p>';
        return;
    }

    const unity = snapshot.val();
    const focusAreas = unity.focusAreas || [];

    document.getElementById('profile-unity-content').innerHTML = `
        <div style="padding:30px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Unity Name</div>
                    <div style="font-size:15px; font-weight:600; color:#111d35;">${unity.name}</div>
                </div>
                <div style="padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Created</div>
                    <div style="font-size:15px; color:#333;">${new Date(unity.created).toLocaleDateString()}</div>
                </div>
                <div style="grid-column:1/-1; padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Description</div>
                    <div style="font-size:15px; color:#333; line-height:1.6;">${unity.description}</div>
                </div>
                <div style="grid-column:1/-1; padding:16px; background:#f8f9fb; border-radius:10px; border:1.5px solid #dde3ee;">
                    <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">Network Focus Areas</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${focusAreas.map(area => `
                            <span style="background:#111d35; color:white; padding:6px 12px; border-radius:20px; font-size:13px;">${area}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}