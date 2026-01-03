import { database } from '../config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { createD3Visualization } from './visualization.js';
import { updateStatistics, updateSidebarTopEntities } from './visualization.js';

export let allNodes = [];
export let allLinks = [];
export let currentNodes = [];
export let currentLinks = [];

export async function loadVisualization() {
    try {
        document.querySelector('.loading').style.display = 'block';
        
        const entitiesRef = ref(database, 'entities');
        const entitiesData = await get(entitiesRef);
        
        const meetingsRef = ref(database, 'meetings');
        const meetingsData = await get(meetingsRef);

        if (!entitiesData.exists()) {
            alert('No data found in database');
            return;
        }

        const entities = entitiesData.val();
        
        let meetings;
        if (meetingsData.exists()) {
            meetings = meetingsData.val();
        } else {
            meetings = [];
        }

        document.querySelector('.loading').style.display = 'none';

        processNetworkData(entities, meetings);
        applyFilters();

    } catch (error) {
        alert('Error loading data: ' + error.message);
        console.error(error);
    }
}

function processNetworkData(entities, meetings) {
    const entitiesArray = Array.isArray(entities) ? entities : Object.values(entities);
    const meetingsArray = Array.isArray(meetings) ? meetings : Object.values(meetings);

    const meetingCounts = {};
    const connectionMap = {};

    meetingsArray.forEach(meeting => {
        if (meeting.participants) {
            meeting.participants.forEach(participantId => {
                meetingCounts[participantId] = (meetingCounts[participantId] || 0) + 1;
            });

            for (let i = 0; i < meeting.participants.length; i++) {
                for (let j = i + 1; j < meeting.participants.length; j++) {
                    const id1 = meeting.participants[i];
                    const id2 = meeting.participants[j];
                    const key = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
                    
                    if (!connectionMap[key]) {
                        connectionMap[key] = {
                            source: id1,
                            target: id2,
                            value: 0
                        };
                    }
                    connectionMap[key].value++;
                }
            }
        }
    });

    allNodes = entitiesArray.map(entity => ({
        id: entity.id,
        name: entity.name || entity.shortName || `Entity ${entity.id}`,
        fullName: entity.fullName || entity.name,
        meetings: meetingCounts[entity.id] || 0,
        sector: entity.sector || 'unknown'
    }));

    allLinks = Object.values(connectionMap);

    updateStatistics();
    updateSidebarTopEntities();
}

export function applyFilters() {
    const viewMode = document.getElementById('viewMode').value;
    const sector = document.getElementById('filterSector').value;
    const strength = document.getElementById('connectionStrength').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    currentNodes = [...allNodes];

    if (searchTerm) {
        currentNodes = currentNodes.filter(node => 
            node.name.toLowerCase().includes(searchTerm) ||
            node.fullName.toLowerCase().includes(searchTerm)
        );
    }

    if (viewMode === 'active') {
        currentNodes = currentNodes.filter(node => node.meetings >= 5);
    } else if (viewMode === 'top') {
        currentNodes = currentNodes.sort((a, b) => b.meetings - a.meetings).slice(0, 10);
    }

    if (sector !== 'all') {
        currentNodes = currentNodes.filter(node => node.sector === sector);
    }

    const nodeIds = new Set(currentNodes.map(node => node.id));

    currentLinks = allLinks.filter(link => 
        nodeIds.has(link.source.id || link.source) && 
        nodeIds.has(link.target.id || link.target)
    );

    if (strength === 'strong') {
        currentLinks = currentLinks.filter(link => link.value >= 3);
    } else if (strength === 'medium') {
        currentLinks = currentLinks.filter(link => link.value === 2);
    } else if (strength === 'weak') {
        currentLinks = currentLinks.filter(link => link.value === 1);
    }

    createD3Visualization(currentNodes, currentLinks);
}

export function clearFilters() {
    document.getElementById('viewMode').value = 'all';
    document.getElementById('filterSector').value = 'all';
    document.getElementById('connectionStrength').value = 'all';
    document.getElementById('searchInput').value = '';
    applyFilters();
}