/**
  * @author Andrey Kaipov
  */

/*
This web application demonstrates how we can use Three.js for 3D Graphics tasks.
Three.js is a fairly lightweight 3D library using WebGL. http://threejs.org/

to do:
- add customizable lights.
- allow camera, background, fps, etc. (i.e. little things) be customizable
- add standard geometries (cubes, spheres, etc.)
*/

// The scene is where everything is placed.
// The camera is what looks at the scene.
// The renderer will display our beautifully crafted scene.
// The mouseCameraControls allow us to move the camera around the scene with the mouse.
// The keys array is for detecting which keys have been pressed so we can get smooth camera control.
var scene, camera, renderer, keysPressedForCamera = [];

// The raycaster will take care of selecting objects.
// The mouse will be modeled as a 2D point on the user's screen.
// The loadedMeshes array holds all of our loaded meshes that our raycaster can pick from.
// The selectedMesh is the currently selected mesh of the currently selected object.
var raycaster, mouse;
var selectedMesh;
var loadedMeshes = [];

var transformControls;

// This bounding box is easier to work with if its global,
// rather than making it a child to the mesh it's designated for.
var selectedMeshBoundaryBox = new THREE.BoxHelper( new THREE.Mesh() );

init();
lights();
animate();

/* Initializes our scene, camera, renderer, and controls. */
function init() {

    // Scene.
    scene = new THREE.Scene();
    // Camera.
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
    var aspectRatio = canvasWidth / canvasHeight;
    var verticalFOV = 80; // in degrees
    var nearPlane = 0.1;
    var farPlane = 8000;
    camera = new THREE.PerspectiveCamera( verticalFOV, aspectRatio, nearPlane, farPlane );
    camera.position.set( 0, 0, 5 );
    scene.add( camera );

    // The renderer provides a place for ThreeJS to draw our scene.
    // Specifically, it provides a <canvas> element we can add to our HTML document.
    renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setClearColor( 0x3a3a3a, 1 );
    document.getElementById("graphicsContainer").appendChild( renderer.domElement );
    renderer.setSize( canvasWidth, canvasHeight );

    // These controls allow us to move around the canvas with our mouse.
    // The keyboard controls are taken care of separately as event listeners.
    var orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
    camera.controllers = {};
    camera.controllers.orbitControls = orbitControls;

    // Take care of object selection.
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();


    transformControls = new THREE.TransformControls( camera, renderer.domElement );
    transformControls.addEventListener( 'change', render );
    transformControls.visible = false;
    scene.add(selectedMeshBoundaryBox);
    scene.add(transformControls);

    // Adds debug axes centered at (0,0,0). Remember: xyz ~ rgb. Solid is positive, dashed is negative.
    createAxes( 100 );

}


/* Creates some lights and adds them to the scene. */
function lights() {

    var ambientLight = new THREE.AmbientLight( 0xffffff );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 1, 1, 1 );
    scene.add( directionalLight );

}


/* Loads our 3D Object into a container object, and returns the container. This seems kind of silly
   (because why not just return our 3D Object?), but we do this because loading is asynchronous. This might
   seem like a poor trick, but it's from mrdoob himself http://stackoverflow.com/a/22977590/4085283. */
function add3DObject( event ) {

    var file = event.target.files[0];
    var filePath = window.URL.createObjectURL( file );
    var loader = new THREE.OBJLoader();

    $.ajax({
        url: filePath,
        contentType: "text/plain",
        mimeType: 'text/plain; charset=x-user-defined',
        success: function( fileAsString ) {

            selectedMesh = null;

            var object = loader.parse( OBJParser.triangulateConvex( fileAsString ) );
            object.name = file.name;
            object.userData.filePath = filePath;
            object.userData.simpleMeshes = OBJParser.parseToSimpleMesh( fileAsString );

            applyDefaultMaterial( object );
            normalizeAndCenterGeometries( object );
            computeFaceAndVertexNormals( object );
            findMeshCounts( object );
            recognizeMeshesOfObjectForRaycasterSelection( object );
            attachTransformControlsTo( object );

            // if ( object.meshCount > 1 ) {
                var boundaryBox = new THREE.BoxHelper( new THREE.Mesh(object.mergedGeometry, null) );
                object.boundaryBox = boundaryBox;
                object.add(boundaryBox);
            // }
            // else {
            //     selectedMesh = object.children[ 0 ];
            // }

            showSelectionTextForObject( object );

            scene.add( object );

            console.log("File was read and loaded into scene successfully." +
						"\nName: " + file.name +
						"\nSize: " + file.size + " bytes" );
        }
    });

}

function attachTransformControlsTo( thing ) {

    transformControls.attach( thing );

}



function showSelectionTextForObject( object ) {

    $('#selected_obj').text( "Currently selected object: " + object.name );
    $('#obj_mesh_count').text( "Number of mesh groups in object: " + object.meshCount );
    $('#selected_mesh').text( "No mesh group currently selected." );

}

function showSelectionTextForMesh( mesh ) {

    if ( mesh.name === "" ) mesh.name = "NO GROUP NAME FOUND";

    $('#selected_obj').text( "Currently selected object: " + mesh.parent.name );
    $('#obj_mesh_count').text( "Number of mesh groups in object: " + mesh.parent.meshCount );
    $('#selected_mesh').text( "Currently selected object: " + mesh.name );

}

function computeInfoForMesh( mesh ) {

    // Find the simple mesh that corresponds to the loaded mesh in the scene.
    var correspondingSimpleMesh;
    var simpleMeshes = mesh.parent.userData.simpleMeshes;
    for ( var i = 0; i < simpleMeshes.length; i++ )
        if ( simpleMeshes[ i ].name === mesh.name )
            correspondingSimpleMesh = simpleMeshes[ i ];

    // Construct a half-edge data structure from it.
    var heMesh = new HalfEdgeMesh( correspondingSimpleMesh );
    heMesh.name = "HalfEdgeMesh for " + mesh.name;
    heMesh.build();
    heMesh.orient();

    mesh.userData.vertices = heMesh.vertices;
    mesh.userData.edges = heMesh.edges;
    mesh.userData.faces = heMesh.faces;
    mesh.userData.characteristic = heMesh.characteristic;
    mesh.userData.genus = heMesh.genus;

    console.log(heMesh);

}

function animate() {

    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame, i.e. frame count in the denominator.
    setTimeout( function() { requestAnimationFrame( animate ); }, 1000 / 30 );

    update();
    render();

}

function update() {

    updateSelectedMesh();
    updateTransformControls();

}

function updateSelectedMesh() {

    if ( selectedMesh ) {

        selectedMeshBoundaryBox.update( selectedMesh );
        transformControls.attach( selectedMesh );

    }

}

function updateTransformControls() {

    transformControls.update();

}

// Render the scene with respect to a camera.
function render() {

    renderer.render( scene, camera );

}

function glueMeshes( object ) {



}

var selectedMeshes = [];

/* ==================== EVENT LISTENERS ==================== */

(function() {

document.getElementById("i_file").addEventListener( 'change', add3DObject );

window.addEventListener( "resize", resizeCanvas );

function resizeCanvas() {

    renderer.setSize( window.innerWidth,  window.innerHeight );
    camera.aspect = window.innerWidth /  window.innerHeight;
    camera.updateProjectionMatrix();

}

// Show the bBox for the object, give it the controls, hide the selectedMesh's bBox,
// store a reference to the mesh in the scene (lol), and don't point to any mesh.
function switchFocusToObject() {

    var object = selectedMesh.parent;
    object.boundaryBox.visible = true;
    transformControls.attach( object );

    selectedMeshBoundaryBox.visible = false;
    scene.__oldSelectedMesh__ = selectedMesh;
    selectedMesh = null;

    showSelectionTextForObject( object );

}

// Restore the selectedMesh reference to the global var, and show the bBox.
function switchFocusBackToMesh() {

    selectedMesh = scene.__oldSelectedMesh__;
    selectedMeshBoundaryBox.visible = true;

    showSelectionTextForMesh( selectedMesh );

}

// Flags to keep track of how the following two events should be handled.
var gluingFlags = {
    successfullyGlued: false,
    transformControlsPressedDown: false,
    gKeyIsDown: false
}

// We don't want for the gluing to work if the user is currently dragging an object.
transformControls.addEventListener( 'mouseDown', function() { gluingFlags.transformControlsHeldDown = true; });
transformControls.addEventListener( 'mouseUp', function() { gluingFlags.transformControlsHeldDown = false; });

// This event glues the mesh back together when the shift key is held down.
// If G is also pressed, then the mesh will stay glued forever and not un-glue itself when shift is lifted.
document.getElementById("graphicsContainer").addEventListener( 'keydown', function( event ) {

    if ( event.keyCode === 71 ) { // We have to test the G key first.

        gluingFlags.gKeyIsDown = true;

    }

    // If the object is already glued together, or the transformControls are being held down, exit the listener.
    if ( gluingFlags.successfullyGlued || gluingFlags.transformControlsPressedDown ) {

        return;

    }

    if ( event.keyCode === 16 ) { // Shift key

        // This event listener should only work for objects with more than one mesh.
        if ( selectedMesh.parent.meshCount > -1 ) {

            var object = selectedMesh.parent;

            // Now glue the meshes back together by moving them to where their original center was.
            object.children.forEach( function( child ) {

                if ( child instanceof THREE.Mesh ) {

                    child.oldPosition = child.position.clone();

                    child.position.copy( child.centroid );
                    child.position.sub( object.mergedCentroid );

                }

            });

            switchFocusToObject();

            gluingFlags.successfullyGlued = true;

        }

    }

});

// This event activates only when the shiftKey is let go, and if the object is currently glued together.
document.getElementById("graphicsContainer").addEventListener( 'keyup', function( event ) {

    if ( event.keyCode === 16 && gluingFlags.gKeyIsDown ) {

        gluingFlags.successfullyGlued = false;
        gluingFlags.gKeyIsDown = false;

        return;

    }
    else if ( event.keyCode === 16 && gluingFlags.successfullyGlued ) {

        switchFocusBackToMesh();
        update();

        var object = selectedMesh.parent;
        object.boundaryBox.visible = false;

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                // child.position.add( object.mergedCentroid );
                child.position.set( child.oldPosition.x, child.oldPosition.y, child.oldPosition.z );

            }

        });

        gluingFlags.successfullyGlued = false;

    }

});

// document.getElementById("graphicsContainer").addEventListener( 'touchstart', onCanvasTouchStart );
// document.getElementById("graphicsContainer").addEventListener( 'mouseup', raycasterSelectMesh );
document.getElementById("graphicsContainer").addEventListener( 'mousedown', onCanvasMouseDown );
document.getElementById("graphicsContainer").addEventListener( 'dblclick', onCanvasMouseDown );

// Raycaster selection of objects. See the example http://mrdoob.github.io/three.js/examples/canvas_interactive_cubes.html
function onCanvasMouseDown( event ) {

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( loadedMeshes, true );

    if ( intersects.length > 0 ) {

        selectedMesh = intersects[0].object;
        var object = selectedMesh.parent;

        console.log("You selected the " + selectedMesh.name + " mesh group of the " + object.name + " object.");

        showSelectionTextForMesh( selectedMesh );

        selectedMeshBoundaryBox.visible = true;
        if ( object.boundaryBox ) object.boundaryBox.visible = false;

        // If double clicked, then focus in on the selected mesh for that cool effect.
        if ( event.type === "dblclick" ) {

            camera.lookAt( selectedMesh.position );
            camera.controllers.orbitControls.target = selectedMesh.position.clone();

        }

    }

}

// function onCanvasMouseDown( event ) {
//     start = new Date().getTime();
// }
//
// function onCanvasMouseUp( event ) {
//     if ( new Date().getTime() - start >= longPress ) {
//         alert("long press");
//     }
//     else {
//         raycasterSelectMesh( event );
//     }
// }

})();