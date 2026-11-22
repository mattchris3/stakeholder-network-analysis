import { allMeetings } from "../main.js";

export function displayActivity() {
    document.getElementById('analytics-activity-content').innerHTML = `
        <div class="data-section" style="margin-bottom:24px;">
            <h3 style="color:#111d35; margin-bottom:8px;">Meeting Activity Over Time</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">
                Monthly meeting frequency across the network.
            </p>
            <canvas id="activityTrendChart"></canvas>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
            <div class="data-section">
                <h3 style="color:#111d35; margin-bottom:8px;">Meeting Type Distribution</h3>
                <p style="color:#888; font-size:13px; margin-bottom:20px;">
                    Breakdown of confirmed meetings by type.
                </p>
                <canvas id="meetingTypeChart"></canvas>
            </div>
            <div class="data-section">
                <h3 style="color:#111d35; margin-bottom:8px;">Format Adoption</h3>
                <p style="color:#888; font-size:13px; margin-bottom:20px;">
                    In-person vs virtual vs hybrid breakdown.
                </p>
                <canvas id="meetingFormatChart"></canvas>
            </div>
        </div>
    `;

    renderTrendChart();
    renderTypeChart();
    renderFormatChart();
}

function renderTrendChart() {
    const monthlyData = {};

    allMeetings.forEach(meeting => {
        const date = new Date(meeting.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
    });

    const sorted = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(([key]) => {
        const [year, month] = key.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const data = sorted.map(([, count]) => count);

    const existing = Chart.getChart('activityTrendChart');
    if (existing) existing.destroy();

    new Chart(document.getElementById('activityTrendChart').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Meetings',
                data,
                borderColor: '#1a3a5c',
                backgroundColor: 'rgba(44,90,160,0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#1a3a5c',
                pointRadius: 5,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    title: { display: true, text: 'Number of Meetings' }
                },
                x: {
                    title: { display: true, text: 'Month' }
                }
            }
        }
    });
}

function renderTypeChart() {
    const typeCounts = {};
    allMeetings.forEach(m => {
        const type = m.type || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const colors = {
        'strategy':     '#1a3a5c',
        'coordination': '#4CAF50',
        'training':     '#FF9800',
        'research':     '#9C27B0',
        'funding':      '#E91E63',
        'emergency':    '#f44336',
        'unknown':      '#999'
    };

    const labels = Object.keys(typeCounts).map(t => t.charAt(0).toUpperCase() + t.slice(1));
    const data = Object.values(typeCounts);
    const backgroundColors = Object.keys(typeCounts).map(t => colors[t] || '#999');

    const existing = Chart.getChart('meetingTypeChart');
    if (existing) existing.destroy();

    new Chart(document.getElementById('meetingTypeChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderFormatChart() {
    const formatCounts = { 'in-person': 0, 'virtual': 0, 'hybrid': 0 };
    allMeetings.forEach(m => {
        const format = m.format || 'unknown';
        if (formatCounts[format] !== undefined) formatCounts[format]++;
    });

    const existing = Chart.getChart('meetingFormatChart');
    if (existing) existing.destroy();

    new Chart(document.getElementById('meetingFormatChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['In-Person', 'Virtual', 'Hybrid'],
            datasets: [{
                data: Object.values(formatCounts),
                backgroundColor: ['#1a3a5c', '#4CAF50', '#FF9800'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}