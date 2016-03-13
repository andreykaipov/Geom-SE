"use strict";

class HalfEdgeHash {

    constructor() {
        // Nah
    }

    form_halfedge_key( x, y ) {
        return [ Math.min(x,y), Math.max(x,y) ];
    }

    hash_halfedge( key, halfedge ) {

        let self = this;

        if ( self.hasOwnProperty(key) && self.hasOwnProperty(key.slice().reverse()) ) {
            alert(`Geometry is non-manifold bro.\n` +
                `The edge along the vertices ${key.map(v => v + 1)} touches more than two faces!`);
        }
        else if ( self.hasOwnProperty(key) ) {
            halfedge.oppHalfEdge = self[key];
            self[key].oppHalfEdge = halfedge;
            key = key.slice().reverse();
        }

        self[key] = halfedge;

    }

}