/**
  * @author Andrey Kaipov / https://github.com/andreykaipov
  *
  * This class is a static class meant for manipulating raw .obj files.
  * It's really just more housekeeping. See GFXViewer#add_obj_file for its uses.
  */

"use strict";

class OBJParser {

    /* Triangulates faces as if they were convex polygons because I can't think of a way
     * to implement a sophisticated polygon triangulation algorithm in 3D.
     * If we could assume that the obj file contains planar faces, then we could find the plane
     * on which the concave face vertices lie on, and then implement a 2D triangulation alg by a
     * change of basis, but I think that's a bold assumption! Plus that sounds hard either way. */
    static triangulate_convex( fileAsString ) {

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

    /* Given an .obj file as text, we parse its groups into an array of simple meshes.
     * A simple mesh is just a list of vertices and a list of faces on those vertices. */
    static parse_to_simple_meshes( fileAsString ) {

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

                if ( (line[0] === 'g' || line[0] === 'o') && (line[1] === ' ' || line[1] === '\t') ) {

                    namedGroupedExists = true;

                }

            }

        });

        if ( ! namedGroupedExists ) {

            nonVertexLines.unshift("g no-name!");

        }

        nonVertexLines.forEach( line => {

            if ( (line[0] === 'g' || line[0] === 'o') && (line[1] === ' ' || line[1] === '\t') ) {

                let mesh = {
                    name: line.substr( 1 ).trim(),
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