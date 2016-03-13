"use strict";

class HalfEdgeFace {

    constructor( adjHalfEdge ) {
        this.adjHalfEdge = adjHalfEdge;
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
        while ( current != self.adjHalfEdge );

        return adjHalfEdges;
    }

    get adj_vertices() {
        return this.adj_half_edges.map(he => he.endVertex);
    }

    orient_adj_faces() {

        let self = this;
        let orientedFaces = [];

        self.adj_half_edges.forEach( he => {

            if ( he.is_boundary_edge() ) {
                // A boundary edge only touches one face. There's no adjacent face to orient here.
            }
            else if ( he.oppFace.is_oriented() ) {
                // Already oriented.
            }
            else if ( he.has_bad_opposite() ) {
                console.log("Orienting the face on the vertices:\n");

                let oppAdjHalfEdges = he.oppFace.adj_half_edges;
                let oppAdjVertices = he.oppFace.adj_vertices;

                let oppSides = oppAdjHalfEdges.length;

                for ( let i = 0; i < oppSides; i++ ) {

                    let oppHE = oppAdjHalfEdges[(i + 1) % oppSides];
                    console.log(`${oppHE.endVertex.x} ${oppHE.endVertex.y} ${oppHE.endVertex.z}\n`);

                    oppHE.endVertex = oppAdjVertices[i];
                    oppHE.nextHalfEdge = oppAdjHalfEdges[i];
                    oppAdjVertices[(i + 1) % oppSides].outHalfEdge = oppHE;

                }

                if ( he.oppFace.adj_half_edges[0] !== he.oppFace.adj_half_edges.shift().nextHalfEdge ) {
                    console.log("bad");
                }

                he.oppFace.oriented = true;
                orientedFaces.push( he.oppFace );
            }
            else {
                console.log("Already oriented");
                he.oppFace.oriented = true;
                orientedFaces.push( he.oppFace );
            }

        });

        return orientedFaces;

    }

}