import { database } from '../config.js';
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { allAdminEntities, showModal, loadData } from '../main.js';

export function displayModifyTables() {
    displayEntitiesTable();
    displayRemovedTable();
    updateCounts();
}

function updateCounts() {
    const approved = allAdminEntities.filter(e => e.approval === 'approved');
    const removed = allAdminEntities.filter(e => e.approval === 'removed');

    const membersCount = document.getElementById('membersCount');
    const removedCount = document.getElementById('removedCount');
    if (membersCount) membersCount.textContent = approved.length;
    if (removedCount) removedCount.textContent = removed.length;
}

function switchModifyView(view) {
    document.querySelectorAll('#admin-modify-content .sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#admin-modify-content .sub-tab-content').forEach(el => el.classList.remove('active'));

    if (view === 'members') {
        document.getElementById('membersView').classList.add('active');
        document.querySelector('#admin-modify-content .sub-tab-btn:nth-child(1)').classList.add('active');
    } else if (view === 'removed') {
        document.getElementById('removedView').classList.add('active');
        document.querySelector('#admin-modify-content .sub-tab-btn:nth-child(2)').classList.add('active');
    }
}

function displayEntitiesTable() {
    const tbody = document.getElementById('modifyEntitiesTable');
    const noMsg = document.getElementById('noMembersMessage');
    if (!tbody) return;

    tbody.innerHTML = '';

    const approvedEntities = allAdminEntities.filter(e => e.approval === 'approved');

    if (approvedEntities.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';

    tbody.innerHTML = approvedEntities.map(entity => {
        const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';
        return `
            <tr>
                <td>${entity.id}</td>
                <td>${entity.name}</td>
                <td>${entity.fullName}</td>
                <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
                <td><span style="color:${statusColor}; font-weight:600;">${entity.status}</span></td>
                <td>${entity.location || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.viewEntityDetail('${entity.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteEntity('${entity.id}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function displayRemovedTable() {
    const tbody = document.getElementById('removedEntitiesTable');
    const noMsg = document.getElementById('noRemovedMessage');
    if (!tbody) return;

    tbody.innerHTML = '';

    const removedEntities = allAdminEntities.filter(e => e.approval === 'removed');

    if (removedEntities.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';

    tbody.innerHTML = removedEntities.map(entity => `
        <tr>
            <td>${entity.id}</td>
            <td>${entity.name}</td>
            <td>${entity.fullName}</td>
            <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
            <td>${entity.removedDate || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="window.viewEntityDetail('${entity.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Soft delete: sets approval to 'removed' instead of deleting from Firebase
async function deleteEntity(entityId) {
    const entity = allAdminEntities.find(e => e.id === entityId);
    if (!entity) return;

    showModal(
        'Confirm Removal',
        `Are you sure you want to remove <strong>${entity.fullName}</strong> from the network? This action cannot be undone.`,
        [
            { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
            { label: 'Remove', style: 'btn-danger', onClick: async () => {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    await update(ref(database, `entities/${entityId}`), {
                        approval: 'removed',
                        removedDate: today
                    });
                    await loadData();
                    displayModifyTables();
                    showModal('Success', `${entity.name} has been removed from the network.`, [
                        { label: 'OK', style: 'btn-primary', onClick: () => {} }
                    ]);
                } catch (error) {
                    showModal('Error', 'Error removing organization: ' + error.message, [
                        { label: 'OK', style: 'btn-secondary', onClick: () => {} }
                    ]);
                }
            }}
        ]
    );
}

window.deleteEntity = deleteEntity;
window.switchModifyView = switchModifyView;