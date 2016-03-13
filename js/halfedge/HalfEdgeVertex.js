"use strict";

class HalfEdgeVertex {

    constructor( x, y, z, outHalfEdge ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.outHalfEdge = outHalfEdge;
    }

    is_boundary_vertex() {
        let self = this;

        if ( self.outHalfEdge === undefined || self.outHalfEdge === null ) {
            throw new Error("Woah. This program failed to identifying iahsdasdk");
        }
        else {
            var current = self.outHalfEdge; // var intentional
        }

        do {
            if ( current.is_boundary_edge() ) {
                return true;
            }
            current = current.oppHalfEdge.nextHalfEdge;
        }
        while ( current != self.outHalfEdge );

        return false;
    }

    get neighboring_vertices() {

        let self = this;

        if ( self.is_boundary_vertex() ) {
            return self.neighboring_vertices_for_boundary_vertex;
        }
        else {
            return self.neighboring_vertices_for_nonboundary_vertex;
        }

    }

    get neighboring_vertices_for_nonboundary_vertex() {

        let self = this;
        let neighbors = [];

        let current = self.outHalfEdge;
        do {
            neighbors.push( current.endVertex );
            current = current.oppHalfEdge.nextHalfEdge;
        }
        while ( current != self.outHalfEdge );

        return neighbors;

    }

    get neighboring_vertices_for_boundary_vertex() {

        let self = this;
        let neighbors = []

        let current = self.outHalfEdge;
        // Sweep to the boundary.
        while ( ! current.is_boundary_edge() ) {
            current = current.oppHalfEdge.nextHalfEdge;
        }
        neighbors.push( current.endVertex );
        // Sweep to the other boundary.
        do {
            current = current.prevHalfEdge.prevHalfEdge;
            neighbors.push( current.endVertex );
            current = current.nextHalfEdge.oppHalfEdge;
        }
        while ( current !== null );

        return neighbors;
        
    }

    adjacent_to( target ) {
        if ( this.is_boundary_vertex() ) {
            return this.neighboring_vertices_for_boundary_vertex.indexOf(target) >= 0
        }
        else {
            return this.neighboring_vertices_for_nonboundary_vertex.indexOf(target) >= 0
        }
    }

    adjacent_to_for_nonboundary_vertex( target ) {
        if ( this === target ) {
            return true;
        }
        else {
            return this.neighboring_vertices_for_nonboundary_vertex.indexOf(target) >= 0
        }
    }

    adjacent_to_for_boundary_vertex( target ) {
        if ( this === target ) {
            return true;
        }
        else {
            return this.neighboring_vertices_for_boundary_vertex.indexOf(target) >= 0
        }
    }
}