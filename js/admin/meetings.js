import { allEntities, allMeetings } from './main.js';

export function displayMeetingsTableView() {
    const tbody = document.getElementById('meetingsTableView');
    tbody.innerHTML = '';

    allMeetings.forEach(meeting => {
        const orgCount = meeting.participants ? meeting.participants.length : 0;
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => showMeetingDetails(meeting.id);
        row.innerHTML = `
            <td>${meeting.title}</td>
            <td>${meeting.date}</td>
            <td>${orgCount}</td>
        `;
        tbody.appendChild(row);
    });
}

function showMeetingDetails(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const participantNames = meeting.participants
        .map(id => {
            const entity = allEntities.find(e => e.id === id);
            return entity ? entity.fullName : `ID: ${id}`;
        })
        .join(', ');

    const detailContent = `
        <h2>${meeting.title}</h2>
        <ul>
            <li>
                <strong>Date:</strong>
                ${meeting.date}
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
                <strong>Organizations Attended:</strong>
                ${participantNames}
            </li>
        </ul>
    `;

    document.getElementById('meetingDetailContent').innerHTML = detailContent;
    document.getElementById('meetingsTableContainer').style.display = 'none';
    document.getElementById('meetingDetail').style.display = 'block';
}

function backToMeetingsTable() {
    document.getElementById('meetingsTableContainer').style.display = 'block';
    document.getElementById('meetingDetail').style.display = 'none';
}

window.showMeetingDetails = showMeetingDetails;
window.backToMeetingsTable = backToMeetingsTable;