/**
  * @author Andrey Kaipov (https://github.com/andreykaipov)
  *
  * This class is a static class and meant for handling and manipulating
  * ThreeJS objects and their constituent meshes.
  *
  * This class is primarily used when loading an object from an .obj file.
  * Specifically, take a look at GFXViewer#listen_handle_object_uploads().
  *
  */

class OBJHandler {

    /* Counts the number of meshes in an object.
     * Be careful - it's not always going to be the length of the children array! */
    static find_mesh_counts( object ) {

        object.userData.meshCount = 0;

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                object.userData.meshCount += 1;

            }

        });

    }

    /* Assigns a random color to each mesh of an object, and use double sided faces. */
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

    /* Merges the geometries of the constituent meshes of an object.
     * Take note of the order in which we manipulate each constituent geometry! */
    static compute_merged_geometry( object ) {

        var mergedGeometry = new THREE.Geometry();

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );

                // The cool spread operator (...) helps us to save horizontal space. :-)
                // We have to convert each ThreeJS vector to an array before we can spread though!
                geometry.scale( ...child.scale.toArray() );

                // A mesh's rotation gets its local rotation, and has an Euler order of XYZ.
                // Since geometry rotation is extrinsic, we have to rotate in an order of ZYX.
                // See https://en.wikipedia.org/wiki/Euler_angles#Conversion_between_intrinsic_and_extrinsic_rotations
                geometry.rotateZ( child.rotation.z );
                geometry.rotateY( child.rotation.y );
                geometry.rotateX( child.rotation.x );

                geometry.translate( ...child.position.toArray() );

                mergedGeometry.merge( geometry );

            }

        });

        // Convert back to a BufferGeometry for efficiency, and compute some useful things.
        object.userData.mergedGeometry = new THREE.BufferGeometry().fromGeometry( mergedGeometry );
        object.userData.mergedGeometry.computeBoundingSphere();
        object.userData.mergedGeometry.computeBoundingBox();

    }

    /* As of r74 OBJLoader, o and g tags are processed as their own separate meshes (and thus their own geometries).
     * Because of this, we have to jump through a couple of hoops to properly normalize the entire object,
     * including its constituent meshes.
     *   1. Merge each inidividual geometry, and then normalize and center the merged geometry.
     *   2. Scale each geometry down by the merged geometry's bounding sphere's radius.
     *   3. "Centralize" each geometry towards the origin with respect to the merged geometry's center.
     *   4. Now, center each geometry at the origin with respect to its own (!) bounding box.
     *   5. Now, move the MESH corresponding to each geometry back to where it just was in step 4.! */
    static normalize_object( object ) {

        this.compute_merged_geometry( object );

        // Scale down the merged geometry.
        let radius = object.userData.mergedGeometry.boundingSphere.radius;
        object.userData.mergedGeometry.scale( 1/radius, 1/radius, 1/radius );

        // Once scaled, center it at the origin by using the negation of the geometry's center.
        let mergedCenter = object.userData.mergedGeometry.boundingBox.center();
        object.userData.mergedGeometry.translate( ...mergedCenter.clone().negate().toArray() );

        // Step 1 done. Now to normalize each constituent geometry.
        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                // Step 2 and 3.
                child.geometry.scale( 1/radius, 1/radius, 1/radius );
                child.geometry.translate( ...mergedCenter.clone().negate().toArray() );

                // Step 4.
                child.geometry.computeBoundingBox();
                child.userData.geomCenter = child.geometry.boundingBox.center();
                child.geometry.translate( ...child.userData.geomCenter.clone().negate().toArray() );

                // Step 5.
                child.position.set( ...child.userData.geomCenter.toArray() );

            }

        });

    }

    /* Computes the face and vertex normals of each constituent mesh of an object. */
    static compute_face_and_vertex_normals( object ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                // A BufferGeometry cannot compute face normals and merge vertices, so convert.
                var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );

                geometry.computeFaceNormals();
                geometry.mergeVertices();
                geometry.computeVertexNormals();

                child.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

            }

        });

    }

    /* Draws a bounding box for an object by using its merged geometry. */
    static draw_object_bounding_box( object ) {

        var boundingBox = new THREE.BoxHelper( new THREE.Mesh( object.userData.mergedGeometry, null ) );

        object.userData.boundingBox = boundingBox;

        object.add( boundingBox );

    }

    /* Draws a bounding box for each constituent mesh of an object. */
    static draw_mesh_bounding_boxes( object ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.userData.boundingBox = new THREE.BoxHelper( child );

                child.userData.boundingBox.visible = false;

                child.add( child.userData.boundingBox );

                child.userData.boundingBox.geometry.center();

            }

        });

    }

    /* Adds the constituent meshes of an object into an array.
     * It's purpose is so our raycaster can select meshes from this array. */
    static recognize_meshes_for_raycaster( object, loadedMeshes ) {

        object.children.forEach( function( child ) {

            if ( child instanceof THREE.Mesh ) {

                loadedMeshes.push( child );

            }

        });

    }

    /* Recomputes an object's bounding box.
     * The way this works is by re-merging the constituent geometries, finding its center,
     * and using that as the new center for the object. However, this also moves the
     * constituent meshes, so we need to move them back to where they just were. */
    static recompute_object_bounding_box( object ) {

        this.compute_merged_geometry( object );

        // Find the center of the re-merged geometry.
        object.userData.mergedGeometry.computeBoundingBox();
        let mergedCenter = object.userData.mergedGeometry.boundingBox.center();

        // Move the object to it's new center. Note its current position.
        let newCenter = mergedCenter.add( object.position );
        let oldPosition = object.position.clone();
        object.position.copy( newCenter );

        // Find out how much we need to move each mesh back.
        let offset = oldPosition.clone().sub( mergedCenter );

        object.children.forEach( function( child ) {
            if ( child instanceof THREE.Mesh ) {

                child.position.add( offset );
                child.userData.geomCenter.copy( child.position );

            }
        });

        object.userData.mergedGeometry.translate( ...offset.toArray() );

        object.remove( object.userData.boundingBox );
        this.draw_object_bounding_box( object );

    }

}
