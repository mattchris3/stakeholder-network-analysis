import { allEntities } from './main.js';

export function displayOverview() {
    displaySectorChart();
}

function displaySectorChart() {
    const canvas = document.getElementById('sectorChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const sectorCounts = {};
    
    allEntities.forEach(entity => {
        const sector = entity.sector || 'unknown';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(sectorCounts),
            datasets: [{
                data: Object.values(sectorCounts),
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#E91E63',
                    '#9C27B0',
                    '#00BCD4'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' orgs';
                        }
                    }
                }
            }
        }
    });

    displaySectorList(sectorCounts);
}

function displaySectorList(sectorCounts) {
    const listContainer = document.getElementById('sectorList');
    listContainer.innerHTML = '';

    const colors = [
        '#4CAF50',
        '#2196F3',
        '#FF9800',
        '#E91E63',
        '#9C27B0',
        '#00BCD4'
    ];

    Object.entries(sectorCounts).forEach(([sector, count], index) => {
        const item = document.createElement('div');
        item.className = 'sector-item';
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border-radius: 4px; background: ${colors[index % colors.length]};"></div>
                <span class="sector-name">${sector.charAt(0).toUpperCase() + sector.slice(1)}</span>
            </div>
            <span class="sector-count">${count} org${count !== 1 ? 's' : ''}</span>
        `;
        listContainer.appendChild(item);
    });
}