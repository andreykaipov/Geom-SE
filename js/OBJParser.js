"use strict";

class OBJParser {

    // Triangulates faces as if they were convex polygons because I can't think of a way
    // to implement a sophisticated polygon triangulation algorithm in 3D.
    // If we could assume that the obj file contains planar faces, then we could find the plane
    // on which the concave face vertices lie on, and then implement a 2D triangulation alg by a
    // change of basis, but I think that's a bold assumption! Plus that sounds hard either way.
    static triangulateConvex( fileAsString ) {

        let lines = fileAsString.split('\n');

        let fileAsStringTriangulated = "";

        lines.forEach( line => {

            line = line.trim();

            if ( line[0] === 'f' && line[1] === ' ' ) {

                let faceVertices = line.split(' ').map(v => parseInt(v, 10)).filter(Boolean);

                let fixedVertex = faceVertices[0];

                for ( let k = 1; k <= faceVertices.length - 2; k++ ) {

                    fileAsStringTriangulated += 'f' + ' ' + fixedVertex
                                                    + ' ' + faceVertices[k]
                                                    + ' ' + faceVertices[k + 1] + '\n';
                }

            }
            else {

                fileAsStringTriangulated += line + '\n'

            }

        });

        return fileAsStringTriangulated;

    }


    static parseToSimpleMesh( fileAsString ) {

        let lines = fileAsString.split('\n');

        let allVertices = [];
        let nonVertexLines = [];
        let meshes = [];
        let meshCount = -1;
        let namedGroupedExists = false;

        lines.forEach( line => {

            line = line.trim();

            if ( line[0] === 'v' && line[1] === ' ' ) {

                allVertices.push( line.split(' ').filter(Boolean).map(parseFloat).splice(1) );

            }
            else {

                nonVertexLines.push( line );

                if ( line[0] === 'g' && line[1] === ' ' ) {

                    namedGroupedExists = true;

                }

            }

        });

        if ( ! namedGroupedExists ) {

            nonVertexLines.unshift("g ~ NO GROUP NAME ~");

        }

        nonVertexLines.forEach( line => {

            if ( line[0] === 'g' && line[1] === ' ' ) {

                let mesh = {
                    name: line.substr( 2 ),
                    vertices: new Map(),
                    faces: []
                };

                meshes.push( mesh );
                meshCount += 1;

            }
            else if ( line[0] === 'f' && line[1] === ' ' ) {

                let face = line.split(' ').filter(Boolean).map(x => parseInt(x, 10) - 1).splice(1);

                meshes[ meshCount ].faces.push( face );

                face.forEach( vIndex => meshes[ meshCount ].vertices.set( vIndex, allVertices[vIndex] ) );

            }

        });

        return meshes;

    }

}