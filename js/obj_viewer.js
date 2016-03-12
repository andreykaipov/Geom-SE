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
// The loadedObjects array holds all of our loaded objects that our raycaster can pick from.
// The selectedObject is the currently selected object..
// The selectedObjectControls is the currently selected object's transform controls.
var raycaster, mouse, selectedMesh, selectedObjectControls;
var loadedMeshes = [];

// We could probably remove this global variable, but it'd be rather messy.
var selectedObjectMaterial;
var shaderStatus;

// Texture Vars
var textureLoader = new THREE.TextureLoader();
var loadedTextureArray = new Array(0);
// TO DO: Get these from a file uploader tool in the GUI
var textureURLArray = ["http://threejs.org/examples/textures/lava/cloud.png",
						"http://threejs.org/examples/textures/lava/lavatile.jpg"];
var texturesLoaded = false;


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
    renderer.domElement.addEventListener( 'mousedown', onCanvasMouseDown, false );
    renderer.domElement.addEventListener( 'touchstart', onCanvasTouchStart, false );

    // Adds debug axes centered at (0,0,0). Remember: xyz ~ rgb. Solid is positive, dashed is negative.
    createAxes( 100 );

    // Event listener for obj file uploading.
    document.getElementById("i_file").addEventListener( 'change', add3DObject );

    /* SHADER STUFF */
    var fragSource = document.getElementById('fragSource');
    //fragSource.value = THREE.ShaderLib.phong.fragmentShader;
    var vertSource = document.getElementById('vertSource');
    //vertSource.value = THREE.ShaderLib.phong.vertexShader;
    FRAGCODE = CodeMirror.fromTextArea(fragSource,
                                         {
                                           lineNumbers: true,
                                           matchBrackets: true,
                                           indentWithTabs: true,
                                           tabSize: 8,
                                           indentUnit: 8
                                           ,mode: "text/x-glsl"
                                         });
    VERTCODE = CodeMirror.fromTextArea(vertSource,
                                         {
                                           lineNumbers: true,
                                           matchBrackets: true,
                                           indentWithTabs: true,
                                           tabSize: 8,
                                           indentUnit: 8
                                           ,mode: "text/x-glsl"
                                         });

    gl = renderer.getContext();

}

function updateCustomShader()
{
    selectedObjectMaterial.vertexShader = VERTCODE.getValue();
    selectedObjectMaterial.fragmentShader = FRAGCODE.getValue();
    selectedObjectMaterial.needsUpdate = true;
}


function loadTextures() {

	// Texture loading is asynchronous
	for(i = 0; i < textureURLArray.length; i++) {

		textureLoader.load(

			// Load the texture
			textureURLArray[i],

			// texture load callback
			function(texture) {
				loadedTextureArray.push(texture);


				//Check if all the textures have been loaded
				if(loadedTextureArray.length == textureURLArray.length){
					//DEBUG
					console.log( 'loadTextures(): ' + loadedTextureArray.length + "/" + textureURLArray.length + " textures loaded" );

					for(j = 0; j < loadedTextureArray.length; j++)
					{
						console.log( '\tTexture' + (j+1) + ": " + loadedTextureArray[j].name + "\n");
					}

					texturesLoaded = true;

				}
			}, //End Load Callback

			// Function called when download progresses
			function ( xhr ) {
				console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			},

			// Function called when download errors
			function ( xhr ) {
				console.log( 'An error happened while loading the textures' );
			}

		); //End Texture Load
	}
}

// Client-side upload, and triangulate to temp file. JS does not allow full path so we create a temporary path.
// See http://stackoverflow.com/a/24818245/4085283, and http://stackoverflow.com/a/21016088/4085283.
function loadObject() {

	// See https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib.js.


	// r74 OBJLoader actually recognizes named objects and polygon groups in obj files.
	// This is good if the user wants to assign different materials to differnet parts of the obj file.
	// This is troublesome if we want to normalize the 3D Object, because it would mean we have to merge
	// all the geometries together somehow and merge as one. So, for now, we'll just strip ot everything
	// but the vertices and faces from the object file to assure that the object file is loaded in one geometry.
	// Since loading is asynchronous (?), everything else has to go into the ajax success call.
	// I'm thinking we might as well just triangulate on upload if we're reading it in the beginning though...?


			// Note: this loadedObject is a container for an Object3D which is the one that actually holds the mesh!
			var loadedObject = create3DObject( bareFilePath, file.name, loadedObjectMaterial );
			loadedObject.name = file.name;
			// Add the file path as an attribute to the object.
			// We'll need it again if the user wants to triangulate. See gui.js.
			loadedObject.userData.filePath = filePath;

			// Add the loadedObject to the array for raycaster selection.
			loadedObjects.push( loadedObject );

			scene.add( loadedObject );

			// Create controls for each loaded object, attach them to the loaded object,
			// and add them to the scene so we can actually see them.



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

    // The true flag is for intersecting descendents of whatever is intersected.
    var intersects = raycaster.intersectObjects( loadedMeshes, true );

    // intersects[0] is the mesh the raycaster intersects.
    if ( intersects.length > 0 ) {

        selectedMesh = intersects[0].object;

        document.getElementById("selected_obj").innerHTML = "Currently selected obj: " + selectedMesh.parent.name;
        document.getElementById("selected_mesh").innerHTML = "Currently selected mesh: " + selectedMesh.name;
        var objectControls = scene.getObjectByName("Controller for " + selectedMesh.parent.id);
        console.log(objectControls);
        showOnlyTheseControls( objectControls );
        // The selected object is the objContainer for the object the intersected mesh belongs to!
        // selectedObject = intersects[0].object.parent.parent;
        // selectedObjectMaterial = selectedObject.children[0].children[0].material;
        // selectedObjectControls = scene.getObjectByName("Controller for " + selectedObject.id);
        // showOnly( selectedObjectControls );
        //
        // console.log("You selected " + selectedObject.name + ".");
        //
        // // Update stats when object is selected.
        // document.getElementById("selected_obj").innerHTML = "Currently selected:<br>" + selectedObject.name;
        //
        // var geometry = selectedObject.children[0].children[0].geometry;
        // document.getElementById("vertices").innerHTML = "Vertices: " + geometry.num_vertices;
        // document.getElementById("edges").innerHTML = "Edges: " + 3/2 * geometry.num_faces;
        // document.getElementById("faces").innerHTML = "Faces: " + geometry.num_faces;
        // document.getElementById("genus").innerHTML = "Genus: " + geometry.genus;

    }

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
            var object = loader.parse( fileAsString );
            object.name = file.name;

            applyDefaultMaterials( object );
            normalizeAndCenterGeometries( object );
            recognizeMeshesOfObjectForRaycasterSelection( object );

            var objectControls = addTransformControls( object );
            showOnlyTheseControls( objectControls );

            scene.add( object );

            console.log("File was read and loaded into scene successfully." +
						"\nName: " + file.name +
						"\nSize: " + file.size + " bytes" );
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

function applyDefaultMaterials( object ) {
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
// Because of this, we have to jump through a couple of hoops to normalize and center each geometry.
function normalizeAndCenterGeometries( object ) {

    // Merge all of the geometries to find the the correct bounding sphere for the correct object.
    // Using BufferGeometry doesn't work for some reason, so we convert into a regular geometry.
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

    // Now we enter each geometry with respect to the mergedGeometry's bounding box.
    // This is similar to what three.js does on line 10030 for centering. I'm surprised this worked!
    mergedGeometry.computeBoundingBox();
    var offset = mergedGeometry.boundingBox.center().negate();
    object.children.forEach( function( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.geometry.translate( offset.x, offset.y, offset.z );
        }
    });

}

// Adds transformsControls for a given object.
// Returns the created controls.
function addTransformControls( object ) {
    var objectControls = new THREE.TransformControls( camera, renderer.domElement );
    objectControls.addEventListener( 'change', render );
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


/* This recursively animates the scene using the awesome requestAnimationFrame. */
function animate() {
    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame.
    // setTimeout( function() {
        requestAnimationFrame( animate );
    // }, 1000 / 30 ); // frame count goes to the denominator.

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


/* Resize canvas when window is resized. */
window.addEventListener( "resize", function() {
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
    renderer.setSize( canvasWidth, canvasHeight );
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
});