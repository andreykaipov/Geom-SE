function createGUI() {

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    // We need to start off with non-integer values because dat.gui is a little buggy.
    // See https://github.com/dataarts/dat.gui/issues/48 for more info.
    guiControls = new function() {
        this.rotationX = 0.001;
        this.rotationY = 0.001;
        this.rotationZ = 0.001;

        this.scaleX = 1;
        this.scaleY = 1;
        this.scaleZ = 1;

        this.baseColor = 0x515a6e;
        this.shading = null; // just a place-holder ...
    };


    // Scale folder.
    var scaleFolder = gui.addFolder( "Scale" );
    scaleFolder.add( guiControls, 'scaleX', 0, 50 ).step(0.5).name( "scale x" );
    scaleFolder.add( guiControls, 'scaleY', 0, 50 ).step(0.5).name( "scale y" );
    scaleFolder.add( guiControls, 'scaleZ', 0, 50 ).step(0.5).name( "scale z" );
    scaleFolder.add( {
        resetScale: function() {
            guiControls.scaleX = 1;
            guiControls.scaleY = 1;
            guiControls.scaleZ = 1;
        }
    }, 'resetScale' ).name( "reset scale" );


    // Rotation folder.
    var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );
    rotationFolder.add( guiControls, 'rotationX', 0, 2 * Math.PI ).name( "rotate on x" ).listen();
    rotationFolder.add( guiControls, 'rotationY', 0, 2 * Math.PI ).name( "rotate on y" ).listen();
    rotationFolder.add( guiControls, 'rotationZ', 0, 2 * Math.PI ).name( "rotate on z" ).listen();
        // Set the sliders to start at 0. This is related to the above bug issue.
        guiControls.rotationX = guiControls.rotationY = guiControls.rotationZ = 0;
    rotationFolder.add(
    {
        resetRotation: function() {
            guiControls.rotationX = 0;
            guiControls.rotationY = 0;
            guiControls.rotationZ = 0;
        }
    }, 'resetRotation' ).name( "reset rotation" );


    // Material folder!
    var materialFolder = gui.addFolder( "Material" );
    materialFolder.addColor( guiControls, 'baseColor' ).onChange( updateColor() );
    var shadingOptions = {
        "THREE.FlatShading" : THREE.FlatShading,
    	"THREE.SmoothShading" : THREE.SmoothShading
    }
    materialFolder.add( guiControls, 'shading', shadingOptions ).onChange( updateShading() );


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
