$.ajax({
    type: "GET",
    dataType: "json",
    url: "../uploads/.uploads.json",
    success: function( data ) {
        
        console.log(data);

        // data[0] is junk, so we start at data[1].
        for ( var i = 1; i < data.length; i++ ) {

            var gfxContent = document.createElement("div");
            gfxContent.className = "col-xs-6 col-sm-3 placeholder";

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 75, 200/200, 0.1, 1000 );

            var renderer = new THREE.WebGLRenderer();
            renderer.setSize( 200, 200 );
            gfxContent.appendChild( renderer.domElement );

            var geometry = new THREE.BoxGeometry( 1, 1, 1 );
            var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
            var cube = new THREE.Mesh( geometry, material );
            scene.add( cube );

            camera.position.z = 5;

            renderer.render(scene, camera);

            $('.row .placeholders').append( gfxContent );

        }
    }
});
