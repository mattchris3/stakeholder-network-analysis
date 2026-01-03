import { displayOrganizationsTable } from './organizations.js';
import { displayMeetingsTableView } from './meetings.js';

export function setupViewButtons() {
    const viewBtns = document.querySelectorAll('.view-btn');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(view) {
    const chartSection = document.querySelector('.chart-section');
    const orgSection = document.querySelector('.organizations-section');
    const meetSection = document.querySelector('.meetings-section');
    
    chartSection.style.display = 'none';
    if(orgSection) orgSection.style.display = 'none';
    if(meetSection) meetSection.style.display = 'none';
    
    if (view === 'overview') {
        chartSection.style.display = 'block';
    } else if (view === 'organizations') {
        if(orgSection) {
            orgSection.style.display = 'block';
            displayOrganizationsTable();
        }
    } else if (view === 'meetings') {
        if(meetSection) {
            meetSection.style.display = 'block';
            displayMeetingsTableView();
        }
    }
}