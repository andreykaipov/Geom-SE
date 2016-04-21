/**
  * @author Andrey Kaipov / https://github.com/andreykaipov
  *
  * This class is a static class meant for handling and manipulating THREE.Meshes.
  * It is primarily used to help the OBJHandler, but is used in the GFXGUI too.
  */

"use strict";

class MeshHandler {

    /* Assigns a random color to the mesh, uses flat shading, and double sided faces. */
    static apply_default_material( mesh ) {

        mesh.material = new THREE.MeshPhongMaterial({
            color: 0xffffff * Math.random(),
            shading: THREE.FlatShading,
            side: THREE.DoubleSide
        });

    }

    /* Computes the face and vertex normals of a mesh. While we're at, also count them. */
    static compute_face_and_vertex_normals( mesh ) {

        // A BufferGeometry cannot compute face normals and merge vertices, so convert.
        var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

        geometry.computeFaceNormals();
        geometry.mergeVertices();
        geometry.computeVertexNormals();

        mesh.userData.threejsVertices = geometry.vertices.length;
        mesh.userData.threejsFaces = geometry.faces.length;

        mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

    }

    /* Draws the bounding box for the mesh. */
    static compute_mesh_bounding_box( mesh ) {

        mesh.userData.boundingBox = new THREE.BoxHelper( mesh );
        mesh.userData.boundingBox.visible = false;
        mesh.userData.boundingBox.geometry.center();

        mesh.add( mesh.userData.boundingBox );

    }

    /* Adds a mesh into an array. The array is supposed to be used by the raycaster. */
    static recognize_mesh_for_raycaster( mesh, loadedMeshes ) {

        loadedMeshes.push( mesh );

    }

    /* Computes the info (vertices, edges, etc..) of this mesh by using a half-edge data structure. */
    static compute_he_info_for_mesh( mesh ) {

        // Find the simple mesh that corresponds to the selected mesh in the scene.
        // Since the indices will match, this is easy.
        let index = mesh.parent.children.indexOf( mesh );
        let correspondingSimpleMesh = mesh.parent.userData.simpleMeshes[ index ];

        // Construct a half-edge data structure from it.
        let heMesh = new HalfEdgeMesh( correspondingSimpleMesh );
        heMesh.name = "HalfEdgeMesh for " + mesh.name;
        heMesh.build();
        heMesh.orient();

        mesh.userData.heVertices = heMesh.vertices;
        mesh.userData.heEdges = heMesh.edges;
        mesh.userData.heFaces = heMesh.faces;
        mesh.userData.heCharacteristic = heMesh.characteristic;
        mesh.userData.heGenus = heMesh.genus;

    }

    /* Assigns some default uv coordinates to this mesh so we can map textures onto it.
     * From here: http://stackoverflow.com/a/20775508/4085283. */
    static assign_default_mesh_uvs( mesh ) {

        let geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

        geometry.computeBoundingBox();

        let max = geometry.boundingBox.max;
        let min = geometry.boundingBox.min;

        let offset = new THREE.Vector2( 0 - min.x, 0 - min.y );
        let range = new THREE.Vector2( max.x - min.x, max.y - min.y );

        geometry.faceVertexUvs[0] = [];
        let faces = geometry.faces;

        for ( let i = 0; i < geometry.faces.length ; i++ ) {

            var v1 = geometry.vertices[ faces[i].a ];
            var v2 = geometry.vertices[ faces[i].b ];
            var v3 = geometry.vertices[ faces[i].c ];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2( (v1.x + offset.x) / range.x , (v1.y + offset.y) / range.y ),
                new THREE.Vector2( (v2.x + offset.x) / range.x , (v2.y + offset.y) / range.y ),
                new THREE.Vector2( (v3.x + offset.x) / range.x , (v3.y + offset.y) / range.y )
            ]);

        }

        geometry.uvsNeedUpdate = true;

        mesh.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

    }

}
