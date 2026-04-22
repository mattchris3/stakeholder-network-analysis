import { allEntities, allMeetings } from '../main.js';

export function displayOrganizationsTable() {
    const tbody = document.getElementById('organizationsTable');
    const noMsg = document.getElementById('noOrganizationsMessage');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (allEntities.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';

    const meetingCounts = {};
    allMeetings.forEach(meeting => {
        meeting.participants.forEach(id => {
            meetingCounts[id] = (meetingCounts[id] || 0) + 1;
        });
    });

    tbody.innerHTML = allEntities.map(entity => {
        const count = meetingCounts[entity.id] || 0;
        const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';
        return `
            <tr style="cursor:pointer;" onclick="window.viewEntityDetail('${entity.id}')">
                <td>${entity.fullName || entity.name}</td>
                <td style="text-transform:capitalize;">${entity.sector || 'Unknown'}</td>
                <td><span style="color:${statusColor}; font-weight:600;">${entity.status}</span></td>
                <td>${count}</td>
            </tr>
        `;
    }).join('');
}