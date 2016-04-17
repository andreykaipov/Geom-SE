/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJExporter = function () {};

THREE.OBJExporter.prototype = {

	constructor: THREE.OBJExporter,

	parse: function ( object ) {

		var output = [];

		var indexVertex = 0;
		var indexVertexUvs = 0;
		var indexNormals = 0;

		var vertex = new THREE.Vector3();
		var normal = new THREE.Vector3();
		var uv = new THREE.Vector2();

		var i, j, l, m, face = [];

		var parseMesh = function ( mesh ) {

			var nbVertex = 0;

			var geometry = mesh.geometry;

			var normalMatrixWorld = new THREE.Matrix3();

			if ( geometry instanceof THREE.Geometry ) {

				geometry = new THREE.BufferGeometry().setFromObject( mesh );

			}

			if ( geometry instanceof THREE.BufferGeometry ) {

				// shortcuts
				var vertices = geometry.getAttribute( 'position' );
				var indices = geometry.getIndex();

				// name of the mesh object
				output.push( 'o ' + mesh.name );

				// vertices

				if( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i++, nbVertex++ ) {

						vertex.x = vertices.getX( i );
						vertex.y = vertices.getY( i );
						vertex.z = vertices.getZ( i );

						// transfrom the vertex to world space
						vertex.applyMatrix4( mesh.matrixWorld );

						// transform the vertex to export format]

                        let vertexLine = 'v' + ' ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z;

                        output.push( vertexLine );

					}

				}

				// faces

				if( indices !== null ) {

					for ( i = 0, l = indices.count; i < l; i += 3 ) {

						for( m = 0; m < 3; m ++ ){

							j = indices.getX( i + m ) + 1;

							face[ m ] = ( indexVertex + j ) ;

						}

						// transform the face to export format
						output.push( 'f ' + face.join( ' ' ) );

					}

				} else {

					for ( i = 0, l = vertices.count; i < l; i += 3 ) {

						for( m = 0; m < 3; m ++ ){

							j = i + m + 1;

							face[ m ] = ( indexVertex + j ) ;

						}

						// transform the face to export format
						output.push( 'f ' + face.join( ' ' ) );

					}

				}

			} else {

				console.warn( 'THREE.OBJExporter.parseMesh(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;

		};

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Mesh ) {

				parseMesh( child );

			}

		} );


        let dupLines = output;

        let nodupLines = [];
        let nodupVertices = [];

        let duplicateVertexIndices = new Map();
        let vertexCount = 0;
        let goodVertexCount = 0;

        let a = 0;

        dupLines.forEach( function( line, dupLineIndex, lines ) {

            if ( line[0] === 'v' ) {

                vertexCount += 1;

                let nodupVertexIndex = nodupVertices.indexOf( line );

                if ( nodupVertexIndex < 0 ) { // line is not in nodupVertices

                    nodupLines.push( line );
                    nodupVertices.push( line );

                    goodVertexCount += 1;
                    duplicateVertexIndices.set( vertexCount, goodVertexCount );
                }
                else { // line is already in nodupVertices
                    duplicateVertexIndices.set( vertexCount, nodupVertexIndex + 1 );
                }

            }
            else if ( line[0] === 'f' ) {

                let faceVertices = line.split(' ');

                for ( let k = 1; k <= 3; k += 1 ) {

                    let vertexIndex = parseInt( faceVertices[k], 10 );

                    if ( duplicateVertexIndices.has( vertexIndex ) ) {

                        faceVertices[k] = duplicateVertexIndices.get( vertexIndex );

                    }

                }

                nodupLines.push( faceVertices.join(' ') );

            }
            else {
                nodupLines.push( line );
            }

        });

        console.log( duplicateVertexIndices );
        console.log( vertexCount );
        console.log( goodVertexCount );
        let newOutput = nodupLines.join("\n");

		return newOutput;

	}

};