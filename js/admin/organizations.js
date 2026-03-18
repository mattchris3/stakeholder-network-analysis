import { allEntities, allMeetings } from './main.js';

export function displayOrganizationsTable() {
    const tbody = document.getElementById('organizationsTable');
    if (!tbody) {
        console.error('Organizations table not found');
        return;
    }
    
    tbody.innerHTML = '';

    const meetingCounts = {};
    allMeetings.forEach(meeting => {
        if (meeting.participants && Array.isArray(meeting.participants)) {
            meeting.participants.forEach(id => {
                meetingCounts[id] = (meetingCounts[id] || 0) + 1;
            });
        }
    });

    const approvedEntities = allEntities.filter(e => e.approval === 'approved');

    approvedEntities.forEach(entity => {
        const count = meetingCounts[entity.id] || 0;
        const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => showOrganizationDetails(entity.id);
        row.innerHTML = `
            <td>${entity.fullName || entity.name}</td>
            <td>${entity.sector ? entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1) : 'Unknown'}</td>
            <td><span style="color: ${statusColor}; font-weight: 600;">${entity.status}</span></td>
            <td>${count}</td>
        `;
        tbody.appendChild(row);
    });
}

function showOrganizationDetails(entityId) {
    const entity = allEntities.find(e => e.id === entityId);
    if (!entity) {
        console.error('Entity not found:', entityId);
        return;
    }

    const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';

    const detailContent = `
        <h2>${entity.fullName || entity.name}</h2>
        <ul>
            <li>
                <strong>ID:</strong>
                ${entity.id}
            </li>
            <li>
                <strong>Short Name:</strong>
                ${entity.name}
            </li>
            <li>
                <strong>Sector:</strong>
                ${entity.sector ? entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1) : 'Not specified'}
            </li>
            <li>
                <strong>Status:</strong>
                <span style="color: ${statusColor}; font-weight: 600;">
                    ${entity.status}
                </span>
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
        </ul>
    `;

    const detailEl = document.getElementById('organizationDetailContent');
    if (detailEl) {
        detailEl.innerHTML = detailContent;
    }
    
    const tableContainer = document.getElementById('organizationsTableContainer');
    const detailContainer = document.getElementById('organizationDetail');
    
    if (tableContainer) tableContainer.style.display = 'none';
    if (detailContainer) detailContainer.style.display = 'block';
}

function backToOrganizationsTable() {
    const tableContainer = document.getElementById('organizationsTableContainer');
    const detailContainer = document.getElementById('organizationDetail');
    
    if (tableContainer) tableContainer.style.display = 'block';
    if (detailContainer) detailContainer.style.display = 'none';
}

window.showOrganizationDetails = showOrganizationDetails;
window.backToOrganizationsTable = backToOrganizationsTable;