import { database } from '../config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { currentUnityId, showModal } from '../main.js';

export async function displayUnityProfile() {
    const container = document.getElementById('unityProfileContent');
    container.innerHTML = '<p style="color:#888;">Loading...</p>';

    const snapshot = await get(ref(database, `unities/${currentUnityId}`));
    if (!snapshot.exists()) {
        container.innerHTML = '<p style="color:#f44336;">Unity not found.</p>';
        return;
    }

    const unity = snapshot.val();

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="padding:16px; background:#f9fafc; border-radius:10px; border:1.5px solid #dde3ee;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Unity ID</div>
                <div style="font-size:15px; font-weight:600; color:#111d35;">${unity.unityId}</div>
            </div>
            <div style="padding:16px; background:#f9fafc; border-radius:10px; border:1.5px solid #dde3ee;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Name</div>
                <div style="font-size:15px; font-weight:600; color:#111d35;">${unity.name}</div>
            </div>
            <div style="grid-column:1/-1; padding:16px; background:#f9fafc; border-radius:10px; border:1.5px solid #dde3ee;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Description</div>
                <div style="font-size:15px; color:#333;">${unity.description}</div>
            </div>
            <div style="grid-column:1/-1; padding:16px; background:#f9fafc; border-radius:10px; border:1.5px solid #dde3ee;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">Focus Areas</div>
                <div id="profileFocusAreaTags" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
                <div style="display:flex; gap:8px;">
                    <input type="text" id="profileFocusAreaInput" placeholder="Add new focus area..." style="flex:1; padding:10px 14px; border:1.5px solid #dde3ee; border-radius:8px; font-size:14px;">
                    <button class="btn btn-primary btn-sm" onclick="window.addProfileFocusArea()">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
            <div style="grid-column:1/-1; padding:16px; background:rgba(26,58,92,0.06); border-radius:10px; border:1.5px solid #1a3a5c;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Access Code</div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="font-size:22px; font-weight:700; color:#111d35; letter-spacing:3px;">${unity.accessCode}</div>
                    <button class="btn btn-primary btn-sm" onclick="window.copyCode('${unity.accessCode}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <div style="font-size:12px; color:#888; margin-top:8px;">Share this code with organizations you want to invite</div>
            </div>
            <div style="grid-column:1/-1; padding:16px; background:#f9fafc; border-radius:10px; border:1.5px solid #dde3ee;">
                <div style="font-size:12px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Created</div>
                <div style="font-size:15px; color:#333;">${new Date(unity.created).toLocaleDateString()}</div>
            </div>
        </div>
    `;

    window.copyCode = function(code) {
        navigator.clipboard.writeText(code).then(() => {
            showModal('Copied', 'Access code copied to clipboard.', [
                { label: 'OK', style: 'btn-primary', onClick: () => {} }
            ]);
        });
    };
    
    let currentFocusAreas = unity.focusAreas || [];
    renderProfileFocusAreas();

    function renderProfileFocusAreas() {
        const container = document.getElementById('profileFocusAreaTags');
        if (!container) return;
        container.innerHTML = currentFocusAreas.map((area, i) => `
            <span style="background:#111d35; color:white; padding:6px 12px; border-radius:20px; font-size:13px; display:inline-flex; align-items:center; gap:6px;">
                ${area}
                <i class="fas fa-times" style="cursor:pointer; font-size:11px;" onclick="window.removeProfileFocusArea(${i})"></i>
            </span>
        `).join('');
    }

    window.addProfileFocusArea = async function() {
        const input = document.getElementById('profileFocusAreaInput');
        const value = input.value.trim();
        if (!value) return;
        if (currentFocusAreas.includes(value)) {
            input.value = '';
            return;
        }
        currentFocusAreas.push(value);
        input.value = '';
        await update(ref(database, `unities/${currentUnityId}`), { focusAreas: currentFocusAreas });
        renderProfileFocusAreas();
    };

    window.removeProfileFocusArea = async function(index) {
        const removed = currentFocusAreas[index];

        const entitiesSnap = await get(ref(database, 'entities'));
        let membersWithArea = [];
        if (entitiesSnap.exists()) {
            membersWithArea = Object.values(entitiesSnap.val()).filter(e =>
                e.unityId === currentUnityId &&
                e.approval === 'approved' &&
                (e.focusAreas || []).includes(removed)
            );
        }

        if (membersWithArea.length > 0) {
            const memberNames = membersWithArea.map(e => e.name).join(', ');
            showModal('Cannot Remove', `
                <strong>"${removed}"</strong> is currently used by ${membersWithArea.length} member${membersWithArea.length > 1 ? 's' : ''}:<br><br>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                    ${membersWithArea.map(e => `<span style="background:#f0f2f5; padding:4px 10px; border-radius:10px; font-size:13px;">${e.name}</span>`).join('')}
                </div>
                These members must remove this focus area from their profile before it can be deleted.
            `, [
                { label: 'OK', style: 'btn-primary', onClick: () => {} }
            ]);
            return;
        }

        showModal('Remove Focus Area', `Are you sure you want to remove "${removed}"?`, [
            { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
            { label: 'Remove', style: 'btn-danger', onClick: async () => {
                currentFocusAreas.splice(index, 1);
                await update(ref(database, `unities/${currentUnityId}`), { focusAreas: currentFocusAreas });
                renderProfileFocusAreas();
            }}
        ]);
    };
}