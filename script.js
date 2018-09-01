const CHAR_OFFSET = -3;
const LINE_OFFSET = 8;
const PREV_STATE = 'Backspace';
const RADIUS_SCALE_FACTOR = 5;

const colors = d3.scaleOrdinal(d3.schemeCategory20c);
let curNodeID = 0, edgeLabels, edgePaths, link, node, simulation, svg;

const graph = {
  nodes: [
    {
      "data": "ε",
      "curState": true,
      "endState": false,
      "id": 0
    },
    // {
    //   "data": "A",
    //   "endState": false,
    //   "id": 1
    // },
    // {
    //   "data": "AB",
    //   "endState": false,
    //   "id": 2
    // },
    // {
    //   "data": "ABC",
    //   "endState": true,
    //   "id": 3
    // },
  ],
  edges: [
    // {
    //   "source": 0,
    //   "target": 1,
    //   "input": "A",
    // },
    // {
    //   "source": 1,
    //   "target": 2,
    //   "input": "B",
    // },
    // {
    //   "source": 2,
    //   "target": 3,
    //   "input": "C",
    // },
    // {
    //   "source": 1,
    //   "target": 0,
    //   "input": PREV_STATE,
    // },
    // {
    //   "source": 2,
    //   "target": 1,
    //   "input": PREV_STATE,
    // },
    // {
    //   "source": 3,
    //   "target": 2,
    //   "input": PREV_STATE,
    // },
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

  node = svg.selectAll(".node")
    .data(nodes);

  node.selectAll('circle')
    .classed("highlight", d => d.curState)
    .classed("endState", d => d.endState);

  const nodeEnter = node.enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  nodeEnter.append("circle")
    .attr("r", (d => 5 + RADIUS_SCALE_FACTOR*d.data.length))
    .classed("highlight", true)
    .style("fill", (d, i) => colors(i));

  nodeEnter.append("text")
    .attrs({
      'dx': d => d.data.length*CHAR_OFFSET,
      'fill': '#000',
      'font-size': 14,
      'stroke': 'none'
    })
    .text(d => d.data);

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

  node = nodeEnter.merge(node);
  link = linkEnter.merge(link);
  edgePaths = edgePathsEnter.merge(edgePaths);
  edgeLabels = edgeLabelsEnter.merge(edgeLabels);

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

function addChar(keyName) {
  const toSearch = curNodeID === 0 ? keyName : graph.nodes[curNodeID].data + keyName;
  const searchRes = _search(toSearch);

  if (searchRes) {
    setCurState(searchRes);
  } else {
    graph.nodes.push({
        "data": toSearch,
        "curState": true,
        "endState": false,
        "id": graph.nodes.length
    });

    graph.edges.push({
      "source": graph.nodes[curNodeID],
      "target": graph.nodes[graph.nodes.length-1],
      "input": keyName
    });
    graph.edges.push({
      "source": graph.nodes[graph.nodes.length-1],
      "target": graph.nodes[curNodeID],
      "input": PREV_STATE
    });

    setCurState(graph.nodes.length-1);
  }
}

function setCurState(newID) {
  graph.nodes[curNodeID].curState = false;
  curNodeID = newID;
  graph.nodes[curNodeID].curState = true;
  update(graph.nodes, graph.edges);
}

function setEndState() {
  graph.nodes[curNodeID].endState = true;
  setCurState(0);
}

function prevState() {
  if (curNodeID === 0) {
    return;
  }
  const curString = graph.nodes[curNodeID].data;
  const toSearch = curString.substring(0, curString.length-1);

  setCurState(toSearch ? _search(toSearch) : 0);
}

const _offset = (input, x) => input === PREV_STATE ? x + LINE_OFFSET : x - LINE_OFFSET;

const _search = (s) => {
  for (let node of graph.nodes) {
    if (node.data === s) {
      return node.id;
    }
  }
  return null;
}

window.addEventListener('resize', () => {
  simulation.force('center')
    .x(window.innerWidth / 2)
    .y(window.innerHeight / 2);

  simulation.alpha(0.3).restart();
});

window.addEventListener('keydown', event => {
  const keyName = event.key;
  const keyCode = event.keyCode;

  if (65 <= keyCode && keyCode <= 90) {
    addChar(keyName);
  } else if (keyCode === 13) {
    setEndState();
  } else if (keyCode === 8) {
    prevState();
  }
});
