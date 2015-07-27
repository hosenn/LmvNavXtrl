var HitTest = {
	activate: function(a){},
	deactivate: function(a){},
	getName: function(){return this.getNames()[0];},
	getNames: function(){return ["HitTest"];},
	getCursor: function(){return "pointer";},
	handleSingleClick: function(evt){
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

function getHitTest(x, y, viewer, prompt) {
	var viewport = viewer.navigation.getScreenViewport();
    var normedPoint = {
        x: (x - viewport.left) / viewport.width,
        y: (y - viewport.top) / viewport.height
    };
    var hitPoint = viewer.utilities.getHitPoint(normedPoint.x, normedPoint.y);
    if (hitPoint) {
    	console.log(prompt, normedPoint, hitPoint);
    } else {
    	hitPoint = viewer.navigation.getWorldPoint(normedPoint.x, normedPoint.y);
    	console.log("Hit missed, world point", normedPoint, hitPoint);
    }
}

function printHitResult(evt) {
	getHitTest(evt.clientX, evt.clientY, viewer3D, "3D");
}

function printHitResult2D(evt) {
	var estimatedpos = getHitTest(evt.clientX, evt.clientY, viewer2D, "2D");
}

