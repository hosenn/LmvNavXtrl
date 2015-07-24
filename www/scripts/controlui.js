
function initializePanel() {
	var nav = viewer3D.navigation;
	var controlPanel = document.getElementsByClassName("control-panel")[0];
	
	var navBar = createTitle("Navigation");
	navBar.style.textAlign = "center";
	navBar.style.fontSize = "17px";
	navBar.style.margin = "20px 0px";
	controlPanel.appendChild(navBar);

	controlPanel.appendChild(createTitle("Position"));
	controlPanel.appendChild(createRow(0, nav.getPosition(), "Position"));

	controlPanel.appendChild(createTitle("Target"));
	controlPanel.appendChild(createRow(0, nav.getTarget(), "Target"));

	controlPanel.appendChild(createTitle("Up"));
	controlPanel.appendChild(createRow(0, nav.getCameraUpVector(), "Up"));

	controlPanel.appendChild(createTitle("Right"));
	controlPanel.appendChild(createRow(0, nav.getCameraRightVector(), "Right"));

	controlPanel.appendChild(createTitle("WorldUp"));
	controlPanel.appendChild(createRow(0, nav.getWorldUpVector(), "WorldUp"));
	
	controlPanel.appendChild(createTitle("WorldRight"));
	controlPanel.appendChild(createRow(0, nav.getWorldRightVector(), "WorldRight"));

	controlPanel.appendChild(createTitle("Pivot"));
	controlPanel.appendChild(createRow(0, nav.getPivotPoint(), "Pivot"));

	controlPanel.appendChild(createTitle("FOV"));
	controlPanel.appendChild(createRow(1, [nav.getFovMin(), nav.getFovMax(), viewer3D.getFOV()], "FOV"));

	controlPanel.appendChild(createRow(2, nav.getVerticalFov(), "VerticalFOV"));
	controlPanel.appendChild(createRow(2, nav.getHorizontalFov(), "HorizontFOV"));
	controlPanel.appendChild(createRow(2, nav.getFocalLength(), "FocalLength"));

	controlPanel.appendChild(createTitle("ViewBox2D"));
	controlPanel.appendChild(createRow(3, 0, "ViewBox2D"));

    viewer3D.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateAll);
}

function createTitle(textValue) {
	var title = document.createElement("div");
	title.className = "control-title";
	title.innerHTML = textValue + ":";
	return title;
}

function createRow(rowType, initVal, inputid) {
	if (rowType === 0) {
		var row = document.createElement("div");
		row.className = "control-row";
		createTextInput("x", initVal['x'], inputid+"x", row);
		createTextInput("y", initVal['y'], inputid+"y", row);
		createTextInput("z", initVal['z'], inputid+"z", row);
		return row;
	} else if (rowType === 1) {
		var row = document.createElement("div");
		row.className = "control-row";
		createSlider(initVal[2], initVal[0], initVal[1], inputid, row);
		return row;
	} else if (rowType === 2){
		var row = document.createElement("div");
		row.className = "control-row";
		row.style.textAlign = "left";
		row.style.fontSize = "15px";
		createTextInput(inputid, initVal, inputid, row);
		return row;
	} else {
		var row = document.createElement("div");
		row.className = "control-row";
		row.style.textAlign = "left";
		row.style.fontSize = "15px";

		createTextInput("minX", 0, "minX", row);
		createTextInput("minY", 0, "minY", row);
		createTextInput("maxX", 0, "maxX", row);
		createTextInput("maxY", 0, "maxY", row);

		return row;
	}
}

function createTextInput(labelName, initVal, inputid, row) {
	var textField = document.createElement("input");
    textField.type = "text";
    textField.className = "control-input";
    textField.style.width = "40px";
    textField.value = initVal;
    if (inputid)
    	textField.id = inputid;
    textField.onkeydown = handleKeyDown;
    //textField.addEventListener("keydown", setInputValue);
	var preLabel = document.createElement("label");
	if (inputid)
		preLabel.htmlFor = textField.id;
	preLabel.innerHTML = labelName + ":";
	preLabel.className = "control-label";

	row.appendChild(preLabel);
	row.appendChild(textField);
}

function createSlider(initVal, min, max, inputid, row) {
	var slider = document.createElement("input");
	slider.type = "range";
    if (inputid)
		slider.id = inputid;
    slider.min = min;
    slider.max = max;
    slider.value = initVal;

    var minLabel = document.createElement("label");
	if (inputid)
		minLabel.htmlFor = slider.id;
	minLabel.innerHTML = min;
	minLabel.className = "control-label";

	var maxLabel = document.createElement("label");
	if (inputid)
		maxLabel.htmlFor = slider.id;
	maxLabel.innerHTML = max;
	maxLabel.className = "control-label";

	var valueLabel = document.createElement("label");
	if (inputid)
		valueLabel.htmlFor = slider.id;
	valueLabel.innerHTML = "   " + Math.round(parseFloat(initVal)*100)/100;;
	valueLabel.className = "control-label";

	slider.onchange = function() {
		valueLabel.innerHTML = Math.round(parseFloat(this.value)*100)/100;
		viewer3D.setFOV(parseFloat(this.value));
    };

    row.appendChild(minLabel);
    row.appendChild(slider);
    row.appendChild(maxLabel);
    row.appendChild(valueLabel);
}

var unitStep = 1;

function handleKeyDown(e) {
	if (e.keyCode == 13) {
		var property = this.id.substring(0, this.id.length-1);
		setInputValue(property);

	} else if (e.keyCode == 38) {
		e.preventDefault();

		var currentVal = parseFloat(this.value);
		this.value = currentVal + unitStep;
		var property = this.id.substring(0, this.id.length-1);
		setInputValue(property);


	} else if (e.keyCode == 40) {
		e.preventDefault();

		var currentVal = parseFloat(this.value);
		this.value = currentVal - unitStep;

		var property = this.id.substring(0, this.id.length-1);
		setInputValue(property);
	}
}

function setInputValue(property) {
	if (property === "min" || property === "max") {
		var viewbox = new Array(4);
		viewbox[0] = parseInt(document.getElementById("minX").value);
		viewbox[1] = parseInt(document.getElementById("minY").value);
		viewbox[2] = parseInt(document.getElementById("maxX").value);
		viewbox[3] = parseInt(document.getElementById("maxY").value);

		viewer2D.setViewFromViewBox(viewbox);
		return;
	}


	var nav = viewer3D.navigation;

	var coord = ['x', 'y', 'z'];
	var position = [];
	for (var i = 0; i < coord.length; i++) {
		var elemId = property + coord[i];
		if (document.getElementById(elemId))
			position.push(document.getElementById(elemId).value);
	};

	// console.log("Update Value: ", property, position);
	switch (property) {
		case "Position":
		nav.setPosition(positionToVector3(position));
		break;
		case "Target":
		nav.setTarget(positionToVector3(position));
		break;
		case "Up":
		nav.setCameraUpVector(positionToVector3(position));
		break;
		case "Right":
		// nav.setCameraRightVector(positionToVector3(position));
		break;
		case "WorldUp":
		nav.setWorldUpVector(positionToVector3(position));
		break;
		case "WorldRight":
		nav.setWorldRightVector(positionToVector3(position));
		break;

		case "Pivot":
		nav.setPivotPoint(positionToVector3(position));
		break;

		default:
		break;
	}		
}

// function positionToVector3(position) {
//     return new THREE.Vector3(parseFloat(position[0]), parseFloat(position[1]), parseFloat(position[2]));
// }

function updateAll() {
	var nav = viewer3D.navigation;

	var properties = ["Position", "Target", "Up", "Right", "WorldUp", "WorldRight", "Pivot"];
	for (var i = properties.length - 1; i >= 0; i--) {
		var propertyVal;
		switch (properties[i]) {
			case "Position":
			propertyVal = nav.getPosition();
			break;
			case "Target":
			propertyVal = nav.getTarget();
			break;
			case "Up":
			propertyVal = nav.getCameraUpVector();
			break;
			case "Right":
			propertyVal = nav.getCameraRightVector();
			break;
			case "WorldUp":
			propertyVal = nav.getWorldUpVector();
			break;
			case "WorldRight":
			propertyVal = nav.getWorldRightVector();
			break;

			default:
			propertyVal = nav.getPivotPoint();
		}
		var coord = ['x', 'y', 'z'];
		for (var j = coord.length - 1; j >= 0; j--) {
			var elemId = properties[i] + coord[j];
			document.getElementById(elemId).value = propertyVal[coord[j]];
		};
	};

	var slider = document.getElementById("FOV");
	slider.value = viewer3D.getFOV();
	slider.nextSibling.nextSibling.innerHTML = Math.round(viewer3D.getFOV() * 100)/100;
	document.getElementById("VerticalFOV").value = nav.getVerticalFov();
	document.getElementById("HorizontFOV").value = nav.getHorizontalFov();
	document.getElementById("FocalLength").value = nav.getFocalLength();
}
