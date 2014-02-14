	function optionExists ( haystack, needle ) {
		var optionExists = false;
		for (i = 0; i < haystack.length; ++i){
			if (haystack.options[i].value == needle){
			  optionExists = true;
			  break;
			}
		}
		return optionExists;
	}
	
	var lastLoadedNodeId = null;
	var allText = "ALL";
	var graph;
	
	function loadJsonData(jsonFileName, idealLength) {
		var selectRow = document.getElementById("selectRow");
		var cell = selectRow.insertCell();
		cell.id = "depthLabelCell";
		cell.innerHTML = "Depth";				
		cell = selectRow.insertCell();
		cell.id = "depthSelectCell";
		var select = document.createElement ("select");
		select.id = "depthSelect";
		cell.appendChild(select);
		select.onchange = function(){
			if (lastLoadedNodeId != null) {
				graph.clear();
				loadGraph(jsonFileName, idealLength, lastLoadedNodeId);
			}
		};
		
		select.options[0] = new Option(allText, allText);
		for(var i=9;i>0;i--)
		{
			opt = document.createElement("option");
			opt.value = i;
			opt.text=i;
			select.appendChild(opt);						
		}
	
		loadGraph(jsonFileName, idealLength, null);
	}
	
	function markRelatedNodes(root, nodeId, depth, maxDepth) {
		
		var found = false;
		for(var i in root.types)
		{
			var type = root.types[i];
			for(var j in type.nodes)
			{
				var node = type.nodes[j];
				if (('depth' in node) == false) {
					if (node.id == nodeId) {
						node.depth = depth;
						found = true;
						break;
					}
				}
			}
			if (found) {
				break;
			}
		}
		
		if (found && (maxDepth == -1 || depth < maxDepth)) {
			for(var i in root.relations)
			{
				var relation = root.relations[i];
				if (relation.src == nodeId || relation.dst == nodeId) {
					if (('depth' in relation) == false) {
						relation.depth = depth;
						if (relation.src == nodeId) {
							markRelatedNodes(root, relation.dst, depth+1, maxDepth);
						}
						if (relation.dst == nodeId) {
							markRelatedNodes(root, relation.src, depth+1, maxDepth);								
						}
					}
					else {
					}
				}
			}
		}
		
	}
				
	function loadGraph(jsonFileName, idealLength, nodeId) {
	
	
		lastLoadedNodeId = nodeId;

		var graphContainer = document.getElementById("graphContainer")
		var containerLeft = graphContainer.offsetLeft;
		var containerTop = graphContainer.offsetTop;
		var containerWidth = graphContainer.offsetWidth;
		var containerHeight = graphContainer.offsetHeight;
	
		graph = Viva.Graph.graph();
	
		d3.json(jsonFileName, function(error, root) {
			/*
			if ('width' in root) {
				console.log('data has width:' + root.width);
				containerWidth = root.width;						
			}
			if ('height' in root) {
				console.log('data has width:' + root.height);
				containerHeight = root.height;
			}
			*/
			
			//console.log('container width:' + containerWidth + " height:" + containerHeight);
					
			if (nodeId != null) {
				// filter for node
				var depth = -1;
				var depthSelect = document.getElementById("depthSelect");
				if (depthSelect != null) {
					if (depthSelect.value != allText) {
						depth = depthSelect.value;
					}
				}
				
				markRelatedNodes(root, nodeId, 0, depth);						
			}					
			
			var selectRow = document.getElementById("selectRow");
			for (var i=0;i<selectRow.cells.length;i++) {					
				var cell = selectRow.cells[i];
				if (cell.id != "depthLabelCell" && 
					cell.id != "depthSelectCell" ) {
					selectRow.removeChild(cell);
					i = 0;
				}						
			}
						
			for(var i in root.types)
			{
				var type = root.types[i];
				
				var cell = document.createElement ("td");
				selectRow.appendChild(cell);

				cell.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + type.name;
				
				cell = document.createElement ("td");
				selectRow.appendChild(cell);
				
				var select = document.createElement ("select");
				cell.appendChild(select);

				select.options[0] = new Option(allText, allText);
				select.onchange = function(){
					var nodeId = this.value;							
					if (nodeId == allText) {
						nodeId = null;
					}
					
					graph.clear();
					loadGraph(jsonFileName, idealLength, nodeId);
				};

				for(var j in type.nodes)
				{
					var node = type.nodes[j];	
													
					if (!optionExists(select, node.id)) {
						opt = document.createElement("option");
						opt.value = node.id;
						opt.text=node.name;
						if (nodeId == node.id) {
							opt.selected="true";
						}
						select.appendChild(opt);
					}
					
					if (nodeId == null || ('depth' in node)) {												
						if ('x' in node && 'y' in node) {
							var x = 0;
							var y = 0;
							//console.log('node ' + node.id + ' has x:' + node.x + ' y:' + node.y);
							
							if (node.x.indexOf("%") >= 0) {
								x = node.x.replace("%","");
								x = containerWidth * x / 100 - containerWidth / 2;
								//console.log('node ' + node.id + ' ' + node.x + ' calculated as x:' + x);
							} else {
								x = node.x - containerWidth / 2;
								//console.log('node ' + node.id + ' x:' + x);
							}
							if (node.y.indexOf("%") >= 0) {
								y = node.y.replace("%","");
								y = containerHeight * y / 100 - containerHeight / 2;
								//console.log('node ' + node.id + ' ' + node.y + ' calculated as y:' + y);
							} else {
								y = node.y - containerHeight / 2;
								//console.log('node ' + node.id + ' y:' + y);
							}
							graph.addNode(node.id, {name:node.name, url : type.icon, x:x, y:y} );
						} else {
							graph.addNode(node.id, {name:node.name, url : type.icon} );
						}
					}						
					
				}
				
			}
								
			for(var i in root.relations)
			{
				var relation = root.relations[i];		
				if (nodeId == null || ('depth' in relation)) {
					graph.addLink(relation.src, relation.dst);							
				}
			}

		});						
		
	 //var idealLength = 100;
	  var layout = Viva.Graph.Layout.forceDirected(graph, {
		  springLength: idealLength,
		  springCoeff : 0.0001,
		  gravity : -10,

		  springTransform: function (link, spring) {
			spring.length = idealLength;
		  }
	  });
	
	var graphics = Viva.Graph.View.svgGraphics();
	var nodeSize = 24;
	
	graphics.node(function(node) {
		   // The function is called every time renderer needs a ui to display node

			var nsize = nodeSize;
			if (node.id == nodeId) {
				nsize = 48;
			}

			var ui = Viva.Graph.svg('g'),
				  // Create SVG text element with user id as content
				  svgText = Viva.Graph.svg('text')
					.attr('y', '-4px')
					.attr('text-anchor', 'middle')
					.attr('x', 12)
					.text(node.data.name),
				  img = Viva.Graph.svg('image')
					 .attr('width', nsize)
					 .attr('height', nsize)
					 .attr('x', 0)
					 .attr('id', node.id)
					 .link(node.data.url);
			
			  ui.append(svgText);
			  ui.append(img);
			  
			  if (node.id == nodeId) {
				rect = Viva.Graph.svg('rect')
					.attr('width', nsize)
					.attr('height', nsize)
					.attr('style', 'fill-opacity:0.0;stroke-width:3;stroke:rgb(255,0,0)');
				 ui.append(rect);
				}
				
				ui.addEventListener('dblclick', function () {
					node.isPinned = !node.isPinned;
				});
			
			if ('x' in node.data && 'y' in node.data) {
				//console.log('node ' + node.id + ' initial position x:' + node.position.x + ', y:' + node.position.y );
				node.position.x = node.data.x;
				node.position.y = node.data.y;
				//console.log('pinning node ' + node.id + ' to x:' + node.position.x + ', y:' + node.position.y );
				node.isPinned = true;
			}
  
			return ui;							 
		})
		.placeNode(function(nodeUI, pos){
			nodeUI.attr('transform',
				'translate(' +
					  (pos.x - nodeSize/2) + ',' + (pos.y - nodeSize/2) +
				')');
		});

	var renderer = Viva.Graph.View.renderer(graph, 
		{
			layout     : layout,
			graphics : graphics
		});
	renderer.run();
		
    }
		