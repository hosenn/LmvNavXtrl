var scale = 3.0529685252835925;
var yoffset = 305.5828538654896;
var xoffset = 173.35610564383717;

var HitTest = {
	activate: function(a){},
	deactivate: function(a){},
	getName: function(){return this.getNames()[0];},
	getNames: function(){return ["HitTest"];},
	handleSingleClick: function(evt){ // hanldeMouseMove
	    var normedpos = {
	    	x: evt.layerX / this.controller.domElement.clientWidth,
	    	y: evt.layerY / this.controller.domElement.clientHeight
	    };
		console.log("HitTest", this.utilities.getHitPoint(normedpos.x, normedpos.y));
		return false;
	}
};

function startHitTest() {
	// viewer3D.toolController.registerTool(HitTest);
	// viewer3D.toolController.activateTool("HitTest");

	// event bubbling
	// viewer3D.container.addEventListener("mouseover", printHitResult, false);
	viewer3D.canvasWrap.addEventListener("click", printHitResult, false);
	viewer2D.canvasWrap.addEventListener("click", printHitResult2D, false);
}

function clearHitTest() {
	// viewer3D.toolController.deregisterTool(HitTest);
	// viewer3D.toolController.deactivateTool("HitTest");

	viewer3D.canvasWrap.removeEventListener("click", printHitResult);
	viewer2D.canvasWrap.removeEventListener("click", printHitResult2D);
}

var activateToolName;
var lastClientX = 0;
var lastClientY = 0;
var lastTimestamp = 0;
var refreshInterval = 1;
var isTracking = false;
// default value, fails when viewer2D zooms
// var clientToViewer3DWorldScale = 0.5929;


function createOverlay() {
    var overlayDiv = document.createElement("div");
    overlayDiv.id = "markerlayer";
    viewer2D.container.appendChild(overlayDiv);

    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.right = "0";
    overlayDiv.style.bottom = "0";
    overlayDiv.style.zIndex = "998";
    overlayDiv.style.position = "absolute";
    // overlayDiv.style.pointerEvents = "none";

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = "8px";
    svg.style.height = "16px";
    svg.style.top = "0px";
    svg.style.left = "0px";
    svg.style.display = "none";
    svg.style.pointerEvents = "visible";
    svg.style.cursor = "pointer";
    svg.style.position = "absolute";
    svg.id = "marker";

    var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute("points", "0,16 4,0 8,16");
    arrow.style.fill = "rgb(56, 200, 56)";

    svg.appendChild(arrow);
    overlayDiv.appendChild(svg);

    svg.onmousedown = function(evt) {
    	if (evt.shiftKey) {
    		var viewport = viewer2D.navigation.getScreenViewport();
    		rotateCenter.x = this.offsetLeft + viewport.left;
    		rotateCenter.y = this.offsetTop + viewport.top;

    		viewer2D.canvasWrap.addEventListener("mousemove", rotateMarkerWithMouse, false);
			viewer2D.canvasWrap.addEventListener("mouseup", clearRotationMarker);

		} else {
	    	activateToolName = viewer2D.toolController.getActiveToolName();
			viewer2D.toolController.deactivateTool(activateToolName);
			viewer2D.getToolbar().container.style.display = "none";

			viewer3D.navigation.toPerspective();
			isTracking = true;

			this.style.left = (this.offsetLeft + markerDelta) + "px";
			this.style.top = (this.offsetTop + markerDelta) + "px";
			//rotateMarker(0);

			handleMouseDown(evt);
			viewer2D.canvasWrap.addEventListener("mousemove", hanldeMouseMove, false);
			viewer2D.canvasWrap.addEventListener("mouseup", clearTrackingTest);
    	}
    };

    // svg.onmouseup = function(evt) {
    // 	clearTrackingTest();
    // }

   	marker = document.getElementById("marker");

   	activateToolName = viewer2D.toolController.getActiveToolName();
	viewer2D.toolController.deactivateTool(activateToolName);
	viewer2D.getToolbar().container.style.display = "none";

	overlayDiv.style.cursor = 'url(data:image/png;base64,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), auto';
	overlayDiv.addEventListener("click", placeMarkerOnCanvas, false);
}

var markerDelta = 10;
var markerPosition = [0,0,0];

function placeMarkerOnCanvas(evt) {

	var viewport = viewer2D.navigation.getScreenViewport();
	var normedpos = {
        x: (evt.clientX - viewport.left) / viewport.width,
        y: (evt.clientY - viewport.top) / viewport.height
    };
    var hitPoint = viewer2D.utilities.getHitPoint(normedpos.x, normedpos.y);
    console.log(hitPoint);
    if (hitPoint == null)
    	return;

    markerPosition[0] = hitPoint.x;
    markerPosition[1]= hitPoint.y;
    markerPosition[2] = hitPoint.z;

	var left = evt.clientX - viewport.left;
	var top = evt.clientY - viewport.top;

    marker.style.left = left + "px";
    marker.style.top = top + "px";
    marker.style.display = "block";

	this.removeEventListener("click", placeMarkerOnCanvas);
	this.style.pointerEvents = "none";
	this.style.cursor = "none";	

	viewer2D.toolController.activateTool(activateToolName);
	viewer2D.getToolbar().container.style.display = "block";

    var nav = viewer3D.navigation;
	nav.toPerspective();
	var worldpos = paperToWorld(markerPosition);

	nav.setCameraUpVector(positionToVector3([0,0,1]));
	nav.setView(positionToVector3(worldpos), positionToVector3([worldpos[0]+initDirection[0],worldpos[1]+initDirection[1],worldpos[2]]));

	viewer2D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarker2D);
    viewer2D.addEventListener(Autodesk.Viewing.VIEWER_RESIZE_EVENT, updateMarker2D);

    viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarker3D);

}

function paperToWorld(position) {
    return [(position[0] - xoffset) / scale, (position[1] - yoffset) / scale, 0];
}

function worldToPaper(position) {
	return [position[0] * scale + xoffset, position[1] * scale + yoffset];
}

function clearRotationMarker(evt) {
	// var delta = [(evt.clientX - rotateCenter.x), (evt.clientY - rotateCenter.y)];
	// var length = Math.sqrt(delta[0]*delta[0] + delta[1]*delta[1]);
	// var initDirection = [100*(delta[0]/length), 100*(delta[1]/length)];

	viewer2D.canvasWrap.removeEventListener("mousemove", rotateMarkerWithMouse);	
	viewer2D.canvasWrap.removeEventListener("mouseup", clearRotationMarker);
}

function updateMarker2D() {
	var vec = positionToVector3(markerPosition);
    var newPos2D = worldToClient(vec, viewer2D.getCamera());

    marker.style.left = newPos2D.x + "px";
    marker.style.top = newPos2D.y + "px";
}

function updateMarker3D() {
	if (!isTracking) {
		var position = viewer3D.navigation.getPosition();
		var eye = viewer3D.navigation.getEyeVector();

		var paperPos = worldToPaper([position.x, position.y]);
		var newPos2D = worldToClient({x:paperPos[0], y:paperPos[1], z:markerPosition[2]}, viewer2D.getCamera());
		console.log(position, paperPos, newPos2D);
		setMarkerPostition([newPos2D.x, newPos2D.y]);

		var angle = radToDegree(angleBetween([100, 1], [eye.x, eye.y]));
		var rotatedDegree = 90 - angle;

		rotateMarker(rotatedDegree, false);
	}
}

function degreeToRad(degree) {
	return (degree) * Math.PI / 180;
}

function radToDegree(radian) {
	return (radian) * 180 / Math.PI; 
}

function setMarkerPostition(position) {
    marker.style.left = position[0] + "px";
    marker.style.top = position[1] + "px";
}

function worldToClient(position, camera) {
    var p = new THREE.Vector4();

    p.x = position.x;
    p.y = position.y;
    p.z = position.z;
    p.w = 1;

    p.applyMatrix4(camera.matrixWorldInverse);
    p.applyMatrix4(camera.projectionMatrix);

    if (p.w > 0)
    {
        p.x /= p.w;
        p.y /= p.w;
        p.z /= p.w;
    }

    var point = viewer2D.impl.viewportToClient(p.x, p.y);
    point.x = Math.floor(point.x) + 0.5;
    point.y = Math.floor(point.y) + 0.5;

    return point;
}

function rotateMarkerWithMouse(evt){

    var radians = Math.atan2(evt.clientX - rotateCenter.x, evt.clientY - rotateCenter.y);
    var degree = (radians * (180 / Math.PI) * -1) + 90; 

    rotatedDegree = degree;

    rotateMarker(degree, true);
}

var marker;

var rotateCenter = {};
var rotatedDegree = 0;

var initDirection = [0, 100];

function startTrackingTest() {

	createOverlay();
	
	// activateToolName = viewer2D.toolController.getActiveToolName();
	// viewer2D.toolController.deactivateTool(activateToolName);
	// viewer2D.getToolbar().container.style.display = "none";

	// viewer3D.navigation.toPerspective();
	// // viewer3D.setFOV(80);
	// isTracking = false;

	// viewer2D.canvasWrap.addEventListener("mousedown", handleMouseDown, false);
	// viewer2D.canvasWrap.addEventListener("mousemove", hanldeMouseMove, false);
	// viewer2D.canvasWrap.addEventListener("mouseup", handleMouseUp, false);
}

function clearTrackingTest() {

	viewer2D.toolController.activateTool(activateToolName);
	viewer2D.getToolbar().container.style.display = "block";

	// viewer3D.navigation.toOrthographic();
	isTracking = false;

	// viewer2D.canvasWrap.removeEventListener("mousedown", handleMouseDown, false);
	viewer2D.canvasWrap.removeEventListener("mousemove", hanldeMouseMove, false);
	viewer2D.canvasWrap.removeEventListener("mouseup", clearTrackingTest, false);
}

function handleMouseDown(evt) {
	var estimatedpos = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");
		
	viewer3D.navigation.setCameraUpVector(positionToVector3([0,0,1]));
	viewer3D.navigation.setView(positionToVector3(estimatedpos), positionToVector3([estimatedpos[0]+initDirection[0],estimatedpos[1]+initDirection[1],estimatedpos[2]]));

	isTracking = true;

	lastClientX = evt.clientX;
	lastClientY = evt.clientY;
	lastTimestamp = Date.now();
}

function hanldeMouseMove(evt) {

	if (isTracking) {

		var deltaX = evt.clientX - lastClientX;
		var deltaY = evt.clientY - lastClientY;

		var currentTimestamp = Date.now();
		var currentDirection = calcDirection(evt.clientX, evt.clientY);
		lastClientX = evt.clientX;
		lastClientY = evt.clientY;

		if (currentTimestamp - lastTimestamp > refreshInterval) {
			var estimatedpos = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");			

			// // var clientDistance = Math.sqrt(Math.pow(evt.clientX-lastClientX,2) + Math.pow(evt.clientY-lastClientY,2));
			// // var worldDistance = Math.sqrt(Math.pow(estimatedpos[0]-lastWorldX,2) + Math.pow(estimatedpos[1]-lastWorldY,2));
			// var deltaX = (evt.clientX-lastClientX) * clientToViewer3DWorldScale;
			// var deltaY = (lastClientY-evt.clientY) * clientToViewer3DWorldScale;// canvas and client XY are opposite
			// var estimatedpos = [lastWorldX+deltaX, lastWorldY+deltaY, 0];
			
			// var direction = calcDirection([(evt.clientX-lastClientX)*100, (lastClientY-evt.clientY)*100, 0]);
			// console.log(currentDirection);

			if (autoUpdateDirection)
				var target = positionToVector3([estimatedpos[0]+currentDirection[0], estimatedpos[1]+currentDirection[1], estimatedpos[2]]);
			else
				var target = positionToVector3([estimatedpos[0]+initDirection[0], estimatedpos[1]+initDirection[1], estimatedpos[2]]);

			viewer3D.navigation.setPosition(positionToVector3(estimatedpos));
			viewer3D.navigation.setTarget(target);
			// viewer3D.navigation.setTarget(positionToVector3([estimatedpos[0], estimatedpos[1]+100, 0]));
			// viewer3D.navigation.setView(positionToVector3(estimatedpos), target);

			lastTimestamp = Date.now();

			// console.log("Ortho Scale", viewer2D.getCamera().orthoScale);
		}

		marker.style.left = (marker.offsetLeft + deltaX ) + "px";
		marker.style.top = (marker.offsetTop + deltaY ) + "px";
	}
}

var dVar = 100;
var autoDirectionMap = [
	// 0: [dVar, 0],
	// 1: [dVar, dVar],
	// 2: [dVar, dVar],
	// 3: [0, dVar],
	// 4: [0, dVar],
	// 5: [-1*dVar, dVar],
	// 6: [-1*dVar, dVar],
	// 7: [-1*dVar, 0],
	// 8: [-1*dVar, 0],
	// 9: [-1*dVar, -1*dVar],
	// 10: [-1*dVar, -1*dVar],
	// 11: [0, -1*dVar],
	// 12: [0, -1*dVar],
	// 13: [dVar, -1*dVar],
	// 14: [dVar, -1*dVar],
	// 15: [dVar, 0]
	{direction: [dVar, 0], angle: 0},
	{direction: [dVar, dVar], angle: 45},
	{direction: [dVar, dVar], angle: 45},
	{direction: [0, dVar], angle: 90},
	{direction: [0, dVar], angle: 90},
	{direction: [-1*dVar, dVar], angle: 135},
	{direction: [-1*dVar, dVar], angle: 135},
	{direction: [-1*dVar, 0], angle: 180},
	{direction: [-1*dVar, 0], angle: 180},
	{direction: [-1*dVar, -1*dVar], angle: 225},
	{direction: [-1*dVar, -1*dVar], angle: 225},
	{direction: [0, -1*dVar], angle: 270},
	{direction: [0, -1*dVar], angle: 270},
	{direction: [dVar, -1*dVar], angle: 315},
	{direction: [dVar, -1*dVar], angle: 315},
	{direction: [dVar, 0], angle: 0}
];

var autoUpdateDirection = true;
var lastDirection = [0, dVar];
var lastIndex = -99;
var successCount = -1;
var successSteps = 3;

function calcDirection(clientX, clientY) {
	var clientDelta = [(clientX-lastClientX)*100, (lastClientY-clientY)*100];
	var rad = angleBetween(lastDirection, clientDelta);
	if (rad < Math.PI/4)
		return lastDirection;

	var angle = angleBetween([1,0], clientDelta);
	var index = Math.floor(angle/(Math.PI/8));

	if ((index%2 === 0 && lastIndex === index - 1) || (index%2 !== 0 && lastIndex === index + 1) ||
		(index === lastIndex) || (index === 0 && lastIndex === 15) || (index === 15 && lastIndex === 0))
		successCount += 1;
	else
		successCount = 0;
	lastIndex = index;

	if (successCount >= successSteps) {
		lastDirection = autoDirectionMap[index].direction;
		if(autoUpdateDirection)
			rotateMarker(90-autoDirectionMap[index].angle, false);
	}
	return lastDirection;
}

function angleBetween(v1, v2) {
	var length1 = Math.sqrt(v1[0]*v1[0]+v1[1]*v1[1]);
	var length2 = Math.sqrt(v2[0]*v2[0]+v2[1]*v2[1]);
	if (length1 === 0 || length2 === 0)
		return 0;
	var angle1 = Math.acos(v1[0]/length1);
	var angle2 = Math.acos(v2[0]/length2);
	if (v1[1] < 0)
		angle1 = 2*Math.PI - angle1;
	if (v2[1] < 0)
		angle2 = 2*Math.PI - angle2;

	return Math.abs(angle1-angle2);
}

function handleMouseUp(evt) {
	isTracking = false;
}

function rotateMarker(degree, updateViewer) {
	console.log("Rotating marker by: ",  degree);
	// var degree = (radians * (180 / Math.PI) * -1) + 90; 
	marker.style.webkitTransform = 'rotate('+degree+'deg)';
	marker.style.MozTransform = 'rotate('+degree+'deg)';
	marker.style.msTransform = 'rotate('+degree+'deg)';
	marker.style.OTransform = 'rotate('+degree+'deg)';
	marker.style.transform = 'rotate('+degree+'deg)';

	var angle = (90 - degree) * Math.PI / 180;
	initDirection = [100*Math.cos(angle), 100*Math.sin(angle)];

	if (updateViewer) {
		var pos = viewer3D.navigation.getPosition();
		var t = positionToVector3([pos.x+initDirection[0], pos.y+initDirection[1], pos.z]);
		viewer3D.navigation.setTarget(t);
	}
}

function printHitResult(evt) {
	getHitTest(evt.clientX, evt.clientY, viewer3D, "3D");
}

function printHitResult2D(evt) {
	var estimatedpos = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");
	clickToShow(estimatedpos);
}

function getHitTest(x, y, viewer, prompt) {
	var viewport = viewer.navigation.getScreenViewport();
    var normedpos = {
        x: (x - viewport.left) / viewport.width,
        y: (y - viewport.top) / viewport.height
    };
    var worldpos = viewer.utilities.getHitPoint(normedpos.x, normedpos.y);
    var estimatedpos;
    if (worldpos) {
    	// console.log(prompt, normedpos, worldpos);
    } else {
    	worldpos = viewer.navigation.getWorldPoint(normedpos.x, normedpos.y);
    	// console.log("Hit missed, world point", normedpos, worldpos);
    }

    if (prompt === "3D") {
		var estimatedpos = [worldpos.x * scale + xoffset, worldpos.y * scale + yoffset, -1];
		// console.log("estimated 2D position", estimatedpos);
	}
	else {
		var estimatedpos = [(worldpos.x - xoffset) / scale, (worldpos.y - yoffset) / scale, 0];
		// console.log("estimated 3D position", estimatedpos);
	}

	return estimatedpos;
}

function clickToShow(worldpos) {

	var nav = viewer3D.navigation;
	nav.toPerspective();

	nav.setCameraUpVector(positionToVector3([0,0,1]));
	nav.setView(positionToVector3(worldpos), positionToVector3([worldpos[0],56,0]));
}