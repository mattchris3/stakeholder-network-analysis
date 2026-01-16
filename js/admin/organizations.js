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
        row.style.cursor = 'pointer';
        row.onclick = () => showOrganizationDetails(entity.id);
        row.innerHTML = `
            <td>${entity.fullName}</td>
            <td>${entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1)}</td>
            <td>${count}</td>
        `;
        tbody.appendChild(row);
    });
}

function showOrganizationDetails(entityId) {
    const entity = allEntities.find(e => e.id === entityId);
    if (!entity) return;

    const detailContent = `
        <h2>${entity.fullName}</h2>
        <ul>
            <li>
                <strong>Short Name:</strong>
                ${entity.name}
            </li>
            <li>
                <strong>Sector:</strong>
                ${entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1)}
            </li>
            <li>
                <strong>Description:</strong>
                ${entity.description || 'Not specified'}
            </li>
            <li>
                <strong>Primary Duty:</strong>
                ${entity.duty || 'Not specified'}
            </li>
            <li>
                <strong>Funding Source:</strong>
                ${entity.fundingSource || 'Not specified'}
            </li>
            <li>
                <strong>Annual Budget:</strong>
                $${entity.budget ? entity.budget.toLocaleString() : 'Not specified'}
            </li>
            <li>
                <strong>Founded:</strong>
                ${entity.founded || 'Not specified'}
            </li>
            <li>
                <strong>Location:</strong>
                ${entity.location || 'Not specified'}
            </li>
            <li>
                <strong>Status:</strong>
                ${entity.status || 'active'}
            </li>
        </ul>
    `;

    document.getElementById('organizationDetailContent').innerHTML = detailContent;
    document.getElementById('organizationsTableContainer').style.display = 'none';
    document.getElementById('organizationDetail').style.display = 'block';
}

function backToOrganizationsTable() {
    document.getElementById('organizationsTableContainer').style.display = 'block';
    document.getElementById('organizationDetail').style.display = 'none';
}

window.showOrganizationDetails = showOrganizationDetails;
window.backToOrganizationsTable = backToOrganizationsTable;