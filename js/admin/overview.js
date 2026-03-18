import { allEntities } from './main.js';

export async function displayOverview() {
    await displaySectorChart();
}

async function displaySectorChart() {
    const canvas = document.getElementById('sectorChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    if (allEntities.length === 0) {
        console.warn('No entities loaded yet');
        return;
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const approvedEntities = allEntities.filter(entity => entity.approval === 'approved');

    const sectorCounts = {};
    
    approvedEntities.forEach(entity => {
        const sector = entity.sector || 'unknown';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    if (Object.keys(sectorCounts).length === 0) {
        console.warn('No sector data to display');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    await new Promise((resolve) => {
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(sectorCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
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
                                return context.label + ': ' + context.parsed + ' org' + (context.parsed !== 1 ? 's' : '');
                            }
                        }
                    }
                },
                animation: {
                    onComplete: resolve
                }
            }
        });
    });

    await displaySectorList(sectorCounts);
}

async function displaySectorList(sectorCounts) {
    return new Promise((resolve) => {
        const listContainer = document.getElementById('sectorList');
        if (!listContainer) {
            resolve();
            return;
        }
        
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

        requestAnimationFrame(() => resolve());
    });
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const canvas = document.getElementById('sectorChart');
        if (canvas && canvas.offsetParent !== null) {
            displaySectorChart();
        }
    }, 300);
});