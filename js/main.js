import { database } from './config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

import { loadVisualization, applyFilters, clearFilters } from './network/data.js';
import { resetZoom } from './network/visualization.js';
import { switchTab, selectEntity } from './network/sidebar.js';

import { displayOverview as displayAdminOverview } from './admin/overview.js';
import { displayPendingApplications } from './admin/pending.js';
import { displayModifyTables } from './admin/modify.js';
import { displayUnityProfile } from './admin/profile.js';

import { displayMemberProfile } from './member/profile.js';
import { displayUnityInfo } from './member/profile.js';

import { displayAddMeeting } from './meeting/add-meeting.js';
import { displayManage } from './meeting/manage.js';
import { displayOverview as displayMemberOverview } from './meeting/overview.js';

import { displayOverview as displayAnalyticsOverview } from './analytics/overview.js';
import { displayInfluence } from './analytics/influence.js';
import { displayActivity } from './analytics/activity.js';
import { displayInsights } from './analytics/insights.js';

export let allEntities = [];
export let allMeetings = [];
export let currentOrgId = null;
export let currentUnityId = null;
export let userRole = null;
export let allMembers = [];
export let allAdminEntities = [];

document.addEventListener('DOMContentLoaded', async () => {
    const unityId = sessionStorage.getItem('unityId');
    const role = sessionStorage.getItem('userRole');
    document.getElementById('viewMode')?.addEventListener('change', applyFilters);
    document.getElementById('filterSector')?.addEventListener('change', applyFilters);
    document.getElementById('connectionStrength')?.addEventListener('change', applyFilters);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('timePeriod')?.addEventListener('change', applyFilters);
    document.getElementById('searchOrgA')?.addEventListener('input', applyFilters);
    document.getElementById('searchOrgB')?.addEventListener('input', applyFilters);
    document.getElementById('showIsolatedNodes')?.addEventListener('change', loadVisualization);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);

    if (!unityId) {
        window.location.href = 'index.html';
        return;
    }

    await loadData();
    updateNotification();

    if (role === 'admin') {
        document.getElementById('adminTabNav').style.display = 'flex';
        document.getElementById('analyticsTabNav').style.display = 'flex';
        const username = sessionStorage.getItem('username');
        if (username) document.getElementById('adminUsername').textContent = username;
    } else if (role === 'member') {
        document.getElementById('meetingsTabNav').style.display = 'flex';
        document.getElementById('analyticsTabNav').style.display = 'flex';
        document.getElementById('userInfoDisplay').style.display = 'flex';
        document.getElementById('profileTabNav').style.display = 'flex';
        const orgName = sessionStorage.getItem('orgName');
        if (orgName) document.getElementById('userDisplayName').textContent = orgName;
        const meetingsOrgName = document.getElementById('meetingsOrgName');
        if (meetingsOrgName) meetingsOrgName.textContent = orgName || '';
        const analyticsUserDisplay = document.getElementById('analyticsUserDisplay');
        if (analyticsUserDisplay) analyticsUserDisplay.textContent = orgName || '';
        const profileOrgName = document.getElementById('profileOrgName');
        if (profileOrgName) profileOrgName.textContent = orgName || '';
    }

    const savedView = sessionStorage.getItem('currentView');
    if (savedView === 'admin' && role === 'admin') showAdminView();
    else if (savedView === 'meetings' && role === 'member') showMeetingsView();
    else if (savedView === 'analytics') showAnalyticsView();
    else if (savedView === 'profile' && role === 'member') showProfileView();
    else showNetworkView();

    document.getElementById('appLoading').style.display = 'none';
});

export async function loadData() {
    currentUnityId = sessionStorage.getItem('unityId');
    currentOrgId = sessionStorage.getItem('orgId');
    userRole = sessionStorage.getItem('userRole');

    const [entitiesSnap, meetingsSnap] = await Promise.all([
        get(ref(database, 'entities')),
        get(ref(database, 'meetings'))
    ]);

    if (entitiesSnap.exists()) {
        const allData = Object.values(entitiesSnap.val()).filter(e =>
            e.unityId === currentUnityId
        );
        
        allEntities = allData.filter(e => e.status === 'active' && e.approval === 'approved');
        allAdminEntities = allData;
        allMembers = allEntities.filter(e => e.id !== currentOrgId);
    }

    if (meetingsSnap.exists()) {
        allMeetings = Object.values(meetingsSnap.val()).filter(m =>
            m.unityId === currentUnityId
        );
    }
}

export function showNetworkView() {
    hideAllViews();
    document.getElementById('networkView').style.display = 'flex';
    setActiveNav('showNetworkView');
    sessionStorage.setItem('currentView', 'network');
    loadVisualization();
}

export function showAdminView() {
    hideAllViews();
    document.getElementById('adminView').style.display = 'flex';
    setActiveNav('showAdminView');
    sessionStorage.setItem('currentView', 'admin');
    initAdminNavigation();
    updateNotification();
    const savedTab = sessionStorage.getItem('adminTab') || 'admin-overview';
    switchAdminTab(savedTab);
}

export function showMeetingsView() {
    hideAllViews();
    document.getElementById('meetingsView').style.display = 'flex';
    setActiveNav('showMeetingsView');
    sessionStorage.setItem('currentView', 'meetings');
    initMeetingsNavigation();
    updateNotification();
    const savedTab = sessionStorage.getItem('meetingsTab') || 'meetings-add';
    switchMeetingsTab(savedTab);
}

export function showAnalyticsView() {
    hideAllViews();
    document.getElementById('analyticsView').style.display = 'flex';
    setActiveNav('showAnalyticsView');
    sessionStorage.setItem('currentView', 'analytics');
    initAnalyticsNavigation();
    const savedTab = sessionStorage.getItem('analyticsTab') || 'analytics-overview';
    switchAnalyticsTab(savedTab);
}

export function showProfileView() {
    hideAllViews();
    document.getElementById('profileView').style.display = 'flex';
    setActiveNav('showProfileView');
    sessionStorage.setItem('currentView', 'profile');
    initProfileNavigation();
    const savedTab = sessionStorage.getItem('profileTab') || 'profile-details';
    switchProfileTab(savedTab);
}

function hideAllViews() {
    ['networkView', 'adminView', 'meetingsView', 'analyticsView', 'profileView'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('.navbar-menu a').forEach(a => a.classList.remove('active'));
}

function setActiveNav(fnName) {
    const nav = document.querySelector(`.navbar-menu a[onclick="${fnName}()"]`);
    if (nav) nav.classList.add('active');
}

function initAdminNavigation() {
    document.querySelectorAll('#adminView .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchAdminTab(item.dataset.tab);
        });
    });
}

function switchAdminTab(tab) {
    document.querySelectorAll('#adminView .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('#adminView .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#adminView .nav-item[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');

    const titles = {
        'admin-overview': 'Overview',
        'admin-modify': 'Members',
        'admin-pending': 'Approvals',
        'admin-profile': 'Unity Profile'
    };
    document.getElementById('pageTitle').textContent = titles[tab];

    if (tab === 'admin-overview') displayAdminOverview();
    if (tab === 'admin-modify') displayModifyTables();
    if (tab === 'admin-pending') displayPendingApplications();
    if (tab === 'admin-profile') displayUnityProfile();

    sessionStorage.setItem('adminTab', tab);
}

function initMeetingsNavigation() {
    document.querySelectorAll('#meetingsView .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchMeetingsTab(item.dataset.tab);
        });
    });
}

function switchMeetingsTab(tab) {
    document.querySelectorAll('#meetingsView .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('#meetingsView .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#meetingsView .nav-item[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');

    const titles = {
        'meetings-add': 'Log Meeting',
        'meetings-manage': 'Manage Meetings',
        'meetings-overview': 'Overview'
    };
    document.getElementById('meetingsPageTitle').textContent = titles[tab];

    if (tab === 'meetings-add') displayAddMeeting();
    if (tab === 'meetings-manage') displayManage();
    if (tab === 'meetings-overview') displayMemberOverview();

    sessionStorage.setItem('meetingsTab', tab);
}

function initAnalyticsNavigation() {
    document.querySelectorAll('#analyticsView .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchAnalyticsTab(item.dataset.tab);
        });
    });
}

function switchAnalyticsTab(tab) {
    document.querySelectorAll('#analyticsView .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('#analyticsView .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#analyticsView .nav-item[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');

    const titles = {
        'analytics-overview': 'Your Overview',
        'analytics-influence': 'Influence Score',
        'analytics-activity': 'Activity Dashboard',
        'analytics-insights': 'Network Insights',
    };
    document.getElementById('analyticsPageTitle').textContent = titles[tab];

    if (tab === 'analytics-overview') displayAnalyticsOverview();
    if (tab === 'analytics-influence') displayInfluence();
    if (tab === 'analytics-activity') displayActivity();
    if (tab === 'analytics-insights') displayInsights();

    sessionStorage.setItem('analyticsTab', tab);
}

function initProfileNavigation() {
    document.querySelectorAll('#profileView .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchProfileTab(item.dataset.tab);
        });
    });
}

function switchProfileTab(tab) {
    document.querySelectorAll('#profileView .nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('#profileView .tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`#profileView .nav-item[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.add('active');

    const titles = {
        'profile-details': 'Your Organization Profile',
        'profile-unity': 'Unity Info'
    };
    document.getElementById('profilePageTitle').textContent = titles[tab];

    if (tab === 'profile-details') displayMemberProfile();
    if (tab === 'profile-unity') displayUnityInfo();

    sessionStorage.setItem('profileTab', tab);
}

export function showModal(title, message, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').innerHTML = message;
    const btnContainer = document.getElementById('modalButtons');
    btnContainer.innerHTML = '';
    buttons.forEach(({ label, style, onClick }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = `btn ${style}`;
        btn.onclick = () => {
            document.getElementById('customModal').style.display = 'none';
            onClick();
        };
        btnContainer.appendChild(btn);
    });
    document.getElementById('customModal').style.display = 'flex';
}

export function statusBadge(status) {
    const styles = {
        confirmed:  { bg: '#4CAF50', label: 'Confirmed' },
        pending:    { bg: '#FF9800', label: 'Pending' },
        disputed:   { bg: '#f44336', label: 'Disputed' },
        approved:   { bg: '#4CAF50', label: 'Approved' },
        rejected:   { bg: '#f44336', label: 'Rejected' }
    };
    const s = styles[status] || { bg: '#999', label: status };
    return `<span style="background:${s.bg}; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">${s.label}</span>`;
}

export function updateNotification() {
    if (userRole === 'member') {
        const pendingCount = allMeetings.filter(m =>
            m.status === 'pending' &&
            m.hostId !== currentOrgId &&
            m.participants.includes(currentOrgId) &&
            m.approvals?.[currentOrgId] !== 'approved' &&
            m.approvals?.[currentOrgId] !== 'disputed'
        ).length;

        const meetingBadge = document.getElementById('meetingNotification');
        const manageBadge = document.getElementById('manageBadge');
        const verifyBadge = document.getElementById('verifyBadge');

        [meetingBadge, manageBadge, verifyBadge].forEach(badge => {
            if (!badge) return;
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    if (userRole === 'admin') {
        const pendingApprovals = allAdminEntities.filter(e => e.approval === 'pending').length;

        const adminBadge = document.getElementById('adminNotification');
        const approvalsBadge = document.getElementById('approvalsBadge');

        [adminBadge, approvalsBadge].forEach(badge => {
            if (!badge) return;
            if (pendingApprovals > 0) {
                badge.textContent = pendingApprovals;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        });
    }
}

window.viewEntityDetail = function(entityId) {
    const entity = allAdminEntities.find(e => e.id === entityId) 
        || allEntities.find(e => e.id === entityId);
    if (!entity) return;

    const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';

    showModal('Organization Details', `
        <strong>ID:</strong> ${entity.id}<br>
        <strong>Name:</strong> ${entity.fullName || entity.name}<br>
        <strong>Sector:</strong> ${entity.sector ? entity.sector.charAt(0).toUpperCase() + entity.sector.slice(1) : 'N/A'}<br>
        <strong>Funding Type:</strong> ${entity.fundingType ? entity.fundingType.charAt(0).toUpperCase() + entity.fundingType.slice(1) : 'N/A'}<br>
        <strong>Focus Areas:</strong><br>
        <div style="margin:6px 0; display:flex; flex-wrap:wrap; gap:4px;">
            ${entity.focusAreas && entity.focusAreas.length > 0
                ? entity.focusAreas.map(f => `<span style="background:#111d35; color:white; padding:3px 8px; border-radius:10px; font-size:12px;">${f}</span>`).join('')
                : '<span style="color:#888;">None</span>'
            }
        </div>
        <strong>Location:</strong> ${entity.location || 'N/A'}<br>
        <strong>Description:</strong> ${entity.description || 'N/A'}<br>
        <strong>Primary Duty:</strong> ${entity.duty || 'N/A'}<br>
        ${entity.fundingSource ? `<strong>Funding Source:</strong> ${entity.fundingSource}<br>` : ''}
        ${entity.budget ? `<strong>Annual Budget:</strong> $${entity.budget.toLocaleString()}<br>` : ''}
        ${entity.founded ? `<strong>Founded:</strong> ${entity.founded}<br>` : ''}
        ${entity.removedDate ? `<strong>Removed:</strong> ${entity.removedDate}<br>` : ''}
        ${entity.appliedDate ? `<strong>Applied:</strong> ${new Date(entity.appliedDate).toLocaleDateString()}<br>` : ''}
        <strong>Status:</strong> <span style="color:${statusColor}; font-weight:600;">${entity.status}</span>
    `, [
        { label: 'Close', style: 'btn-secondary', onClick: () => {} }
    ]);
};

window.viewMeetingDetail = function(meetingId) {
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const allOrgList = [...allEntities, ...allAdminEntities];
    const host = allOrgList.find(e => e.id === meeting.hostId);
    const approvals = meeting.approvals || {};

    const participantRows = meeting.participants.map(id => {
        const member = allOrgList.find(e => e.id === id) || { name: id };
        const status = approvals[id] || 'pending';
        return `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                <span>${member.name}</span>${statusBadge(status)}
            </div>
        `;
    }).join('');

    showModal('Meeting Details', `
        <strong>Title:</strong> ${meeting.title}<br>
        <strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}<br>
        <strong>Host:</strong> ${host?.name || meeting.hostId}<br>
        <strong>Type:</strong> ${meeting.type || 'N/A'}<br>
        <strong>Format:</strong> ${meeting.format || 'N/A'}<br>
        <strong>Location:</strong> ${meeting.location || 'N/A'}<br>
        <strong>Purpose:</strong> ${meeting.purpose || 'N/A'}<br>
        <strong>Outcome:</strong> ${meeting.outcome || 'N/A'}<br><br>
        <strong>Participants:</strong>
        <div style="margin-top:8px;">${participantRows}</div>
    `, [
        { label: 'Close', style: 'btn-secondary', onClick: () => {} }
    ]);
};

window.showNetworkView = showNetworkView;
window.showAdminView = showAdminView;
window.showMeetingsView = showMeetingsView;
window.showAnalyticsView = showAnalyticsView;
window.showProfileView = showProfileView;
window.loadVisualization = loadVisualization;
window.resetZoom = resetZoom;
window.clearFilters = clearFilters;
window.switchTab = switchTab;
window.selectEntity = selectEntity;