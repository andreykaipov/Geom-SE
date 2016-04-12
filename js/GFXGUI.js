/**
  * @author Andrey Kaipov
  */

// See the source for this. It's really innovative and helped a lot.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial

"use strict";

class GFXGUI {

    constructor( gfxViewer ) {

        this.gui = new dat.GUI();

        this.gfxViewer = gfxViewer;
        this.selectedMesh = gfxViewer.selectedMesh;
        this.selectedObject = gfxViewer.selectedObject;

    }

    createGUI() {

        this.__create_GUI_scale( this.gui );
        this.__create_GUI_rotation( this.gui );
        this.__create_GUI_translation( this.gui );
        this.__create_upload_obj_file( this.gui );
        this.__create_export_obj_file( this.gui );

    }

    __create_upload_obj_file( gui ) {

        gui.add({
            uploadObj: function() {

                document.getElementById("i_file").click();

            }
        }, 'uploadObj').name( "upload an obj file" );

    }

    __create_export_obj_file( gui ) {

        let self = this;

        gui.add({
            exportObj: function() {

                let exporter = new THREE.OBJExporter();

                let objAsString = exporter.parse( self.gfxViewer.selectedObject );
                let objAsFile = new Blob( [ objAsString ], { type: "text/plain" } );
                let objFilePath = window.URL.createObjectURL( objAsFile );

                let link = document.getElementById("o_file")
                link.href = objFilePath;
                link.download = self.gfxViewer.selectedObject.name.slice(0,-4) + "_modified.obj";
                link.click()

            }
        }, 'exportObj').name( "export as obj" );

    }

    __create_GUI_scale( gui ) {

        var parameters = {
            scaleX : 1,
            scaleY : 1,
            scaleZ : 1
        };

        var scaleFolder = gui.addFolder( "Scale" );

        scaleFolder.add( parameters, 'scaleX', 1, 100 ).step(1).name( "scale x" ).onChange(
            function( value ) { gfxViewer.selectedMesh.scale.setX( value ); }
        );
        scaleFolder.add( parameters, 'scaleY', 1, 100 ).step(1).name( "scale y" ).onChange(
            function( value ) { gfxViewer.selectedMesh.scale.setY( value ); }
        );
        scaleFolder.add( parameters, 'scaleZ', 1, 100 ).step(1).name( "scale z" ).onChange(
            function( value ) { gfxViewer.selectedMesh.scale.setZ( value ); }
        );

        scaleFolder.add( {
            // Reset object scale and reset gui sliders.
            // Without the .listen() method above, the gui sliders will not visually reset !
            resetScale: function() {
                parameters.scaleX = parameters.scaleY = parameters.scaleZ = 1;
                gfxViewer.selectedMesh.scale.set( 1, 1, 1 );
            }
        }, 'resetScale' ).name( "reset scale" );

        // When an object is moved with the TransformControls (see obj_viewer.js),
        // the GUI sliders need to be visually updated, so we do that here.
        document.addEventListener( 'mousedown', updateScaleGui );

        function updateScaleGui() {
            requestAnimationFrame( updateScaleGui );
            if ( gfxViewer.selectedMesh != null ) {
                parameters.scaleX = gfxViewer.selectedMesh.scale.x;
                parameters.scaleY = gfxViewer.selectedMesh.scale.y;
                parameters.scaleZ = gfxViewer.selectedMesh.scale.z;
            }
            for ( var i in scaleFolder.__controllers )
                scaleFolder.__controllers[i].updateDisplay();
        }

    }

    __create_GUI_rotation( gui ) {
        // We need to start off with non-integer values because dat.gui is a little buggy.
        // See https://github.com/dataarts/dat.gui/issues/48 for more info.
        var parameters = {
            rotationX : 0.001,
            rotationY : 0.001,
            rotationZ : 0.001
        };

        var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );

        rotationFolder.add( parameters, 'rotationX', -Math.PI, Math.PI ).name( "rotate on x" ).onChange(
            function ( value ) { gfxViewer.selectedMesh.rotation.x = value; }
        );
        rotationFolder.add( parameters, 'rotationY', -Math.PI, Math.PI ).name( "rotate on y" ).onChange(
            function( value ) {
                gfxViewer.selectedMesh.rotation.y = value;
            }
        );
        rotationFolder.add( parameters, 'rotationZ', -Math.PI, Math.PI ).name( "rotate on z" ).onChange(
            function( value ) { gfxViewer.selectedMesh.rotation.z = value; }
        );

        // Set the sliders to start at 0. This is related to the above bug issue.
        parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;

        rotationFolder.add( {
            // Reset object rotation and reset gui sliders.
            resetRotation: function() {
                parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;
                gfxViewer.selectedMesh.rotation.set( 0, 0, 0 );
            }
        }, 'resetRotation' ).name( "reset rotation" );

        // When an object is moved with the TransformControls (see obj_viewer.js),
        // the GUI sliders need to be visually updated, so we do that here.
        document.addEventListener( 'mousedown', updateRotationGui );

        function updateRotationGui() {
            requestAnimationFrame( updateRotationGui );
            if ( gfxViewer.selectedMesh != null ) {
                parameters.rotationX = gfxViewer.selectedMesh.rotation.x;
                parameters.rotationY = gfxViewer.selectedMesh.rotation.y;
                parameters.rotationZ = gfxViewer.selectedMesh.rotation.z;
            }
            for ( var i in rotationFolder.__controllers )
            rotationFolder.__controllers[i].updateDisplay();
        }

    }

    __create_GUI_translation( gui ) {
        var parameters = {
            translationX : 0.01,
            translationY : 0.01,
            translationZ : 0.01
        };

        var translationFolder = gui.addFolder( "Translation" );

        translationFolder.add( parameters, 'translationX', -20, 20 ).name( "translate x" ).onChange(
            function ( value ) { gfxViewer.selectedMesh.position.setX( value ); }
        );
        translationFolder.add( parameters, 'translationY', -20, 20 ).name( "translate y" ).onChange(
            function( value ) { gfxViewer.selectedMesh.position.setY( value ); }
        );
        translationFolder.add( parameters, 'translationZ', -20, 20 ).name( "translate z" ).onChange(
            function( value ) { gfxViewer.selectedMesh.position.setZ( value ); }
        );

        // Set the sliders to start at 0.
        parameters.translationX = parameters.translationY = parameters.translationZ = 0;

        translationFolder.add( {
            // Reset object translation and reset gui sliders.
            resetTranslation: function() {
                parameters.translationX = parameters.translationY = parameters.translationZ = 0;
                gfxViewer.selectedMesh.position.copy( gfxViewer.selectedMesh.centroid );
                gfxViewer.selectedMesh.position.sub( gfxViewer.selectedMesh.parent.mergedCentroid );
            }
        }, 'resetTranslation' ).name( "reset translation" );

        // When an object is moved with the TransformControls (see obj_viewer.js),
        // the GUI sliders need to be visually updated, so we do that here.
        document.addEventListener( 'mousedown', updateTranslationGui );

        function updateTranslationGui() {
            requestAnimationFrame( updateTranslationGui );
            if ( gfxViewer.selectedMesh != null ) {
                parameters.translationX = gfxViewer.selectedMesh.position.x;
                parameters.translationY = gfxViewer.selectedMesh.position.y;
                parameters.translationZ = gfxViewer.selectedMesh.position.z;
            }
            for ( var i in translationFolder.__controllers )
                translationFolder.__controllers[i].updateDisplay();
        }
    }

}
/*
function createGUI() {

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    // console.log(gui);

    createGuiScale( gui );
    createGuiRotation( gui );
    createGuiTranslation( gui );
    createGuiMaterial( gui );
    createUploadObjFile( gui );
    createComputeInfo( gui );

    // Start with a collpased GUI.
    gui.close();

}

function createComputeInfo( gui ) {

    gui.add({
        computeInfo: function() {
            computeInfoForMesh( selectedMesh );
            showInfoForMesh( selectedMesh );
        }
    }, 'computeInfo').name( "compute.." );

}

function createGuiScale( gui ) {

    var parameters = {
        scaleX : 1,
        scaleY : 1,
        scaleZ : 1
    };

    var scaleFolder = gui.addFolder( "Scale" );

    scaleFolder.add( parameters, 'scaleX', 1, 100 ).step(1).name( "scale x" ).onChange(
        function( value ) { selectedMesh.scale.setX( value ); }
    );
    scaleFolder.add( parameters, 'scaleY', 1, 100 ).step(1).name( "scale y" ).onChange(
        function( value ) { selectedMesh.scale.setY( value ); }
    );
    scaleFolder.add( parameters, 'scaleZ', 1, 100 ).step(1).name( "scale z" ).onChange(
        function( value ) { selectedMesh.scale.setZ( value ); }
    );

    scaleFolder.add( {
        // Reset object scale and reset gui sliders.
        // Without the .listen() method above, the gui sliders will not visually reset !
        resetScale: function() {
            parameters.scaleX = parameters.scaleY = parameters.scaleZ = 1;
            selectedMesh.scale.set( 1, 1, 1 );
        }
    }, 'resetScale' ).name( "reset scale" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateScaleGui );

    function updateScaleGui() {
        requestAnimationFrame( updateScaleGui );
        if ( selectedMesh != null ) {
            parameters.scaleX = selectedMesh.scale.x;
            parameters.scaleY = selectedMesh.scale.y;
            parameters.scaleZ = selectedMesh.scale.z;
        }
        for ( var i in scaleFolder.__controllers )
            scaleFolder.__controllers[i].updateDisplay();
    }
}


function createGuiRotation( gui ) {

    // We need to start off with non-integer values because dat.gui is a little buggy.
    // See https://github.com/dataarts/dat.gui/issues/48 for more info.
    var parameters = {
        rotationX : 0.001,
        rotationY : 0.001,
        rotationZ : 0.001
    };

    var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );

    rotationFolder.add( parameters, 'rotationX', -Math.PI, Math.PI ).name( "rotate on x" ).onChange(
        function ( value ) { selectedMesh.rotation.x = value; }
    );
    rotationFolder.add( parameters, 'rotationY', -Math.PI, Math.PI ).name( "rotate on y" ).onChange(
        function( value ) {
            selectedMesh.rotation.y = value;
        }
    );
    rotationFolder.add( parameters, 'rotationZ', -Math.PI, Math.PI ).name( "rotate on z" ).onChange(
        function( value ) { selectedMesh.rotation.z = value; }
    );

    // Set the sliders to start at 0. This is related to the above bug issue.
    parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;

    rotationFolder.add( {
        // Reset object rotation and reset gui sliders.
        resetRotation: function() {
            parameters.rotationX = parameters.rotationY = parameters.rotationZ = 0;
            selectedMesh.rotation.set( 0, 0, 0 );
        }
    }, 'resetRotation' ).name( "reset rotation" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateRotationGui );

    function updateRotationGui() {
        requestAnimationFrame( updateRotationGui );
        if ( selectedMesh != null ) {
            parameters.rotationX = selectedMesh.rotation.x;
            parameters.rotationY = selectedMesh.rotation.y;
            parameters.rotationZ = selectedMesh.rotation.z;
        }
        for ( var i in rotationFolder.__controllers )
            rotationFolder.__controllers[i].updateDisplay();
    }
}


function createGuiTranslation( gui ) {

    var parameters = {
        translationX : 0.01,
        translationY : 0.01,
        translationZ : 0.01
    };

    var translationFolder = gui.addFolder( "Translation" );

    translationFolder.add( parameters, 'translationX', -20, 20 ).name( "translate x" ).onChange(
        function ( value ) { selectedMesh.position.setX( value ); }
    );
    translationFolder.add( parameters, 'translationY', -20, 20 ).name( "translate y" ).onChange(
        function( value ) { selectedMesh.position.setY( value ); }
    );
    translationFolder.add( parameters, 'translationZ', -20, 20 ).name( "translate z" ).onChange(
        function( value ) { selectedMesh.position.setZ( value ); }
    );

    // Set the sliders to start at 0.
    parameters.translationX = parameters.translationY = parameters.translationZ = 0;

    translationFolder.add( {
        // Reset object translation and reset gui sliders.
        resetTranslation: function() {
            parameters.translationX = parameters.translationY = parameters.translationZ = 0;
            selectedMesh.position.copy( selectedMesh.centroid );
            selectedMesh.position.sub( selectedMesh.parent.mergedCentroid );
        }
    }, 'resetTranslation' ).name( "reset translation" );

    // When an object is moved with the TransformControls (see obj_viewer.js),
    // the GUI sliders need to be visually updated, so we do that here.
    document.addEventListener( 'mousedown', updateTranslationGui );

    function updateTranslationGui() {
        requestAnimationFrame( updateTranslationGui );
        if ( selectedMesh != null ) {
            parameters.translationX = selectedMesh.position.x;
            parameters.translationY = selectedMesh.position.y;
            parameters.translationZ = selectedMesh.position.z;
        }
        for ( var i in translationFolder.__controllers )
            translationFolder.__controllers[i].updateDisplay();
    }

}


function createGuiMaterial( gui ) {

    var parameters = {
        color : 0x5c54dc,
        shading : THREE.FlatShading,
        side : THREE.DoubleSide
    }

    var constants = {
        shadingOptions : {
            "flat shading" : THREE.FlatShading,
            "smooth shading" : THREE.SmoothShading
        },
        sideOptions : {
            "front side" : THREE.FrontSide,
            "back side" : THREE.BackSide,
            "double side" : THREE.DoubleSide
        }
    };

    var materialFolder = gui.addFolder( "Material" );

    materialFolder.addColor( parameters, 'color' ).onChange(
        function( value ) {
            if ( typeof value === "string" ) {
                value = value.replace('#', '0x');
            }
            selectedMesh.material.color.setHex( value );
        }
    );

    materialFolder.add( parameters, 'shading', constants.shadingOptions ).onChange(
        function( value ) {
            if ( value === "1" ) selectedMesh.material.shading = THREE.FlatShading;
            else if ( value === "2" ) selectedMesh.material.shading = THREE.SmoothShading;

            selectedMesh.material.needsUpdate = true;
        }
    );

    materialFolder.add( parameters, 'side', constants.sideOptions ).onChange(
        function( value ) {
            if ( value === "0" ) selectedMesh.material.side = THREE.FrontSide;
            else if ( value === "1" ) selectedMesh.material.side = THREE.BackSide;
            else if ( value === "2" ) selectedMesh.material.side = THREE.DoubleSide;

            selectedMesh.material.needsUpdate = true;
        }
    );

    // Update the GUI whenever a new object is loaded, or whenever the user clicks on the canvas.
    document.getElementById("i_file").addEventListener( 'change', updateMaterialGui );
    document.addEventListener( 'mousedown', updateMaterialGui );

    // Wow the color updating was a pain to figure out.
    function updateMaterialGui() {
        if ( selectedMesh != null ) {
            parameters.color = "#" + selectedMesh.material.color.getHexString();
            parameters.shading = selectedMesh.material.shading;
            parameters.side = selectedMesh.material.side;
        }
        for ( var i in materialFolder.__controllers )
            materialFolder.__controllers[i].updateDisplay();
    }
}


function createUploadObjFile( gui ) {

    gui.add({
        uploadObj: function() {

            document.getElementById("i_file").click();

        }
    }, 'uploadObj').name( "upload an obj file" );

}
*/