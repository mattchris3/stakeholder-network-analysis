import { allLinks } from './data.js';
import { selectEntity } from './sidebar.js';

let simulation = null;
let svg, g, zoom, container;

// D3 initialization
export function createD3Visualization(nodes, links) {
    container = document.getElementById('network');
    d3.select('#network').selectAll('svg').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg = d3.select('#network')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g');
    
    zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            const k = event.transform.k;
            const w = container.clientWidth;
            const h = container.clientHeight;
            g.attr('transform', `translate(${w/2},${h/2}) scale(${k}) translate(${-w/2},${-h/2})`);
        });

    svg.call(zoom);

    const connectionCounts = {};
    nodes.forEach(n => { connectionCounts[n.id] = 0; });
    links.forEach(l => {
        const src = l.source.id || l.source;
        const tgt = l.target.id || l.target;
        connectionCounts[src] = (connectionCounts[src] || 0) + 1;
        connectionCounts[tgt] = (connectionCounts[tgt] || 0) + 1;
    });

    const viewMode = document.getElementById('viewMode').value;

    let xForce, yForce;

    if (viewMode === 'sector' || viewMode === 'funding') {
        const groupKey = viewMode === 'sector' ? 'sector' : 'fundingType';
        const groups = [...new Set(nodes.map(n => n[groupKey] || 'unknown'))];
        const angleStep = (2 * Math.PI) / groups.length;
        const orbitRadius = Math.min(width, height) * 0.36;

        const groupCenters = {};
        groups.forEach((group, i) => {
            groupCenters[group] = {
                x: width / 2 + orbitRadius * Math.cos(angleStep * i - Math.PI / 2),
                y: height / 2 + orbitRadius * Math.sin(angleStep * i - Math.PI / 2)
            };
        });

        xForce = d3.forceX(d => groupCenters[d[groupKey] || 'unknown'].x).strength(0.8);
        yForce = d3.forceY(d => groupCenters[d[groupKey] || 'unknown'].y).strength(0.8);
    } else {
        xForce = d3.forceX(width / 2).strength(d => {
            const c = connectionCounts[d.id] || 0;
            if (c >= 13) return 0.75;
            if (c >= 11) return 0.6;
            if (c >= 9) return 0.45;
            if (c >= 7) return 0.3;
            if (c >= 5) return 0.18;
            if (c >= 3) return 0.08;
            return 0.02;
        });
        yForce = d3.forceY(height / 2).strength(d => {
            const c = connectionCounts[d.id] || 0;
            if (c >= 13) return 0.75;
            if (c >= 11) return 0.6;
            if (c >= 9) return 0.45;
            if (c >= 7) return 0.3;
            if (c >= 5) return 0.18;
            if (c >= 3) return 0.08;
            return 0.02;
        });
    }

    const chargeStrength = (viewMode === 'sector' || viewMode === 'funding') ? -350 : -300;

    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(viewMode === 'all' ? 400 : 250))
        .force('charge', d3.forceManyBody().strength(chargeStrength))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.meetings) * 2 + 15))
        .force('x', xForce)
        .force('y', yForce);

    const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', d => {
            if (d.value >= 6) return 'link link-strong';
            if (d.value >= 3) return 'link link-medium';
            return 'link link-weak';
        });

    const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', d => Math.sqrt(d.meetings) * 2 + 12)
        .attr('fill', d => getSectorColor(d.sector))
        .attr('opacity', d => d.meetings === 0 ? 0.8 : 1)
        .call(drag(simulation));

    const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .attr('class', 'node-label')
        .text(d => d.name);

    const tooltip = d3.select('#tooltip');

    node.on('mouseover', (event, d) => {
            const connections = allLinks.filter(link => 
                link.source.id === d.id || link.target.id === d.id ||
                link.source === d.id || link.target === d.id
            );
            
            const strongLinks = connections.filter(c => c.value >= 6).length;
            const mediumLinks = connections.filter(c => c.value >= 3 && c.value < 6).length;
            const weakLinks = connections.filter(c => c.value < 3).length;
            
            tooltip.style('display', 'block')
                .html(`
                    <strong>${d.fullName}</strong><br/>
                    <span style="color: #888;">${d.name}</span><br/>
                    <hr style="margin: 5px 0; border-color: #444;">
                    <strong>Sector:</strong> ${d.sector}<br/>
                    <strong>Meetings:</strong> ${d.meetings}<br/>
                    <strong>Total Collaborations:</strong> ${connections.length}<br/>
                    <div style="margin-top: 8px; font-size: 12px;">
                        <div style="color: #000;">━ Strong (6+): ${strongLinks}</div>
                        <div style="color: #4CAF50;">━ Medium (3-5): ${mediumLinks}</div>
                        <div style="color: #f44336;">┈ Weak (1-2): ${weakLinks}</div>
                    </div>
                    ${d.description ? `<hr style="margin: 5px 0; border-color: #444;"><small style="color: #aaa;">${d.description.substring(0, 100)}...</small>` : ''}
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
            selectEntity(d.id);
            highlightNode(d.id); 
        });

    simulation.on('tick', () => {
        const padding = 20;
        const w = container.clientWidth;
        const h = container.clientHeight;
        
        node.each(function(d) {
            const radius = Math.sqrt(d.meetings) * 3 + 12;
            d.x = Math.max(radius + padding, Math.min(w - radius - padding, d.x));
            d.y = Math.max(radius + padding, Math.min(h - radius - padding, d.y));
        });
        
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('cx', d => d.x).attr('cy', d => d.y);
        label.attr('x', d => d.x).attr('y', d => d.y + 5);
    });
}

// D3 add-on features
function getSectorColor(sector) {
    const sectorColors = {
        'healthcare': '#4CAF50',
        'education': '#2196F3',
        'government': '#FF9800',
        'nonprofit': '#E91E63',
        'business': '#9C27B0',
        'technology': '#00BCD4',
        'banking': '#3F51B5',
        'legal': '#FF5722',
        'energy': '#8BC34A',
        'agriculture': '#FFC107'
    };
    return sectorColors[sector] || '#607D8B';
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

window.addEventListener('resize', () => {
    if (!svg || !simulation || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    svg.attr('width', w).attr('height', h);

    simulation
        .force('center', d3.forceCenter(w / 2, h / 2))
        .force('x', d3.forceX(w / 2).strength(0.08))
        .force('y', d3.forceY(h / 2).strength(0.08))
        .alpha(0.3)
        .restart();

    const currentTransform = d3.zoomTransform(svg.node());
    const k = currentTransform.k;
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(w / 2, h / 2)
        .scale(k)
        .translate(-w / 2, -h / 2)
    );
});
