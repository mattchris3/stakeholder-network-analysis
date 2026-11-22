import { allEntities, allMeetings, showModal } from '../main.js';

export function displayInsights() {
    renderDependency();
    renderBridges();
    renderGaps();
}

function buildLinkMap() {
    const links = {};
    const confirmed = allMeetings.filter(m => m.status === 'confirmed');

    confirmed.forEach(meeting => {
        const parts = meeting.participants;
        for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) {
                const key = [parts[i], parts[j]].sort().join('-');
                if (!links[key]) {
                    links[key] = { source: parts[i], target: parts[j], value: 0 };
                }
                links[key].value++;
            }
        }
    });

    return Object.values(links);
}

function getEntityName(id) {
    const entity = allEntities.find(e => e.id === id);
    return entity ? entity.name : id;
}

function getEntity(id) {
    return allEntities.find(e => e.id === id);
}

// Simulate removing each org to measure network impact
function renderDependency() {
    const container = document.getElementById('dependency-view');
    if (!container) return;

    const links = buildLinkMap();
    const confirmed = allMeetings.filter(m => m.status === 'confirmed');

    const results = allEntities.map(entity => {
        const id = entity.id;
        const focusAreas = entity.focusAreas || [];

        const partners = new Set();
        links.forEach(link => {
            if (link.source === id) partners.add(link.target);
            if (link.target === id) partners.add(link.source);
        });

        const exclusivePartners = [...partners].filter(partnerId => {
            const partnerLinks = links.filter(l =>
                (l.source === partnerId || l.target === partnerId) &&
                l.source !== id && l.target !== id
            );
            return partnerLinks.length === 0;
        });

        const focusCoverage = focusAreas.map(area => {
            const othersWithArea = allEntities.filter(e => e.id !== id && (e.focusAreas || []).includes(area));
            return { area, othersCount: othersWithArea.length };
        });
        const uniqueFocusAreas = focusCoverage.filter(f => f.othersCount === 0).map(f => f.area);
        const lowCoverageFocusAreas = focusCoverage.filter(f => f.othersCount === 1).map(f => f.area);

        const sameType = allEntities.filter(e => e.id !== id && e.fundingType === entity.fundingType);
        const isUniqueType = sameType.length === 0;

        const hostedMeetings = confirmed.filter(m => m.hostId === id).length;
        const totalMeetings = confirmed.filter(m => m.participants.includes(id)).length;

        let score = 0;
        score += exclusivePartners.length * 25;
        score += uniqueFocusAreas.length * 20;
        score += lowCoverageFocusAreas.length * 10;
        if (isUniqueType) score += 15;
        score += Math.min(partners.size * 3, 30);

        score = Math.min(score, 100);

        return {
            id,
            name: entity.name,
            fullName: entity.fullName,
            sector: entity.sector,
            fundingType: entity.fundingType || 'N/A',
            focusAreas,
            partners: partners.size,
            exclusivePartners,
            exclusiveNames: exclusivePartners.map(getEntityName),
            uniqueFocusAreas,
            lowCoverageFocusAreas,
            focusCoverage,
            isUniqueType,
            sameTypeCount: sameType.length,
            hostedMeetings,
            totalMeetings,
            score
        };
    }).sort((a, b) => b.score - a.score);

    container.innerHTML = `
        <div class="data-section" style="margin-top:20px;">
            <h3 style="color:#111d35; margin-bottom:8px;">Unique Contribution Analysis</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">
                Measures what each organization uniquely brings to the network — exclusive partnerships, irreplaceable focus areas, and role coverage. Click a row to see the full breakdown.
            </p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Organization</th>
                        <th>Sector</th>
                        <th>Partners</th>
                        <th>Contribution Score</th>
                        <th>Level</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r, i) => `
                        <tr style="cursor:pointer;" onclick="window.showContributionDetail('${r.id}')">
                            <td>
                                <span style="font-weight:700; color:${i === 0 ? '#f39c12' : i === 1 ? '#95a5a6' : i === 2 ? '#cd7f32' : '#111d35'};">
                                    #${i + 1}
                                </span>
                            </td>
                            <td>
                                <strong>${r.name}</strong><br>
                                <small style="color:#888;">${r.fullName}</small>
                            </td>
                            <td style="text-transform:capitalize;">${r.sector}</td>
                            <td>${r.partners}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="flex:1; background:#e9ecef; border-radius:4px; height:8px;">
                                        <div style="width:${r.score}%; background:linear-gradient(90deg,#1a3a5c,#111d35); height:8px; border-radius:4px;"></div>
                                    </div>
                                    <span style="font-weight:700; color:#111d35; min-width:32px;">${r.score}</span>
                                </div>
                            </td>
                            <td>
                                ${r.score >= 70
                                    ? '<span style="background:#f44336; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Critical</span>'
                                    : r.score >= 40
                                    ? '<span style="background:#FF9800; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">High</span>'
                                    : r.score >= 20
                                    ? '<span style="background:#1a3a5c; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Moderate</span>'
                                    : '<span style="background:#4CAF50; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Low</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    window.showContributionDetail = function(entityId) {
        const r = results.find(r => r.id === entityId);
        if (!r) return;

        const exclusiveSection = r.exclusivePartners.length > 0
            ? `<div style="margin-bottom:16px;">
                    <div style="font-weight:700; color:#f44336; margin-bottom:8px;">
                        <i class="fas fa-exclamation-triangle"></i> ${r.exclusivePartners.length} Exclusive Partner${r.exclusivePartners.length > 1 ? 's' : ''}
                    </div>
                    <p style="font-size:13px; color:#666; margin-bottom:8px;">These organizations only connect to the network through ${r.name}:</p>
                    ${r.exclusiveNames.map(name => `
                        <span style="background:#fee; color:#c33; padding:4px 12px; border-radius:12px; font-size:12px; display:inline-block; margin:2px;">${name}</span>
                    `).join('')}
                </div>`
            : `<div style="margin-bottom:16px;">
                    <div style="color:#4CAF50; margin-bottom:4px;"><i class="fas fa-check-circle"></i> No exclusive partners</div>
                    <p style="font-size:13px; color:#888;">All connected organizations have alternative links.</p>
                </div>`;

        const focusSection = `
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; color:#111d35; margin-bottom:8px;">
                    <i class="fas fa-tags"></i> Focus Area Coverage
                </div>
                ${r.focusCoverage.map(f => {
                    const width = f.othersCount === 0 ? 100 : f.othersCount === 1 ? 60 : 30;
                    const color = f.othersCount === 0 ? '#f44336' : f.othersCount === 1 ? '#FF9800' : '#4CAF50';
                    const label = f.othersCount === 0 ? 'Only provider' : f.othersCount === 1 ? '1 other covers this' : `${f.othersCount} others cover this`;
                    return `
                        <div style="margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:13px; font-weight:600;">${f.area}</span>
                                <span style="font-size:11px; color:${color};">${label}</span>
                            </div>
                            <div style="background:#e9ecef; border-radius:4px; height:6px;">
                                <div style="width:${width}%; background:${color}; height:6px; border-radius:4px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        const roleSection = `
            <div style="margin-bottom:16px;">
                <div style="font-weight:700; color:#111d35; margin-bottom:8px;">
                    <i class="fas fa-hand-holding-usd"></i> Network Role
                </div>
                <div style="display:flex; gap:12px;">
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:4px;">Type</div>
                        <div style="font-weight:700; color:#111d35; text-transform:capitalize;">${r.fundingType}</div>
                    </div>
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:4px;">Others Same Type</div>
                        <div style="font-weight:700; color:${r.isUniqueType ? '#f44336' : '#111d35'};">${r.isUniqueType ? 'None — unique role' : r.sameTypeCount}</div>
                    </div>
                </div>
            </div>
        `;

        const activitySection = `
            <div>
                <div style="font-weight:700; color:#111d35; margin-bottom:8px;">
                    <i class="fas fa-calendar-check"></i> Meeting Activity
                </div>
                <div style="display:flex; gap:12px;">
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:4px;">Hosted</div>
                        <div style="font-size:20px; font-weight:700; color:#111d35;">${r.hostedMeetings}</div>
                    </div>
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:4px;">Attended</div>
                        <div style="font-size:20px; font-weight:700; color:#111d35;">${r.totalMeetings}</div>
                    </div>
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase; margin-bottom:4px;">Partners</div>
                        <div style="font-size:20px; font-weight:700; color:#111d35;">${r.partners}</div>
                    </div>
                </div>
            </div>
        `;

        showModal(`${r.name} — Contribution Breakdown`, `
            <div style="max-height:60vh; overflow-y:auto;">
                ${exclusiveSection}
                ${focusSection}
                ${roleSection}
                ${activitySection}
            </div>
        `, [
            { label: 'Close', style: 'btn-secondary', onClick: () => {} }
        ]);
    };
}

// Identify cross-sector and cross-focus connections that bridge domains
function renderBridges() {
    const container = document.getElementById('bridges-view');
    if (!container) return;

    const links = buildLinkMap();
    const bridges = [];

    links.forEach(link => {
        const sourceEntity = getEntity(link.source);
        const targetEntity = getEntity(link.target);
        if (!sourceEntity || !targetEntity) return;

        const sourceFocus = sourceEntity.focusAreas || [];
        const targetFocus = targetEntity.focusAreas || [];
        const sharedFocus = sourceFocus.filter(f => targetFocus.includes(f));

        if (sourceEntity.sector !== targetEntity.sector || sharedFocus.length === 0) {
            bridges.push({
                sourceId: sourceEntity.id,
                source: sourceEntity.name,
                sourceSector: sourceEntity.sector,
                sourceFocus,
                sourceFunding: sourceEntity.fundingType || 'N/A',
                targetId: targetEntity.id,
                target: targetEntity.name,
                targetSector: targetEntity.sector,
                targetFocus,
                targetFunding: targetEntity.fundingType || 'N/A',
                sharedFocus,
                meetings: link.value,
                crossSector: sourceEntity.sector !== targetEntity.sector,
                crossFocus: sharedFocus.length === 0
            });
        }
    });

    bridges.sort((a, b) => {
        if (a.crossSector && a.crossFocus && !(b.crossSector && b.crossFocus)) return -1;
        if (!(a.crossSector && a.crossFocus) && b.crossSector && b.crossFocus) return 1;
        return b.meetings - a.meetings;
    });

    container.innerHTML = `
        <div class="data-section" style="margin-top:20px;">
            <h3 style="color:#111d35; margin-bottom:8px;">Sector & Focus Area Bridges</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">
                Connections between organizations from different sectors or with no shared focus areas. These bridges enable cross-domain knowledge transfer. Click a row to compare.
            </p>
            ${bridges.length === 0
                ? '<p style="color:#888; text-align:center; padding:40px;">No cross-sector or cross-focus bridges found.</p>'
                : `<table class="data-table">
                    <thead>
                        <tr>
                            <th>Organization A</th>
                            <th>Organization B</th>
                            <th>Meetings</th>
                            <th>Bridge Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bridges.map((b, i) => `
                            <tr style="cursor:pointer;" onclick="window.showBridgeDetail(${i})">
                                <td>
                                    <strong>${b.source}</strong><br>
                                    <small style="color:#888; text-transform:capitalize;">${b.sourceSector}</small>
                                </td>
                                <td>
                                    <strong>${b.target}</strong><br>
                                    <small style="color:#888; text-transform:capitalize;">${b.targetSector}</small>
                                </td>
                                <td>${b.meetings}</td>
                                <td>
                                    ${b.crossSector && b.crossFocus
                                        ? '<span style="background:#f44336; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Cross-Sector + Cross-Focus</span>'
                                        : b.crossSector
                                        ? '<span style="background:#FF9800; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Cross-Sector</span>'
                                        : '<span style="background:#1a3a5c; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Cross-Focus</span>'
                                    }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
            }
        </div>
    `;

    window.showBridgeDetail = function(index) {
        const b = bridges[index];
        if (!b) return;

        const allAreas = [...new Set([...b.sourceFocus, ...b.targetFocus])].sort();

        const comparisonRows = allAreas.map(area => {
            const hasSource = b.sourceFocus.includes(area);
            const hasTarget = b.targetFocus.includes(area);
            const isShared = hasSource && hasTarget;
            return `
                <div style="display:flex; align-items:center; padding:6px 0; border-bottom:1px solid #eee;">
                    <div style="flex:1; text-align:center; font-size:14px; color:${hasSource ? (isShared ? '#4CAF50' : '#1a3a5c') : '#ccc'};">
                        ${hasSource ? '✓' : '—'}
                    </div>
                    <div style="flex:2; text-align:center; font-size:13px; font-weight:${isShared ? '600' : '400'}; color:${isShared ? '#4CAF50' : '#333'};">
                        ${area}
                    </div>
                    <div style="flex:1; text-align:center; font-size:14px; color:${hasTarget ? (isShared ? '#4CAF50' : '#1a3a5c') : '#ccc'};">
                        ${hasTarget ? '✓' : '—'}
                    </div>
                </div>
            `;
        }).join('');

        const sourceOnly = b.sourceFocus.filter(f => !b.targetFocus.includes(f)).length;
        const targetOnly = b.targetFocus.filter(f => !b.sourceFocus.includes(f)).length;

        showModal(`Bridge: ${b.source} ↔ ${b.target}`, `
            <div style="max-height:60vh; overflow-y:auto;">
                <div style="display:flex; gap:12px; margin-bottom:20px;">
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-weight:700; color:#111d35;">${b.source}</div>
                        <div style="font-size:12px; color:#888; text-transform:capitalize;">${b.sourceSector} · ${b.sourceFunding}</div>
                    </div>
                    <div style="display:flex; align-items:center; color:#888;">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    <div style="flex:1; padding:12px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-weight:700; color:#111d35;">${b.target}</div>
                        <div style="font-size:12px; color:#888; text-transform:capitalize;">${b.targetSector} · ${b.targetFunding}</div>
                    </div>
                </div>

                <div style="display:flex; gap:12px; margin-bottom:20px;">
                    <div style="flex:1; padding:10px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase;">Shared</div>
                        <div style="font-size:20px; font-weight:700; color:#4CAF50;">${b.sharedFocus.length}</div>
                    </div>
                    <div style="flex:1; padding:10px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase;">${b.source} Only</div>
                        <div style="font-size:20px; font-weight:700; color:#1a3a5c;">${sourceOnly}</div>
                    </div>
                    <div style="flex:1; padding:10px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase;">${b.target} Only</div>
                        <div style="font-size:20px; font-weight:700; color:#1a3a5c;">${targetOnly}</div>
                    </div>
                    <div style="flex:1; padding:10px; background:#f0f2f5; border-radius:8px; text-align:center;">
                        <div style="font-size:11px; color:#888; text-transform:uppercase;">Meetings</div>
                        <div style="font-size:20px; font-weight:700; color:#111d35;">${b.meetings}</div>
                    </div>
                </div>

                <div style="font-weight:700; color:#111d35; margin-bottom:8px;">Focus Area Comparison</div>
                <div style="display:flex; padding:8px 0; border-bottom:2px solid #dde3ee; margin-bottom:4px;">
                    <div style="flex:1; text-align:center; font-size:12px; font-weight:700; color:#888;">${b.source}</div>
                    <div style="flex:2; text-align:center; font-size:12px; font-weight:700; color:#888;">Focus Area</div>
                    <div style="flex:1; text-align:center; font-size:12px; font-weight:700; color:#888;">${b.target}</div>
                </div>
                ${comparisonRows}
            </div>
        `, [
            { label: 'Close', style: 'btn-secondary', onClick: () => {} }
        ]);
    };
}

// Find org pairs sharing focus areas but with no direct meetings
function renderGaps() {
    const container = document.getElementById('gaps-view');
    if (!container) return;

    const links = buildLinkMap();
    const linkSet = new Set(links.map(l => [l.source, l.target].sort().join('-')));

    const gaps = [];

    for (let i = 0; i < allEntities.length; i++) {
        for (let j = i + 1; j < allEntities.length; j++) {
            const a = allEntities[i];
            const b = allEntities[j];
            const key = [a.id, b.id].sort().join('-');

            if (linkSet.has(key)) continue;

            const aFocus = a.focusAreas || [];
            const bFocus = b.focusAreas || [];
            const sharedFocus = aFocus.filter(f => bFocus.includes(f));

            if (sharedFocus.length === 0) continue;

            const aPartners = new Set();
            const bPartners = new Set();
            links.forEach(link => {
                if (link.source === a.id) aPartners.add(link.target);
                if (link.target === a.id) aPartners.add(link.source);
                if (link.source === b.id) bPartners.add(link.target);
                if (link.target === b.id) bPartners.add(link.source);
            });

            const mutualPartners = [...aPartners].filter(p => bPartners.has(p));

            gaps.push({
                orgA: a.name,
                orgAId: a.id,
                sectorA: a.sector,
                orgB: b.name,
                orgBId: b.id,
                sectorB: b.sector,
                sharedFocus,
                mutualPartners: mutualPartners.length,
                mutualNames: mutualPartners.map(getEntityName)
            });
        }
    }

    gaps.sort((a, b) => {
        if (b.sharedFocus.length !== a.sharedFocus.length) return b.sharedFocus.length - a.sharedFocus.length;
        return b.mutualPartners - a.mutualPartners;
    });

    container.innerHTML = `
        <div class="data-section" style="margin-top:20px;">
            <h3 style="color:#111d35; margin-bottom:8px;">Collaboration Gaps</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">
                Organizations that share focus areas but have never met. Higher shared focus areas and mutual partners suggest stronger potential for collaboration.
            </p>
            ${gaps.length === 0
                ? '<p style="color:#888; text-align:center; padding:40px;">No collaboration gaps identified.</p>'
                : `<table class="data-table">
                    <thead>
                        <tr>
                            <th>Organization A</th>
                            <th>Organization B</th>
                            <th>Shared Focus Areas</th>
                            <th>Mutual Partners</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gaps.map(g => `
                            <tr>
                                <td>
                                    <strong>${g.orgA}</strong><br>
                                    <small style="color:#888; text-transform:capitalize;">${g.sectorA}</small>
                                </td>
                                <td>
                                    <strong>${g.orgB}</strong><br>
                                    <small style="color:#888; text-transform:capitalize;">${g.sectorB}</small>
                                </td>
                                <td>
                                    ${g.sharedFocus.map(f => `<span style="background:#f0f2f5; padding:2px 8px; border-radius:10px; font-size:11px; margin:2px; display:inline-block;">${f}</span>`).join('')}
                                </td>
                                <td>
                                    ${g.mutualPartners > 0
                                        ? `<span style="font-weight:600;">${g.mutualPartners}</span><br><small style="color:#888;">${g.mutualNames.join(', ')}</small>`
                                        : '<span style="color:#888;">None</span>'
                                    }
                                </td>
                                <td>
                                    ${g.sharedFocus.length >= 3
                                        ? '<span style="background:#f44336; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">High</span>'
                                        : g.sharedFocus.length >= 2 || g.mutualPartners >= 2
                                        ? '<span style="background:#FF9800; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Medium</span>'
                                        : '<span style="background:#1a3a5c; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">Low</span>'
                                    }
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`
            }
        </div>
    `;
}

function switchInsightsView(view) {
    document.querySelectorAll('#analytics-insights-content .sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#analytics-insights-content .sub-tab-content').forEach(el => el.classList.remove('active'));

    if (view === 'dependency') {
        document.querySelector('#analytics-insights-content .sub-tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('dependency-view').classList.add('active');
    } else if (view === 'bridges') {
        document.querySelector('#analytics-insights-content .sub-tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('bridges-view').classList.add('active');
    } else if (view === 'gaps') {
        document.querySelector('#analytics-insights-content .sub-tab-btn:nth-child(3)').classList.add('active');
        document.getElementById('gaps-view').classList.add('active');
    }
}

window.switchInsightsView = switchInsightsView;