import { allEntities, allMeetings, showModal } from "../main.js";

let currentScores = [];

export function displayInfluence() {
    const scores = calculateInfluenceScores();
    renderInfluenceTable(scores);
    renderInfluenceChart(scores);
}

function calculateInfluenceScores() {
    const entityIds = allEntities.map(e => e.id);

    const meetingCount = {};
    const uniquePartners = {};
    const bridgeScore = {};

    entityIds.forEach(id => {
        meetingCount[id] = 0;
        uniquePartners[id] = new Set();
        bridgeScore[id] = 0;
    });

    allMeetings.forEach(meeting => {
        meeting.participants.forEach(p => {
            if (meetingCount[p] !== undefined) {
                meetingCount[p]++;
                meeting.participants.forEach(other => {
                    if (other !== p) uniquePartners[p].add(other);
                });
            }
        });

        if (meeting.participants.length > 2) {
            meeting.participants.forEach(p => {
                if (bridgeScore[p] !== undefined) {
                    bridgeScore[p] += meeting.participants.length - 2;
                }
            });
        }
    });

    const maxMeetings = Math.max(...Object.values(meetingCount), 1);
    const maxPartners = Math.max(...Object.values(uniquePartners).map(s => s.size), 1);
    const maxBridge = Math.max(...Object.values(bridgeScore), 1);

    return allEntities.map(entity => {
        const meetings = meetingCount[entity.id];
        const partners = uniquePartners[entity.id]?.size || 0;
        const bridge = bridgeScore[entity.id] || 0;

        const normalizedMeetings = meetings / maxMeetings;
        const normalizedPartners = partners / maxPartners;
        const normalizedBridge = bridge / maxBridge;

        const score = Math.round(
            (normalizedMeetings * 0.35 +
            normalizedPartners * 0.40 +
            normalizedBridge * 0.25) * 100
        );

        return {
            id: entity.id,
            name: entity.name,
            fullName: entity.fullName,
            sector: entity.sector,
            type: entity.type,
            meetings,
            partners,
            bridge,
            score
        };
    }).sort((a, b) => b.score - a.score);
}

function renderInfluenceTable(scores) {
    currentScores = scores;
    document.getElementById('analytics-influence-content').innerHTML = `
        <div class="data-section" style="margin-bottom:24px;">
            <h3 style="color:#111d35; margin-bottom:8px;">Influence Score</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">
                Calculated from three factors: meeting frequency (35%), 
                unique collaborators (40%), and multi-party bridge meetings (25%).
            </p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Organization</th>
                        <th>Sector</th>
                        <th>Meetings</th>
                        <th>Unique Partners</th>
                        <th>Bridge Score</th>
                        <th>Influence</th>
                    </tr>
                </thead>
                <tbody>
                    ${scores.map((e, i) => `
                        <tr style="cursor:pointer;" onclick="window.viewEntityDetail('${e.id}')">
                            <td>
                                <span style="font-weight:700; color:${i === 0 ? '#f39c12' : i === 1 ? '#95a5a6' : i === 2 ? '#cd7f32' : '#111d35'};">
                                    #${i + 1}
                                </span>
                            </td>
                            <td>
                                <strong>${e.name}</strong><br>
                                <small style="color:#888;">${e.fullName}</small>
                            </td>
                            <td style="text-transform:capitalize;">${e.sector}</td>
                            <td>${e.meetings}</td>
                            <td>${e.partners}</td>
                            <td>${e.bridge}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <div style="flex:1; background:#e9ecef; border-radius:4px; height:8px;">
                                        <div style="width:${e.score}%; background:linear-gradient(90deg,#1a3a5c,#111d35); height:8px; border-radius:4px;"></div>
                                    </div>
                                    <span style="font-weight:700; color:#111d35; min-width:32px;">${e.score}</span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div id="influence-chart-container"></div>
    `;

    renderInfluenceChart(scores);
}

function renderInfluenceChart(scores) {
    const container = document.getElementById('influence-chart-container');
    if (!container) return;

    container.innerHTML = `
        <div class="data-section">
            <h3 style="color:#111d35; margin-bottom:20px;">Influence Breakdown</h3>
            <canvas id="influenceChart"></canvas>
        </div>
    `;

    const ctx = document.getElementById('influenceChart').getContext('2d');

    const existing = Chart.getChart('influenceChart');
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scores.map(e => e.name),
            datasets: [
                {
                    label: 'Meetings (35%)',
                    data: scores.map(e => Math.round((e.meetings / Math.max(...scores.map(s => s.meetings), 1)) * 35)),
                    backgroundColor: '#1a3a5c'
                },
                {
                    label: 'Unique Partners (40%)',
                    data: scores.map(e => Math.round((e.partners / Math.max(...scores.map(s => s.partners), 1)) * 40)),
                    backgroundColor: '#4CAF50'
                },
                {
                    label: 'Bridge Score (25%)',
                    data: scores.map(e => Math.round((e.bridge / Math.max(...scores.map(s => s.bridge), 1)) * 25)),
                    backgroundColor: '#FF9800'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        footer: (items) => {
                            const total = items.reduce((sum, i) => sum + i.parsed.y, 0);
                            return `Total Influence: ${total}`;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    max: 100,
                    title: { display: true, text: 'Influence Score' }
                }
            }
        }
    });
}