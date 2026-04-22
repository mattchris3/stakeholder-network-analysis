import { allEntities, allMeetings, currentOrgId, userRole } from '../main.js';

export function displayOverview() {
    renderStats();
}

function renderStats() {
    let myMeetings = allMeetings;

    if (userRole === 'member') {
        myMeetings = allMeetings.filter(m => m.participants.includes(currentOrgId));
    } 
    
    const collaborators = new Set();
    myMeetings.forEach(m => m.participants.forEach(p => {
        if (p !== currentOrgId) collaborators.add(p);
    }));

    const typeCounts = {};
    myMeetings.forEach(m => {
        typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
    });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const ranked = [...allEntities].sort((a, b) => {
        const aCount = allMeetings.filter(m => m.participants.includes(a.id)).length;
        const bCount = allMeetings.filter(m => m.participants.includes(b.id)).length;
        return bCount - aCount;
    });
    const rank = ranked.findIndex(e => e.id === currentOrgId) + 1;

    document.getElementById('analytics-overview-content').innerHTML = `
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-box">
                <i class="fas fa-calendar-check" style="color:#1a3a5c;"></i>
                <div class="stat-number">${myMeetings.length}</div>
                <div class="stat-label">Confirmed Meetings</div>
            </div>
            <div class="stat-box">
                <i class="fas fa-users" style="color:#1a3a5c;"></i>
                <div class="stat-number">${collaborators.size}</div>
                <div class="stat-label">Unique Collaborators</div>
            </div>
            <div class="stat-box">
                <i class="fas fa-tag" style="color:#1a3a5c;"></i>
                <div class="stat-number" style="font-size:20px; text-transform:capitalize;">${topType}</div>
                <div class="stat-label">Top Meeting Type</div>
            </div>
            <div class="stat-box">
                <i class="fas fa-trophy" style="color:#1a3a5c;"></i>
                <div class="stat-number">#${rank}</div>
                <div class="stat-label">Network Rank</div>
            </div>
        </div>
        <div id="overview-collaborators"></div>
        <div id="overview-recent"></div>
    `;

    renderTopCollaborators(myMeetings);
    renderRecentMeetings(myMeetings);
}

function renderTopCollaborators(myMeetings) {
    const container = document.getElementById('overview-collaborators');
    if (!container) return;

    const partnerCounts = {};
    myMeetings.forEach(m => {
        m.participants.forEach(p => {
            if (p !== currentOrgId) {
                partnerCounts[p] = (partnerCounts[p] || 0) + 1;
            }
        });
    });

    const top3 = Object.entries(partnerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => {
            const entity = allEntities.find(e => e.id === id);
            return { name: entity?.name || id, fullName: entity?.fullName || id, sector: entity?.sector || '', count };
        });

    container.innerHTML = `
        <div class="data-section" style="margin-bottom:24px;">
            <h3 style="color:#1a3a5c; margin-bottom:16px;">Top Collaborators</h3>
            ${top3.length === 0 ? '<p style="color:#888;">No collaborations yet</p>' :
            top3.map((p, i) => `
                <div style="display:flex; align-items:center; gap:16px; padding:12px; background:#f9fafc; border-radius:10px; margin-bottom:10px;">
                    <div style="width:32px; height:32px; background:linear-gradient(135deg,#1a3a5c,#111d35); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:14px;">${i + 1}</div>
                    <div style="flex:1;">
                        <div style="font-weight:700; color:#111d35;">${p.name}</div>
                        <div style="font-size:12px; color:#888;">${p.sector}</div>
                    </div>
                    <span style="background:linear-gradient(135deg,#1a3a5c,#111d35); color:white; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">${p.count} meetings</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderRecentMeetings(myMeetings) {
    const container = document.getElementById('overview-recent');
    if (!container) return;

    const recent = [...myMeetings]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    container.innerHTML = `
        <div class="data-section">
            <h3 style="color:#1a3a5c; margin-bottom:16px;">Recent Meetings</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Format</th>
                        <th>Participants</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.length === 0 ? '<tr><td colspan="5" style="text-align:center; color:#888;">No meetings yet</td></tr>' :
                    recent.map(m => `
                        <tr>
                            <td>${new Date(m.date).toLocaleDateString()}</td>
                            <td><strong>${m.title}</strong></td>
                            <td style="text-transform:capitalize;">${m.type || 'N/A'}</td>
                            <td style="text-transform:capitalize;">${m.format || 'N/A'}</td>
                            <td>${m.participants.length} orgs</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="window.viewMeetingDetail('${m.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}   

