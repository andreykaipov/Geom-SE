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
var raycaster, mouse, loadedObjects = [], selectedObject, selectedObjectControls;

// We could probably remove this global variable, but it'd be rather messy.
var selectedObjectMaterial;
var shaderStatus;
var textureLoader = new THREE.TextureLoader();


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
    document.getElementById("i_file").addEventListener( 'change', loadObject );

    /* SHADER STUFF */
    var fragSource = document.getElementById('fragSource');
    fragSource.value = THREE.ShaderLib.phong.fragmentShader;
    var vertSource = document.getElementById('vertSource');
    vertSource.value = THREE.ShaderLib.phong.vertexShader;
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

    selectedObjectMaterial.uniforms.texture1.value.needsUpdate = true;
    selectedObjectMaterial.uniforms.texture2.value.needsUpdate = true;
}

// Client-side upload, and triangulate to temp file. JS does not allow full path so we create a temporary path.
// See http://stackoverflow.com/a/24818245/4085283, and http://stackoverflow.com/a/21016088/4085283.
function loadObject() {

    // See https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib.js.
    var loadedObjectMaterial = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge( [
            THREE.UniformsLib[ "common" ],
            THREE.UniformsLib[ "aomap" ],
            THREE.UniformsLib[ "lightmap" ],
            THREE.UniformsLib[ "emissivemap" ],
            THREE.UniformsLib[ "bumpmap" ],
            THREE.UniformsLib[ "normalmap" ],
            THREE.UniformsLib[ "displacementmap" ],
            THREE.UniformsLib[ "fog" ],
            THREE.UniformsLib[ "ambient" ],
            THREE.UniformsLib[ "lights" ],
            {
                diffuse: { type:"c", value: new THREE.Color(Math.random() * 0xffffff) },
                emissive : { type: "c", value: new THREE.Color( 0x000000 ) },
                specular : { type: "c", value: new THREE.Color( 0x111111 ) },
                shininess: { type: "f", value: 30 },
                fogDensity: { type: "f", value: 0.45 },
                fogColor: { type: "v3", value: new THREE.Vector3( 0, 0, 0 ) },
                time: { type: "f", value: 1.0 },
                resolution: { type: "v2", value: new THREE.Vector2() },
                uvScale: { type: "v2", value: new THREE.Vector2( 3.0, 1.0 ) },
                texture1: { type: "t", value: textureLoader.load( "http://threejs.org/examples/textures/lava/cloud.png" ) },
                texture2: { type: "t", value: textureLoader.load( "http://threejs.org/examples/textures/lava/lavatile.jpg" ) }
            }
        ] ),
        vertexShader: VERTCODE.getValue(),
        fragmentShader: FRAGCODE.getValue(),
        lights: true
    });

    // r74 OBJLoader actually recognizes named objects and polygon groups in obj files.
    // This is good if the user wants to assign different materials to differnet parts of the obj file.
    // This is troublesome if we want to normalize the 3D Object, because it would mean we have to merge
    // all the geometries together somehow and merge as one. So, for now, we'll just strip ot everything
    // but the vertices and faces from the object file to assure that the object file is loaded in one geometry.
    // Since loading is asynchronous (?), everything else has to go into the ajax success call.
    // I'm thinking we might as well just triangulate on upload if we're reading it in the beginning though...?
    var file = event.target.files[0];
    var filePath = window.URL.createObjectURL( file );
    $.ajax({
        url : filePath,
        success : function( fileAsString ) {

            var lines = fileAsString.split(/[\r\n]/);
            bareLines = lines.filter(function(line) {
                return (line[0] === 'v' && line[1] === ' ') ||
                       (line[0] === 'f' && line[1] === ' ')
            });
            var bareFile = new Blob( [ bareLines.join('\n') ], { type: "text/plain" } );
            var bareFilePath = window.URL.createObjectURL( bareFile );

            console.log( "File was read and loaded successfully." +
                        "\nName: " + file.name +
                        "\nSize: " + file.size + " bytes" );

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
            var objectControls = new THREE.TransformControls( camera, renderer.domElement );
            objectControls.addEventListener( 'change', render );
            objectControls.attach( loadedObject );
            scene.add( objectControls );

            // Associate the objectControls with the loadedObject. See gui.js in triangulation button.
            objectControls.name = "Controller for " + loadedObject.id;

            // Make the most recently loaded object the selected object.
            selectedObject = loadedObject;
            selectedObjectMaterial = loadedObjectMaterial;
            selectedObjectControls = objectControls;
            showOnly( selectedObjectControls );

            selectedObjectMaterial.uniforms.texture1.value.wrapS = selectedObjectMaterial.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
            selectedObjectMaterial.uniforms.texture2.value.wrapS = selectedObjectMaterial.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

            FRAGCODE.on("change", updateCustomShader);
            VERTCODE.on("change", updateCustomShader);

        } // end ajax success
    });

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
    var intersects = raycaster.intersectObjects( loadedObjects, true );

    // intersects[0] is the mesh the raycaster intersects.
    if ( intersects.length > 0 ) {

        // The selected object is the objContainer for the object the intersected mesh belongs to!
        selectedObject = intersects[0].object.parent.parent;
        selectedObjectMaterial = selectedObject.children[0].children[0].material;
        selectedObjectControls = scene.getObjectByName("Controller for " + selectedObject.id);
        showOnly( selectedObjectControls );

        console.log("You selected " + selectedObject.name + ".");

        // Update stats when object is selected.
        document.getElementById("selected_obj").innerHTML = "Currently selected:<br>" + selectedObject.name;

        var geometry = selectedObject.children[0].children[0].geometry;
        document.getElementById("vertices").innerHTML = "Vertices: " + geometry.num_vertices;
        document.getElementById("edges").innerHTML = "Edges: " + 3/2 * geometry.num_faces;
        document.getElementById("faces").innerHTML = "Faces: " + geometry.num_faces;
        document.getElementById("genus").innerHTML = "Genus: " + geometry.genus;

    }

}


/* Creates some lights and adds them to the scene. */
function lights() {

    // var ambientLight = new THREE.AmbientLight( 0xffffff );
    // scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 1, 1, 1 );
    scene.add( directionalLight );

}


/* Loads our 3D Object into a container object, and returns the container. This seems kind of silly
   (because why not just return our 3D Object?), but we do this because loading is asynchronous. This might
   seem like a poor trick, but it's from mrdoob himself http://stackoverflow.com/a/22977590/4085283. */
function create3DObject( obj_url, obj_name, obj_material ) {

    var objContainer = new THREE.Object3D();

    // Clear our container for safety.
    objContainer.children.length = 0;

    var loader = new THREE.OBJLoader();

    loader.load( obj_url, function ( object ) {

        object.name = obj_name;

        // Traverse the 3D Object's children to find the Mesh property.
        object.traverse( function( mesh ) {

            if ( mesh instanceof THREE.Mesh ) {

                // Assign the parameter material to the mesh.
                mesh.material = obj_material;

                // The updated version of OBJLoader uses a BufferGeometry for the loaded 3D Object by default.
                // It stores all of the geometry's data within buffers,
                // to reduce the cost of passing all of the data directly to the GPU. (?)
                // We unpack it to a Geometry first for easier manipulation!
                var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

                // Normalize geometry by scaling it down by it's bounding sphere's radius. Also centers it.
                geometry.normalize();

                // Compute face normals so we can we use flat shading.
                // Merge vertices to removes duplicates and update faces' vertices.
                // Compute vertex normals so we can use Phong shading (i.e. smooth shading).
                geometry.computeFaceNormals();
                geometry.mergeVertices();
                geometry.computeVertexNormals();

                // Compute and print vertices, edges, faces, and genus.
                // We use the Euler characteristic of a surface, 2 - 2g = V - E + F.
                // To use the above formula, notice that in any TRIANGULAR mesh, every face
                // touches three half-edges, so we have 2E = 3F.
                var numVertices = geometry.vertices.length;
                var numFaces = geometry.faces.length;
                var numEdges = 3/2 * numFaces;
                var genus = (1 - numVertices/2 + numFaces/4);

                document.getElementById("selected_obj").innerHTML = "Currently selected:<br>" + obj_name;
                document.getElementById("selected_hreaker").style.display = "block";
                document.getElementById("vertices").innerHTML = "Vertices: " + numVertices;
                document.getElementById("edges").innerHTML = "Edges: " + numEdges;
                document.getElementById("faces").innerHTML = "Faces: " + numFaces;
                document.getElementById("genus").innerHTML = "Genus: " + genus;

                // Convert back to a bufferGeometry for efficiency (??)
                mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

                // Store for later.
                mesh.geometry.num_vertices = numVertices;
                mesh.geometry.edges = numEdges;
                mesh.geometry.num_faces = numFaces;
                mesh.geometry.genus = genus;

            } // end if

        }); // end object.traverse

        objContainer.add( object );

    }); // end loader

    // Hide download button to the old triangulated obj file.
    // This has to be outside of the loader because loading is asynchronous.
    document.getElementById("download_link").style.display = "none";
    document.getElementById("download_hreaker").style.display = "none";

    return objContainer;

}

/* This recursively animates the scene using the awesome requestAnimationFrame. */
function animate() {
    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame.
    // setTimeout( function() {
        requestAnimationFrame( animate );
    // }, 1000 / 30 ); // frame count goes to the denominator.

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

function showOnly( objectControls ) {
    for ( var i = 0; i < scene.children.length; i++ ) {
        if ( scene.children[i] == objectControls ) {
            objectControls.visible = true;
            if (objectControls.size == 0.000001)
                objectControls.size =  1;
        }
        else if ( scene.children[i] instanceof THREE.TransformControls ) {
            scene.children[i].visible = false;
            scene.children[i].size = 0.000001;
        }
    }
}