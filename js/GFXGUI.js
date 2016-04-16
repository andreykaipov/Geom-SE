/**
  * @author Andrey Kaipov
  */

// See the source for this. It's really innovative and helped a lot.
// http://threejs.org/docs/scenes/material-browser.html#MeshPhongMaterial

"use strict";

class GFXGUI {

    constructor( gfxViewer ) {

        this.gui = new dat.GUI();

        this.gfxViewer = gfxViewer;
        this.selectedMesh = gfxViewer.selectedMesh;
        this.selectedObject = gfxViewer.selectedObject;

    }

    create() {
        this.create_gui_scene_controls();
        this.create_gui_transform_controls();
        this.create_gui_material_controls();

        this.create_upload_obj_file();
        this.create_export_obj_file();

        // this.__create_GUI_scale( this.gui );
        // this.__create_GUI_rotation( this.gui );
        // this.__create_GUI_translation( this.gui );
        // this.__create_export_obj_file( this.gui );

        // Makes room for the function buttons with longer names.
        $( 'li.cr.function' ).width( 1000 );

    }

    create_gui_scene_controls() {

        let controlFolder = this.gui.addFolder( "Scene" );
        this.create_gui_scene( controlFolder );

    }

    create_gui_transform_controls() {

        let controlFolder = this.gui.addFolder( "Transformations" );

        let objectFolder = controlFolder.addFolder( "object controls (world)" );
        this.create_gui_scale( "selectedObject", objectFolder );
        this.create_gui_rotation( "selectedObject", objectFolder );
        this.create_gui_translation( "selectedObject", objectFolder );

        let meshFolder = controlFolder.addFolder( "mesh controls (relative)" );
        this.create_gui_scale( "selectedMesh", meshFolder );
        this.create_gui_rotation( "selectedMesh", meshFolder );
        this.create_gui_translation( "selectedMesh", meshFolder );

    }

    create_gui_material_controls() {

        let controlFolder = this.gui.addFolder( "Mesh Material" );

        this.create_gui_material_appearance( controlFolder );
        this.create_gui_material_colors( controlFolder );
        this.create_gui_material_textures( controlFolder );

    }

    create_gui_scene( parentFolder ) {

        let folder = parentFolder;

        let parameters = {
            axes: true,
            rendererColor: 0x3a3a3a,
            cameraFOV: 60,
            renderFPS: 60
        };

        folder.add( parameters, 'axes' ).name( "axes" ).onChange( function( value ) {
            gfxViewer.axes.visible = value;
        });

        folder.addColor( parameters, 'rendererColor' ).name( "color" ).onChange( function( value ) {
            gfxViewer.renderer.setClearColor( value, 1 );
        });

        folder.add( parameters, 'cameraFOV', 0, 90 ).name( "camera fov" ).onChange( function( value ) {
            gfxViewer.camera.fov = value;
            gfxViewer.camera.updateProjectionMatrix();
        });

        folder.add( parameters, 'renderFPS', 1, 60 ).name( "render fps" ).onChange( function( value ) {
            gfxViewer.renderFPS = value
        });

    }

    /* Creates a GUI for the scale for the selectedThing under a designated folder.
     * We pass the selectedThing as a string so we can access the updated property from the gfxViewer.
     * The following methods for the rotation and translation are similar except where noted. */
    create_gui_scale( selectedThing, parentFolder ) {

        let folder = parentFolder.addFolder( "scale" );

        let parameters = { scaleX: 1, scaleY: 1, scaleZ: 1 };
        let keys = Object.keys( parameters );

        folder.add( parameters, 'scaleX', 0.1, 25 ).name( "x" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].scale.setX( value ); }
        );
        folder.add( parameters, 'scaleY', 0.1, 25 ).name( "y" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].scale.setY( value ); }
        );
        folder.add( parameters, 'scaleZ', 0.1, 25 ).name( "z" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].scale.setZ( value ); }
        );

        // Reset object scale by setting the sliders to the defaults.
        // The first three controllers are the XYZ scale sliders.
        folder.add( {
            resetScale: function() {
                for ( let i = 0; i < 3; i++ ) {
                    folder.__controllers[ i ].setValue( 1 );
                }
            }
        }, 'resetScale' ).name( "reset scale" );

        // When an object is changed with the TransformControls, the GUI sliders need to be visually updated.
        gfxViewer.transformControls.addEventListener( 'objectChange', function() {
            for ( let i = 0; i < 3; i++ ) {
                parameters[ keys[ i ] ] = gfxViewer[ selectedThing ].scale.toArray()[ i ];
                folder.__controllers[ i ].updateDisplay();
            }
        });

    }

    /* Creates a GUI for the scale for the selectedThing under a designated folder.
     * We pass the selectedThing as a string so we can access the updated property from the gfxViewer. */
    create_gui_rotation( selectedThing, parentFolder ) {

        let folder = parentFolder.addFolder( "rotation (clockwise in radians)" );

        // We need to start off with non-integer values because dat.gui is a little buggy.
        // See https://github.com/dataarts/dat.gui/issues/48 for more info.
        let parameters = { rotationX: 0.001, rotationY: 0.001, rotationZ: 0.001 };
        let keys = Object.keys( parameters );

        folder.add( parameters, 'rotationX', -Math.PI, Math.PI ).name( "x" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].rotation.x = value; }
        );
        folder.add( parameters, 'rotationY', -Math.PI, Math.PI ).name( "y" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].rotation.y = value; }
        );
        folder.add( parameters, 'rotationZ', -Math.PI, Math.PI ).name( "z" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].rotation.z = value; }
        );

        // Now set the sliders to start at 0. This is related to the above bug issue.
        for ( let i = 0; i < 3; i++ ) { folder.__controllers[ i ].setValue( 0 ); }

        folder.add( {
            resetRotation: function() {
                for ( let i = 0; i < 3; i++ ) {
                    folder.__controllers[ i ].setValue( 0 );
                }
            }
        }, 'resetRotation' ).name( "reset rotation" );

        gfxViewer.transformControls.addEventListener( 'objectChange', function() {
            for ( let i = 0; i < 3; i++ ) {
                parameters[ keys[ i ] ] = gfxViewer[ selectedThing ].rotation.toArray()[ i ];
                folder.__controllers[ i ].updateDisplay();
            }
        });

    }

    /* Creates a GUI for the scale for the selectedThing under a designated folder.
     * We pass the selectedThing as a string so we can access the updated property from the gfxViewer. */
    create_gui_translation( selectedThing, parentFolder ) {

        let folder = parentFolder.addFolder( "translation" );

        let parameters = { translationX: 0, translationY: 0, translationZ: 0 };
        let keys = Object.keys( parameters );

        folder.add( parameters, 'translationX', -25, 25 ).name( "x" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].position.setX( value ); }
        );
        folder.add( parameters, 'translationY', -25, 25 ).name( "y" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].position.setY( value ); }
        );
        folder.add( parameters, 'translationZ', -25, 25 ).name( "z" ).onChange(
            function( value ) { gfxViewer[ selectedThing ].position.setZ( value ); }
        );

        folder.add( {
            resetTranslation: function() {
                for ( let i = 0; i < 3; i++ ) {
                    folder.__controllers[ i ].setValue( 0 );
                }
            }
        }, 'resetTranslation' ).name( "reset position" );

        gfxViewer.transformControls.addEventListener( 'objectChange', function() {
            for ( let i = 0; i < 3; i++ ) {
                parameters[ keys[ i ] ] = gfxViewer[ selectedThing ].rotation.toArray()[ i ];
                folder.__controllers[ i ].updateDisplay();
            }
        });

    }

    create_gui_material_appearance( parentFolder ) {

        let folder = parentFolder.addFolder( "Appearance" );

        let parameters = {
            opacity: 1,
            shading : THREE.FlatShading,
            side : THREE.DoubleSide,
            wireframe : false,
            depthTest : true
        }

        let constants = {
            shadingOptions : {
                "flat shading" : THREE.FlatShading,
                "smooth shading" : THREE.SmoothShading
            },
            sideOptions : {
                "front side" : THREE.FrontSide,
                "back side" : THREE.BackSide,
                "double side" : THREE.DoubleSide
            }
        };

        folder.add( parameters, 'opacity', 0, 1 ).onChange( function( value ) {
            if ( value == 1 ) {
                gfxViewer.selectedMesh.material.transparent = false;
            }
            else {
                gfxViewer.selectedMesh.material.transparent = true;
                gfxViewer.selectedMesh.material.opacity = value;
            }
        });

        // The integers 1/2 corresponds to Flat/Smooth shading respectively.
        folder.add( parameters, 'shading', constants.shadingOptions ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.shading = parseInt( value );
            gfxViewer.selectedMesh.material.needsUpdate = true;
        });

        // The integers 0/1/2 corresponds to Front/Back/Double side respectively.
        folder.add( parameters, 'side', constants.sideOptions ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.side = parseInt( value );
            gfxViewer.selectedMesh.material.needsUpdate = true;
        });

        folder.add( parameters, 'wireframe' ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.wireframe = value;
        });

        folder.add( parameters, 'depthTest' ).name( "depth test" ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.depthTest = value;
        });

        // When a new object is selected by our raycaster, update the parameters of the GUI.
        $('body').click( function() {
            let intersected = gfxViewer.raycaster.intersectObjects( gfxViewer.loadedMeshesInScene );
            let material = gfxViewer.selectedMesh.material;
            if ( intersected.length > 0 ) {
                parameters.opacity = material.opacity;
                parameters.shading = material.shading;
                parameters.side = material.side;
                parameters.wireframe = material.wireframe;
                parameters.depthTest = material.depthTest;
                folder.__controllers.forEach( controller => controller.updateDisplay() );
            }
        });

    }

    create_gui_material_colors( parentFolder ) {

        let folder = parentFolder.addFolder( "Color" );

        let parameters = {
            diffuse : 0x000000,
            emissive : 0x000000,
            emissiveIntensity : 1,
            specular : 0x000000,
            shininess : 30
        }

        folder.addColor( parameters, 'diffuse' ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.color.setHex( value );
        });

        folder.addColor( parameters, 'emissive' ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.emissive.setHex( value );
        });

        folder.add( parameters, 'emissiveIntensity', 0, 10 ).name( "intensity" ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.emissiveIntensity = value;
        });

        folder.addColor( parameters, 'specular' ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.specular.setHex( value );
        });

        folder.add( parameters, 'shininess', 0, 100 ).onChange( function( value ) {
            gfxViewer.selectedMesh.material.shininess = value;
        });

        $('body').click( function() {
            let intersected = gfxViewer.raycaster.intersectObjects( gfxViewer.loadedMeshesInScene );
            let material = gfxViewer.selectedMesh.material;
            if ( intersected.length > 0 ) {
                parameters.diffuse = material.color.getHex();
                parameters.emissive = material.emissive.getHex();
                parameters.emissiveIntensity = material.emissiveIntensity;
                parameters.specular = material.specular.getHex();
                parameters.shininess = material.shininess;
                folder.__controllers.forEach( controller => controller.updateDisplay() );
            }
        });

    }

    create_gui_material_textures( parentFolder ) {

        let parameters = {
            texture : gfxViewer.textureFilePaths[ "no-texture" ]
        }

        let folder = parentFolder.addFolder( "Textures" );

        folder.add({
            uploadTexture: function() {

                $( '#upload_texture_file' ).change( function( event ) {

                    let file = event.target.files[0];

                    let filePath = window.URL.createObjectURL( file );
                    gfxViewer.textureFilePaths[ file.name ] = filePath;

                    let loader = new THREE.TextureLoader();
                    let texture = loader.load( filePath , function( texture ) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.set(1,1);
                        texture.needsUpdate = true;
                    });
                    gfxViewer.loadedTextures[ filePath ] = texture;

                    updateTemplate();

                }).click();

            }
        }, 'uploadTexture' ).name( "upload a texture" );

        folder.add( parameters, 'texture', gfxViewer.textureFilePaths ).name( "textures" );

        function updateTemplate() {

            folder.__controllers[1].remove();
            folder.add( parameters, 'texture', gfxViewer.textureFilePaths ).name( "textures" ).onChange( function ( value ) {
                console.log( value );
                console.log( gfxViewer.loadedTextures[ value ] );
                if ( value == "no-texture-url" ) {
                    gfxViewer.selectedMesh.material.map = null;
                    gfxViewer.selectedMesh.material.needsUpdate = true;
                }
                else {
                    let selectedTexture = gfxViewer.loadedTextures[ value ];
                    OBJHandler.compute_mesh_uvs( gfxViewer.selectedMesh );
                    gfxViewer.selectedMesh.material.map = selectedTexture;
                    gfxViewer.selectedMesh.material.needsUpdate = true;
                }
            });

        }

    }

    create_upload_obj_file() {

        this.gui.add({
            uploadObj: function() {

                document.getElementById("i_file").click();

            }
        }, 'uploadObj' ).name( "upload an obj file" );

    }

    create_export_obj_file() {

        let self = this;

        this.gui.add({
            exportObj: function() {

                let exporter = new THREE.OBJExporter();

                let objAsString = exporter.parse( self.gfxViewer.selectedObject );
                let objAsFile = new Blob( [ objAsString ], { type: "text/plain" } );
                let objFilePath = window.URL.createObjectURL( objAsFile );

                let link = document.getElementById("o_file")
                link.href = objFilePath;
                link.download = self.gfxViewer.selectedObject.name.slice(0,-4) + "_modified.obj";
                link.click()

            }
        }, 'exportObj' ).name( "export as obj" );

    }
}



/*
function createGUI() {

    var gui = new dat.GUI();
    gui.domElement.id = "gui";

    // console.log(gui);

    createGuiScale( gui );
    createGuiRotation( gui );
    createGuiTranslation( gui );
    createGuiMaterial( gui );
    createUploadObjFile( gui );
    createComputeInfo( gui );

    // Start with a collpased GUI.
    gui.close();

}

function createComputeInfo( gui ) {

    gui.add({
        computeInfo: function() {
            computeInfoForMesh( selectedMesh );
            showInfoForMesh( selectedMesh );
        }
    }, 'computeInfo').name( "compute.." );

}

*/