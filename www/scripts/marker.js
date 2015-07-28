var marker;
var activateToolName;

var lastFloorIndex = 0;
var currentFloorIndex = 0;

var lastPosition;
var STABLELIMIT = 1;

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
		activateToolName = null;
		// viewer.getToolbar().container.style.display = "block";
	}

	if (viewer.viewCubeUi.homeViewContainer) {
		viewer.viewCubeUi.infoButton.style.display = "block";
		// viewer.viewCubeUi.homeViewContainer.style.display = "block";
		viewer.displayViewCube(true, true);
	}
}

function initializeMarker() {
	marker = new Marker(viewer2D.container, viewer2D.container.getBoundingClientRect().left, viewer2D.container.getBoundingClientRect().top);
	
	viewer2D.setViewFromViewBox(viewboxes[0].box);
	disableViewerCanvas(viewer2D);
	
	marker.hideMarker();
	marker.addEventListenerOnMarker("canvasclick", placeMarkerOnCanvas);
	marker.toggleCanvas(true);
}

function placeMarkerOnCanvas(evt) {

	var offsetLeft = evt.clientX - viewer2D.navigation.getScreenViewport().left;
	var offsetTop = evt.clientY - viewer2D.navigation.getScreenViewport().top;

	marker.setPosition(offsetLeft, offsetTop);
	marker.showMarker();
	marker.removeEventListenerOnMarker("canvasclick", placeMarkerOnCanvas);
	marker.toggleCanvas(false);
	enableViewerCanvas(viewer2D);

	marker.addEventListenerOnMarker("markerdown", startTracking);
	// marker.addEventListenerOnMarker("markerdrag", trackMarker);
	// marker.addEventListenerOnMarker("markerup", stopTracking);

	updateCameraToMarker();

	var updateMarkerOnCanvas = function() {
		var position = viewer3D.navigation.getPosition();
		var paperPos = worldToPaper(position);
		if (paperPos) {
			var newPos2D = projectToViewport(paperPos.pos, viewer2D.getCamera());
	    	marker.setPosition(newPos2D.x, newPos2D.y);
	    }
	}

	viewer2D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerOnCanvas);
    viewer2D.addEventListener(Autodesk.Viewing.VIEWER_RESIZE_EVENT, updateMarkerOnCanvas);

    viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
    
}

function startTracking(evt) {
	marker.addEventListenerOnMarker("markerdrag", trackMarker);
	marker.addEventListenerOnMarker("markerup", stopTracking);

	disableViewerCanvas(viewer2D);
	viewer3D.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
	lastPosition = null;
	updateCameraToMarker(false, false);
}

function trackMarker(evt) {
	if (marker.isTracking)
		updateCameraToMarker(false, false);
	else if (marker.isRotating)
		updateCameraToMarker(true, false);
}

function stopTracking(evt) {
	marker.removeEventListenerOnMarker("markerdrag", trackMarker);
	marker.removeEventListenerOnMarker("markerup", stopTracking);

	enableViewerCanvas(viewer2D);
	viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkerToCamera);
}

function updateCameraToMarker(skipPosition, skipTarget) {
    var nav = viewer3D.navigation;
	nav.toPerspective();

	var up = positionToVector3([0,0,1]);
	nav.setCameraUpVector(up);

	if (!(skipPosition)) {

		var position = marker.getPosition();
		var viewport = viewer2D.navigation.getScreenViewport();
	    var normedPoint = {
	        x: position.x / viewport.width,
	        y: position.y / viewport.height
	    };
	    var worldPos = clientToWorld(normedPoint);
	    if (worldPos) {
	    		// for stablility
	    	if (lastPosition) {
	    		worldPos.x = Math.abs(worldPos.x - lastPosition.x) < STABLELIMIT ? lastPosition.x : worldPos.x;
	    		worldPos.y = Math.abs(worldPos.y - lastPosition.y) < STABLELIMIT ? lastPosition.y : worldPos.y;
	    	}
	    	//console.log("update camera position ", position);
	    	nav.setPosition(positionToVector3(worldPos));
	    	lastPosition = worldPos;
	    } 
	    // else return;
	}

	if (!(skipTarget)) {
		var position = viewer3D.navigation.getPosition();
		var direction = marker.getDirection();
		// console.log("update camera target ", direction);
		viewer3D.navigation.setTarget(positionToVector3([position.x+direction[0], position.y+direction[1], position.z]));
	}
}

function updateMarkerToCamera() {
	if (marker.isTracking() || marker.isRotating())
		return;

	var position = viewer3D.navigation.getPosition();
	var eye = viewer3D.navigation.getEyeVector();
	marker.setDirection([eye.x, eye.y]);

	var paperPos = worldToPaper(position);
	if (paperPos) {
		var newPos2D = projectToViewport(paperPos.pos, viewer2D.getCamera());
		marker.setPosition(newPos2D.x, newPos2D.y);
		currentFloorIndex = paperPos.boxIndex;
		if (currentFloorIndex != lastFloorIndex) {
			viewer2D.setViewFromViewBox(viewboxes[currentFloorIndex].box);
		}

		lastFloorIndex = currentFloorIndex;
	}
}


function Marker(container, containerLeft, containerTop) {

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
    // svg.style.display = "none";
    svg.style.position = "absolute";
    svg.style.pointerEvents = "visible";
    svg.style.cursor = "pointer";
    svg.id = "marker";

    var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute("points", "0,16 4,0 8,16");
    arrow.style.fill = "rgb(196, 20, 26)";

    svg.appendChild(arrow);
    overlayDiv.appendChild(svg);
    container.appendChild(overlayDiv);

    this.marker = svg;
    this.layer = overlayDiv;


	function rotateMarker(angle, unit) {
		unit = unit || 'deg';
		svg.style.webkitTransform = 'rotate('+angle+unit+')';
		svg.style.MozTransform = 'rotate('+angle+unit+')';
		svg.style.msTransform = 'rotate('+angle+unit+')';
		svg.style.OTransform = 'rotate('+angle+unit+')';
		svg.style.transform = 'rotate('+angle+unit+')';
	};

	function translateBy(translateX, translateY) {
		var newOffsetLeft = this.marker.offsetLeft + translateX;
		var newOffsetTop = this.marker.offsetTop + translateY;
		svg.style.left = newOffsetLeft + "px";
		svg.style.top = newOffsetTop + "px";
	};

	function translateTo(translateX, translateY) {
		svg.style.left = translateX + "px";
		svg.style.top = translateY + "px";
	};


	var isRotating = false;
	var isTracking = false;
	var DELTA = 10;

	var lastClientX = 0;
	var lastClientY = 0;
	var lastTimestamp = 0;
	var REFRESHINTERVAL = 0;

	var directionMap = new DirectionMap();
	var autoUpdateDirection = true;
	var shouldGeneralizeDirection = true;

	var ANGLETOLERANCE = Math.PI/8;
	var SUCCESSIVELIMIT = 1;
	var successiveCount = 0;
	var successiveChange = "";

	var externalEvtHandlers = {
		"canvasclick": [],
		"markerdown": [],
		"markerdrag": [],
		"markerup": []
	};

	function callExtHandler(eventName, evt) {
		var extHandler = externalEvtHandlers[eventName];
		for (var i = 0; i < extHandler.length; i++) {
			var cb = extHandler[i];
			cb(evt);
		};
	}

	var onmarkerdrag= function(evt) {
		var currentTimestamp = Date.now();
		if (currentTimestamp - lastTimestamp > REFRESHINTERVAL) {
			if (isTracking) {
				var deltaX = evt.clientX - lastClientX;
				// var deltaY = evt.clientY - lastClientY;
				var deltaY = lastClientY - evt.clientY; // mouse Y coord system opposite to viewer
				translateTo(evt.clientX-containerLeft, evt.clientY-containerTop);

				if (autoUpdateDirection) {
					var newDirection = [deltaX, deltaY];
					var deviate = Math.abs(directionMap.angleBetween(directionMap.currentDirection, newDirection));
					
					if (deviate > ANGLETOLERANCE && successiveCount >= SUCCESSIVELIMIT) {
						if (shouldGeneralizeDirection) {
							directionMap.currentDirection = directionMap.generalizeDirection(newDirection).vector;
						} else {
							directionMap.currentDirection = directionMap.normalizeDirection(newDirection);
						}
						var angleToxAxis = directionMap.angleBetween(directionMap.currentDirection, [1,0]);
						rotateMarker((Math.PI/2 - angleToxAxis), 'rad');

						successiveCount = 0;
						successiveChange = "";

					} else if (deviate > ANGLETOLERANCE) {
						var d = directionMap.generalizeDirection(newDirection);
						if (d.name === successiveChange) {
							successiveCount += 1;
						}
						else {
							successiveCount = 0;
							successiveChange = d.name;
						}
					} else {
						successiveCount = 0;
						successiveChange = "";
					}
				}

			} else if (isRotating) {
				var d = directionMap.calcMouseDirection(evt.clientX, evt.clientY);
				directionMap.currentDirection = d;
				
				var angleToxAxis = directionMap.angleBetween(d, [1,0]);
				rotateMarker((Math.PI/2 - angleToxAxis), 'rad');
			}

			lastClientX = evt.clientX;
			lastClientY = evt.clientY;

			callExtHandler("markerdrag", evt);
		}
		lastTimestamp = currentTimestamp;
	};

	var onmarkerup = function(evt) {
		isTracking = false;
		isRotating = false;

		overlayDiv.style.pointerEvents = "none";
		overlayDiv.removeEventListener("mousemove", onmarkerdrag);
		overlayDiv.removeEventListener("mouseup", onmarkerup);
		
		callExtHandler("markerup", evt);
	};

	svg.onmousedown = function(evt) {
		if (evt.shiftKey) {
			isRotating = true;
			isTracking = false;

			directionMap.setRotateCenter(evt.clientX, evt.clientY);
			//directionMap.setRotateCenter(pageLeft + this.offsetLeft, pageTop + this.offsetTop);

		} else {
			isRotating = false;
			isTracking = true;

			translateBy(DELTA);
		}

		overlayDiv.style.pointerEvents = "auto";
		overlayDiv.style.cursor = "auto";
		overlayDiv.addEventListener("mousemove", onmarkerdrag, false);
		overlayDiv.addEventListener("mouseup", onmarkerup, false);

		lastClientX = evt.clientX;
		lastClientY = evt.clientY;
		lastTimestamp = Date.now();

		callExtHandler("markerdown", evt);
	};

	var oncanvasclick = function(evt) {
		callExtHandler("canvasclick", evt);
	}

	var getCursor = function() {
		return 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAXCAYAAAA7kX6CAAAAAXNSR0IArs4c6QAAATVJREFUOBGNlEFOw0AMRT2e0JaSQjdRBWsQe8oFECsQKgu4AefiFhyim56DLRvECoF/FFczP5PASJbt8X+JMl8TkYG1k+Z8K83FwFh0YKAfos+fok82L2qKmyauDoI+IFCXHl4EX0TqWvQagfq/YNhIc6tBpgjUBgaGS2+MM9VHF3Z19N5zCawWP/HGBV3d+84e+CrLy3kIZw6ixp73nhnUlUw2PvTc7WXarDFhVQe9c8DzUdB7zLxHzkAc/ULiOhWgPpZ4xbakYGtDDDJhEHtsSwpmNjDMtqRgZgODbMseZBsYZFscLNrAcGqLg5Udec8GBjtNa0sL4qhP7MhZyL3ZsnZbAO5vAwu5T20BOGoDw24LwFEbGHRbcEHnFvhFnFpEi7H1bcN3izeAiEOLvyCTtAvw1y8BCCQKGvhlGAAAAABJRU5ErkJggg==), auto';
	};

	this.toggleCanvas = function(activate) {
		if (activate) {
			this.layer.style.pointerEvents = "auto";
			this.layer.style.cursor = getCursor();
			this.layer.addEventListener("click", oncanvasclick, false);
		}
		else {
			this.layer.style.pointerEvents = "none";
			this.layer.style.cursor = "none";
			this.layer.removeEventListener("click", oncanvasclick);
		}
	};

	this.getDirectionMap = function() {
		return directionMap;
	};

	this.alignMarkerDirection = function() {
		var angleToxAxis = directionMap.angleBetween(directionMap.currentDirection, [1,0]);
		rotateMarker((Math.PI/2 - angleToxAxis), 'rad');	
	};

	this.isTracking = function() {
		return isTracking;
	};

	this.isRotating = function() {
		return isRotating;
	};

	this.getExtHandler = function() {
		return externalEvtHandlers;
	};
}

Marker.prototype.hideMarker = function() {
	this.marker.style.display = "none";
};

Marker.prototype.showMarker = function() {
	this.marker.style.display = "block";
};

Marker.prototype.getPosition = function() {
	return {x:this.marker.offsetLeft, y:this.marker.offsetTop};
};

Marker.prototype.getDirection = function() {
	return this.getDirectionMap().currentDirection;
};

Marker.prototype.setPosition = function(offsetLeft, offsetTop) {
	this.marker.style.left = offsetLeft + "px";
	this.marker.style.top = offsetTop + "px";
};

Marker.prototype.setDirection = function(newDirection) {
	var directionMap = this.getDirectionMap();
	directionMap.currentDirection = directionMap.normalizeDirection(newDirection);
	this.alignMarkerDirection();
};

Marker.prototype.addEventListenerOnMarker = function(eventName, callFunc) {
	var externalEvtHandler = this.getExtHandler();
	if (eventName in externalEvtHandler)
		externalEvtHandler[eventName].push(callFunc);
};

Marker.prototype.removeEventListenerOnMarker = function(eventName, callFunc) {
	var externalEvtHandler = this.getExtHandler();
	if (eventName in externalEvtHandler) {
		var callFuncs = externalEvtHandler[eventName];
		for (var i = 0; i < callFuncs.length; i++) {
			if (callFunc === callFuncs[i]) {
				callFuncs.splice(i, 1);
				break;
			}
		}
	}
};


function DirectionMap(direction) {
	var normLen = 300;
	this.getNormLen = function() {return normLen;};
	this.currentDirection = direction || [0, normLen];

	this.rotateCenter = {x:0, y:0};
	this.generalizedDirections = [
		{name:'EAST',		vector:[normLen, 0],							xDeg:0	},
		{name:'NORTHEAST',	vector:[0.7071 * normLen, 0.7071 * normLen],	xDeg:45 },
		{name:'NORTH',		vector:[0, normLen],							xDeg:90	},
		{name:'NORTHWEST',	vector:[-0.7071 * normLen, 0.7071 * normLen],	xDeg:135},
		{name:'WEST',		vector:[-1 * normLen, 0],						xDeg:180},
		{name:'SOUTHWEST',	vector:[-0.7071 * normLen, -0.7071 * normLen],	xDeg:225},
		{name:'SOUTH',		vector:[0, -1 * normLen],						xDeg:270},
		{name:'SOUTHEAST',	vector:[0.7071 * normLen, -0.7071 * normLen],	xDeg:315},
	];
}

DirectionMap.prototype.angleBetween = function(d1, d2) {
	var length1 = Math.sqrt(d1[0]*d1[0]+d1[1]*d1[1]);
	var length2 = Math.sqrt(d2[0]*d2[0]+d2[1]*d2[1]);
	if (length1 === 0 || length2 === 0)
		return 0;
	var angle1 = Math.acos(d1[0]/length1);
	var angle2 = Math.acos(d2[0]/length2);
	if (d1[1] < 0)
		angle1 = 2*Math.PI - angle1;
	if (d2[1] < 0)
		angle2 = 2*Math.PI - angle2;

	//return Math.abs(angle1-angle2);
	return angle1-angle2;
};

DirectionMap.prototype.normalizeDirection = function(d, normLen) {
	var length = Math.sqrt(d[0]*d[0]+d[1]*d[1]);
	normLen = normLen || this.getNormLen();
	return [normLen*(d[0]/length), normLen*(d[1]/length)];
};

DirectionMap.prototype.generalizeDirection = function(d) {
	var angleToxAxis = Math.abs(this.angleBetween(d, [1,0]));
	var index = Math.floor(angleToxAxis/(Math.PI/8));

	if (index === 15 || index === 0) {
		return this.generalizedDirections[0];
	} else if (index%2 == 0){
		return this.generalizedDirections[index/2];
	} else {
		return this.generalizedDirections[Math.ceil(index/2)];
	}
};

DirectionMap.prototype.setRotateCenter = function(clientX, clientY) {
	this.rotateCenter.x = clientX;
	this.rotateCenter.y = clientY;
};

DirectionMap.prototype.calcMouseDirection = function(clientX, clientY) {
	// var	subVec = [clientX-this.rotateCenter.x, clientY-this.rotateCenter.y];
	var	subVec = [clientX-this.rotateCenter.x, this.rotateCenter.y-clientY];
	return this.normalizeDirection(subVec);
};


var viewboxes = [
	{box: [61.30275909098552 , 572.8253921735151, 411.29704813713875, 251.63262845992332], floor: 0}, 
	// {box: [426.01228910438573, 572.8253921735151, 718.0903793548525, 251.63262845992332], floor: 1}
	{box: [411.29704813713875, 572.8253921735151, 718.0903793548525, 251.63262845992332], floor: 1}, 
];

var floorHeight = 10;
var floorBase = -5;

var scale = 3.0529685252835925;
var yoffset = 305.5828538654896;
var xoffset = 173.35610564383717;
var paperZ = -0.8462999999999852;

// var floorZ = 0;
// var floorChangeX = 426.01228910438573;
// var floorChangeOffsetWidth = -349.99428904615326;

function getPaperViewBox(point) {
	for (var i = viewboxes.length - 1; i >= 0; i--) {
		var viewbox = viewboxes[i].box;
		if (point.x >= viewbox[0] && point.x <= viewbox[2] &&
			point.y >= viewbox[3] && point.y <= viewbox[1]) {
			return viewboxes[i];
		}
	};

	return null;
}

function worldToPaper(position) {
	var paperPos = {x:position.x * scale + xoffset, y:position.y * scale + yoffset, z:paperZ};

	var floor = Math.floor((position.z - floorBase) / floorHeight);
	floor = floor < 0 ? 0 : floor;
	floor = floor >= viewboxes.length ? viewboxes.length - 1 : floor;
	var viewbox = viewboxes[floor];
	var xoffsetBox = viewbox.box[0] - viewboxes[0].box[0];
    var yoffsetBox = viewbox.box[1] - viewboxes[0].box[1];

    paperPos.x += xoffsetBox;
    paperPos.y += yoffsetBox;

	if (paperPos.x < viewbox.box[0] || paperPos.x > viewbox.box[2] ||
		paperPos.y > viewbox.box[1] || paperPos.y < viewbox.box[3]) {
		return null;
	}
	else {
		return {pos:paperPos, boxIndex:floor};
	}
}

function clientToWorld(normedPoint) {
	var paperPos = clientToPaper(normedPoint);
	var viewbox = getPaperViewBox(paperPos);
    if (viewbox == null)
    	return null;

	var xoffsetBox = viewbox.box[0] - viewboxes[0].box[0];
    var yoffsetBox = viewbox.box[1] - viewboxes[0].box[1];

    return {x:(paperPos.x - xoffset - xoffsetBox) / scale, y:(paperPos.y - yoffset - yoffsetBox) / scale, z:(viewbox.floor * floorHeight) + (floorHeight/2 + floorBase)};
}

function clientToPaper(normedPoint) {
    var hitPoint = viewer2D.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    if (hitPoint == null) {
    	hitPoint = viewer2D.navigation.getWorldPoint(normedPoint.x, normedPoint.y);
    }

    return hitPoint;
}

function projectToViewport(position, camera) {
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

