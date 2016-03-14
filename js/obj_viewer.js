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
var scene, camera, renderer, mouseCameraControls, keysPressedForCamera = [];

// The raycaster will take care of selecting objects.
// The mouse will be modeled as a 2D point on the user's screen.
// The loadedMeshes array holds all of our loaded meshes that our raycaster can pick from.
// The selectedMesh is the currently selected mesh of the currently selected object.
var raycaster, mouse, selectedMesh
var loadedMeshes = [];

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
    renderer.setClearColor( 0x010101, 0.1 );
    document.getElementById("graphicsContainer").appendChild( renderer.domElement );
    renderer.setSize( canvasWidth, canvasHeight );

    // These controls allow us to move around the canvas with our mouse.
    // The keyboard controls are taken care of separately as event listeners.
    mouseCameraControls = new THREE.OrbitControls( camera, renderer.domElement );

    // Take care of object selection.
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

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
function add3DObject() {

    var file = event.target.files[0];
    var filePath = window.URL.createObjectURL( file );
    var loader = new THREE.OBJLoader();

    $.ajax({
        url: filePath,
        success: function( fileAsString ) {
            var object = loader.parse( triangulate( fileAsString ) );
            object.name = file.name;
            object.userData.filePath = filePath;
            object.userData.simpleMeshes = OBJParser.parseToSimpleMesh( fileAsString );

            applyDefaultMaterial( object );
            normalizeAndCenterGeometries( object );
            recognizeMeshesOfObjectForRaycasterSelection( object );

            var objectControls = addTransformControls( object );
            showOnlyTheseControls( objectControls );

            // By default, choose the first mesh group of the object as the selectedMesh.
            selectedMesh = object.children[0];
            showInfoForMesh( selectedMesh );

            scene.add( object );

            console.log("File was read and loaded into scene successfully." +
						"\nName: " + file.name +
						"\nSize: " + file.size + " bytes" );
        }
    });

}


function applyDefaultMaterial( object ) {

    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.material = new THREE.MeshPhongMaterial({
                color: 0xffffff * Math.random(),
                side: THREE.DoubleSide
            });
        }
    });

}


// With r74 OBJLoader, o and g tags are processed as their own separate meshes (and hence their own geometries).
// Because of this, we have to jump through a couple of hoops to normalize and center the entire object properly.
function normalizeAndCenterGeometries( object ) {

    // Merge all of the geometries to find the the correct bounding sphere for the correct object.
    // Merging BufferGeometries don't work for some reason, so we convert them into a regular geometry.
    var mergedGeometry = new THREE.Geometry();
    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
            mergedGeometry.merge( geometry );
        }
    });
    mergedGeometry.computeBoundingSphere();
    var r = mergedGeometry.boundingSphere.radius;
    object.scale.set( 1/r, 1/r, 1/r );

    // Now we center each geometry with respect to the mergedGeometry's bounding box.
    // This is similar to what three.js r74 does on line 10030 for centering. I'm surprised this worked here!
    mergedGeometry.computeBoundingBox();
    var offset = mergedGeometry.boundingBox.center().negate();
    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.geometry.translate( offset.x, offset.y, offset.z );
        }
    });

}


function recognizeMeshesOfObjectForRaycasterSelection( object ) {

    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            loadedMeshes.push( child );
        }
    });

}


// Adds transformsControls for a given object.
// Returns the created controls.
function addTransformControls( object ) {

    var objectControls = new THREE.TransformControls( camera, renderer.domElement );
    // objectControls.addEventListener( 'change', render ); // don't know if i need this...
    objectControls.attach( object );
    scene.add( objectControls );
    objectControls.name = "Controller for " + object.id;
    return objectControls;

}


// Show only the selected object's transform controls.
// Making the controls invisible still allows them to be clickable, so we make them really small too.
function showOnlyTheseControls( objectControls ) {

    scene.children.forEach( function( child ) {
        if ( child instanceof THREE.TransformControls ) {
            if ( child !== objectControls ) {
                child.visible = false;
                child.setSize(0.00001);
            }
            else {
                child.visible = true;
                child.setSize(1);
            }
        }
    });

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


function showInfoForMesh( mesh ) {

    if ( mesh.name === "" ) { mesh.name = "~ NO GROUP NAME ~"; }

    document.getElementById("selected_obj").innerHTML = "Currently selected object: " + mesh.parent.name;
    document.getElementById("selected_mesh").innerHTML = "Currently selected mesh group: " + mesh.name;
    document.getElementById("selected_hreaker").style.display = "block";
    document.getElementById("vertices").innerHTML = "Vertices: " + mesh.userData.vertices;
    document.getElementById("edges").innerHTML = "Edges: " + mesh.userData.edges;
    document.getElementById("faces").innerHTML = "Faces: " + mesh.userData.faces;
    document.getElementById("characteristic").innerHTML = "Characteristic: " + mesh.userData.characteristic;
    document.getElementById("genus").innerHTML = "Genus: " + mesh.userData.genus;

}



/* This recursively animates the scene using the awesome requestAnimationFrame. */
function animate() {
    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame.
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 30 ); // frame count goes to the denominator.

    if ( selectedMesh ) {
        var objectControls = scene.getObjectByName("Controller for " + selectedMesh.parent.id);
        objectControls.update();
    }

    render();
}

/* This just renders the scene with respect to a camera once. */
function render() {
    renderer.render( scene, camera );
}

/* ==================== EVENT LISTENERS ==================== */

window.addEventListener( "resize", resizeCanvas );
document.getElementById("i_file").addEventListener( 'change', add3DObject );

document.getElementById("graphicsContainer").addEventListener( 'mousedown', onCanvasMouseDown );
document.getElementById("graphicsContainer").addEventListener( 'touchstart', onCanvasTouchStart );

function resizeCanvas() {

    renderer.setSize( window.innerWidth,  window.innerHeight );
    camera.aspect = window.innerWidth /  window.innerHeight;
    camera.updateProjectionMatrix();

}

/* The following two functions take care of our raycaster selecting objects. For reference,
   see the example http://mrdoob.github.io/three.js/examples/canvas_interactive_cubes.html */
function onCanvasTouchStart( event ) {

    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;
    onCanvasMouseDown( event );

}

function onCanvasMouseDown( event ) {

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( loadedMeshes );

    if ( intersects.length > 0 ) {

        // intersects[0] is the mesh the raycaster intersects.
        selectedMesh = intersects[0].object;

        console.log("You selected the " + selectedMesh.name + " mesh group of the " + selectedMesh.parent.name + " object.");

        showInfoForMesh( selectedMesh );
        showOnlyTheseControls( scene.getObjectByName("Controller for " + selectedMesh.parent.id) );

    }

}
