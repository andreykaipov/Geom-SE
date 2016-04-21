/**
  * @author Andrey Kaipov / https://github.com/andreykaipov
  *
  * This class is for the logic behind the graphics component of the application.
  * It creates a nice foundation to easily implement interaction via the GFXGUI.
  */

"use strict";

class GFXViewer {

    constructor() {

        // Scene, camera, and renderer.
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera();
        this.camera.fov = 60; // in degs
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.near = 0.05;
        this.camera.far = 8000;
        this.camera.position.set( 0, 0.1, 2 );
        this.camera.updateProjectionMatrix();

        this.renderer = new THREE.WebGLRenderer( { alpha: true } );
        this.renderer.setClearColor( 0x3a3a3a, 1 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        $('#gfxContainer').append( this.renderer.domElement );

        // Render how many frames per second?
        this.renderFPS = 60;

        // For camera control with the mouse.
        this.camera.orbitControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

        // For raycaster for selection of meshes.
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.loadedMeshesInScene = [];

        // For like everything!
        this.selectedMesh = new THREE.Mesh();
        this.selectedMesh.name = "undefined";
        this.selectedObject = new THREE.Object3D();
        this.selectedObject.name = "undefined";

        // Add xyz axes and keep a reference to it.
        this.axes = this.makeAxes( 5 );
        this.scene.add( this.axes );

        // For control of selected mesh and object.
        this.transformControls = new THREE.TransformControls( this.camera, this.renderer.domElement );
        this.transformControls.addEventListener( 'change', this.render.bind( this ) );
        this.transformControls.setSize( 0.6 );
        this.transformControls.visible = false;
        this.scene.add( this.transformControls );

        // For organizing our lights. This is initialized down below, and used from the GUI.
        this.lights = {
            ambient: new THREE.AmbientLight( 0x000000 ),
            directional: {
                "dir-light-1": new THREE.DirectionalLight( 0xffffff, 1 ),
                "controls": new THREE.TransformControls( this.camera, this.renderer.domElement )
            }
        };

        // Flag for us in the GFXGUI. We will check this flag before we manipulate any bounding boxes.
        this.boundingBoxesOn = true;

        // For organzing our textures. This is useed from the GUI.
        this.textureFilePaths = { "no-texture": "no-texture-url" };
        this.loadedTextures = { "no-texture-url": new THREE.Texture() };

        // Let's just initialize them once.
        this.objLoader = new THREE.OBJLoader();
        this.objExporter = new THREE.OBJExporter();
        this.textureLoader = new THREE.TextureLoader();

    }

    /* Get some initial lights into the scene. */
    init_lights() {

        // Add the ambient light. But remember - it's black ambient light by default!
        this.scene.add( this.lights.ambient );

        // Initialize our directional light, and attach some controls to it.
        this.init_directional_light( this.lights.directional["dir-light-1"] );
        this.lights.directional["controls"].setSize( 0.3 );
        this.scene.add( this.lights.directional["controls"] );

        // Update the light's guide-line's whenever the directional light is moved.
        this.lights.directional["controls"].addEventListener( 'objectChange', function( event ) {
            let directionalLight = event.target.object;
            directionalLight.children[0].geometry.vertices[0] = directionalLight.position.clone().negate();
            directionalLight.children[0].geometry.verticesNeedUpdate = true;
        });

    }

    /* Position the light, attach the controls, add the guide-line, and add it to the scene.
     * This method will also be used in the GFXGUI when we are adding lights. */
    init_directional_light( directionalLight ) {

        directionalLight.position.set( 0, 1, 0 );

        this.lights.directional["controls"].attach( directionalLight );

        // This line represents the direction the directional light is shining.
        let lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(
            directionalLight.position.clone().negate(),
            new THREE.Vector3( 0, 0, 0 )
        );
        let line = new THREE.Line( lineGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }) );
        directionalLight.add( line );

        this.scene.add( directionalLight );

    }

    /* Just initializes the below event handlers. */
    init_event_handlers() {

        this.handle_window_onload();
        this.handle_window_resize();
        this.handle_object_uploads();
        this.handle_raycaster_for_selection();
        this.handle_bounding_box_controls();
        this.handle_keyboard_transform_controls();

    }

    /* Reads an object from its file path, calculates some info, and adds it into the scene. */
    add_obj_file( filePath, fileName ) {

        // If a file name is not provided, recover it from the URL.
        if ( fileName === undefined ) {
            fileName = filePath.split('\\').pop().split('/').pop();
        }

        let self = this;

        $.ajax({
            url: filePath,
            contents: { obj: /obj/ },
            contentType: 'text/plain',
            mimeType: 'text/plain; charset=x-user-defined',
            success: function( fileAsString ) {

                let object = self.objLoader.parse( OBJParser.triangulate_convex( fileAsString ) );
                object.name = fileName;
                object.userData.filePath = filePath;
                object.userData.simpleMeshes = OBJParser.parse_to_simple_meshes( fileAsString );

                OBJHandler.find_mesh_counts( object );
                OBJHandler.apply_default_material( object );
                OBJHandler.normalize_object( object );
                OBJHandler.compute_face_and_vertex_normals( object );
                OBJHandler.compute_object_bounding_box( object );
                OBJHandler.compute_constituent_bounding_boxes( object );
                OBJHandler.recognize_object_for_raycaster( object, self.loadedMeshesInScene );

                // Hide previous selected bounding boxes before loading again.
                self.show_bounding_boxes( false );

                self.selectedObject = object;
                self.selectedMesh = object.children[ 0 ];
                self.transformControls.attach( object );

                self.scene.add( object );

                console.log( `File was read and loaded into scene successfully.
                              Name: ${fileName}
                              Path: ${filePath}` );
            }
        });

    }

    /* Toggles the bounding boxes of the selected mesh and selected object.
     * If the object is a single-mesh object, then we will always hide the bounding box! */
    show_bounding_boxes( toggle ) {

        let meshBBox = gfxViewer.selectedMesh.userData.boundingBox;
        let objBBox = gfxViewer.selectedObject.userData.boundingBox;

        if ( meshBBox ) {
            meshBBox.visible = toggle;
        }
        if ( objBBox ) {
            if ( gfxViewer.selectedObject.userData.meshCount === 1 ) {
                objBBox.visible = false;
            }
            else {
                objBBox.visible = toggle;
            }
        }

    }

    /* If there is a hash in the url, treat is as the url to an .obj file, and load it on page load. */
    handle_window_onload() {

        let self = this;

        let hash = window.location.hash;

        if ( hash ) {

            let fileURL = hash.slice( 1 );

            window.onload = self.add_obj_file( fileURL );

        }

    }

    /* Promps the upload of a local .obj files. */
    handle_object_uploads() {

        let self = this;

        $( '#input-obj-file' ).change( function( event ) {

            let file = event.target.files[0];
            let filePath = window.URL.createObjectURL( file );

            self.add_obj_file( filePath, file.name );

        });

    }

    /* Selects a mesh via a raycaster. */
    handle_raycaster_for_selection() {

        let self = this;

        $('body').on( 'click dblclick' , function( event ) {

            self.mouse.x = ( event.clientX / self.renderer.domElement.clientWidth ) * 2 - 1;
            self.mouse.y = - ( event.clientY / self.renderer.domElement.clientHeight ) * 2 + 1;

            self.raycaster.setFromCamera( self.mouse, self.camera );

            let intersected = self.raycaster.intersectObjects( self.loadedMeshesInScene );

            if ( intersected.length > 0 ) {

                self.transformControls.setSpace( "local" );

                // Before assigning the new selected mesh and selected object,
                // hide the old selected stuff's bounding boxes, if they exist.
                if ( self.selectedObject.userData.boundingBox && self.boundingBoxesOn ) {
                    self.selectedObject.userData.boundingBox.visible = false;
                }
                if ( self.selectedMesh.userData.boundingBox && self.boundingBoxesOn ) {
                    self.selectedMesh.userData.boundingBox.visible = false;
                }

                // Assign the new selected stuff.
                self.selectedMesh = intersected[0].object;
                self.selectedObject = self.selectedMesh.parent;

                console.log("You selected the " + self.selectedMesh.name + " mesh group of the " + self.selectedObject.name + " object.");

                // Show the new selected mesh's bounding box.
                if ( self.boundingBoxesOn ) {
                    self.selectedMesh.userData.boundingBox.visible = true;
                }
                self.transformControls.attach( self.selectedMesh );

                // If double clicked, then focus in on the selected mesh for that cool effect.
                if ( event.type === "dblclick" ) {

                    self.camera.lookAt( self.selectedMesh.position );
                    self.camera.orbitControls.target = self.selectedMesh.position.clone();

                }

            }

        });

    }

    /* Pressing and holding the shift key temporarily reassembles the constituent meshes of an object
     * back together at the object's center. Pressing G at this time will permanently glue it back together.
     * Alternatively, one can press B */
    handle_bounding_box_controls() {

        let self = this;
        let shiftKeyUp = true; // jQuery doesn't support shift as a "keypress" event,
                               // so we make our shift keydown event behave like a keypress with this flag.

        $('body').keydown( function( event ) {

            // Fire only when the shift key is up and the shift key is being pressed.
            // Additionally, gluing back only makes sense if the object has several meshes. <--- Look into this.
            if ( shiftKeyUp && event.keyCode == 16 && self.selectedObject.userData.meshCount > 1 ) { // Shift key

                shiftKeyUp = false; // Settings this to false prevents this if-statement from running more than once.

                self.transformControls.setSpace( "world" );

                if ( self.boundingBoxesOn ) {
                    self.selectedMesh.userData.boundingBox.visible = false;
                    self.selectedObject.userData.boundingBox.visible = true;
                }
                self.transformControls.attach( self.selectedObject );

                self.selectedObject.children.forEach( function( child ) {

                    if ( child instanceof THREE.Mesh ) {

                        child.userData.oldPosition = child.position.clone();
                        child.position.copy( child.userData.geomCenter );

                    }

                });

            }

        }).keyup( function( event ) {

            // If the G key is coming back up, lift the shift key back up immediately.
            // This leaves the meshes glued back together at the object's center.
            if ( event.keyCode == 71 ) { // G key

                shiftKeyUp = true;

            }

            if ( event.keyCode == 66 ) { // B key

                self.selectedMesh.userData.boundingBox.visible = false;

                OBJHandler.recompute_object_bounding_box( self.selectedObject );
                self.transformControls.attach( self.selectedObject );

                if ( ! self.boundingBoxesOn ) {
                    self.selectedObject.userData.boundingBox.visible = false;
                }

                shiftKeyUp = true;

            }

            // Fires only when the shift key is down, and is just being let go.
            if ( ! shiftKeyUp && event.keyCode == 16 ) {  // Shift key

                shiftKeyUp = true; // Reset this flag.

                self.transformControls.setSpace( "local" );

                if ( self.boundingBoxesOn ) {
                    self.selectedMesh.userData.boundingBox.visible = true;
                    self.selectedObject.userData.boundingBox.visible = false;
                }
                self.transformControls.attach( self.selectedMesh );

                self.selectedObject.children.forEach( function( child ) {

                    if ( child instanceof THREE.Mesh ) {

                        child.position.copy( child.userData.oldPosition );

                    }

                });

            }

        });

    }

    /* Keyboard controls for the transforms controls. */
    handle_keyboard_transform_controls() {

        let self = this;

        $('body').keydown( function( event ) {

            switch ( event.keyCode ) {
                case 48: // 0
                    self.transformControls.setSpace( self.transformControls.space === "local" ? "world" : "local" );
                    break;
                case 49: // 1
                    self.transformControls.setMode( "translate" );
                    break;
                case 50: // 2
                    self.transformControls.setMode( "rotate" );
                    break;
                case 51: // 3
                    self.transformControls.setMode( "scale" );
                    break;
                case 187: // =/+ key
                case 107: // numpad +
                    self.transformControls.setSize( self.transformControls.size + 0.1 );
                    break;
                case 189: // -/_ key
                case 109: // numpad -
                    self.transformControls.setSize( Math.max( self.transformControls.size - 0.1, 0.1 ) );
                    break;
                case 17: // CTRL key
                    // Toggle snap-to-grid for the selectedObject.
                    if ( self.transformControls.translationSnap == null && self.transformControls.rotationSnap == null) {
                        self.transformControls.setTranslationSnap( 1 );
                        self.transformControls.setRotationSnap( THREE.Math.degToRad(15) );
                    }
                    else {
                        self.transformControls.setTranslationSnap( null );
                        self.transformControls.setRotationSnap( null );
                    }
                    break;
                case 72: // H
                    // Toggle visibility of selected object controls
                    self.transformControls.visible = (self.transformControls.visible ? false : true);
                    break;
            }

        });

    }

    // On resize of the window, resize the renderer and adjust camera accordingly.
    handle_window_resize() {

        $(window).resize( event => {
            this.renderer.setSize( window.innerWidth,  window.innerHeight );
            this.camera.aspect = window.innerWidth /  window.innerHeight;
            this.camera.updateProjectionMatrix();
        });

    }

    animate() {

        let self = this;

        setTimeout( function() {
            requestAnimationFrame( self.animate.bind( self ) );
        }, 1000 / self.renderFPS );

        this.render();
        this.update();

    }

    render() {

        this.renderer.render( this.scene, this.camera );

    }

    update() {

        this.transformControls.update();
        this.update_selection_text();

    }

    update_selection_text( mesh ) {

        $( '#selected-obj' ).text( `Selected object: ${this.selectedObject.name}` );
        $( '#obj-mesh-count' ).text( `Object mesh count: ${this.selectedObject.userData.meshCount}` );

        $( '#selected-mesh' ).text( `Selected mesh group: ${this.selectedMesh.name}` );
        $( '#threejs-vertices' ).text( `-> vertices: ${this.selectedMesh.userData.threejsVertices}` );
        $( '#threejs-faces' ).text( `-> faces: ${this.selectedMesh.userData.threejsFaces}` );

        $( '#he-vertices' ).text( `-> vertices: ${this.selectedMesh.userData.heVertices}` );
        $( '#he-edges' ).text( `-> edges: ${this.selectedMesh.userData.heEdges}` );
        $( '#he-faces' ).text( `-> faces: ${this.selectedMesh.userData.heFaces}` );
        $( '#he-characteristic' ).text( `-> characteristic: ${this.selectedMesh.userData.heCharacteristic}` );
        $( '#he-genus' ).text( `-> genus: ${this.selectedMesh.userData.heGenus}` );

    }

    makeAxes( length ) {

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
    		0, 1, 0,  0, 1, 0.6, // +y is green to kinda green.
    		0, 0, 1,  0.6, 0, 1, // +z is blue to kinda blue.
            0, 1, 1,  0, 0.4, 1, // -x is cyan to kinda cyan.
    		1, 0, 1,  1, 0, 0.4, // -y is magenta to kinda magenta.
    		1, 1, 0,  0.4, 1, 0  // -z is yellow to kinda yellow.
    	] );

    	var geometry = new THREE.BufferGeometry();
    	geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    	geometry.addAttribute( 'color', new THREE.BufferAttribute( vertexColors, 3 ) );

    	var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

    	return new THREE.LineSegments( geometry, material );

    }

}
