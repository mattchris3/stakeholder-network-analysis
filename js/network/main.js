import { loadVisualization, applyFilters, clearFilters } from './data.js';
import {  
    selectEntity, 
    switchTab, 
} from './sidebar.js';
import { resetZoom } from './visualization.js';

document.addEventListener('DOMContentLoaded', () => {
    loadVisualization();
});
document.getElementById('showIsolatedNodes').addEventListener('change', () => {
    loadVisualization();
});

document.getElementById('viewMode').addEventListener('change', applyFilters);
document.getElementById('filterSector').addEventListener('change', applyFilters);
document.getElementById('connectionStrength').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('showIsolatedNodes').addEventListener('change', applyFilters);
document.getElementById('timePeriod').addEventListener('change', applyFilters);


window.loadVisualization = loadVisualization;
window.resetZoom = resetZoom;
window.clearFilters = clearFilters;
window.selectEntity = selectEntity;
window.switchTab = switchTab;