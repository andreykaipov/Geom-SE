// Name: Andrey Kaipov
// Class: CAP 4993
// Professor: Wei Zeng
//
// This program demonstrates how we can use Three.js for 3D Graphics tasks.
// Three.js is a fairly lightweight 3D library using WebGL. http://threejs.org/

init();
lights();
$('#i_file').change( function(event) {

    var file = event.target.files[0];

    var numVertices = 0;
    var numFaces = 0;

    // Load our file and calculate the vertices, edges, faces, and genus of the surface.
    // First notice that every edge forms two half-edges, and every face has three half-edges. So, 2E = 3F.
    // We also use the Euler characteristic of a surface, 2 - 2g = V - E + F, to find the genus.
    // The calculations follow from simple algebra.
    if ( file ) {
        var fileReader = new FileReader();
        fileReader.onload = function( event ) {
            var contents = event.target.result;
            console.log( "File loaded successfully." +
                              "\nName: " + file.name +
                              "\nSize: " + file.size + " bytes" );
            var lines = contents.split(/[\r\n]/);
            lines.map( function( line ) {
                var firstChar = line.charAt(0);
                var secondChar = line.charAt(1);
                if ( firstChar === 'v' && secondChar === ' ') numVertices++;
                if ( firstChar === 'f' && secondChar === ' ') numFaces++;
            });
            $('#vertices').html("Vertices: " + numVertices);
            $('#edges').html("Edges: " + 3/2 * numFaces);
            $('#faces').html("Faces: " + numFaces);
            $('#genus').html("Genus: " + (1 - numVertices/2 + numFaces/4) );
        }
        console.log(fileReader.readAsText( file ));
    }
    else {
        alert( "Failed to load file!" );
    }


    // If there is an object in the scene, remove it.
    if (typeof object !== 'undefined') {
        scene.remove( object );
    }

    var tmppath = URL.createObjectURL( file );

    object = create3DObject( tmppath, "sculpture", new THREE.MeshPhongMaterial({
        color: 0x515a6e,
        emissive: 0x000000,
        shading: THREE.FlatShading,
        side: THREE.DoubleSide // important.
    })
    );
    scene.add( object );

    render();
});

// The scene is where everything is placed.
// The camera is what looks at the scene.
// The renderer will display our beautifully crafted scene.
// The controls allow you to move around the scene with the camera.

var scene, camera, object, renderer, cameraControls, guiControls;

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
    camera.position.set( 0, 0, 100 );
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
    var axes = buildAxes( 3000 );
    scene.add( axes );


    // Create the gui for the slider controllers.
    createGUI();
}

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


    var rotationFolder = gui.addFolder( "Rotation (clockwise in radians)" );
    rotationFolder.add( guiControls, 'rotationX', 0, 2 * Math.PI ).name( "rotate on x" ).listen();
    rotationFolder.add( guiControls, 'rotationY', 0, 2 * Math.PI ).name( "rotate on y" ).listen();
    rotationFolder.add( guiControls, 'rotationZ', 0, 2 * Math.PI ).name( "rotate on z" ).listen();
        // Set the sliders to start at 0. This is related to the above bug issue.
        guiControls.rotationX = guiControls.rotationY = guiControls.rotationZ = 0;
    rotationFolder.add( {
        resetRotation: function() {
            guiControls.rotationX = 0;
            guiControls.rotationY = 0;
            guiControls.rotationZ = 0;
        }
    }, 'resetRotation' ).name( "reset rotation" );


    var materialFolder = gui.addFolder( "Material" );
    materialFolder.addColor( guiControls, 'baseColor' ).onChange( updateColor() );
    var shadingOptions = {
        "THREE.FlatShading" : THREE.FlatShading,
    	"THREE.SmoothShading" : THREE.SmoothShading
    }
    materialFolder.add( guiControls, 'shading', shadingOptions ).onChange( updateShading() );

    gui.close();
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
function create3DObject( obj_file, obj_name, obj_material ) {

    // will hold our output
    var container = new THREE.Object3D();

    var loader = new THREE.OBJLoader();

    loader.load( obj_file, function ( object ) {

        object.name = obj_name;

        // Traverse the 3D Object's children to find the Mesh property.
        object.traverse( function( mesh ) {

            if ( mesh instanceof THREE.Mesh ) {

                // Assign the passed-in material to the mesh.
                mesh.material = obj_material;

                // OBJLoader uses a BufferGeometry for the 3D Object by default.
                // It stores all of the geometry's data within buffers, to reduce
                // the cost of passing all of the data directly to the GPU.
                // We need to unpack it to a Geometry first.
                var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

                // Normalize geometry by scaling it down by it's bounding sphere's radius.
                geometry.computeBoundingSphere();
                var r = geometry.boundingSphere.radius;
                mesh.scale.set( 1/r, 1/r, 1/r );

                // Compute both normals so we can use both flat and smooth shading.
                geometry.computeFaceNormals();
                geometry.mergeVertices();        // Merge just in case.
                geometry.computeVertexNormals();

                // Center geometry at origin.
                THREE.GeometryUtils.center( geometry );

                // Convert back to a bufferGeometry for efficiency (???)
                mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );
                
            } // end if

        }); // end object.traverse

        container.add( object );

    }); // end loader

    return container;

}

function populateScene() {
    object = create3DObject( "blob:http%3A//127.0.0.1%3A8887/74448804-d190-47d4-b2dd-cf54451ed9df", "sculpture", new THREE.MeshPhongMaterial({
        color: "rgb(120,120,20)",
        emissive: "rgb(0,0,0)",
        shading: THREE.FlatShading,
        side:THREE.DoubleSide // important.
    })
    );
    scene.add( object );
}


/* This recursively animates the scene using the requestAnimationFrame() function. */
function render() {
    window.requestAnimationFrame( render );

    object.rotation.set( guiControls.rotationX, 0, 0 );
    object.rotation.y = guiControls.rotationY;
    object.rotation.z = guiControls.rotationZ;

    object.scale.x = guiControls.scaleX;
    object.scale.y = guiControls.scaleY;
    object.scale.z = guiControls.scaleZ;

    renderer.render( scene, camera );
    cameraControls.update();
}
