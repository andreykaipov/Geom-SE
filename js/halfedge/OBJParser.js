"use strict";

class OBJParser {

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

                let face = line.split(' ').filter(Boolean).map(x => parseInt(x) - 1).splice(1);

                meshes[ meshCount ].faces.push( face );

                face.forEach( vIndex => meshes[ meshCount ].vertices.set( vIndex, allVertices[vIndex] ) );

            }

        });

        return meshes;

    }

}