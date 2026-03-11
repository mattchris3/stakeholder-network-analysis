import { database } from '../config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { createD3Visualization } from './visualization.js';
import { updateStatistics, updateSidebarTopEntities } from './sidebar.js';

export let allNodes = [];
export let allLinks = [];
export let currentNodes = [];
export let currentLinks = [];

export async function loadVisualization() {
    try {
        document.querySelector('.loading').style.display = 'block';
        
        let currentUnityId = sessionStorage.getItem('unityId');
        if (!currentUnityId) {
            currentUnityId = 'UNITY-GLOBHEALTH-2025';
            sessionStorage.setItem('unityId', currentUnityId);
        }
        
        const entitiesRef = ref(database, 'entities');
        const entitiesSnapshot = await get(entitiesRef);
        
        const meetingsRef = ref(database, 'meetings');
        const meetingsSnapshot = await get(meetingsRef);

        if (!entitiesSnapshot.exists()) {
            alert('No entities found in database');
            document.querySelector('.loading').style.display = 'none';
            return;
        }

        const allEntities = entitiesSnapshot.val();
        const entities = Object.values(allEntities).filter(entity => 
            entity && entity.unityId === currentUnityId && entity.status === 'active'
        );

        let meetings = [];
        if (meetingsSnapshot.exists()) {
            const allMeetings = meetingsSnapshot.val();
            meetings = Object.values(allMeetings).filter(meeting => 
                meeting && meeting.unityId === currentUnityId
            );
        }

        document.querySelector('.loading').style.display = 'none';

        processNetworkData(entities, meetings);
        applyFilters();

    } catch (error) {
        alert('Error loading data: ' + error.message);
        console.error(error);
        document.querySelector('.loading').style.display = 'none';
    }
}

function processNetworkData(entities, meetings) {
    const validEntityIds = new Set(entities.map(e => e.id));

    const meetingCounts = {};
    const connectionMap = {};

    meetings.forEach(meeting => {
        if (meeting.participants && Array.isArray(meeting.participants)) {
            meeting.participants.forEach(participantId => {
                if (validEntityIds.has(participantId)) {
                    meetingCounts[participantId] = (meetingCounts[participantId] || 0) + 1;
                }
            });

            for (let i = 0; i < meeting.participants.length; i++) {
                for (let j = i + 1; j < meeting.participants.length; j++) {
                    const id1 = meeting.participants[i];
                    const id2 = meeting.participants[j];
                    
                    if (validEntityIds.has(id1) && validEntityIds.has(id2)) {
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
        }
    });

    allNodes = entities.map(entity => ({
        id: entity.id,
        name: entity.name || entity.shortName || `Entity ${entity.id}`,
        fullName: entity.fullName || entity.name,
        meetings: meetingCounts[entity.id] || 0,
        sector: entity.sector || 'unknown',
        status: entity.status || 'active',
        description: entity.description || '',
        duty: entity.duty || ''
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

    const showIsolated = document.getElementById('showIsolatedNodes')?.checked !== false;
    if (!showIsolated) {
        const connectedIds = new Set();
        currentLinks.forEach(link => {
            connectedIds.add(link.source.id || link.source);
            connectedIds.add(link.target.id || link.target);
        });
        
        currentNodes = currentNodes.filter(node => connectedIds.has(node.id));
    }
    
    updateStatistics(currentNodes, currentLinks);
    createD3Visualization(currentNodes, currentLinks);
}

export function clearFilters() {
    document.getElementById('viewMode').value = 'all';
    document.getElementById('filterSector').value = 'all';
    document.getElementById('connectionStrength').value = 'all';
    document.getElementById('searchInput').value = '';
    applyFilters();
}