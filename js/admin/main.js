import { database } from '../config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { displayOverview } from './overview.js';
import { setupViewButtons } from './view-switcher.js';
import { displayModifyTables } from './modify.js';

export let allEntities = [];
export let allMeetings = [];

if (!sessionStorage.getItem('adminAuthenticated')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupViewButtons();
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

    if (tabName === 'overview') {
        loadData();
    } else if (tabName === 'modify') {
        loadData().then(() => {
            displayModifyTables();
        });
    }
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