"use strict";

class OBJParser {

    static parse( objFilePath ) {

        let mesh = {
            vertices: [],
            faces: []
        };

        let fileAsString = $.ajax({ url: objFilePath, async: false }).responseText;
        let lines = fileAsString.split(/[\r\n]/);

        lines.forEach( function( line ) {

            line = line.trim();

            if ( line[0] == 'v' && line[1] == ' ' )
                mesh.vertices.push( line.split(' ').filter(Boolean).map(parseFloat).splice(1) );

            else if ( line[0] == 'f' && line[1] == ' ' )
                mesh.faces.push( line.split(' ').filter(Boolean).map(x => parseInt(x) - 1).splice(1) );

        });

        return mesh;

    }

}