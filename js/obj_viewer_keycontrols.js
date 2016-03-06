updateCameraFromKeyboard();

// Click on the graphicsContainer to focus on it so that the following event listeners can work,
// and typing in the CodeMirror text boxes doesn't interfere.
document.getElementById("graphicsContainer").addEventListener( 'click', function(event) {
    document.getElementById("graphicsContainer").focus();
});

/* These are the keyboard controls for the camera. They reference the mouse camera controls. */
function updateCameraFromKeyboard() {
    // Get the vector representing the direction in which the camera is looking.
    var dirVector = camera.getWorldDirection().multiplyScalar(0.10);

    if (keysPressedForCamera[87]) { // W
        camera.position.add( dirVector );
        camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[83]) { // D
        camera.position.sub( dirVector );
        camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[65]) { // A
        camera.position.sub( dirVector.cross( new THREE.Vector3( 0, 1, 0) ) );
        camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[68]) { // D
        camera.position.add( dirVector.cross( new THREE.Vector3( 0, 1, 0) ) );
        camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[70]) {
        camera.position.sub( new THREE.Vector3(0, 0.1, 0) );
        // camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[82]) {
        camera.position.add( new THREE.Vector3(0, 0.1, 0) );
        // camera.lookAt( mouseCameraControls.target = camera.getWorldDirection() );
    }
    else if (keysPressedForCamera[90])
    {
        camera.position.set( 0, 0, 5 );
        mouseCameraControls.target.set( 0, 0, 0 );
        camera.lookAt( 0, 0, 0 );
    }

    camera.updateProjectionMatrix();

    if (selectedObjectControls) selectedObjectControls.update();
    window.requestAnimationFrame(updateCameraFromKeyboard);
}

document.getElementById("graphicsContainer").addEventListener( 'keyup', function(event) {
    keysPressedForCamera[event.keyCode] = false;
});

document.getElementById("graphicsContainer").addEventListener( 'keydown', function(event) {

    // The camera controls are taken care of outside of this event listener,
    // because we want for the camera controls to be smooth and continuous.
    keysPressedForCamera[event.keyCode] = true;

    // These are the keyboard options that allow us to update the transform controls of an object.
    switch ( event.keyCode ) {
        case 48: // 0
            // What's the difference between local and world space?
            selectedObjectControls.setSpace( objectControls.space === "local" ? "world" : "local" );
            break;
        case 49: // 1
            selectedObjectControls.setMode( "translate" );
            break;
        case 50: // 2
            selectedObjectControls.setMode( "rotate" );
            break;
        case 51: // 3
            selectedObjectControls.setMode( "scale" );
            break;

        case 187: // =/+ key
        case 107: // numpad +
            selectedObjectControls.setSize( selectedObjectControls.size + 0.1 );
            break;
        case 189: // -/_ key
        case 109: // numpad -
            selectedObjectControls.setSize( Math.max( selectedObjectControls.size - 0.1, 0.1 ) );
            break;

        case 17: // CTRL key
            // Toggle snap-to-grid for the selectedObject.
            var objectControls = scene.getObjectByName("Controller for " + selectedObject.id);
            if ( objectControls.translationSnap == null && objectControls.rotationSnap == null) {
                objectControls.setTranslationSnap( 1 );
                objectControls.setRotationSnap( THREE.Math.degToRad(15) );
            }
            else {
                objectControls.setTranslationSnap( null );
                objectControls.setRotationSnap( null );
            }

        case 72: // H
            // Toggle visibility of selected object controls
            selectedObjectControls.visible = (selectedObjectControls.visible ? false : true);
    }

});
