"use strict";

class GFXViewer {

    constructor() {

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera();
        this.camera.fov = 80; // in degs
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.near = 0.1;
        this.camera.far = 8000;
        this.camera.position.set( 0, 0.1, 2 );
        this.camera.updateProjectionMatrix();

        this.renderer = new THREE.WebGLRenderer( { alpha: true } );
        this.renderer.setClearColor( 0x3a3a3a, 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        $('#gfxContainer').append( this.renderer.domElement );

        this.camera.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedMesh = new THREE.Mesh();
        this.selectedObject = new THREE.Object3D();
        // this.selectedBoundingBox = new THREE.BoxHelper( this.selectedMesh );

        this.loadedMeshes = [];
        this.selectedMeshes = new THREE.Group();

        this.scene.add( this.__makeAxes( 5 ) );
        // this.scene.add( this.selectedBoundingBox );

        this.transformControls = new THREE.TransformControls( this.camera, this.renderer.domElement );
        this.transformControls.addEventListener( 'change', this.__render.bind( this ) );
        this.transformControls.visible = false;

        this.scene.add( this.transformControls );

    }

    initLights() {

        let ambientLight = new THREE.AmbientLight( 0xffffff );
        this.scene.add( ambientLight );

        let directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
        directionalLight.position.set( 1, 1, 1 );
        this.scene.add( directionalLight );

    }


    __handleAdd3DObject( file ) {

        let self = this;

        let filePath = window.URL.createObjectURL( file );

        $.ajax({
            url: filePath,
            contentType: "text/plain",
            mimeType: 'text/plain; charset=x-user-defined',
            success: function( fileAsString ) {

                let object = new THREE.OBJLoader().parse( OBJParser.triangulateConvex( fileAsString ) );
                object.name = file.name;
                object.userData.filePath = filePath;
                object.userData.simpleMeshes = OBJParser.parseToSimpleMesh( fileAsString );

                OBJHandler.find_mesh_counts( object );
                OBJHandler.apply_default_materials( object );
                OBJHandler.find_normalize_and_center_object_geometry( object );
                OBJHandler.normalize_and_center_mesh_geometries( object );
                OBJHandler.compute_face_and_vertex_normals( object );
                OBJHandler.compute_bounding_box_for_object( object )
                OBJHandler.compute_bounding_boxes_for_meshes( object );
                OBJHandler.recognize_meshes_for_raycaster( object, self.loadedMeshes );

                self.transformControls.attach( object );
                self.selectedObject = object;

                self.scene.add( object );

                console.log("File was read and loaded into scene successfully." +
    						"\nName: " + file.name +
    						"\nSize: " + file.size + " bytes" );
            }
        });

    }

    initEventListeners() {

        let self = this;
        let shiftKeyUp = true; // jQuery doesn't support shift as a keypress,
                               // so we make our shift keydown event behave like a keypress with this flag.

        $(window).resize( event => {

            self.renderer.setSize( window.innerWidth,  window.innerHeight );
            self.camera.aspect = window.innerWidth /  window.innerHeight;
            self.camera.updateProjectionMatrix();

        });

        $('#i_file').change( function( event ) {

            let file = event.target.files[0];
            self.__handleAdd3DObject( file );

        });
        $('body').click( onMouseDown ).dblclick( onMouseDown );
        $('body').keydown( onKeyDown ).keyup( onKeyUp );

        function onKeyDown( event ) {

            // Fire only when the shift key is up and the shift key is being pressed.
            // Additionally, gluing back only makes sense if the object has several meshes. <--- Look into this.
            if ( shiftKeyUp && event.keyCode == 16 && self.selectedObject.meshCount > 1 ) {

                shiftKeyUp = false; // Settings this to false prevents this if-statement from running more than once.

                self.selectedMesh.boundingBox.visible = false;
                self.selectedObject.boundingBox.visible = true;
                self.transformControls.attach( self.selectedObject );

                self.selectedObject.children.forEach( child => {

                    if ( child instanceof THREE.Mesh ) {

                        child.__oldPosition = child.position.clone();
                        child.position.copy( child.centroid );

                    }

                });

            }

        }

        function onKeyUp( event ) {

            console.log(event.keyCode);

            // If the G key is coming back up, lift the shift key back up immediately.
            // This leaves the meshes glued back together at the object's center.
            if ( event.keyCode == 71 ) {

                shiftKeyUp = true;

            }

            // Fires only when the shift key is down, and is just being let go.
            if ( ! shiftKeyUp && event.keyCode == 16 ) {

                shiftKeyUp = true; // Reset this flag.

                self.selectedMesh.boundingBox.visible = true;
                self.selectedObject.boundingBox.visible = false;
                self.transformControls.attach( self.selectedMesh );

                self.selectedObject.children.forEach( child => {

                    if ( child instanceof THREE.Mesh ) {

                        child.position.copy( child.__oldPosition );

                    }

                });

            }

        }

        function onMouseDown( event ) {

            self.mouse.x = ( event.clientX / self.renderer.domElement.clientWidth ) * 2 - 1;
            self.mouse.y = - ( event.clientY / self.renderer.domElement.clientHeight ) * 2 + 1;

            self.raycaster.setFromCamera( self.mouse, self.camera );

            var intersected = self.raycaster.intersectObjects( self.loadedMeshes );

            if ( intersected.length == 0 ) {

                self.selectedMeshes.length = 0;

            }
            else if ( intersected.length > 0 ) {

                // Before assigning the new selected mesh and selected object,
                // hide the old selected stuff's bounding boxes, if they exist.
                if ( self.selectedObject.boundingBox ) {
                    self.selectedObject.boundingBox.visible = false;
                }
                if ( self.selectedMesh.boundingBox ) {
                    self.selectedMesh.boundingBox.visible = false;
                }

                // Assign the new selected stuff.
                self.selectedMesh = intersected[0].object;
                self.selectedObject = self.selectedMesh.parent;

                console.log("You selected the " + self.selectedMesh.name + " mesh group of the " + self.selectedObject.name + " object.");

                // Show the new selected mesh's bounding box.
                self.selectedMesh.boundingBox.visible = true;
                self.transformControls.attach( self.selectedMesh );

                // If double clicked, then focus in on the selected mesh for that cool effect.
                if ( event.ctrlKey ) {

                    self.selectedMesh.material.color.setHex( 0x999900 );
                    // self.selectedMeshes.add( self.selectedMesh );
                    // self.transformControls.attach( self.selectedMeshes );
                    // self.transformControls.update();

                }
                if ( event.type === "dblclick" ) {

                    self.camera.lookAt( self.selectedMesh.position );
                    self.camera.orbitControls.target = self.selectedMesh.position.clone();

                }

            }

        }

    }

    animate() {

        requestAnimationFrame( this.animate.bind(this) );

        this.__render();
        this.__update();

    }

    __render() {

        this.renderer.render( this.scene, this.camera );

    }

    __update() {

        this.transformControls.update();

        // this.camera.orbitControls.update();

    }

    __makeAxes( length ) {

    	var vertices = new Float32Array( [
    		0, 0, 0,  length, 0, 0,  // +x
    		0, 0, 0,  0, length, 0,  // +y
    		0, 0, 0,  0, 0, length,  // +z
            0, 0, 0,  -length, 0, 0, // -x
    		0, 0, 0,  0, -length, 0, // -y
    		0, 0, 0,  0, 0, -length  // -z
    	] );

    	var vertexColors = new Float32Array( [
            1, 0, 0,  1, 0.6, 0, // +x is red to kinda red.
    		0, 1, 0,  0.6, 1, 0, // +y is green to kinda green.
    		0, 0, 1,  0, 0.6, 1, // +z is blue to kinda blue.
            0, 1, 1,  0, 0.4, 1, // -x is cyan to kinda cyan.
    		1, 0, 1,  0.4, 0, 1, // -y is magenta to kinda magenta.
    		1, 1, 0,  1, 0.4, 0  // -z is yellow to kinda yellow.
    	] );

    	var geometry = new THREE.BufferGeometry();
    	geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    	geometry.addAttribute( 'color', new THREE.BufferAttribute( vertexColors, 3 ) );

    	var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

    	return new THREE.LineSegments( geometry, material );

    }

}

console.log("hello");