import { database } from '../config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { createD3Visualization } from './visualization.js';
import { updateStatistics, updateSidebarTopEntities } from './sidebar.js';

export let allNodes = [];
export let allLinks = [];
export let currentNodes = [];
export let currentLinks = [];
export let currentPeriodNodes = [];
export let allMeetings = [];
export let allRelationships = [];

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
            console.warn('No entities found in database');
            document.querySelector('.loading').style.display = 'none';
            return;
        }

        const allEntities = entitiesSnapshot.val();
        const entities = Object.values(allEntities).filter(entity => 
            entity && entity.unityId === currentUnityId && entity.status === 'active' && entity.approval === 'approved'
        );

        if (entities.length === 0) {
            document.querySelector('.loading').style.display = 'none';
            document.getElementById('network').innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#5a6478; text-align:center; padding:40px;">
                    <i class="fas fa-network-wired" style="font-size:64px; color:#dde3ee; margin-bottom:24px;"></i>
                    <h3 style="color:#111d35; margin-bottom:12px;">Your Network is Empty</h3>
                    <p style="max-width:400px; line-height:1.6;">No active members yet. Share your Unity access code with organizations you want to collaborate with to get started.</p>
                </div>
            `;
            return;
        }

        let meetings = [];
        if (meetingsSnapshot.exists()) {
            const allMeetings = meetingsSnapshot.val();
            meetings = Object.values(allMeetings).filter(meeting => 
                meeting && meeting.status === 'confirmed' && meeting.unityId === currentUnityId
            );
        }
        allMeetings = meetings;

        document.querySelector('.loading').style.display = 'none';

        processNetworkData(entities, meetings);
        applyFilters();

    } catch (error) {
        console.error('Error loading data:', error.message);
        console.error(error);
        document.querySelector('.loading').style.display = 'none';
    }
}

// Build node and link arrays from raw Firebase data
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
                                value: 0,
                                dates: [],
                                meetingIds: []
                            };
                        }
                        connectionMap[key].value++;
                        connectionMap[key].dates.push(meeting.date);
                        connectionMap[key].meetingIds.push(meeting.id);
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
        fundingType: entity.fundingType || 'unknown',
        focusAreas: entity.focusAreas || [],
        status: entity.status || 'active',
        description: entity.description || '',
        duty: entity.duty || ''
    }));

    allLinks = Object.values(connectionMap);

    updateStatistics();
    updateSidebarTopEntities();
}

// Filter pipeline: runs from fresh allNodes/allLinks on every filter change
export function applyFilters() {
    const viewMode = document.getElementById('viewMode').value;
    const sector = document.getElementById('filterSector').value;
    const strength = document.getElementById('connectionStrength').value;

    currentNodes = allNodes.map(n => ({ ...n }));

    const searchOrgA = document.getElementById('searchOrgA').value.toLowerCase().trim();
    const searchOrgB = document.getElementById('searchOrgB').value.toLowerCase().trim();

    if (searchOrgA || searchOrgB) {
        const matchA = searchOrgA
            ? currentNodes.filter(n =>
                n.name.toLowerCase().includes(searchOrgA) ||
                n.fullName.toLowerCase().includes(searchOrgA)
            ).map(n => n.id)
            : null;

        const matchB = searchOrgB
            ? currentNodes.filter(n =>
                n.name.toLowerCase().includes(searchOrgB) ||
                n.fullName.toLowerCase().includes(searchOrgB)
            ).map(n => n.id)
            : null;

        if (matchA && matchB) {
            currentLinks = currentLinks.filter(link => {
                const src = link.source.id || link.source;
                const tgt = link.target.id || link.target;
                return (matchA.some(id => id === src || id === tgt) &&
                        matchB.some(id => id === src || id === tgt));
            });
        } else if (matchA) {
            currentLinks = currentLinks.filter(link => {
                const src = link.source.id || link.source;
                const tgt = link.target.id || link.target;
                return matchA.some(id => id === src || id === tgt);
            });
        } else if (matchB) {
            currentLinks = currentLinks.filter(link => {
                const src = link.source.id || link.source;
                const tgt = link.target.id || link.target;
                return matchB.some(id => id === src || id === tgt);
            });
        }

        const linkedIds = new Set();
        currentLinks.forEach(link => {
            linkedIds.add(link.source.id || link.source);
            linkedIds.add(link.target.id || link.target);
        });
        currentNodes = currentNodes.filter(n => linkedIds.has(n.id));
    }

    if (sector !== 'all') {
        currentNodes = currentNodes.filter(node => node.sector === sector);
    }

    const nodeIds = new Set(currentNodes.map(node => node.id));

    currentLinks = allLinks
        .map(link => ({ ...link, dates: [...link.dates] }))
        .filter(link => 
            nodeIds.has(link.source || link.source.id) &&
            nodeIds.has(link.target || link.target.id)
        );

    const showIsolated = document.getElementById('showIsolatedNodes')?.checked !== false;

    if (strength === 'strong') {
        currentLinks = currentLinks.filter(link => link.value >= 6);
    } else if (strength === 'medium') {
        currentLinks = currentLinks.filter(link => link.value >= 3 && link.value <= 5);
    } else if (strength === 'weak') {
        currentLinks = currentLinks.filter(link => link.value >= 1 && link.value <= 2);
    }
    
    if (!showIsolated || strength !== 'all') {
        const connectedIds = new Set();
        currentLinks.forEach(link => {
            connectedIds.add(link.source.id || link.source);
            connectedIds.add(link.target.id || link.target);
        });
        currentNodes = currentNodes.filter(node => connectedIds.has(node.id));
    }

    const timePeriod = document.getElementById('timePeriod').value;
    if (timePeriod !== 'all') {
        const now = new Date();
        let cutoff;

        if (timePeriod === '1') {
            cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else if (timePeriod === '3') {
            cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        } else if (timePeriod === '6') {
            cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        } else if (timePeriod === '12') {
            cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        }

        currentLinks = currentLinks.map(link => {
            const periodDates = link.dates.filter(date => new Date(date).getTime() >= cutoff.getTime());
            return { ...link, value: periodDates.length, dates: periodDates };
        })
        .filter(link => link.value > 0);

        const connectedIds = new Set();
        currentLinks.forEach(link => {
            connectedIds.add(link.source.id || link.source);
            connectedIds.add(link.target.id || link.target);
        });

        currentNodes = currentNodes.filter(node => connectedIds.has(node.id));

        currentPeriodNodes = currentNodes.map(node => {
            const periodMeetings = allMeetings.filter(meeting => 
                new Date(meeting.date).getTime() >= cutoff.getTime() &&
                meeting.participants.includes(node.id)
            ).length;
            return { ...node, meetings: periodMeetings };
        });

        updateStatistics(currentPeriodNodes, currentLinks);
        updateSidebarTopEntities(currentPeriodNodes);
    } else {
        currentPeriodNodes = [...currentNodes]
        updateStatistics();
        updateSidebarTopEntities();
    }

    createD3Visualization(currentNodes, currentLinks);
}

export function clearFilters() {
    document.getElementById('viewMode').value = 'all';
    document.getElementById('filterSector').value = 'all';
    document.getElementById('connectionStrength').value = 'all';
    document.getElementById('timePeriod').value = 'all';
    document.getElementById('searchOrgA').value = '';
    document.getElementById('searchOrgB').value = '';
    applyFilters();
}