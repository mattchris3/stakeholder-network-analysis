import { loadVisualization, applyFilters, clearFilters } from './data.js';
import { 
    resetZoom, 
    selectEntity, 
    switchTab, 
    toggleExportMenu, 
    exportPNG, 
    exportJSON, 
    exportCSV 
} from './visualization.js';

window.addEventListener('load', () => {
    loadVisualization();
});

document.getElementById('viewMode').addEventListener('change', applyFilters);
document.getElementById('filterSector').addEventListener('change', applyFilters);
document.getElementById('connectionStrength').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

window.loadVisualization = loadVisualization;
window.resetZoom = resetZoom;
window.clearFilters = clearFilters;
window.selectEntity = selectEntity;
window.switchTab = switchTab;
window.toggleExportMenu = toggleExportMenu;
window.exportPNG = exportPNG;
window.exportJSON = exportJSON;
window.exportCSV = exportCSV;

document.addEventListener('click', function(event) {
    const exportMenu = document.getElementById('exportMenu');
    const exportButton = event.target.closest('button');
    if (!exportMenu.contains(event.target) && 
        (!exportButton || !exportButton.onclick?.toString().includes('toggleExportMenu'))) {
        exportMenu.classList.remove('show');
    }
});