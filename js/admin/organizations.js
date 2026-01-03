import { allEntities, allMeetings } from './main.js';

export function displayOrganizationsTable() {
    const tbody = document.getElementById('organizationsTable');
    tbody.innerHTML = '';

    const meetingCounts = {};
    allMeetings.forEach(meeting => {
        if (meeting.participants) {
            meeting.participants.forEach(id => {
                meetingCounts[id] = (meetingCounts[id] || 0) + 1;
            });
        }
    });

    allEntities.forEach(entity => {
        const count = meetingCounts[entity.id] || 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entity.fullName}</td>
            <td>${entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1)}</td>
            <td>${count}</td>
        `;
        tbody.appendChild(row);
    });
}