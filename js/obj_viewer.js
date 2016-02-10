// Name: Andrey Kaipov
// Class: CAP 4993
// Professor: Wei Zeng
//
// This program demonstrates how we can use Three.js for 3D Graphics tasks.
// Three.js is a fairly lightweight 3D library using WebGL. http://threejs.org/
//
// to do:
// - triangulation of .obj files !!!
// - make wasd camera controllable. scroll-wheel only zooms.
// - allow objects to be selectable
// - add customizable lights.
// - allow translation of added objects, because objects all clump together at
// the origin.
// - allow fps be customizable..
// - add standard geometries (cubes, spheres, etc.)

init();
createGUI();
lights();
animate();


// The scene is where everything is placed.
// The camera is what looks at the scene.
// The renderer will display our beautifully crafted scene.
// The controls allow you to move around the scene with the camera.

var scene, camera, loadedObject, renderer, cameraControls, guiControls;


$('#i_file').change( function(event) {

    var file = event.target.files[0];

    // Loads our file so we can read it.
    // No longer necessary, but maybe it could be used to triangulate the obj file.
    if ( file ) {
        var fileReader = new FileReader();
        fileReader.onload = function( event ) {
            var contents = event.target.result;
            console.log( "File loaded successfully." +
                              "\nName: " + file.name +
                              "\nSize: " + file.size + " bytes" );
            var lines = contents.split(/[\r\n]/);
        }
        fileReader.readAsText( file );
    }
    else {
        alert( "Failed to load file!" );
    }


    //If there is already an object in the scene, remove it.
    if (typeof loadedObject !== 'undefined') {
        scene.remove( loadedObject );
    }


    var tmppath = URL.createObjectURL( file );
    var fileName = file.name.substr(0, file.name.length - 4);

    loadedObject = create3DObject( tmppath, fileName, new THREE.MeshPhongMaterial({
        color: pickedColor,
        emissive: 0x000000,
        shading: pickedShading,
        side: THREE.DoubleSide // important.
    })
    );
    loadedObject.deletable = true; // see 'clearObjects' button in the gui_sliders.js fileName

    scene.add( loadedObject );

});


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
    camera.position.set( 0, 0, 10 );
    scene.add( camera );


    // The renderer provides a place for ThreeJS to draw our scene.
    // Specifically, it provides a <canvas> element which we add to our HTML document.
    renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setClearColor( 0x010101, 0.1 );
    document.body.appendChild( renderer.domElement );
    renderer.setSize( canvasWidth, canvasHeight );

    // Resize canvas when window is resized.
    window.addEventListener( 'resize', function() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        renderer.setSize( canvasWidth, canvasHeight );
        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
    });


    // Add controls so we can pan around with the mouse and arrow-keys.
    cameraControls = new THREE.OrbitControls( camera, renderer.domElement );


    // Adds debug axes into scene centered at (0,0,0).
    // Red is x, green is y, and blue is z.
    // Solid line positive, dashed line is negative.
    var axes = buildAxes( 100 );
    scene.add( axes );

}


/* Creates some lights and adds them to the scene. */
function lights() {
    var ambientLight = new THREE.AmbientLight( 0xffffff );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.position.set( 0, 1, 1 );
    scene.add( directionalLight );
}


/* Loads our 3D Object and returns it. */
function create3DObject( obj_url, obj_name, obj_material ) {

    // This container will hold our output. It seems like a poor trick since now our actual
    // Object3D is nested within a dummy Object3D, but it's from mrdoob himself http://stackoverflow.com/a/22977590/4085283
    var container = new THREE.Object3D();

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
                $('#vertices').html("Vertices: " + numVertices);
                $('#edges').html("Edges: " + 3/2 * numFaces);
                $('#faces').html("Faces: " + numFaces);
                $('#genus').html("Genus: " + (1 - numVertices/2 + numFaces/4) );

                // Convert back to a bufferGeometry for efficiency (??)
                mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

            } // end if

        }); // end object.traverse

        container.add( object );

    }); // end loader

    return container;

}


/* This recursively animates the scene using the awesome requestAnimationFrame. */
function animate() {
    // Limit rendering to 30 fps, equivalent to 1000 / 30 = 33.33 ms per frame.
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 30 ); // frame count goes to the denominator.

    render();
}


/* This just renders once. */
function render() {

    // Loading is asynchronous, so we have to do qualify it before we try and change our object.
    if ( typeof loadedObject !== 'undefined' ) {
        loadedObject.rotation.set( guiControls.rotationX, 0, 0 );
        loadedObject.rotation.y = guiControls.rotationY;
        loadedObject.rotation.z = guiControls.rotationZ;

        loadedObject.scale.x = guiControls.scaleX;
        loadedObject.scale.y = guiControls.scaleY;
        loadedObject.scale.z = guiControls.scaleZ;
    }

    renderer.render( scene, camera );
    cameraControls.update();

}
