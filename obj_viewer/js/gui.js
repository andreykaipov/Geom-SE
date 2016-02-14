// See the source for this. It's really innovative and helped a lot.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial

createGUI();

function createGUI() {

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    createGuiScale( gui );
    createGuiRotation( gui );
    createGuiTranslation( gui );
    createGuiMaterial( gui );
    createTriangulation( gui );

    // Start with a collpased GUI.
    gui.close();

}


function createGuiScale( gui ) {

    var data = {
        scaleX : 1,
        scaleY : 1,
        scaleZ : 1
    };

    var scaleFolder = gui.addFolder( "Scale" );

    scaleFolder.add( data, 'scaleX', 1, 100 ).step(1).name( "scale x" ).listen().onChange(
        function( value ) { objContainer.scale.setX( value ); }
    );
    scaleFolder.add( data, 'scaleY', 1, 100 ).step(1).name( "scale y" ).listen().onChange(
        function( value ) { objContainer.scale.setY( value ); }
    );
    scaleFolder.add( data, 'scaleZ', 1, 100 ).step(1).name( "scale z" ).listen().onChange(
        function( value ) { objContainer.scale.setZ( value ); }
    );

    scaleFolder.add( {
        // Reset object scale and reset gui sliders.
        // Without the .listen() method above, the gui sliders will not visually reset !
        resetScale: function() {
            data.scaleX = data.scaleY = data.scaleZ = 1;
            objContainer.scale.set( 1, 1, 1 );
        }
    }, 'resetScale' ).name( "reset scale" );

}


function createGuiRotation( gui ) {

    // We need to start off with non-integer values because dat.gui is a little buggy.
    // See https://github.com/dataarts/dat.gui/issues/48 for more info.
    var data = {
        rotationX : 0.001,
        rotationY : 0.001,
        rotationZ : 0.001
    };

    var translationFolder = gui.addFolder( "Rotation (clockwise in radians)" );

    translationFolder.add( data, 'rotationX', 0, 2 * Math.PI ).name( "rotate on x" ).listen().onChange(
        function ( value ) { objContainer.rotation.x = value; }
    );
    translationFolder.add( data, 'rotationY', 0, 2 * Math.PI ).name( "rotate on y" ).listen().onChange(
        function( value ) { objContainer.rotation.y = value; }
    );
    translationFolder.add( data, 'rotationZ', 0, 2 * Math.PI ).name( "rotate on z" ).listen().onChange(
        function( value ) { objContainer.rotation.z = value; }
    );

    // Set the sliders to start at 0. This is related to the above bug issue.
    data.rotationX = data.rotationY = data.rotationZ = 0;

    translationFolder.add( {
        // Reset object rotation and reset gui sliders.
        resetRotation: function() {
            data.rotationX = data.rotationY = data.rotationZ = 0;
            objContainer.rotation.set( 0, 0, 0 );
        }
    }, 'resetRotation' ).name( "reset rotation" );

}


function createGuiTranslation( gui ) {

    var data = {
        translationX : 0,
        translationY : 0,
        translationZ : 0
    };

    var translationFolder = gui.addFolder( "Translation" );

    translationFolder.add( data, 'translationX', -20, 20 ).step(1).name( "translate x" ).listen().onChange(
        function ( value ) { objContainer.position.setX( value ); }
    );
    translationFolder.add( data, 'translationY', -20, 20 ).step(1).name( "translate y" ).listen().onChange(
        function( value ) { objContainer.position.setY( value ); }
    );
    translationFolder.add( data, 'translationZ', -20, 20 ).step(1).name( "translate z" ).listen().onChange(
        function( value ) { objContainer.position.setZ( value ); }
    );

    translationFolder.add( {
        // Reset object translation and reset gui sliders.
        resetTranslation: function() {
            data.translationX = data.translationY = data.translationZ = 0;
            objContainer.position.set( 0, 0, 0 );
        }
    }, 'resetTranslation' ).name( "reset translation" );

}


function createGuiMaterial( gui ) {

    var data = {
        side : THREE.DoubleSide,
        baseColor : 0x5c54dc,
        shading : THREE.FlatShading
    }

    var constants = {
        sideOptions : {
            "front side" : THREE.FrontSide,
            "back side" : THREE.BackSide,
            "double side" : THREE.DoubleSide
        },

        shadingOptions : {
            "flat shading" : THREE.FlatShading,
            "smooth shading" : THREE.SmoothShading
        }
    };

    var materialFolder = gui.addFolder( "Material" );

    materialFolder.addColor( data, 'baseColor' ).onChange(
        updateColor( loadedObjectMaterial.color )
    );

    materialFolder.add( data, 'shading', constants.shadingOptions ).onFinishChange(
        updateShading( loadedObjectMaterial )
    );

    materialFolder.add( data, 'side', constants.sideOptions ).onFinishChange(
        updateSide( loadedObjectMaterial )
    );

}


function createTriangulation( gui ) {

    gui.add( {
        triangulate: function() {

            var fileReader = new FileReader();

            fileReader.onload = function( event ) {

                var fileAsString = event.target.result;
                var triangulatedFileAsString = triangulate( fileAsString );
                var triangulatedFile = new Blob( [ triangulatedFileAsString ], { type: "text/plain" } );
                var newFilePath = window.URL.createObjectURL( triangulatedFile );

                triangulated = true;
                console.log( "File was triangulated successfully." +
                             "\nThe new size is " + triangulatedFile.size + " bytes.");

                loadedObject = create3DObject( newFilePath, window.file.name, loadedObjectMaterial );
                scene.add( loadedObject );

                var download_link = document.getElementById("download_link");
                download_link.style.display = "inline";
                download_link.download = window.file.name.slice(0,-4) + "_triangulated.obj";
                download_link.href = newFilePath;

                document.getElementById("download_hreaker").style.display="block";

            };
            fileReader.readAsText( window.file );

        }
    }, 'triangulate').name( "triangulate!" )

}


function getTriangulationButton() {
    var guiButtons = gui.getElementsByClassName("property-name");
    var triangulationButton;
    for ( var i = 0; i < guiButtons.length; i++ ) {
        if ( guiButtons[i].innerHTML === "triangulate!" )
            triangulationButton = guiButtons[i];
    };
    return triangulationButton;
}
