"use strict";

class HalfEdge {
    constructor( endVertex, adjFace, oppHalfEdge, nextHalfEdge ) {
        this.endVertex = endVertex;
        this.adjFace = adjFace;
        this.oppHalfEdge = null;
        this.nextHalfEdge = nextHalfEdge;
    }

    is_boundary_edge() {
        return this.oppHalfEdge === null;
    }

    has_good_opposite() {
        return this.endVertex != this.oppHalfEdge.endVertex;
    }

    has_bad_opposite() {
        return ! this.has_good_opposite();
    }

    get oppFace() {
        return this.oppHalfEdge.adjFace;
    }

    get prevHalfEdge() {

        let self = this;
        // We can skip a bit because the smallest amount of sides a face can have will be 3.
        let current = self.nextHalfEdge.nextHalfEdge;

        while ( current.nextHalfEdge != self ) {
            current = current.nextHalfEdge;
        }

        return current;

    }

}