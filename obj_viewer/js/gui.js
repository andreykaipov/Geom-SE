// See the source for this. It's really innovative and helped a lot.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial

createGUI();

function createGUI() {

    constants = {
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

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    createGuiScale( gui );
    createGuiRotation( gui );
    createGuiMaterial( gui );

    // Clear button.
    gui.add(
    {
        clearObjects: function() {
            var objs = scene.children;
            for ( var i = objs.length - 1; i >= 0; i-- ) {
                obj = objs[ i ];
                if ( obj.deletable === true )
                    scene.remove( obj );
            }
        }
    }, 'clearObjects').name( "clear objects" );


    // Start with a collpased GUI.
    gui.close();

}


function createGuiScale( gui ) {

    // We need to start off with non-integer values because dat.gui is a little buggy.
    // See https://github.com/dataarts/dat.gui/issues/48 for more info.
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

    var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );

    rotationFolder.add( data, 'rotationX', 0, 2 * Math.PI ).name( "rotate on x" ).listen().onChange(
        function( value ) { objContainer.rotation.set( value, 0, 0 ); }
    );
    rotationFolder.add( data, 'rotationY', 0, 2 * Math.PI ).name( "rotate on y" ).listen().onChange(
        function( value ) { objContainer.rotation.set( 0, value, 0 ); }
    );
    rotationFolder.add( data, 'rotationZ', 0, 2 * Math.PI ).name( "rotate on z" ).listen().onChange(
        function( value ) { objContainer.rotation.set( 0, 0, value ); }
    );
            // Set the sliders to start at 0. This is related to the above bug issue.
            data.rotationX = data.rotationY = data.rotationZ = 0;

    rotationFolder.add( {
        // Reset object rotation and reset gui sliders.
        resetRotation: function() {
            data.rotationX = data.rotationY = data.rotationZ = 0;
            objContainer.rotation.set( 0, 0, 0 );
        }
    }, 'resetRotation' ).name( "reset rotation" );

}


function createGuiMaterial( gui ) {

    var data = {
        side : THREE.DoubleSide,
        baseColor : 0x5c54dc,
        shading : THREE.FlatShading
    }

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
