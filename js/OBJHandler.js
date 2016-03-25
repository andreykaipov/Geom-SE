class OBJHandler {

    constructor() {
        this.boundingBoxes = [];
    }

    static apply_default_materials( object ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.material = new THREE.MeshPhongMaterial({
                    color: 0xffffff * Math.random(),
                    side: THREE.DoubleSide
                });

            }

        });

    }

    // As of r74 OBJLoader, o and g tags are processed as their own separate meshes (and hence their own geometries).
    // Because of this, we have to jump through a couple of hoops to properly normalize and center the entire object.
    //   1. Merge each inidividual geometry, and then normalize and center the merged geometry.
    //   2. Scale each geometry down by the merged geometry's bounding sphere's radius.
    //   3. "Centralize" each geometry towards the origin with respect to the merged geometry's bounding box.
    //   4. Now center each geometry at the origin with respect to its own (!) bounding box.
    //   5. Now, move the mesh corresponding to each geometry back to where it just was in step 4.!
    // This method is as short as I can get it without losing understanding of it!
    static normalize_and_center_geometries( object ) {

        // Merging BufferGeometries don't work for some reason, so convert them into a regular geometry.
        var mergedGeometry = new THREE.Geometry();

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
                mergedGeometry.merge( geometry );

            }

        });

        // Scale down merged geometry. Keep the r to scale down the composing geometries...
        mergedGeometry.computeBoundingSphere();
        var r = mergedGeometry.boundingSphere.radius;
        mergedGeometry.scale( 1/r, 1/r, 1/r );

        // Center it. Keep the offset to center the composing geometries with respect to the merged geometry.
        mergedGeometry.computeBoundingBox();
        var mergedCentroid = mergedGeometry.boundingBox.center();
        var mergedOffset = mergedCentroid.clone().multiplyScalar( -1 );
        mergedGeometry.translate( mergedOffset.x, mergedOffset.y, mergedOffset.z );

        object.mergedGeometry = mergedGeometry;
        object.mergedCentroid = mergedCentroid;

        var meshCount = 0;

        // Traverse again, now to normalize each individual geometry.
        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.geometry.scale( 1/r, 1/r, 1/r );

                child.geometry.translate( mergedOffset.x, mergedOffset.y, mergedOffset.z );

                child.geometry.computeBoundingBox();
                var centroid = child.geometry.boundingBox.center();
                var offset = centroid.clone().negate();
                //
                child.geometry.translate( offset.x, offset.y, offset.z );
                child.position.set( centroid.x, centroid.y, centroid.z );

                child.geometry.computeBoundingBox();

                child.centroid = centroid;

            }

        });

    }

    static create_bounding_boxes_for_meshes( object ) {

        let self = this;

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.boundingBox = new THREE.BoxHelper( child );

                child.add( child.boundingBox );

                child.boundingBox.geometry.center();

                self.boundingBoxes.push( child.boundingBox );

            }

        });

    }

    // Counts the number of meshes in an object.
    static find_mesh_counts( object ) {

        object.meshCount = 0;

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                object.meshCount += 1;

            }

        });

    }

    // Computes the face and vertex normals of each composing mesh of each object.
    static compute_face_and_vertex_normals( object ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );

                geometry.computeFaceNormals();
                geometry.mergeVertices();
                geometry.computeVertexNormals();

                child.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

            }

        });

    }

    static recognize_meshes_for_raycaster( object, loadedMeshes ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                loadedMeshes.push( child );

            }

        });

    }
}