var marker;
var activateToolName;

var isTracking = false;
var isRotating = false;

var lastClientX = 0;
var lastClientY = 0;
var lastTimestamp = 0;
var refreshInterval = 1;

var unitDistance = 100;
var defaultDirection = [0, unitDistance];
var autoDirectionMap = [
	{direction: [unitDistance, 0], angle: 0},
	{direction: [unitDistance, unitDistance], angle: 45},
	{direction: [unitDistance, unitDistance], angle: 45},
	{direction: [0, unitDistance], angle: 90},
	{direction: [0, unitDistance], angle: 90},
	{direction: [-1*unitDistance, unitDistance], angle: 135},
	{direction: [-1*unitDistance, unitDistance], angle: 135},
	{direction: [-1*unitDistance, 0], angle: 180},
	{direction: [-1*unitDistance, 0], angle: 180},
	{direction: [-1*unitDistance, -1*unitDistance], angle: 225},
	{direction: [-1*unitDistance, -1*unitDistance], angle: 225},
	{direction: [0, -1*unitDistance], angle: 270},
	{direction: [0, -1*unitDistance], angle: 270},
	{direction: [unitDistance, -1*unitDistance], angle: 315},
	{direction: [unitDistance, -1*unitDistance], angle: 315},
	{direction: [unitDistance, 0], angle: 0}
];

var rotateCenter = {};
var rotatedDegree = 0;

var autoUpdateDirection = true;
var lastDirection = [0, unitDistance];
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
			marker.rotate(90-autoDirectionMap[index].angle, 'deg');
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


function disableViewerCanvas(viewer) {
   	activateToolName = viewer.toolController.getActiveToolName();
	viewer.toolController.deactivateTool(activateToolName);
	viewer.getToolbar().container.style.display = "none";

	if (viewer.viewCubeUi.homeViewContainer) {
		viewer.viewCubeUi.infoButton.style.display = "none";
		// viewer.viewCubeUi.homeViewContainer.style.display = "none";
		viewer.displayViewCube(false, true);	//hide viewcube and update preference
	}
}

function enableViewerCanvas(viewer) {
	if (activateToolName) {
		viewer.toolController.activateTool(activateToolName);
		activateToolNameactivateToolName = null;
		viewer.getToolbar().container.style.display = "block";
	}

	if (viewer.viewCubeUi.homeViewContainer) {
		viewer.viewCubeUi.infoButton.style.display = "block";
		// viewer.viewCubeUi.homeViewContainer.style.display = "block";
		viewer.displayViewCube(true, true);
	}
}

function handleMarkerMousedown(evt) {
	disableViewerCanvas(viewer2D);
	viewer3D.navigation.toPerspective();
	if (evt.shiftKey) {
		var viewport = viewer2D.navigation.getScreenViewport();
		rotateCenter.x = this.offsetLeft + viewport.left;
		rotateCenter.y = this.offsetTop + viewport.top;

		isRotating = true;
		isTracking = false;

	} else {
		isTracking = true;
		isRotating = false;

		marker.translate(marker.delta);
		updateCameraToMarker();
	}
		
	viewer2D.canvasWrap.addEventListener("mousemove", handleCanvasMousemove, false);
	viewer2D.canvasWrap.addEventListener("mouseup", handleCanvasMouseup, false);

	lastClientX = evt.clientX;
	lastClientY = evt.clientY;
	lastTimestamp = Date.now();
}

function handleCanvasMousemove(evt) {
	if (isTracking) {
		var deltaX = evt.clientX - lastClientX;
		var deltaY = evt.clientY - lastClientY;

		var currentTimestamp = Date.now();
		var currentDirection = calcDirection(evt.clientX, evt.clientY);
		lastClientX = evt.clientX;
		lastClientY = evt.clientY;

		if (currentTimestamp - lastTimestamp > refreshInterval) {
			//var estimatedpos = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");			
			var viewport = viewer2D.navigation.getScreenViewport();
		    var normedPoint = {
		        x: (evt.clientX - viewport.left) / viewport.width,
		        y: (evt.clientY - viewport.top) / viewport.height
		    };
		    var hitPoint = viewer2D.utilities.getHitPoint(normedPoint.x, normedPoint.y);
		    if (hitPoint == null)
		    	hitPoint = viewer2D.navigation.getWorldPoint(normedPoint.x, normedPoint.y);

		    var estimatedpos = paperToWorld(hitPoint);

		    // console.log("currentDirection: ", currentDirection);

			if (autoUpdateDirection)
				var target = positionToVector3([estimatedpos.x+currentDirection[0], estimatedpos.y+currentDirection[1], estimatedpos.z]);
			else
				var target = positionToVector3([estimatedpos.x+defaultDirection[0], estimatedpos.y+defaultDirection[1], estimatedpos.z]);


			viewer3D.navigation.setPosition(positionToVector3(estimatedpos));
			viewer3D.navigation.setTarget(target);

			lastTimestamp = Date.now();

			// console.log("Ortho Scale", viewer2D.getCamera().orthoScale);
		}

		marker.translate(deltaX, deltaY);

	} else if (isRotating) {
    	var radians = Math.atan2(evt.clientX - rotateCenter.x, evt.clientY - rotateCenter.y);
    	var degree = (radians * (180 / Math.PI) * -1) + 90; 
    	
    	rotatedDegree = degree;
    	marker.rotate(degree, 'deg');

    	console.log("rotate: ", degree, radians);
    	var angle = (90 - degree) * Math.PI / 180;

    	rotateCameraWithMarker([100*Math.cos(angle), 100*Math.sin(angle)]);
	}
}

function handleCanvasMouseup(evt) {
	isTracking = false;
	isRotating = false;
	viewer2D.canvasWrap.removeEventListener("mousemove", handleCanvasMousemove);
	viewer2D.canvasWrap.removeEventListener("mouseup", handleCanvasMouseup);
	enableViewerCanvas(viewer2D);
}

function initializeMarker() {
	marker = new Marker(viewer2D.container);
	marker.marker.addEventListener("mousedown", handleMarkerMousedown, false);

	disableViewerCanvas(viewer2D);
	marker.layer.addEventListener("click", placeMarkerOnCanvas, false);
	marker.displayCursor(true);
}

function placeMarkerOnCanvas(evt) {
	var viewport = viewer2D.navigation.getScreenViewport();
	var normedPoint = {
        x: (evt.clientX - viewport.left) / viewport.width,
        y: (evt.clientY - viewport.top) / viewport.height
    };
    var hitPoint = viewer2D.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    console.log(hitPoint);
    if (hitPoint == null)
    	return;

    marker.position.x = hitPoint.x;
    marker.position.y = hitPoint.y;
    marker.position.z = hitPoint.z;

    marker.setPositionOnCanvas(evt.clientX - viewport.left, evt.clientY - viewport.top);
	marker.displayCursor(false);
	marker.showMarker();

	this.removeEventListener("click", placeMarkerOnCanvas);
	enableViewerCanvas(viewer2D);
	updateCameraToMarker();

	viewer2D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerOnCanvas2D);
    viewer2D.addEventListener(Autodesk.Viewing.VIEWER_RESIZE_EVENT, updateMarkerOnCanvas2D);
    
    viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
}

function updateMarkerOnCanvas2D() {
	var vec = positionToVector3(marker.position);
    var newPos2D = projectToClient(vec, viewer2D.getCamera());
    marker.setPositionOnCanvas(newPos2D.x, newPos2D.y);
}

function updateCameraToMarker() {
    var nav = viewer3D.navigation;
	nav.toPerspective();

	var upVec = positionToVector3([0,0,1]);
	nav.setCameraUpVector(upVec);

	var viewport = viewer2D.navigation.getScreenViewport();
    var normedPoint = {
        x: marker.marker.offsetLeft / viewport.width,
        y: marker.marker.offsetTop / viewport.height
    };
    var hitPoint = viewer2D.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    if (hitPoint == null)
    	hitPoint = viewer2D.navigation.getWorldPoint(normedPoint.x, normedPoint.y);

    var worldpos = paperToWorld(hitPoint);

	// nav.setView(positionToVector3(worldpos), positionToVector3(targetpos));
	nav.setPosition(positionToVector3(worldpos));

	var targetpos = [worldpos.x+defaultDirection[0],worldpos.y+defaultDirection[1],worldpos.z];
	nav.setTarget(positionToVector3(targetpos));
}

function rotateCameraWithMarker(direction) {
	var pos = viewer3D.navigation.getPosition();
	var t = positionToVector3([pos.x+direction[0], pos.y+direction[1], pos.z]);
	viewer3D.navigation.setTarget(t);
}

function moveCameraWithMarker() {

}

function updateMarkerToCamera() {

	if (isTracking || isRotating)
		return;

	var position = viewer3D.navigation.getPosition();
	var eye = viewer3D.navigation.getEyeVector();

	var paperPos = worldToPaper(position);
	var newPos2D = projectToClient(paperPos, viewer2D.getCamera());

	marker.setPositionOnCanvas(newPos2D.x, newPos2D.y);

	var angle = (angleBetween([100, 1], [eye.x, eye.y])) * 180 / Math.PI;
	var rotatedDegree = 90 - angle;

	marker.rotate(rotatedDegree);
}


function Marker(container) {

	var overlayDiv = document.createElement("div");
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.right = "0";
    overlayDiv.style.bottom = "0";
    overlayDiv.style.zIndex = "998";
    overlayDiv.style.position = "absolute";
    overlayDiv.id = "markerlayer";

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.width = "8px";
    svg.style.height = "16px";
    svg.style.top = "0px";
    svg.style.left = "0px";
    svg.style.display = "none";
    svg.style.position = "absolute";
    svg.style.pointerEvents = "visible";
    svg.style.cursor = "pointer";
    svg.id = "marker";

    var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute("points", "0,16 4,0 8,16");
    arrow.style.fill = "rgb(56, 200, 56)";

    svg.appendChild(arrow);
    overlayDiv.appendChild(svg);
    container.appendChild(overlayDiv);

    this.marker = svg;
    this.layer = overlayDiv;
	this.position = {x:0, y:0, z:0};
	this.delta = 10;

	this.getCursor = function() {
		return 'url(data:image/png;base64,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), auto';
	};

	this.displayCursor = function(display) {
		if (display) {
			this.layer.style.pointerEvents = "auto";
			this.layer.style.cursor = this.getCursor();
		}
		else {
			this.layer.style.pointerEvents = "none";
			this.layer.style.cursor = "none";
		}
	};

	this.hideMarker = function() {
		this.marker.style.display = "none";
	};

	this.showMarker = function() {
		this.marker.style.display = "block";
	};
}

Marker.prototype.rotate = function(angle, unit) {
	unit = unit || 'deg';
	// console.log("rotate marker by 	" + angle + unit);
	this.marker.style.webkitTransform = 'rotate('+angle+unit+')';
	this.marker.style.MozTransform = 'rotate('+angle+unit+')';
	this.marker.style.msTransform = 'rotate('+angle+unit+')';
	this.marker.style.OTransform = 'rotate('+angle+unit+')';
	this.marker.style.transform = 'rotate('+angle+unit+')';
};

Marker.prototype.translate = function(translateX, translateY) {
	var newOffsetLeft = this.marker.offsetLeft + translateX;
	var newOffsetTop = this.marker.offsetTop + translateY;
	this.marker.style.left = newOffsetLeft + "px";
	this.marker.style.top = newOffsetTop + "px";
};

Marker.prototype.setPositionOnCanvas = function(offsetLeft, offsetTop) {
	this.marker.style.left = offsetLeft + "px";
	this.marker.style.top = offsetTop + "px";
};
	

var scale = 3.0529685252835925;
var yoffset = 305.5828538654896;
var xoffset = 173.35610564383717;
var paperZ = 0;

function paperToWorld(position) {
    return {x:(position.x - xoffset) / scale, y:(position.y - yoffset) / scale, z:0};
}

function worldToPaper(position) {
	return {x:position.x * scale + xoffset, y:position.y * scale + yoffset, z:paperZ};
}

function projectToClient(position, camera) {
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

function positionToVector3(position) {
	var x = parseFloat(position[0] || position.x);
	var y = parseFloat(position[1] || position.y);
	var z = parseFloat(position[2] || position.z);
    return new THREE.Vector3(x, y, z);
}

