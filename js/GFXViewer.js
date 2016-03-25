"use strict";

class GFXViewer {

    constructor() {

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera();
        this.camera.fov = 80; // in degs
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.near = 0.1;
        this.camera.far = 8000;
        this.camera.position.set( 0, 0, 5 );

        this.renderer = new THREE.WebGLRenderer( { alpha: true } );
        this.renderer.setClearColor( 0x3a3a3a, 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        $('#gfxContainer').append( this.renderer.domElement );

        this.camera.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.selectedMesh = new THREE.Mesh();
        this.selectedObject = new THREE.Object3D();
        this.selectedBoundingBox = new THREE.BoxHelper( this.selectedMesh );

        this.loadedMeshes = [];
        this.selectedMeshes = new THREE.Group();

        this.scene.add( buildAxes( 100 ) );
        this.scene.add( this.selectedBoundingBox );

        this.transformControls = new THREE.TransformControls( this.camera, this.renderer.domElement );
        this.transformControls.addEventListener( 'change', this.__render );
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

    add3DObject( file ) {

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
                OBJHandler.normalize_and_center_geometries( object );
                OBJHandler.compute_face_and_vertex_normals( object );
                // OBJHandler.create_bounding_boxes_for_meshes( object );
                OBJHandler.recognize_meshes_for_raycaster( object, self.loadedMeshes );
                // attachTransformControlsTo( object );

                // if ( object.meshCount > 1 ) {
                    // var boundaryBox = new THREE.BoxHelper( new THREE.Mesh(object.mergedGeometry, null) );
                    // object.boundaryBox = boundaryBox;
                    // object.add(boundaryBox);
                // }
                // else {
                //     selectedMesh = object.children[ 0 ];
                // }

                // showSelectionTextForObject( object );

                self.scene.add( object );

                console.log("File was read and loaded into scene successfully." +
    						"\nName: " + file.name +
    						"\nSize: " + file.size + " bytes" );
            }
        });

    }

    initEventListeners() {

        let self = this;

        $('#i_file').change( event => {

            var file = event.target.files[0];
            self.add3DObject( file );

        });

        $('#gfxContainer').click( event => {

            self.mouse.x = ( event.clientX / self.renderer.domElement.clientWidth ) * 2 - 1;
            self.mouse.y = - ( event.clientY / self.renderer.domElement.clientHeight ) * 2 + 1;

            self.raycaster.setFromCamera( self.mouse, self.camera );

            var intersected = self.raycaster.intersectObjects( self.loadedMeshes );

            if ( intersected.length == 0 ) {

                self.selectedMeshes.length = 0;

            }
            else if ( intersected.length > 0 ) {

                self.selectedMesh = intersected[0].object;
                self.selectedObject = self.selectedMesh.parent;

                console.log("You selected the " + self.selectedMesh.name + " mesh group of the " + self.selectedObject.name + " object.");

                // selectedMeshBoundaryBox.visible = true;
                // if ( object.boundaryBox ) object.boundaryBox.visible = false;

                // If double clicked, then focus in on the selected mesh for that cool effect.
                if ( event.ctrlKey ) {

                    self.selectedMesh.material.color.setHex( 0x999900 );
                    self.selectedMeshes.add( self.selectedMesh );
                    self.transformControls.attach( self.selectedMeshes );
                    self.transformControls.update();
                    
                }
                if ( event.type === "dblclick" ) {

                    self.camera.lookAt( self.selectedMesh.position );
                    self.camera.orbitControls.target = self.selectedMesh.position.clone();

                }

            }

        });

    }

    __render() {

        this.renderer.render( this.scene, this.camera );

    }

    __update() {

        // if ( this.selectedMesh ) {
        //
        //     if ( ! this.selectedMesh.name ) this.selectedMesh.name = "NO GROUP NAME FOUND";
        //
        //     $('#selected_obj').text( "Currently selected object: " + this.selectedObject.name );
        //     $('#obj_mesh_count').text( "Number of mesh groups in object: " + this.selectedObject.meshCount );
        //     $('#selected_mesh').text( "Currently selected object: " + this.selectedMesh.name );
        //
        // }
        // else {
        //
        //     $('#selected_obj').text( "Currently selected object: " + this.selectedObject.name );
        //     $('#obj_mesh_count').text( "Number of mesh groups in object: " + this.selectedObject.meshCount );
        //     $('#selected_mesh').text( "No mesh group currently selected." );
        //
        // }

        // let mergedMesh = this.merge_meshes( this.selectedMeshes );
        // this.selectedBoundingBox.update( mergedMesh );

    }

    merge_meshes( meshes ) {

        let mergedGeometry = new THREE.Geometry();
        meshes.forEach( mesh => {
            let geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );
            geometry.center();
            mergedGeometry.merge( geometry );
        });
        let representativeMergedMesh = new THREE.Mesh( mergedGeometry, null );

        return representativeMergedMesh;

    }

    animate() {

        requestAnimationFrame( this.animate.bind(this) );

        this.__render();
        this.__update();

    }

}

console.log("hello");