import { database } from '../config.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { currentOrgId, currentUnityId, allMembers, loadData, showModal } from '../main.js';

export function displayAddMeeting() {
    renderParticipantsList();
}

function renderParticipantsList() {
    const container = document.getElementById('participantsList');

    if (!allMembers.length) {
        container.innerHTML = '<p style="color:#999;">No other members found</p>';
        return;
    }

    container.innerHTML = allMembers.map(member => `
        <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; 
               background:#f4f6fb; border-radius:8px; cursor:pointer; border: 1.5px solid #dde3ee;">
            <input type="checkbox" value="${member.id}" id="participant-${member.id}">
            <span style="font-weight:600; color:#111d35;">${member.name}</span>
            <small style="color:#888;">${member.sector}</small>
        </label>
    `).join('');
}

window.submitMeeting = async function() {
    const title = document.getElementById('meetingTitle').value.trim();
    const date = document.getElementById('meetingDate').value;
    const purpose = document.getElementById('meetingPurpose').value.trim();
    const outcome = document.getElementById('meetingOutcome').value.trim();
    const type = document.getElementById('meetingType').value;
    const format = document.getElementById('meetingFormat').value;
    const location = document.getElementById('meetingLocation').value.trim();

    const selectedParticipants = Array.from(
        document.querySelectorAll('#participantsList input:checked')
    ).map(cb => cb.value);

    if (!title || !date || !type || !format || !location || !purpose || !outcome) {
        showModal('Missing Fields', 'Please fill all required fields.', [
            { label: 'OK', style: 'btn-primary', onClick: () => {} }
        ]);
        return;
    }

    if (!selectedParticipants.length) {
        showModal('No Participants', 'Please select at least one other participant.', [
            { label: 'OK', style: 'btn-primary', onClick: () => {} }
        ]);
        return;
    }

    const allParticipants = [currentOrgId, ...selectedParticipants];

    const approvals = {}
    allParticipants.forEach(id => {
        approvals[id] = id === currentOrgId ? 'approved' : 'pending';
    });

    const meetingId = `MEET-${Date.now()}`;
    const newMeeting = {
        id: meetingId,
        unityId: currentUnityId,
        title,
        date,
        type,
        format,
        location,
        purpose,
        outcome,
        participants: allParticipants,
        hostId: currentOrgId,
        status: 'pending',
        approvals,
        createdAt: new Date().toISOString().split('T')[0]
    };

    try {
        await set(ref(database, `meetings/${meetingId}`), newMeeting);
        showModal('Meeting Logged', 'Your meeting has been submitted. Awaiting verification from all participants.', [
            { label: 'OK', style: 'btn-primary', onClick: () => {} }
        ]);
        clearMeetingForm();
        await loadData();
        renderParticipantsList();
    } catch (e) {
        showModal('Error', 'Error logging meeting: ' + e.message, [
            { label: 'Close', style: 'btn-danger', onClick: () => {} }
        ]);
    }
};

window.clearMeetingForm = function() {
    document.getElementById('meetingTitle').value = '';
    document.getElementById('meetingDate').value = '';
    document.getElementById('meetingType').value = '';
    document.getElementById('meetingFormat').value = '';
    document.getElementById('meetingLocation').value = '';
    document.getElementById('meetingPurpose').value = '';
    document.getElementById('meetingOutcome').value = '';
    document.querySelectorAll('#participantsList input:checked')
        .forEach(cb => cb.checked = false);
}