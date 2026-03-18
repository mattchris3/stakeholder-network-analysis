import { database } from '../config.js';
import { ref, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { allEntities } from './main.js';

export function displayModifyTables() {
    displayEntitiesTable();
}

function displayEntitiesTable() {
    const tbody = document.getElementById('modifyEntitiesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const approvedEntities = allEntities.filter(entity => entity.approval === 'approved');

    approvedEntities.forEach(entity => {
        const statusColor = entity.status === 'active' ? '#60b070' : '#c06060';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entity.id}</td>
            <td>${entity.name}</td>
            <td>${entity.fullName}</td>
            <td><span class="badge badge-${entity.sector}">${entity.sector}</span></td>
            <td><span style="color: ${statusColor}; font-weight: 600;">${entity.status}</span></td>
            <td>${entity.location || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-danger" onclick="deleteEntity('${entity.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteEntity(entityId) {
    const entity = allEntities.find(e => e.id === entityId);
    if (!entity) {
        alert('Entity not found');
        return;
    }

    if (!confirm(`Remove ${entity.fullName} from the network?`)) {
        return;
    }
    
    try {
        await remove(ref(database, `entities/${entityId}`));
        alert(`${entity.name} has been removed`);
        location.reload();
    } catch (error) {
        alert('Error removing organization: ' + error.message);
    }
}

window.deleteEntity = deleteEntity;