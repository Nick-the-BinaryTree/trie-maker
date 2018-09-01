const CHAR_OFFSET = -5;
const LINE_OFFSET = 8;
const PREV_STATE = 'Backspace';
const RADIUS_SCALE_FACTOR = 14;

const colors = d3.scaleOrdinal(d3.schemeCategory20c);
let edgeLabels, edgePaths, link, node, simulation, svg;

const graph = {
  nodes: [
    {
      "data": "ε",
      "endState": false,
      "id": 0
    },
    {
      "data": "A",
      "endState": false,
      "id": 1
    },
    {
      "data": "AB",
      "endState": false,
      "id": 2
    },
    {
      "data": "ABC",
      "endState": true,
      "id": 3
    },
  ],
  edges: [
    {
      "source": 0,
      "target": 1,
      "input": "A",
    },
    {
      "source": 1,
      "target": 2,
      "input": "B",
    },
    {
      "source": 2,
      "target": 3,
      "input": "C",
    },
    {
      "source": 1,
      "target": 0,
      "input": PREV_STATE,
    },
    {
      "source": 2,
      "target": 1,
      "input": PREV_STATE,
    },
    {
      "source": 3,
      "target": 2,
      "input": PREV_STATE,
    },
  ]
}

window.onload = () => {
  initSim();
}

function initSim() {
  svg = d3.select("svg"),

  svg.append('defs').append('marker')
    .attrs({
      'id':'arrowhead',
      'viewBox':'-0 -5 10 10',
      'refX':13,
      'refY':0,
      'orient':'auto',
      'markerWidth':15,
      'markerHeight':15,
      'xoverflow':'visible'
      })
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#93ff9c6c')
    .style('stroke','none');

  simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(200))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(window.innerWidth/2, window.innerHeight/2));

  update(graph.nodes, graph.edges);
}

function update(nodes, links) {
  edgePaths = svg.selectAll(".edgePath")
    .data(links)

  const edgePathsEnter = edgePaths.enter()
    .append('path')
    .attrs({
        'class': 'edgePath',
        'id': (d, i) => 'edgePath' + i,
        'fill-opacity': 0,
        'stroke-opacity': 0
    })
    .style("pointer-events", "none");

  edgePaths = edgePathsEnter.merge(edgePaths);

  edgeLabels = svg.selectAll(".edgeLabel")
    .data(links);

  const edgeLabelsEnter = edgeLabels.enter()
    .append('text')
    .style("pointer-events", "none")
    .attrs({
        'class': 'edgeLabel',
        'id': (d, i) => 'edgeLabel' + i,
        'font-size': 14,
        'fill': '#aaa'
    });

  edgeLabelsEnter.append('textPath')
    .attrs({
      'startOffset': "50%",
      'xlink:href': (d, i) => '#edgePath' + i
    })
    .style("pointer-events", "none")
    .style("text-anchor", "middle")
    .text(d => d.input);

  edgeLabels = edgeLabelsEnter.merge(edgeLabels);

  node = svg.selectAll(".node")
    .data(nodes);

  const nodeEnter = node.enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  nodeEnter.append("circle")
    .attr("r", (d => RADIUS_SCALE_FACTOR*d.data.length))
    .attr("stroke", d => d.endState ? 'yellow' : null)
    .style("fill", (d, i) => colors(i));

  nodeEnter.append("text")
    .attrs({
      'dx': d => d.data.length*CHAR_OFFSET,
      'fill': '#000',
      'font-size': 14,
      'stroke': 'none'
    })
    .text(d => d.data);

  node = nodeEnter.merge(node);

  link = svg.selectAll(".link")
    .data(links);

  const linkEnter = link.enter()
    .append("line")
    .attrs({
      'class': 'link',
      'marker-end': 'url(#arrowhead)'
    })

  linkEnter.append("title")
    .text(d => d.input);

  link = linkEnter.merge(link);

  simulation
    .nodes(nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(links);
}

function ticked() {
  link
    .attr("x1", d => _offset(d.input, d.source.x))
    .attr("y1", d => _offset(d.input, d.source.y))
    .attr("x2", d => _offset(d.input, d.target.x))
    .attr("y2", d => _offset(d.input, d.target.y))

    node
      .attr("transform", d => "translate(" + d.x + ", " + d.y + ")");

    edgePaths.attr('d', d => 'M ' + _offset(d.input, d.source.x) + ' ' + _offset(d.input, d.source.y)
      + ' L ' + _offset(d.input, d.target.x) + ' ' + _offset(d.input, d.target.y));
}

function dragstarted(d) {
  if (!d3.event.active) {
    simulation.alphaTarget(0.3).restart();
  }
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

const _offset = (input, x) => input === PREV_STATE ? x + LINE_OFFSET : x - LINE_OFFSET;

window.addEventListener("resize", () => {
  simulation.force("center")
    .x(window.innerWidth / 2)
    .y(window.innerHeight / 2);

  simulation.alpha(0.3).restart();
});

setTimeout(() => {
  console.log(graph);
  graph.nodes.push({
    "data": "ABCD",
    "endState": false,
    "id": 4,
  });
  graph.edges.push({
    "source": graph.nodes[3],
    "target": graph.nodes[4],
    "input": "D",
    "index": 6
  });
  update(graph.nodes, graph.edges);

}, 2000)
