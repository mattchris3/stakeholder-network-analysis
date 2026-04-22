import { allEntities } from '../main.js';
import { displayOrganizationsTable } from './organizations.js';
import { displayMeetingsTableView } from './meetings.js';

export async function displayOverview() {
    await displaySectorChart();
}

async function displaySectorChart() {
    const canvas = document.getElementById('sectorChart');
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const approvedEntities = allEntities.filter(entity => entity.approval === 'approved');

    if (approvedEntities.length === 0) {
        canvas.style.display = 'none';
        const listContainer = document.getElementById('sectorList');
        if (listContainer) listContainer.innerHTML = '';
        const chartContainer = canvas.closest('.chart-container');
        if (chartContainer) {
            let emptyMsg = chartContainer.querySelector('.empty-state');
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-state';
                emptyMsg.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; color:#5a6478; text-align:center;">
                        <i class="fas fa-chart-pie" style="font-size:48px; color:#dde3ee; margin-bottom:16px;"></i>
                        <p style="max-width:360px; line-height:1.6;">No members yet. Approved organizations will appear here by sector.</p>
                    </div>
                `;
                chartContainer.appendChild(emptyMsg);
            }
        }
        return;
    }

    canvas.style.display = 'block';
    const chartContainer = canvas.closest('.chart-container');
    if (chartContainer) {
        const emptyMsg = chartContainer.querySelector('.empty-state');
        if (emptyMsg) emptyMsg.remove();
    }

    const sectorCounts = {};
    approvedEntities.forEach(entity => {
        const sector = entity.sector || 'unknown';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

    const ctx = canvas.getContext('2d');
    await new Promise((resolve) => {
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(sectorCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [{
                    data: Object.values(sectorCounts),
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed} org${context.parsed !== 1 ? 's' : ''}`
                        }
                    }
                },
                animation: { onComplete: resolve }
            }
        });
    });

    const listContainer = document.getElementById('sectorList');
    if (listContainer) {
        listContainer.innerHTML = Object.entries(sectorCounts).map(([sector, count], i) => `
            <div class="sector-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:20px; height:20px; border-radius:4px; background:${colors[i % colors.length]};"></div>
                    <span class="sector-name">${sector.charAt(0).toUpperCase() + sector.slice(1)}</span>
                </div>
                <span class="sector-count">${count} org${count !== 1 ? 's' : ''}</span>
            </div>
        `).join('');
    }
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const canvas = document.getElementById('sectorChart');
        if (canvas && canvas.offsetParent !== null) displaySectorChart();
    }, 300);
});

function switchOverviewView(view) {
    document.querySelectorAll('#admin-overview-content .sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#admin-overview-content .sub-tab-content').forEach(el => el.classList.remove('active'));

    if (view === 'overview') {
        document.querySelector('#admin-overview-content .sub-tab-btn:nth-child(1)').classList.add('active');
        document.querySelector('#admin-overview-content .chart-section').classList.add('active');
    } else if (view === 'organizations') {
        document.querySelector('#admin-overview-content .sub-tab-btn:nth-child(2)').classList.add('active');
        document.querySelector('#admin-overview-content .organizations-section').classList.add('active');
        displayOrganizationsTable();
    } else if (view === 'meetings') {
        document.querySelector('#admin-overview-content .sub-tab-btn:nth-child(3)').classList.add('active');
        document.querySelector('#admin-overview-content .meetings-section').classList.add('active');
        displayMeetingsTableView();
    }
}

window.switchOverviewView = switchOverviewView;