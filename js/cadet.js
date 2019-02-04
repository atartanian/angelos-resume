paper.settings.handleSize = 6;
paper.settings.applyMatrix = false;
var myLayer = project.activeLayer;
var centerViz;
var startingDistance;

var selectedColor = new Color(1,0,0);

var unselectedStyle = {
	fillColor: new Color(.5,.5,.5),
    strokeColor: 'black',
    strokeWidth: 1
}

var hoverStyle = {
	fillColor: new Color(.7,.7,.7),
    strokeColor: new Color(.5,.5,.5),
    strokeWidth: 1
}

var previewStyle = {
	fillColor: new Color(0,0,0,0),
    strokeColor: 'black',
    strokeWidth: 1
}

project.currentStyle = unselectedStyle;
myLayer.selectedColor = selectedColor;

var circleTool = new Tool();
circleTool.toolName = "circleTool";
circleTool.onMouseDown = createCircle;
circleTool.onMouseDrag = sizeCircle;
circleTool.onMouseUp = finalizeCircle;
circleTool.onKeyDown = onKeyDown;

var rectangleTool = new Tool();
rectangleTool.toolName = "rectangleTool";
rectangleTool.onMouseDown = createRectangle;
rectangleTool.onMouseDrag = sizeRectangle;
rectangleTool.onMouseUp = finalizeRectangle;
rectangleTool.onKeyDown = onKeyDown;

var selectTool = new Tool();
selectTool.toolName = "selectTool";
selectTool.onMouseDown = select;
selectTool.onMouseUp = drop;
selectTool.onMouseDrag = drag;
selectTool.onKeyDown = onKeyDown;

var rotateTool = new Tool();
rotateTool.toolName = "rotateTool";
rotateTool.onMouseMove = rotate;
rotateTool.onMouseDown = confirmRotate;

var scaleTool = new Tool();
scaleTool.toolName = "scaleTool";
scaleTool.onMouseMove = scale;
scaleTool.onMouseDown = confirmScale;

var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 2
};

var dragging = false;
var justSelected = false;

var mouseDown = false;
var clipBoard;

circleTool.activate();
$("#circle-tool").addClass("active");
$("#cadet").addClass("cursor-cross");


function select(event) {
	var hitResult = project.hitTest(event.point, hitOptions);
	if (!hitResult){
		project.activeLayer.selected = false;
		return;
	}

	if (dragging == false) {
		if (event.item.selected != true) {
			if (event.modifiers.shift) {
				if (hitResult.type == 'fill') {
					if (event.item.selected == false) {
						event.item.selected = true;
						justSelected = true;
					} else {
						event.item.selected = false;
						justSelected = true;
					}
				}
			} else {
				if (hitResult.type == 'fill' || hitResult.type == 'segment') {
					project.activeLayer.selected = false;
					event.item.selected = true;
					justSelected = true;
				}
			}
		}
	}
}

function drag(event) {
	if (event.downPoint.getDistance(event.point) > 2) {
		dragging = true;
		for (var i = 0; i < project.selectedItems.length; i++) {
			project.selectedItems[i].position += event.delta;
		}
	}
}

function drop(event) {
	if (event.item){
		if (dragging == false && event.item.selected == true && justSelected == false) {
			if (event.modifiers.shift == true) {
				event.item.selected = false;
				justSelected = true;
			} else {
				project.activeLayer.selected = false;
				event.item.selected = true;
			}
		} else {
			dragging = false;
		}
		justSelected = false;
	}
	
}

var previewShape;

function createCircle(event){
	previewShape = new Shape.Circle(event.point, 10);
	previewShape.fillColor = new Color(1,.6,.6,.5);
}


function sizeCircle(event){
	if (previewShape) {
		previewShape.radius = event.downPoint.getDistance(event.point);
	}
}

function finalizeCircle(event){
	path = new Path.Circle(previewShape.position, previewShape.radius);
	path.attach('mouseenter', function() {
		if(paper.tool.toolName == "selectTool"){
			this.style = hoverStyle;
		} else {
			this.style = unselectedStyle;
		}
	});
	path.attach('mouseleave', function() {
		this.style = unselectedStyle;
	});
	previewShape.remove();
}

var rectSize;

function createRectangle(event){
	rectSize = new Size(20,20);
	previewShape = new Shape.Rectangle(event.point, new Point(event.point.x + 10, event.point.y + 10));
	previewShape.fillColor = new Color(1,.6,.6,.5);
}


function sizeRectangle(event){
	if (previewShape) {
		previewShape.remove();
		previewShape = new Shape.Rectangle(event.downPoint, event.point);
	}
}

function finalizeRectangle(event){
	path = new Path.Rectangle(previewShape.position - previewShape.size / 2, previewShape.size);
	path.attach('mouseenter', function() {
		if(paper.tool.toolName == "selectTool"){
			this.style = hoverStyle;
		} else {
			this.style = unselectedStyle;
		}
	});
	path.attach('mouseleave', function() {
		this.style = unselectedStyle;
	});
	previewShape.remove();
}

function getSelectedCenter(){
	var center = new Point();
	for (var i = 0; i < project.selectedItems.length; i++) {
		center = center + project.selectedItems[i].position;
	};
	center = center / project.selectedItems.length;
	return center;
}

var baseAngle;

function rotate(event){
	var mouseVector = event.point - baseCenter;
	var basis = new Point(1,0);
	if (!baseAngle) {
		baseAngle = basis.getDirectedAngle(mouseVector);
	}
	rotateGroup.matrix.reset();
	rotateGroup.rotate(basis.getDirectedAngle(mouseVector) - baseAngle);
	console.log(rotateGroup.rotation);
}

function confirmRotate(event){
	rotateGroup.applyMatrix = true;
	project.activeLayer.addChildren(rotateGroup.removeChildren()); 
	rotateGroup.remove();
	centerViz.remove();
	selectTool.activate();
	justSelected = true;
	baseAngle = undefined;
	$("#rotate-tool").removeClass("active");
	$("#cadet").removeClass("cursor-move cursor-cross");
}

function scale(event){
	if (!startingDistance) {
		startingDistance = baseCenter.getDistance(event.point);
	}
	scaleGroup.matrix.reset();
	scaleGroup.scale(baseCenter.getDistance(event.point)/startingDistance);
	console.log(scaleGroup.scaling);
}

function confirmScale(event){
	startingDistance = undefined;
	scaleGroup.applyMatrix = true;
	project.activeLayer.addChildren(scaleGroup.removeChildren()); 
	scaleGroup.remove();
	centerViz.remove();
	selectTool.activate();
	justSelected = true;
	$("#scale-tool").removeClass("active");
	$("#cadet").removeClass("cursor-move cursor-cross");
}

function booleanUnion(){
	while (project.selectedItems.length > 1) {
		var a = project.selectedItems[0];
		var b = project.selectedItems[1];
		var c = a.unite(b);
		a.remove();
		b.remove();
		c.selected = true;
	}
	console.log(project.selectedItems.length);
}

function booleanIntersect(){
	while (project.selectedItems.length > 1) {
		var a = project.selectedItems[0];
		var b = project.selectedItems[1];
		var c = a.intersect(b);
		a.remove();
		b.remove();
		c.selected = true;
	}
	console.log(project.selectedItems.length);
}

function booleanDifference(){
	var operand = project.selectedItems[0];
	operand.selected = false;
	while (project.selectedItems.length > 0) {
		var operator = project.selectedItems[0];
		var result = operand.subtract(operator);
		operator.remove();
		operand.remove();
		operand = result;
	}
	operand.selected = true;
	console.log(project.selectedItems.length);
}

function convexHullSelected(){
	var points = [];
	while(project.selectedItems.length > 0){
		var curItem = project.selectedItems[0];
		console.log(curItem.getClassName());
		if (curItem.getClassName() == "CompoundPath") {
			while(curItem.children.length > 0) {
				var path = curItem.children[0];
				path.flatten(5);
				for (var p = 0; p < path.segments.length; p++) {
					var point = path.segments[p].point;
					points.push(path.localToGlobal(point));
				}
				path.remove();
			}
			curItem.remove();
		} else {
			var path = curItem;
			path.flatten(5);
			for (var p = 0; p < path.segments.length; p++) {
				var point = path.segments[p].point;
				points.push(path.localToGlobal(point));
			}
			path.remove();
		}	
	}
	var hull = new Path(convexHull(points));
	hull.clockwise = true;
	hull.selected = true;
	hull.closed = true;
	console.log(project.selectedItems.length);
}

function deleteSelected(){
	while (project.selectedItems.length > 0) {
		project.selectedItems[0].remove();
	}
	console.log(project.selectedItems.length);
}

function duplicateSelected(){
	var oldLen = project.selectedItems.length;
	for(var i = 0; i < oldLen; i++){
			var oldpath = project.selectedItems[0];
			var newpath = oldpath.clone();
			oldpath.selected = false;
			newpath.selected = true;
			newpath.position += new Point(20,20);
	}
	console.log(project.selectedItems.length);
}

function rotateSelected(){
	if (project.selectedItems.length) {
		baseCenter = getSelectedCenter();
		rotateGroup = new Group(project.selectedItems);
		rotateGroup.pivot = baseCenter;
		centerViz = new Shape.Circle(baseCenter, 5);
		centerViz.fillColor = new Color(0,0,0);
		console.log("rotate tool active");
	}
}

function scaleSelected(){
	if (project.selectedItems.length) {
		baseCenter = getSelectedCenter();
		scaleGroup = new Group(project.selectedItems);
		scaleGroup.pivot = baseCenter;
		centerViz = new Shape.Circle(baseCenter, 5);
		centerViz.fillColor = new Color(0,0,0);
		console.log("scale tool active");
	}
}

function saveProject(){
	localStorage.setItem("cadet", project.exportJSON());
}

function loadProject(){
	project.clear();
	project.importJSON(localStorage.getItem("cadet"));
	myLayer = project.activeLayer;
	project.currentStyle = unselectedStyle;
	myLayer.selectedColor = selectedColor;
	project.deselectAll();

}

function onKeyDown(event) {
	switch(event.key) {
		case 'c':
			$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-cross");
			$("#circle-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#circle-tool").addClass("active");

			circleTool.activate();
			break;
		case 't':
			$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-cross");
			$("#rectangle-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#rectangle-tool").addClass("active");

			rectangleTool.activate();
			break;
		case 'v':
			$("#cadet").removeClass("cursor-move cursor-cross");
			$("#select-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#select-tool").addClass("active");

			selectTool.activate();
			break;
		case 'u':
			booleanUnion();
			$("#union-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#union-tool").addClass("active");
			setTimeout(function(){ $("#union-tool").removeClass("active"); }, 400);

			break;
		case 'i':
			booleanIntersect();
			$("#intersect-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#intersect-tool").addClass("active");
			setTimeout(function(){ $("#intersect-tool").removeClass("active"); }, 400);
			break;
		case 'o':
			if (project.selectedItems.length <= 1) {
				break;
			}
			booleanDifference();
			$("#difference-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#difference-tool").addClass("active");
			setTimeout(function(){ $("#difference-tool").removeClass("active"); }, 400);
			break;
		case 'h':
			convexHullSelected();
			$("#hull-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#hull-tool").addClass("active");
			setTimeout(function(){ $("#hull-tool").removeClass("active"); }, 400);
			break;
		case 'backspace':
			event.preventDefault();
			deleteSelected();
			$("#delete-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#delete-tool").addClass("active");
			setTimeout(function(){ $("#delete-tool").removeClass("active"); }, 400);
			break;
		case 'd':
			event.preventDefault();
			duplicateSelected();
			$("#duplicate-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
			$("#duplicate-tool").addClass("active");
			setTimeout(function(){ $("#duplicate-tool").removeClass("active"); }, 400);
			break;
		case 'r':
			if(!(commandKey || event.modifiers.ctrl)) {
				event.preventDefault();
				if (project.selectedItems.length) {
					$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-move");
					$("#rotate-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
					$("#rotate-tool").addClass("active");
					rotateTool.activate();
					rotateSelected();
				}
			}
			break;
		case 's':
			event.preventDefault();
			if (project.selectedItems.length) {
				$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-move");
				$("#scale-tool").parent().parent().children(".tool-group").children(".tool-btn").removeClass("active");
				$("#scale-tool").addClass("active");
				scaleTool.activate();
				scaleSelected();
			}
			
			break;
		case '.':
			event.preventDefault();
			for (var i = 0; i < project.selectedItems.length; i++){
					var path = project.selectedItems[i];
					path.bringToFront();
			}
			break;
		case ',':
			event.preventDefault();
			for (var i = 0; i < project.selectedItems.length; i++){
				var path = project.selectedItems[i];
				path.sendToBack();
			}
			break;
	}		
}

function cross(o, a, b) {
   return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}
 
/**
 * @param points An array of [X, Y] coordinates
 */
function convexHull(points) {
   points.sort(function(a, b) {
      return a.x == b.x ? a.y - b.y : a.x - b.x;
   });
 
   var lower = [];
   for (var i = 0; i < points.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
         lower.pop();
      }
      lower.push(points[i]);
   }
 
   var upper = [];
   for (var i = points.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
         upper.pop();
      }
      upper.push(points[i]);
   }
 
   upper.pop();
   lower.pop();
   return lower.concat(upper);
}

$(document).ready(function(){
	$(".tool-btn").click(function(){
		$(this).parent().parent().children(".tool-group").children(".tool-btn").removeClass('active');
		$(this).addClass('active');
		var toolType = $(this).attr('id').slice(0,-5) + 'Tool';
		if (toolType == "unionTool") {
			$(this).removeClass('active');
			booleanUnion();
			view.draw();
			return;
		}
		if (toolType == "intersectTool") {
			$(this).removeClass('active');
			booleanIntersect();
			view.draw();
			return;
		}
		if (toolType == "differenceTool") {
			$(this).removeClass('active');
			booleanDifference();
			view.draw();
			return;
		}
		if (toolType == "hullTool") {
			$(this).removeClass('active');
			convexHullSelected();
			view.draw();
			return;
		}
		if (toolType == "circleTool") {
			$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-cross");
			circleTool.activate();
			console.log(paper.tool);
			view.draw();
			return;
		}
		if (toolType == "rectangleTool") {
			$("#cadet").removeClass("cursor-move cursor-cross").addClass("cursor-cross");
			rectangleTool.activate();
			console.log(paper.tool);
			view.draw();
			return;
		}
		if (toolType == "selectTool") {
			$("#cadet").removeClass("cursor-move cursor-cross");
			selectTool.activate();
			view.draw();
			return;
		}
		if (toolType == "scaleTool") {
			$("#cadet").removeClass("cursor-move cursor-cross");
			scaleTool.activate();
			scaleSelected();
			return;
		}
		if (toolType == "rotateTool") {
			$("#cadet").removeClass("cursor-move cursor-cross");
			rotateTool.activate();
			rotateSelected();
			return;
		}
		if (toolType == "deleteTool") {
			$(this).removeClass('active');
			deleteSelected();
			view.draw();
			return;
		}
		if (toolType == "duplicateTool") {
			$(this).removeClass('active');
			duplicateSelected();
			view.draw();
			return;
		}
		if (toolType == "saveTool") {
			$(this).removeClass('active');
			saveProject();
			return;
		}
		if (toolType == "loadTool") {
			$(this).removeClass('active');
			loadProject();
			view.draw();
			return;
		}
	});
});

// var CBoolGroup = paper.Group.extend({ 
//     initialize: function CBoolGroup() { 

//     },
//     addPath: function(path){
//     	this.adders.push(path);
//     	//this is where i left off
//     },
//     computeAddersUnite: function(){
//     	if (this.adders.length) {
//     		var interim = undefined;
// 			var result = undefined;
// 			for(var i = 0; i < this.adders.length; i++){
// 				if (!interim) {
// 					interim = this.adders[i];
// 				} else {
// 					result = interim.unite(this.adders[i]);
// 					interim.remove();
// 					interim = result;
// 				}
// 			}
// 			return result;
//     	}
// 		return false;   
//     },
//     computeAddersIntersect: function(){
//     	if (this.adders.length) {
//     		var interim = undefined;
// 			var result = undefined;
// 			for(var i = 0; i < this.adders.length; i++){
// 				if (!interim) {
// 					interim = this.adders[i];
// 				} else {
// 					result = interim.intersect(this.adders[i]);
// 					interim.remove();
// 					interim = result;
// 				}
// 			}
// 			return result;
//     	}
//     	return false;
//     },
//     computeHoles: function(){
//     	if (this.holes.length) {
//     		var interim = undefined;
// 			var result = undefined;
// 			for(var i = 0; i < this.holes.length; i++){
// 				if (!interim) {
// 					interim = this.holes[i];
// 				} else {
// 					result = interim.unite(this.holes[i]);
// 					interim.remove();
// 					interim = result;
// 				}
// 			}
// 			return result;
//     	}
//     	return false;
//     },
//     computePath: function(){
//     	if (this.addTypes[this.addTypeIndex] == 'unite') {
//     		var adders = computeAddersUnite();
//     		var holes = computeHoles();
//     		var interim = adders.subtract(holes);
//     		this.computedPath = interim;
//     		adders.remove();
//     		holes.remove();
//     		interim.remove();
//     	} else if (this.addTypes[this.addTypeIndex] == 'intersect') {
//     		var adders = computeAddersIntersect();
//     		var holes = computeHoles();
//     		var interim = adders.subtract(holes);
//     		this.computedPath = interim;
//     		adders.remove();
//     		holes.remove();
//     		interim.remove();
//     	}
//     },
//     adders: [],
//     holes: [],
//     computedPath: undefined,
//     addTypes: ['unite', 'intersect'],
//     addTypeIndex: 0
// }); 
