import { allLinks } from './data.js';
import { showEntityDetails } from './sidebar.js';

let simulation = null;
let svg, g, zoom;

// D3 initialization
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
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    svg.on('wheel.zoom', function(event) {
        event.preventDefault();
        
        const currentTransform = d3.zoomTransform(svg.node());
        const delta = -event.deltaY * 0.002;
        const newScale = Math.max(0.5, Math.min(3, currentTransform.k * Math.exp(delta)));
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        const newTransform = d3.zoomIdentity
            .translate(centerX, centerY)
            .scale(newScale)
            .translate(-centerX, -centerY);
        
        svg.transition()
            .duration(50)
            .call(zoom.transform, newTransform);
    });
    
    svg.on('dblclick.zoom', function(event) {
        event.preventDefault();
        
        const currentTransform = d3.zoomTransform(svg.node());
        const newScale = currentTransform.k === 1 ? 2 : 1;
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        const newTransform = d3.zoomIdentity
            .translate(centerX, centerY)
            .scale(newScale)
            .translate(-centerX, -centerY);
        
        svg.transition()
            .duration(300)
            .call(zoom.transform, newTransform);
    });

    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(250))
        .force('charge', d3.forceManyBody().strength(-1200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.meetings) * 5 + 40))
        .force('x', d3.forceX(width / 2).strength(0.08))
        .force('y', d3.forceY(height / 2).strength(0.08));

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
        .attr('r', d => Math.sqrt(d.meetings) * 5 + 15)
        .attr('fill', d => getSectorColor(d.sector))
        .attr('opacity', d => d.meetings === 0 ? 0.5 : 1)
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

// D3 add-on features
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
