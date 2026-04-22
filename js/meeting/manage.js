import { database } from "../config.js";
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { currentOrgId, allMeetings, allMembers, allEntities, loadData, showModal, statusBadge, updateNotification } from "../main.js";

export function displayManage() {
    const myRequests = allMeetings.filter(m => m.hostId === currentOrgId);
    const toVerify = allMeetings.filter(m =>
        m.hostId !== currentOrgId &&
        m.status === 'pending' &&
        m.approvals?.[currentOrgId] !== 'approved' &&
        m.approvals?.[currentOrgId] !== 'disputed'
    );
    const disputed = allMeetings.filter(m =>
        m.approvals?.[currentOrgId] === 'disputed'
    );
    const approvedMeetings = allMeetings.filter(m =>
        m.approvals?.[currentOrgId] === 'approved' &&
        m.hostId !== currentOrgId
    );
    const history = allMeetings.filter(m => m.status === 'confirmed');

    document.getElementById('myRequestsCount').textContent = myRequests.length;
    document.getElementById('verifyBadge').textContent = toVerify.length;
    document.getElementById('disputedCount').textContent = disputed.length;
    document.getElementById('approvedMeetingsCount').textContent = approvedMeetings.length;
    document.getElementById('historyCount').textContent = history.length;

    renderMyRequests(myRequests);
    renderVerify(toVerify);
    renderDisputed(disputed);
    renderApprovedMeetings(approvedMeetings);
    renderHistory(history);
}

function renderMyRequests(meetings) {
    const tbody = document.getElementById('myRequestsTable');
    const noMsg = document.getElementById('noMyRequestsMessage');

    if (!meetings.length) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    tbody.innerHTML = meetings.map(meeting => {
        const approvals = meeting.approvals || {};
        const total = meeting.participants.length;
        const approved = Object.values(approvals).filter(v => v === 'approved').length;
        const disputed = Object.values(approvals).filter(v => v === 'disputed').length;

        statusBadge(meeting.status);

        return `
            <tr>
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td><strong>${meeting.title}</strong></td>
                <td>${meeting.participants.length} participants</td>
                <td>${meeting.status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${meeting.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderVerify(meetings) {
    const tbody = document.getElementById('verifyTable');
    const noMsg = document.getElementById('noVerifyMessage');
    if (!meetings.length) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    tbody.innerHTML = meetings.map(meeting => {
        const myStatus = meeting.approvals?.[currentOrgId] || 'pending';
        const host = allMembers.find(m => m.id === meeting.hostId);

        statusBadge(meeting.status);

        const actions = myStatus === 'approved'
            ? '<span style="color:#4CAF50; font-weight:600;"><i class="fas fa-lock"></i> Verified</span>'
            : `
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${meeting.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.verifyMeeting('${meeting.id}')">
                        <i class="fas fa-check"></i> Verify
                    </button>
                    <button class="btn btn-sm btn-danger" id="disputeMeetingText" onclick="window.disputeMeeting('${meeting.id}')">
                        <i class="fas fa-times"></i> Dispute
                    </button>
                </div>
            `;

        return `
            <tr>
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td><strong>${meeting.title}</strong></td>
                <td>${host?.name || meeting.hostId}</td>
                <td>${meeting.status}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

function renderDisputed(meetings) {
    const tbody = document.getElementById('disputedTable');
    const noMsg = document.getElementById('noDisputedMessage');

    if (!meetings.length) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    tbody.innerHTML = meetings.map(meeting => {
        const host = allMembers.find(m => m.id === meeting.hostId);
        return `
            <tr>
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td><strong>${meeting.title}</strong></td>
                <td>${host?.name || meeting.hostId}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${meeting.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.undisputeMeeting('${meeting.id}')">
                            <i class="fas fa-undo"></i> Undispute
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderApprovedMeetings(meetings) {
    const tbody = document.getElementById('approvedMeetingsTable');
    const noMsg = document.getElementById('noApprovedMeetingsMessage');

    if (!meetings.length) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    tbody.innerHTML = meetings.map(meeting => {
        const host = allMembers.find(m => m.id === meeting.hostId);
        const approvals = meeting.approvals || {};
        const pendingCount = meeting.participants.filter(p =>
            approvals[p] !== 'approved' && approvals[p] !== 'disputed'
        ).length;

        return `
            <tr>
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td><strong>${meeting.title}</strong></td>
                <td>${host?.name || meeting.hostId}</td>
                <td>
                    ${pendingCount === 0
                        ? '<span style="color:#4CAF50; font-weight:600;">All approved</span>'
                        : `<span style="color:#FF9800; font-weight:600;">${pendingCount} pending</span>`
                    }
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${meeting.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderHistory(meetings) {
    const tbody = document.getElementById('historyTable');
    const noMsg = document.getElementById('noHistoryMessage');

    if (!meetings.length) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';

    tbody.innerHTML = meetings.map(meeting => {
        const host = allMembers.find(m => m.id === meeting.hostId);
        return `
            <tr>
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td><strong>${meeting.title}</strong></td>
                <td>${meeting.participants.length} participants</td>
                <td><span style="background:#4CAF50; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Confirmed</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${meeting.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.verifyMeeting = async function(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    showModal('Verify Meeting', `Confirm that "${meeting.title}" took place? This cannot be undone.`, [
        { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
        { label: 'Verify', style: 'btn-primary', onClick: async () => {
            try {
                const updatedApprovals = {...meeting.approvals, [currentOrgId]: 'approved' };
                const allApproved = meeting.participants.every(p => updatedApprovals[p] === 'approved');

                await update(ref(database, `meetings/${meetingId}/approvals`), {
                    [currentOrgId]: 'approved',
                });

                if (allApproved) {
                    await update(ref(database, `meetings/${meetingId}`), {
                        status: 'confirmed'
                    });
                }

                showModal('Verified', 'You have successfully verified this meeting.', [
                    { label: 'OK', style: 'btn-primary', onClick: async () => {
                        await loadData();
                        updateNotification();
                        displayManage();
                    }}
                ]);
            } catch (e) {
                showModal('Error', 'Error verifying meeting: ' + e.message, [
                    { label: 'Close', style: 'btn-danger', onClick: async () => {} }
                ]);
            }
        }}
    ]);
};

window.undisputeMeeting = async function(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    showModal('Remove Dispute', `Remove your dispute on "${meeting.title}"? It will return to your verify tab.`, [
        { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
        { label: 'Remove Dispute', style: 'btn-primary', onClick: async () => {
            try {
                await update(ref(database, `meetings/${meetingId}`), {
                    [`approvals/${currentOrgId}`]: 'pending'
                });
                await loadData();
                updateNotification();
                displayManage();
            } catch (e) {
                showModal('Error', e.message, [
                    { label: 'Close', style: 'btn-danger', onClick: () => {} }
                ]);
            }
        }}
    ]);
};

window.disputeMeeting = async function(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    showModal('Dispute Meeting', `Dispute "${meeting.title}"? The meeting will move to your Disputed tab where you can remove the dispute later.`, [
        { label: 'Cancel', style: 'btn-secondary', onClick: () => {} },
        { label: 'Dispute', style: 'btn-danger', onClick: async () => {
            try {
                await update(ref(database, `meetings/${meetingId}`), {
                    [`approvals/${currentOrgId}`]: 'disputed'
                });
                await loadData();
                updateNotification();
                displayManage();
            } catch (e) {
                showModal('Error', e.message, [
                    { label: 'Close', style: 'btn-danger', onClick: () => {} }
                ]);
            }
        }}
    ]);
};

window.switchMeetingManageView = function(view) {
    document.querySelectorAll('#meetings-manage-content .sub-tab-btn').forEach(btn =>
        btn.classList.remove('active'));
    document.querySelectorAll('#meetings-manage-content .sub-tab-content').forEach(content =>
        content.classList.remove('active'));
    document.querySelector(`#meetings-manage-content .sub-tab-btn[onclick="switchMeetingManageView('${view}')"]`)
        .classList.add('active');

    const viewId = view === 'approved' ? 'approved-meetings-view' : `${view}-view`;
    document.getElementById(viewId).classList.add('active');
};