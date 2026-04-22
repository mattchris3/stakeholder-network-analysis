import { database } from '../config.js';
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { allAdminEntities, showModal, updateNotification } from '../main.js';

export function displayPendingApplications() {
    displayPendingTable();
    displayApprovedTable();
    displayRejectedTable();
}

function displayPendingTable() {
    const tbody = document.getElementById('pendingApplicationsTable');
    const noMessage = document.getElementById('noPendingMessage');
    const pendingCount = document.getElementById('pendingCount');

    if (!tbody) return;

    tbody.innerHTML = '';

    const pendingEntities = allAdminEntities.filter(e => e.approval === 'pending');

    if (pendingCount) {
        pendingCount.textContent = pendingEntities.length;
    }

    if (pendingEntities.length === 0) {
        if (noMessage) noMessage.style.display = 'block';
        return;
    }

    if (noMessage) noMessage.style.display = 'none';

    pendingEntities.sort((a, b) =>
        new Date(b.appliedDate) - new Date(a.appliedDate)
    );

    tbody.innerHTML = pendingEntities.map(entity => `
        <tr>
            <td>${new Date(entity.appliedDate).toLocaleDateString()}</td>
            <td>
                <strong>${entity.name}</strong><br>
                <small style="color:#5a6478;">${entity.fullName}</small>
            </td>
            <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
            <td>${entity.location || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewEntityDetail('${entity.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-success" onclick="approveApplication('${entity.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectApplication('${entity.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayApprovedTable() {
    const tbody = document.getElementById('approvedApplicationsTable');
    const noMessage = document.getElementById('noApprovedMessage');
    const approvedCount = document.getElementById('approvedCount');

    if (!tbody) return;

    tbody.innerHTML = '';

    const approvedEntities = allAdminEntities.filter(e => e.approval === 'approved');

    if (approvedCount) {
        approvedCount.textContent = approvedEntities.length;
    }

    if (approvedEntities.length === 0) {
        if (noMessage) noMessage.style.display = 'block';
        return;
    }

    if (noMessage) noMessage.style.display = 'none';

    approvedEntities.sort((a, b) =>
        new Date(b.approvedDate || 0) - new Date(a.approvedDate || 0)
    );

    tbody.innerHTML = approvedEntities.map(entity => `
        <tr>
            <td>${entity.approvedDate ? new Date(entity.approvedDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <strong>${entity.name}</strong><br>
                <small style="color:#5a6478;">${entity.fullName}</small>
            </td>
            <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
            <td>${entity.location || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewEntityDetail('${entity.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function displayRejectedTable() {
    const tbody = document.getElementById('rejectedApplicationsTable');
    const noMessage = document.getElementById('noRejectedMessage');
    const rejectedCount = document.getElementById('rejectedCount');

    if (!tbody) return;

    tbody.innerHTML = '';

    const rejectedEntities = allAdminEntities.filter(e => e.approval === 'rejected');

    if (rejectedCount) {
        rejectedCount.textContent = rejectedEntities.length;
    }

    if (rejectedEntities.length === 0) {
        if (noMessage) noMessage.style.display = 'block';
        return;
    }

    if (noMessage) noMessage.style.display = 'none';

    rejectedEntities.sort((a, b) =>
        new Date(b.rejectedDate || b.appliedDate) - new Date(a.rejectedDate || a.appliedDate)
    );

    tbody.innerHTML = rejectedEntities.map(entity => `
        <tr>
            <td>${entity.rejectedDate ? new Date(entity.rejectedDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <strong>${entity.name}</strong><br>
                <small style="color:#5a6478;">${entity.fullName}</small>
            </td>
            <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
            <td>${entity.location || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewEntityDetail('${entity.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.switchPendingView = function(view) {
    document.querySelectorAll('#admin-pending-content .sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#admin-pending-content .sub-tab-content').forEach(content => content.classList.remove('active'));

    if (view === 'pending') {
        document.querySelector('#admin-pending-content .sub-tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('pendingView').classList.add('active');
    } else if (view === 'approved') {
        document.querySelector('#admin-pending-content .sub-tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('approvedView').classList.add('active');
    } else if (view === 'rejected') {
        document.querySelector('#admin-pending-content .sub-tab-btn:nth-child(3)').classList.add('active');
        document.getElementById('rejectedView').classList.add('active');
    }
};

window.approveApplication = async function(entityId) {
    const entity = allAdminEntities.find(e => e.id === entityId);
    if (!entity) return;

    showModal('Approve Application', `Approve ${entity.fullName}?`, [
        { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
        { label: 'Approve', style: 'btn-primary', onClick: async () => {
            try {
                await update(ref(database, `entities/${entity.id}`), {
                    status: 'active',
                    approval: 'approved',
                    approvedDate: new Date().toISOString().split('T')[0]
                });
                showModal('Success', `${entity.name} has been approved!`, [
                    { label: 'OK', style: 'btn-primary', onClick: () => location.reload() }
                ]);
                updateNotification();
            } catch (e) {
                showModal('Error', 'Error approving application: ' + e.message, [
                    { label: 'Close', style: 'btn-danger', onClick: () => {} }
                ]);
            }
        }}
    ]);
};

window.rejectApplication = async function(entityId) {
    const entity = allAdminEntities.find(e => e.id === entityId);
    if (!entity) return;

    showModal('Reject Application', `Reject ${entity.fullName}?`, [
        { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
        { label: 'Reject', style: 'btn-danger', onClick: async () => {
            try {
                await update(ref(database, `entities/${entityId}`), {
                    approval: 'rejected',
                    rejectedDate: new Date().toISOString().split('T')[0]
                });
                showModal('Done', `${entity.name} application has been rejected.`, [
                    { label: 'OK', style: 'btn-primary', onClick: () => location.reload() }
                ]);
                updateNotification();
            } catch (e) {
                showModal('Error', 'Error rejecting application: ' + e.message, [
                    { label: 'Close', style: 'btn-danger', onClick: () => {} }
                ]);
            }
        }}
    ]);
};