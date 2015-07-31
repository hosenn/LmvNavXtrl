
var viewModels = [
    { id: "racsimple", label: "Revit House", urn: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE1LTA3LTE2LTIxLTIwLTEzLW1hdHZ6ZW05MmJjdW9xNnJlZ2R0Y2RudXYyd2svcmFjX2Jhc2ljX3NhbXBsZV9wcm9qZWN0LnJ2dA=="},
    { id: "racadvanced", label: "Revit School", urn: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE1LTA3LTI5LTIxLTEwLTQzLXdxbWpzN3FyZXN0dGtxYXV3NGdxa3phanZoZG8vcmFjX2FkdmFuY2VkX3NhbXBsZV9wcm9qZWN0LnJ2dA=="}
];

var currentModel = 0;

var viewer3D;
var viewer2D;

document.addEventListener("DOMContentLoaded", function(event) { 

    var getToken =  function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'http://' + window.location.host + '/api/token', false);
        xhr.send(null);

        var res = JSON.parse(xhr.responseText);
        return res.access_token;               
    }

    function initialize() {
        var options = {
            env: "AutodeskProduction",
            getAccessToken: getToken,
            refreshToken: getToken
        };

        Autodesk.Viewing.Initializer(options, function () {
            
            var viewer3DContainer = document.getElementById("viewer3D");
            viewer3D = new Autodesk.Viewing.Private.GuiViewer3D(viewer3DContainer, {});

            var viewer2DContainer = document.getElementById("viewer2D");
            viewer2D = new Autodesk.Viewing.Private.GuiViewer3D(viewer2DContainer, {});

            // var retCode = viewer.initialize();
            // if (retCode !== 0) {
            //     alert("ERROR: Couldn't initialize main viewer!");
            //     console.log("ERROR Code: " + retCode);      // TBD: do real error handling here
            // }

            // viewer3D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
            //     initializePanel();
            // });

            viewer2D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
                initializeMarker();

                viewer2D.getToolbar().container.style.display = "none";
                viewer3D.getToolbar().container.style.left = "0%";
            });

            viewer3D.start();
            viewer2D.start();

            viewer3D.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {        
                if (_blockEventSecondary)
                    return;
                _blockEventMain = true;
                viewer2D.select(viewer3D.getSelection());
                _blockEventMain = false;
            });

            viewer2D.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
                if (_blockEventMain)
                    return;
                _blockEventSecondary = true;
                viewer3D.select(viewer2D.getSelection()); 
                _blockEventSecondary = false;
            });

            loadDocument(viewModels[currentModel].urn);
        });
    }

    initialize();
    initializeControlPanel();

});

var _blockEventMain = false;
var _blockEventSecondary = false;

function loadDocument (urnStr, callback) {
    var urn = "urn:" + urnStr;

    Autodesk.Viewing.Document.load(urn,

        function (document) {
            var geometryItems3D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'3d'}, true);
            var geometryItems2D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'2d'}, true);
            //console.log(geometryItems2D);
            viewer3D.load(document.getViewablePath(geometryItems3D[0]), null, function () {if (callback) callback();});
            viewer2D.load(document.getViewablePath(geometryItems2D[0]));
        },

        // onErrorCallback
        function (msg) {
            console.log("Error loading document: " + msg);
        }
    );
}