import { allEntities, allMeetings } from './main.js';

export function displayMeetingsTableView() {
    const tbody = document.getElementById('meetingsTableView');
    if (!tbody) {
        console.error('Meetings table not found');
        return;
    }
    
    tbody.innerHTML = '';

    allMeetings.forEach(meeting => {
        const orgCount = meeting.participants && Array.isArray(meeting.participants) ? meeting.participants.length : 0;
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => showMeetingDetails(meeting.id);
        row.innerHTML = `
            <td>${meeting.title || 'Untitled Meeting'}</td>
            <td>${meeting.date || 'No date'}</td>
            <td>${orgCount}</td>
        `;
        tbody.appendChild(row);
    });
}

function showMeetingDetails(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) {
        console.error('Meeting not found:', meetingId);
        return;
    }

    let participantNames = 'No participants';
    if (meeting.participants && Array.isArray(meeting.participants) && meeting.participants.length > 0) {
        participantNames = meeting.participants
            .map(id => {
                const entity = allEntities.find(e => e.id === id);
                return entity ? entity.fullName || entity.name : `ID: ${id}`;
            })
            .join(', ');
    }

    const detailContent = `
        <h2>${meeting.title || 'Untitled Meeting'}</h2>
        <ul>
            <li>
                <strong>ID:</strong>
                ${meeting.id}
            </li>
            <li>
                <strong>Date:</strong>
                ${meeting.date || 'Not specified'}
            </li>
            <li>
                <strong>Purpose:</strong>
                ${meeting.purpose || 'Not specified'}
            </li>
            <li>
                <strong>Outcome:</strong>
                ${meeting.outcome || 'Not specified'}
            </li>
            <li>
                <strong>Number of Participants:</strong>
                ${meeting.participants ? meeting.participants.length : 0}
            </li>
            <li>
                <strong>Organizations Attended:</strong><br>
                ${participantNames}
            </li>
        </ul>
    `;

    const detailEl = document.getElementById('meetingDetailContent');
    if (detailEl) {
        detailEl.innerHTML = detailContent;
    }
    
    const tableContainer = document.getElementById('meetingsTableContainer');
    const detailContainer = document.getElementById('meetingDetail');
    
    if (tableContainer) tableContainer.style.display = 'none';
    if (detailContainer) detailContainer.style.display = 'block';
}

function backToMeetingsTable() {
    const tableContainer = document.getElementById('meetingsTableContainer');
    const detailContainer = document.getElementById('meetingDetail');
    
    if (tableContainer) tableContainer.style.display = 'block';
    if (detailContainer) detailContainer.style.display = 'none';
}

window.showMeetingDetails = showMeetingDetails;
window.backToMeetingsTable = backToMeetingsTable;