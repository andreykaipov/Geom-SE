"use strict";

// class OBJParser {
//
//     static parse( objFilePath ) {
//
//         let mesh = {
//             vertices: [],
//             faces: []
//         };
//
//         let fileAsString = $.ajax({ url: objFilePath, async: false }).responseText;
//         let lines = fileAsString.split(/[\r\n]/);
//         console.log(lines);
//         lines.forEach( function( line ) {
//
//             if ( line[0] == 'v' && line[1] == ' ' )
//                 mesh.vertices.push( line.split(' ').filter(Boolean).map(parseFloat).splice(1) );
//
//             else if ( line[0] == 'f' && line[1] == ' ' )
//                 mesh.faces.push( line.split(' ').filter(Boolean).map(x => parseInt(x) - 1).splice(1) );
//
//         });
//
//         return mesh;
//
//     }
//
// }

class OBJParser {

    static parseToSimpleMesh( objFilePath ) {

        let allVertices = [];
        let meshes = [];

        let meshCount = -1;

        let fileAsString = $.ajax({ url: objFilePath, async: false }).responseText;
        let lines = fileAsString.split(/[\r\n]/);

        let nonVertexLines = [];
        let groupExists = false;

        lines.forEach( line => {

            line = line.trim();

            if ( line[0] == 'v' && line[1] == ' ' )
                allVertices.push( line.split(' ').filter(Boolean).map(parseFloat).splice(1) );
            else {
                nonVertexLines.push( line );
                if ( line[0] == 'g' ) {
                    groupExists = true;
                }
            }

        });

        if ( groupExists === false ) {
            nonVertexLines.unshift("g NAME YOUR GROUPS PLAYA");
        }

        nonVertexLines.forEach( line => {

            if ( line[0] == 'g' && line[1] == ' ' ) {

                let mesh = {
                    vertices: {},
                    faces: []
                };
                meshes.push( mesh );
                meshCount += 1;

            }
            else if ( line[0] == 'f' && line[1] == ' ' ) {

                let face = line.split(' ').filter(Boolean).map(x => parseInt(x) - 1).splice(1);
                meshes[meshCount].faces.push( face );

                face.forEach( vIndex => meshes[meshCount].vertices[vIndex] = allVertices[vIndex] );

            }

        });

        return meshes;

    }

}