import { database } from './config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let allEntities = [];
let allMeetings = [];

if (!sessionStorage.getItem('adminAuthenticated')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(`${tabName}-content`).classList.add('active');
    
    const titles = {
        overview: 'Overview',
        modify: 'Modify Data',
        settings: 'Admin Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName];
}

async function loadData() {
    try {
        const entitiesRef = ref(database, 'entities');
        const entitiesData = await get(entitiesRef);
        
        const meetingsRef = ref(database, 'meetings');
        const meetingsData = await get(meetingsRef);

        if (entitiesData.exists()) {
            allEntities = Object.values(entitiesData.val());
        }

        if (meetingsData.exists()) {
            allMeetings = Object.values(meetingsData.val());
        }

        displayOverview();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data from Firebase');
    }
}

function displayOverview() {
    document.getElementById('totalEntities').textContent = allEntities.length;
    document.getElementById('totalMeetings').textContent = allMeetings.length;
    
    const totalParticipants = allMeetings.reduce((sum, meeting) => {
        return sum + (meeting.participants ? meeting.participants.length : 0);
    }, 0);
    const avgParticipants = allMeetings.length > 0 
        ? (totalParticipants / allMeetings.length).toFixed(1) 
        : 0;
    document.getElementById('avgParticipants').textContent = avgParticipants;

    displayEntitiesTable();
    displayMeetingsTable();
}

function displayEntitiesTable() {
    const tbody = document.getElementById('entitiesTable');
    tbody.innerHTML = '';

    allEntities.forEach(entity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entity.id}</td>
            <td>${entity.name}</td>
            <td>${entity.fullName}</td>
            <td>${entity.sector}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayMeetingsTable() {
    const tbody = document.getElementById('meetingsTable');
    tbody.innerHTML = '';

    allMeetings.forEach(meeting => {
        const participantCount = meeting.participants ? meeting.participants.length : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${meeting.id}</td>
            <td>${meeting.title}</td>
            <td>${meeting.date}</td>
            <td>${participantCount} participants</td>
        `;
        tbody.appendChild(row);
    });
}