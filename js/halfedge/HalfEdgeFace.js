"use strict";

class HalfEdgeFace {

    constructor() {
        
        this.adjHalfEdge = null;
        this.oriented = false;

    }

    is_oriented() {

        return this.oriented === true;

    }

    get adj_half_edges() {

        let self = this;
        let adjHalfEdges = [];

        let current = self.adjHalfEdge;
        do {
            adjHalfEdges.push( current );
            current = current.nextHalfEdge;
        }
        while ( current !== self.adjHalfEdge );

        return adjHalfEdges;

    }

    get adj_vertices() {

        return this.adj_half_edges.map(he => he.endVertex);

    }

    // Checks whether or not the vertices of a face are unique with one another.
    // If they are not, then this face is degenerate.
    is_degenerate() {

        return this.adj_vertices.length !== new Set( this.adj_vertices ).size;

    }

    orient_adj_faces() {

        let self = this;
        let orientedFaces = [];

        self.adj_half_edges.forEach( he => {

            if ( he.is_boundary_edge() ) {

                console.log("Boundary edge");// A boundary edge only touches one face. There's no adjacent face to orient here.

            }
            else if ( he.oppFace.is_oriented() ) {

                if ( he.has_bad_opposite() ) {

                    throw new Error(`Mesh is unorientable. Terminated at face ${he.oppFace}.`);

                }

            }
            else if ( he.has_bad_opposite() ) {

                if ( he.oppFace.is_degenerate() ) throw new Error("Face is not on unique vertices.\n");

                let oppFaceAdjHalfEdges = he.oppFace.adj_half_edges;
                let oppFaceAdjVertices = he.oppFace.adj_vertices;
                let oppSides = oppAdjHalfEdges.length;

                console.log("Orienting the face on the vertices:\n");

                oppFaceAdjHalfEdges.forEach( (oppHE, i) => {

                    console.log(`${oppHE.endVertex.x} ${oppHE.endVertex.y} ${oppHE.endVertex.z}\n`);

                    let prevI = ((i - 1) + oppSides) % oppSides;

                    oppHE.endVertex = oppFaceAdjVertices[ prevI ];
                    oppHE.nextHalfEdge = oppFaceAdjHalfEdges[ prevI ];
                    oppFaceAdjVertices[ i ].outHalfEdge = oppHE;

                });

                if ( he.oppFace.adj_half_edges[0] !== he.oppFace.adj_half_edges.shift().nextHalfEdge ) {
                    throw new Error("New face orientation does not loop around.");
                }

                he.oppFace.oriented = true;
                orientedFaces.push( he.oppFace );
            }
            else {

                let oppFaceAdjHalfEdges = he.oppFace.adj_half_edges;
                let oppFaceAdjVertices = he.oppFace.adj_vertices;

                if ( he.oppFace.is_degenerate() ) throw new Error("Face is not on unique vertices.\n");

                console.log("Already oriented");
                he.oppFace.oriented = true;
                orientedFaces.push( he.oppFace );

            }

        });

        return orientedFaces;

    }

}