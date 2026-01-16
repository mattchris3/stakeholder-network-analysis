import { database } from '../config.js';
import { ref, set, remove, get, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { allEntities, allMeetings } from './main.js';

export function displayModifyTables() {
    displayModifyEntitiesTable();
    displayModifyMeetingsTable();
}

function displayModifyEntitiesTable() {
    const tbody = document.getElementById('modifyEntitiesTable');
    tbody.innerHTML = '';

    allEntities.forEach(entity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entity.id}</td>
            <td>${entity.name}</td>
            <td>${entity.fullName}</td>
            <td>${entity.sector}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editEntity(${entity.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEntity(${entity.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayModifyMeetingsTable() {
    const tbody = document.getElementById('modifyMeetingsTable');
    tbody.innerHTML = '';

    allMeetings.forEach(meeting => {
        const participantCount = meeting.participants ? meeting.participants.length : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${meeting.id}</td>
            <td>${meeting.title}</td>
            <td>${meeting.date}</td>
            <td>${participantCount}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editMeeting(${meeting.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMeeting(${meeting.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddEntityForm() {
    displayModifyTables();
    document.getElementById('modifyTablesView').style.display = 'none';
    document.getElementById('addEntityFormView').style.display = 'block';
}

function backToModifyTables() {
    document.getElementById('modifyTablesView').style.display = 'block';
    document.getElementById('addEntityFormView').style.display = 'none';
}

async function editEntity(entityId) {
    displayModifyTables();
    const entity = allEntities.find(e => e.id === entityId);
    if (!entity) return;

    document.getElementById('editEntityId').value = entity.id;
    document.getElementById('editEntityName').value = entity.name;
    document.getElementById('editEntityFullName').value = entity.fullName;
    document.getElementById('editEntitySector').value = entity.sector;
    document.getElementById('editEntityStatus').value = entity.status || 'active';
    document.getElementById('editEntityDescription').value = entity.description || '';
    document.getElementById('editEntityDuty').value = entity.duty || '';
    document.getElementById('editEntityFunding').value = entity.fundingSource || '';
    document.getElementById('editEntityBudget').value = entity.budget || '';
    document.getElementById('editEntityFounded').value = entity.founded || '';
    document.getElementById('editEntityLocation').value = entity.location || '';

    document.getElementById('modifyTablesView').style.display = 'none';
    document.getElementById('editEntityFormView').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const addEntityForm = document.getElementById('addEntityForm');
    if (addEntityForm) {
        addEntityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newEntity = {
                id: allEntities.length + 1,
                name: document.getElementById('entityName').value,
                fullName: document.getElementById('entityFullName').value,
                sector: document.getElementById('entitySector').value,
                description: document.getElementById('entityDescription').value,
                duty: document.getElementById('entityDuty').value,
                fundingSource: document.getElementById('entityFunding').value,
                budget: parseInt(document.getElementById('entityBudget').value) || 0,
                founded: parseInt(document.getElementById('entityFounded').value) || new Date().getFullYear(),
                location: document.getElementById('entityLocation').value,
                status: document.getElementById('entityStatus').value
            };
            
            try {
                await set(ref(database, `entities/${newEntity.id}`), newEntity);
                alert('Organization added successfully!');
                addEntityForm.reset();
                location.reload();
                setTimeout(() => {
                    document.querySelector('[data-tab="modify"]').click();
                }, 100);
            } catch (error) {
                alert('Error adding organization: ' + error.message);
            }
        });
    }

    const editEntityForm = document.getElementById('editEntityForm');
    if (editEntityForm) {
        editEntityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const entityId = document.getElementById('editEntityId').value;
            const updatedEntity = {
                id: parseInt(entityId),
                name: document.getElementById('editEntityName').value,
                fullName: document.getElementById('editEntityFullName').value,
                sector: document.getElementById('editEntitySector').value,
                description: document.getElementById('editEntityDescription').value,
                duty: document.getElementById('editEntityDuty').value,
                fundingSource: document.getElementById('editEntityFunding').value,
                budget: parseInt(document.getElementById('editEntityBudget').value) || 0,
                founded: parseInt(document.getElementById('editEntityFounded').value) || new Date().getFullYear(),
                location: document.getElementById('editEntityLocation').value,
                status: document.getElementById('editEntityStatus').value
            };
            
            try {
                const entityId = document.getElementById('editEntityId').value;
                await set(ref(database, `entities/${String(entityId)}`), updatedEntity);
                alert('Organization updated successfully!');
                location.reload();
                setTimeout(() => {
                    document.querySelector('[data-tab="modify"]').click();
                }, 100);
            } catch (error) {
                alert('Error updating organization: ' + error.message);
            }
        });
    }
});

async function deleteEntity(entityId) {
    if (!confirm('Are you sure you want to delete this organization?')) {
        return;
    }
    
    try {
        await remove(ref(database, `entities/${entityId}`));
        alert('Organization deleted successfully!');
        location.reload();
        setTimeout(() => {
            document.querySelector('[data-tab="modify"]').click();
        }, 100);
    } catch (error) {
        alert('Error deleting organization: ' + error.message);
    }
}

window.deleteEntity = deleteEntity;
window.showAddEntityForm = showAddEntityForm;
window.backToModifyTables = backToModifyTables;
window.editEntity = editEntity;