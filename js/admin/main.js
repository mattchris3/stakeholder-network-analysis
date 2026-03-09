import { database } from '../config.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { displayOverview } from './overview.js';
import { setupViewButtons } from './view-switcher.js';
import { displayModifyTables } from './modify.js';

export let allEntities = [];
export let allMeetings = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminView')) {
        setupNavigation();
        setupViewButtons();
        loadAdminData();
    }
});

function setupNavigation() {
    const navItems = document.querySelectorAll('#adminView .nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const tabName = item.getAttribute('data-tab');
            switchAdminTab(tabName);
        });
    });
}

function switchAdminTab(tabName) {
    const tabs = document.querySelectorAll('#adminView .tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const targetTab = document.getElementById(`${tabName}-content`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const titles = {
        'admin-overview': 'Overview',
        'admin-modify': 'Modify Data',
        'admin-pending': 'Pending Approvals',
        'admin-settings': 'Settings'
    };

    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = titles[tabName] || 'Admin Panel';
    }

    if (tabName === 'admin-overview') {
        loadAdminData();
    } else if (tabName === 'admin-modify') {
        displayModifyTables();
    }
}

async function loadAdminData() {
    try {
        const currentUnityId = sessionStorage.getItem('unityId');
        if (!currentUnityId) {
            console.error('No unity ID found');
            return;
        }

        const entitiesRef = ref(database, 'entities');
        const entitiesData = await get(entitiesRef);
        
        const meetingsRef = ref(database, 'meetings');
        const meetingsData = await get(meetingsRef);

        allEntities = [];
        allMeetings = [];

        if (entitiesData.exists()) {
            const all = entitiesData.val();
            allEntities = Object.values(all).filter(e => e && e.unityId === currentUnityId);
        }

        if (meetingsData.exists()) {
            const all = meetingsData.val();
            allMeetings = Object.values(all).filter(m => m && m.unityId === currentUnityId);
        }

        await displayOverview();
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}