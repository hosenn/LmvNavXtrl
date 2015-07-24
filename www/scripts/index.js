/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

var defaultUrn = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE1LTA3LTE2LTIxLTIwLTEzLW1hdHZ6ZW05MmJjdW9xNnJlZ2R0Y2RudXYyd2svcmFjX2Jhc2ljX3NhbXBsZV9wcm9qZWN0LnJ2dA==";

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
            viewer3D.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function (event) {
                initializePanel();
            });

            viewer3D.start();
            viewer2D.start();

            var urn = "urn:" + defaultUrn;
            Autodesk.Viewing.Document.load(urn,

                function (document) {
                    var geometryItems3D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'3d'}, true);
                    var geometryItems2D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'2d'}, true);
                    //console.log(geometryItems2D);
                    viewer3D.load(document.getViewablePath(geometryItems3D[0]));
                    viewer2D.load(document.getViewablePath(geometryItems2D[0]));
                },

                // onErrorCallback
                function (msg) {
                    console.log("Error loading document: " + msg);
                }
            );
        });
    }

    initialize();

});
