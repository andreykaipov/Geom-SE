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
    //
    // This function actually only does step 1 of the above strategy!
    static find_normalize_and_center_object_geometry( object ) {

        // Merging BufferGeometries don't work for some reason, so convert them into a regular geometry.
        var mergedGeometry = new THREE.Geometry();

        object.children.forEach( function( child ) {
            if ( child instanceof THREE.Mesh ) {

                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
                mergedGeometry.merge( geometry );

            }
        });

        mergedGeometry = new THREE.BufferGeometry().fromGeometry( mergedGeometry );

        // Scale down the merged geometry.
        // Keep the r to scale down the individual mesh geometries respectively in the below function.
        mergedGeometry.computeBoundingSphere();
        var r = mergedGeometry.boundingSphere.radius;
        mergedGeometry.scale( 1/r, 1/r, 1/r );
        mergedGeometry.__originalRadius = r;

        // Center it. Keep the offset to center the composing geometries with respect to the merged geometry.
        mergedGeometry.computeBoundingBox();
        var mergedCentroid = mergedGeometry.boundingBox.center();
        var mergedOffset = mergedCentroid.clone().multiplyScalar( -1 );
        mergedGeometry.translate( mergedOffset.x, mergedOffset.y, mergedOffset.z );

        object.mergedGeometry = mergedGeometry;
        object.mergedCentroid = mergedCentroid;

    }

    static normalize_and_center_mesh_geometries( object ) {

        var r = object.mergedGeometry.__originalRadius;
        var mergedOffset = object.mergedCentroid.clone().multiplyScalar( -1 );

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

    static compute_bounding_box_for_object( object ) {

        var boundingBox = new THREE.BoxHelper( new THREE.Mesh( object.mergedGeometry, null ) );

        object.boundingBox = boundingBox;

        object.add( boundingBox );

    }

    // This function is similar in spirit to `find_normalize_and_center_object_geometry`, except here
    // we have to change each individual mesh's geometry so that it corresponds to the properties of its mesh.
    // Take extra note of the order in which we change the geometry!
    static recompute_bounding_box_for_object( object ) {

        var mergedGeometry = new THREE.Geometry();

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {


                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );

                geometry.scale( child.scale.x, child.scale.y, child.scale.z );
                geometry.rotateX( child.rotation.x );
                geometry.rotateY( child.rotation.y );
                geometry.rotateZ( child.rotation.z );
                geometry.translate( child.position.x, child.position.y, child.position.z );

                mergedGeometry.merge( geometry );

            }

        });

        mergedGeometry.computeBoundingBox();
        var mergedCentroid = mergedGeometry.boundingBox.center();
        object.mergedGeometry = new THREE.BufferGeometry().fromGeometry( mergedGeometry );

        object.mergedCentroid = mergedCentroid.add( object.position );
        // object.mergedCentroid = mergedGeometry.boundingBox.center().add( object.position );
        // object.translateX( object.position.x - object.mergedCentroid.x );
        // object.translateY( object.position.y - object.mergedCentroid.y );
        // object.translateZ( object.position.z - object.mergedCentroid.z );
        object.__oldPosition = object.position.clone();
        object.position.copy( object.mergedCentroid );

        object.children.forEach( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.translateX( object.__oldPosition.x - object.mergedCentroid.x );
                child.translateY( object.__oldPosition.y - object.mergedCentroid.y );
                child.translateZ( object.__oldPosition.z - object.mergedCentroid.z );

                child.centroid.set( child.position.x,
                                    child.position.y,
                                    child.position.z );

            }
        });

        object.mergedGeometry.translate( object.__oldPosition.x - object.mergedCentroid.x,
                                         object.__oldPosition.y - object.mergedCentroid.y,
                                         object.__oldPosition.z - object.mergedCentroid.z )
        // object.matrixWorld.elements[ 12 ] = object.mergedCentroid.x;
        // object.matrixWorld.elements[ 13 ] = object.mergedCentroid.y;
        // object.matrixWorld.elements[ 14 ] = object.mergedCentroid.z;
        // console.log( object.matrixWorld.elements[ 13 ] );
        // object.matrixWorldNeedsUpdate = true;
        // console.log( object.matrixWorld.elements[ 13 ] );
        this.compute_bounding_box_for_object( object );

    }


    static compute_bounding_boxes_for_meshes( object ) {

        // Only consider multi-mesh objects because if the object consists of one mesh,
        // then the object's bBox will be the same as the lone mesh's bBox.
        if ( object.meshCount == "EE" ) {

            // return;

        }
        else {

            let self = this;

            object.children.forEach( function( child ) {

                if ( child instanceof THREE.Mesh ) {

                    child.boundingBox = new THREE.BoxHelper( child );

                    child.boundingBox.visible = false;

                    child.add( child.boundingBox );

                    child.boundingBox.geometry.center();

                    // self.boundingBoxes.push( child.boundingBox );

                }

            });

        }

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