import { currentOrgId, allMeetings, allMembers, statusBadge, showModal } from "../main.js";

export function displayOverview() {
    renderStats();
    renderOverviewTable();
}

function renderStats() {
    const confirmed = allMeetings.filter(m => m.status === 'confirmed');
    const pending = allMeetings.filter(m => m.status === 'pending');

    const collaborators = new Set();
    confirmed.forEach(m => m.participants.forEach(p => {
        if (p !== currentOrgId) collaborators.add(p);
    }));

    document.getElementById('confirmedMeetingsCount').textContent = confirmed.length;
    document.getElementById('pendingMeetingsCount').textContent = pending.length;
    document.getElementById('uniqueCollaboratorsCount').textContent = collaborators.size;
}

function renderOverviewTable() {
    const tbody = document.getElementById('overviewMeetingsTable');

    if (!allMeetings.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:40px; color:#5a6478;">
                    <i class="fas fa-calendar" style="font-size:48px; margin-bottom:20px;"></i>
                    <p>No meetings yet</p>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...allMeetings].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(meeting => {
        const host = allMembers.find(m => m.id === meeting.hostId);
        const isHost = meeting.hostId === currentOrgId;

        statusBadge(meeting.status);

        const hostBadge = isHost
            ? '<span style="background:#1a3a5c; color:white; padding:2px 8px; border-radius:8px; font-size:11px; margin-left:6px;">Host</span>'
            : '';

        return `
            <tr style="cursor:pointer;" onclick="window.viewMeetingDetail('${meeting.id}')">
                <td>${new Date(meeting.date).toLocaleDateString()}</td>
                <td>
                    <strong>${meeting.title}</strong>${hostBadge}
                </td>
                <td>${meeting.participants.length} participants</td>
                <td>${meeting.status}</td>
            </tr>
        `;
    }).join('');
}