import { allNodes, 
    allLinks, 
    currentLinks, 
    currentNodes, 
    currentPeriodNodes,
    allMeetings
} from './data.js';
import { highlightNode } from './visualization.js';

export function updateStatistics() {
    document.getElementById('entityCount').textContent = allNodes.length;
    document.getElementById('connectionCount').textContent = allLinks.length;
    
    document.getElementById('meetingCount').textContent = allMeetings.length;
    
    const avgConn = allNodes.length > 0 ? 
        (allLinks.length * 2 / allNodes.length).toFixed(1) : 0;
    document.getElementById('avgConnections').textContent = avgConn;
}

export function updateSidebarTopEntities(nodes) {
    const source = nodes || allNodes;
    
    const topEntities = [...source]
        .sort((a, b) => b.meetings - a.meetings)
        .slice(0, 8);

    document.getElementById('topEntities').innerHTML = topEntities.map(entity => `
        <li class="entity-item" onclick="window.selectEntity('${entity.id}')">
            <div>
                <div class="entity-name">${entity.name}</div>
                <small style="color: #666;">${entity.sector}</small>
            </div>
            <span class="entity-count">${entity.meetings} meetings</span>
        </li>
    `).join('');
}

export function selectEntity(entityId) {
    const entity = currentPeriodNodes.find(node => node.id === entityId) 
        || allNodes.find(node => node.id === entityId);
    if (entity) {
        showEntityDetails(entity);
        highlightNode(entityId);
    }
}

export function showEntityDetails(entity) {
    switchTab('details');
    
    const connections = currentLinks.filter(link => 
        link.source.id === entity.id || link.target.id === entity.id ||
        link.source === entity.id || link.target === entity.id
    );

    const collaborators = connections.map(link => {
        const partnerId = (link.source.id || link.source) === entity.id ? 
            (link.target.id || link.target) : (link.source.id || link.source);
        const partner = currentPeriodNodes.find(n => n.id === partnerId) 
            || allNodes.find(n => n.id === partnerId);
        return partner ? {
            name: partner.name,
            fullName: partner.fullName,
            meetings: link.value,
            strength: link.value >= 6 ? 'strong' : (link.value >= 3 ? 'medium' : 'weak')
        } : null;
    }).filter(c => c !== null)
    .sort((a, b) => b.meetings - a.meetings);

    const strongCount = collaborators.filter(c => c.strength === 'strong').length;
    const mediumCount = collaborators.filter(c => c.strength === 'medium').length;
    const weakCount = collaborators.filter(c => c.strength === 'weak').length;

    const getStrengthBadge = (strength) => {
        if (strength === 'strong') return '<span style="background: #000; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">STRONG</span>';
        if (strength === 'medium') return '<span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">MEDIUM</span>';
        return '<span style="background: #f44336; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">WEAK</span>';
    };

    const collaboratorsList = collaborators.length > 0 ? 
        collaborators.map(c => `
            <div style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${c.name}</strong><br>
                    <small style="color: #666;">${c.meetings} meeting${c.meetings > 1 ? 's' : ''}</small>
                </div>
                ${getStrengthBadge(c.strength)}
            </div>
        `).join('') : '<p style="color: #999;">No collaborations recorded</p>';

    document.getElementById('entityDetails').innerHTML = `
        <div class="details-panel">
            <h4>${entity.fullName}</h4>
            <div class="detail-row">
                <span class="detail-label">Short Name:</span>
                <span class="detail-value">${entity.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${entity.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sector:</span>
                <span class="detail-value">${entity.sector}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Meetings:</span>
                <span class="detail-value">${entity.meetings}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Collaborations:</span>
                <span class="detail-value">${connections.length}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Funding Type:</span>
                <span class="detail-value" style="text-transform:capitalize;">${entity.fundingType}</span>
            </div>
            <div style="margin-top:12px;">
                <span class="detail-label">Focus Areas:</span>
                <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
                    ${entity.focusAreas.length > 0
                        ? entity.focusAreas.map(f => `<span style="background:#111d35; color:white; padding:3px 8px; border-radius:10px; font-size:11px;">${f}</span>`).join('')
                        : '<span style="color:#888; font-size:12px;">None specified</span>'
                    }
                </div>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <strong>Link Strength Breakdown:</strong>
                <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #000;">${strongCount}</div>
                        <div style="font-size: 11px; color: #666;">Strong (6+)</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${mediumCount}</div>
                        <div style="font-size: 11px; color: #666;">Medium (3-5)</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #f44336;">${weakCount}</div>
                        <div style="font-size: 11px; color: #666;">Weak (1-2)</div>
                    </div>
                </div>
            </div>
            ${entity.description ? `
                <div style="margin-top: 15px;">
                    <strong>Description:</strong>
                    <p style="color: #666; font-size: 0.9em; margin-top: 5px;">${entity.description}</p>
                </div>
            ` : ''}
            ${entity.duty ? `
                <div style="margin-top: 10px;">
                    <strong>Primary Duties:</strong>
                    <p style="color: #666; font-size: 0.9em; margin-top: 5px;">${entity.duty}</p>
                </div>
            ` : ''}
            <div style="margin-top: 15px;">
                <strong>Collaborators:</strong>
                ${collaboratorsList}
            </div>
        </div>
    `;

    document.getElementById('entityDetails').style.display = 'block';
}

export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tabName === 'overview') {
        document.getElementById('overview-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('details-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}