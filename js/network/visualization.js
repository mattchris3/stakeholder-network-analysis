import { allNodes, allLinks, currentNodes, currentLinks } from './data.js';

let simulation = null;
let svg, g, zoom;

export function createD3Visualization(nodes, links) {
    d3.select('#network').selectAll('svg').remove();

    const container = document.getElementById('network');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select('#network')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g');
    
    zoom = d3.zoom()
        .scaleExtent([0.8, 2])
        .on('zoom', (event) => {
            const centerX = width / 2;
            const centerY = height / 2;
            const transform = d3.zoomIdentity
                .translate(centerX, centerY)
                .scale(event.transform.k)
                .translate(-centerX, -centerY);
            g.attr('transform', transform);
        })
        .filter(event => {
            return event.type === 'wheel' || event.type === 'dblclick';
        });

    svg.call(zoom);

    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-800))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.meetings) * 5 + 25));

    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => Math.sqrt(d.value) * 2);

    const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', d => Math.sqrt(d.meetings) * 5 + 15)
        .attr('fill', d => getSectorColor(d.sector))
        .call(drag(simulation));

    const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('class', 'node-label')
        .text(d => d.name);

    const tooltip = d3.select('#tooltip');

    node.on('mouseover', (event, d) => {
            tooltip.style('display', 'block')
                .html(`
                    <strong>${d.fullName}</strong><br/>
                    Sector: ${d.sector}<br/>
                    Meetings: ${d.meetings}<br/>
                    ID: ${d.id}
                `);
        })
        .on('mousemove', (event) => {
            tooltip.style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
            tooltip.style('display', 'none');
        })
        .on('click', (event, d) => {
            showEntityDetails(d);
            highlightNode(d.id); 
        });

    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        label
            .attr('x', d => d.x)
            .attr('y', d => d.y + 5);
    });
}

function getSectorColor(sector) {
    const sectorColors = {
        'healthcare': '#4CAF50',
        'education': '#2196F3',
        'government': '#FF9800',
        'nonprofit': '#E91E63',
        'business': '#9C27B0'
    };
    return sectorColors[sector] || '#00BCD4';
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

export function highlightNode(entityId) {
    d3.selectAll('.node').classed('highlighted', false);
    d3.selectAll('.link').classed('highlighted', false);

    d3.selectAll('.node')
        .filter(d => d.id === entityId)
        .classed('highlighted', true);

    d3.selectAll('.link')
        .filter(d => {
            const sourceId = d.source.id !== undefined ? d.source.id : d.source;
            const targetId = d.target.id !== undefined ? d.target.id : d.target;
            return sourceId === entityId || targetId === entityId;
        })
        .classed('highlighted', true);
}

export function resetZoom() {
    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
}

export function updateStatistics() {
    document.getElementById('entityCount').textContent = allNodes.length;
    document.getElementById('connectionCount').textContent = allLinks.length;
    document.getElementById('meetingCount').textContent = 
        allNodes.reduce((sum, node) => sum + node.meetings, 0);
    const avgConn = allLinks.length > 0 ? 
        (allLinks.length * 2 / allNodes.length).toFixed(1) : 0;
    document.getElementById('avgConnections').textContent = avgConn;
}

export function updateSidebarTopEntities() {
    const topEntities = [...allNodes]
        .sort((a, b) => b.meetings - a.meetings)
        .slice(0, 5);

    const listHTML = topEntities.map(entity => `
        <li class="entity-item" onclick="window.selectEntity(${entity.id})">
            <div>
                <div class="entity-name">${entity.name}</div>
                <small style="color: #666;">${entity.sector}</small>
            </div>
            <span class="entity-count">${entity.meetings} meetings</span>
        </li>
    `).join('');

    document.getElementById('topEntities').innerHTML = listHTML;
}

export function selectEntity(entityId) {
    const entity = allNodes.find(node => node.id === entityId);
    if (entity) {
        showEntityDetails(entity);
        highlightNode(entityId);
    }
}

function showEntityDetails(entity) {
    switchTab('details');
    
    const connections = allLinks.filter(link => 
        link.source.id === entity.id || link.target.id === entity.id ||
        link.source === entity.id || link.target === entity.id
    ).length;

    const detailsHTML = `
        <div class="details-panel">
            <h4>${entity.fullName}</h4>
            <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${entity.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Short Name:</span>
                <span class="detail-value">${entity.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sector:</span>
                <span class="detail-value">${entity.sector}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Meetings:</span>
                <span class="detail-value">${entity.meetings}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Connections:</span>
                <span class="detail-value">${connections}</span>
            </div>
        </div>
    `;

    document.getElementById('entityDetails').innerHTML = detailsHTML;
    document.getElementById('entityDetails').style.display = 'block';
}

export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tabName === 'overview') {
        document.getElementById('overview-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('details-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

export function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
}

export function exportPNG() {
    alert('PNG export functionality would be implemented here');
    toggleExportMenu();
}

export function exportJSON() {
    const data = {
        nodes: currentNodes, 
        links: currentLinks 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-data.json';
    a.click();
    toggleExportMenu();
}

export function exportCSV() {
    let csv = 'Entity ID,Entity Name,Sector,Meetings\n';
    currentNodes.forEach(node => {  
        csv += `${node.id},"${node.fullName}",${node.sector},${node.meetings}\n`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-entities.csv';
    a.click();
    toggleExportMenu();
}