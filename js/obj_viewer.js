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
    transformControls.addEventListener('change', render);
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
            var object = loader.parse( OBJParser.triangulateConvex( fileAsString ) );
            object.name = file.name;
            object.userData.filePath = filePath;
            object.userData.simpleMeshes = OBJParser.parseToSimpleMesh( fileAsString );

            applyDefaultMaterial( object );
            normalizeAndCenterGeometries( object );
            recognizeMeshesOfObjectForRaycasterSelection( object );
            attachTransformControlsTo( object );

            selectedMesh = object.children[0];

            if ( object.meshCount !== 1 ) {
                var boundaryBox = new THREE.BoxHelper( new THREE.Mesh(object.mergedGeometry, null) );
                object.boundaryBox = boundaryBox;
                object.add(boundaryBox);
            }

            // Choose the first mesh group of the object as the default selectedMesh.
            // showInfoForMesh( selectedMesh );

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

            geometry.computeFaceNormals();
            geometry.mergeVertices();
            geometry.computeVertexNormals();

        }
    });

    mergedGeometry.computeBoundingSphere();
    var r = mergedGeometry.boundingSphere.radius;
    mergedGeometry.scale( 1/r, 1/r, 1/r );
    object.mergedGeometry = mergedGeometry;

    var count = 0;
    // Traverse again, now to normalize each individual geometry.
    // Also, we find the center of the geometry so that rotation of the mesh can be around itself.
    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {

            var mesh = child;

            // Scale it down.
            mesh.geometry.scale( 1/r, 1/r, 1/r );

            // Find the centroid of geometry.
            var centroid = new THREE.Vector3();
            mesh.geometry.computeBoundingBox();
            centroid.addVectors( mesh.geometry.boundingBox.max, mesh.geometry.boundingBox.min );
            centroid.multiplyScalar( 0.5 );

            // Move geometry to origin.
            mesh.geometry.translate( - centroid.x, - centroid.y, - centroid.z );

            // Move the mesh back to where the geometry was just before.
            mesh.position.set( centroid.x, centroid.y, centroid.z );

            // Store for later use.
            child.centroid = centroid;

            count += 1;
        }
    });

    if ( count === 1 ) {
        object.position.set(0,0,0);
        object.children.forEach( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.position.set( 0, 0, 0 );
            }
        });
    }

    object.meshCount = count;
}


function recognizeMeshesOfObjectForRaycasterSelection( object ) {

    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            loadedMeshes.push( child );
        }
    });

}


function showTransformControls( thing ) {

    var oldControls = scene.getObjectByName("LonelyTransformControls")
    scene.remove( oldControls );

    var controls = new THREE.TransformControls( camera, renderer.domElement );
    controls.name = "LonelyTransformControls";
    controls.attach( thing );
    controls.addEventListener( 'change', render );
    scene.add( controls );

    return controls;

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

function hideInfo() {

    document.getElementById("selected_obj").innerHTML = "";
    document.getElementById("selected_mesh").innerHTML = "";
    document.getElementById("selected_hreaker").style.display = "none";
    document.getElementById("vertices").innerHTML = "";
    document.getElementById("edges").innerHTML = "";
    document.getElementById("faces").innerHTML = "";
    document.getElementById("characteristic").innerHTML = "";
    document.getElementById("genus").innerHTML = "";

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

/* ==================== EVENT LISTENERS ==================== */

(function() {

document.getElementById("i_file").addEventListener( 'change', add3DObject );

window.addEventListener( "resize", resizeCanvas );

function resizeCanvas() {

    renderer.setSize( window.innerWidth,  window.innerHeight );
    camera.aspect = window.innerWidth /  window.innerHeight;
    camera.updateProjectionMatrix();

}

function onObjectTransformControlsDown( event ) {
    console.log(event);
    var object = event.target.object.parent;
    attachTransformControlsTo( object );
}

function onObjectTransformControlsUp( event ) {
    var object = event.target.object;
    var bBox = object.boundaryBox;
    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            bBox.visible = false;
            child.position.set( child.oldPosition.x, child.oldPosition.y, child.oldPosition.z );
        }
    });
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

}

// Restore the selectedMesh reference to the global var, and show the bBox.
function switchFocusBackToMesh() {

    selectedMesh = scene.__oldSelectedMesh__;
    selectedMeshBoundaryBox.visible = true;

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
        if ( selectedMesh.parent.meshCount > 1 ) {

            var object = selectedMesh.parent;

            // Now glue the meshes back together by moving them to where their original center was.
            object.children.forEach( function( child ) {

                if ( child instanceof THREE.Mesh ) {

                    child.oldPosition = child.position.clone();

                    child.position.set( child.centroid.x, child.centroid.y, child.centroid.z );

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

        console.log("You selected the " + selectedMesh.name + " mesh group of the " + selectedMesh.parent.name + " object.");

        showInfoForMesh( selectedMesh );

        selectedMeshBoundaryBox.visible = true;
        if ( selectedMesh.parent.meshCount > 1 ) selectedMesh.parent.boundaryBox.visible = false;

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