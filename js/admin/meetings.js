import { allMeetings } from '../main.js';

export function displayMeetingsTableView() {
    const tbody = document.getElementById('meetingsTableView');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const emptyMsg = document.getElementById('noMeetingsViewMessage');

    if (allMeetings.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = allMeetings.map(meeting => `
        <tr style="cursor:pointer;" onclick="window.viewMeetingDetail('${meeting.id}')">
            <td>${meeting.title || 'Untitled Meeting'}</td>
            <td>${meeting.date || 'No date'}</td>
            <td>${meeting.participants.length}</td>
        </tr>
    `).join('');
}