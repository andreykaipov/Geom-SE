/**
 * @author Andrey Kaipov
 */

/*
Here we first get the data in our .uploads.json data file into an array.
Now for each object in the array, we create its own separate scene, renderer,
and an HTML div that will hold our renderer as a dom element (a canvas tag).
After changing the geometry of the object a little bit, we add it to the scene and render.

An alternative is to take the renderer's canvas and access it as an image file.
Then we can just use an image tag, but I'm not sure if this would be more efficient.
The client would still render the scene, but won't see it, so we might as well show the canvas?
Note: If we want to get the canvas as a image, we have to do that AFTER we render the scene.
*/

$.ajax({
    type: "GET",
    dataType: "json",
    url: "../uploads/.uploads.json",
    success: function( data ) {

        // These will be common to every thumbnail, so we can keep them here.
        var camera = new THREE.PerspectiveCamera( 75, 200/200, 0.1, 1000 );
        camera.position.z = 2;

        var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLight.position.set( 0, 0, 1);

        // data[0] is junk, so we start at data[1].
        for ( var i = 1; i < data.length; i++ ) {

            var loader = new THREE.OBJLoader();

            // Loading is asynchronous, so we have to do everything in the loader.
            // We could do what we in OBJ_Viewer.js, but it didn't work that way when I tried...
            loader.load( "../" + data[i].path, function ( object ) {

                var scene = new THREE.Scene();
                scene.add( directionalLight );

                var renderer = new THREE.WebGLRenderer();
                renderer.setSize( 200, 200 );

                var gfxContent = document.createElement("img"); // or <img>
                gfxContent.className = "col-xs-6 col-sm-3 placeholder";
                // gfxContent.appendChild( renderer.domElement );
                $('.row .placeholders').append( gfxContent );

                object.traverse( function( mesh ) {
                    if ( mesh instanceof THREE.Mesh ) {
                        // mesh.material = material;
                        var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );
                        geometry.normalize();
                        geometry.computeFaceNormals();
                        geometry.mergeVertices();
                        geometry.computeVertexNormals();
                        mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );
                    } // end if
                }); // end object.traverse

                scene.add( object );
                renderer.render(scene, camera);
                gfxContent.src = renderer.domElement.toDataURL("image/png");

            }); // end loader

        }
    }
});