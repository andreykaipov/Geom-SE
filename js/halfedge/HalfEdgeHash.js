/**
  * @author Andrey Kaipov / https://github.com/andreykaipov
  */

"use strict";

class HalfEdgeHash extends Map {

    constructor() {

        super();

    }

    form_pair( x, y ) {

        return [ [ Math.min( x, y ) ], [ Math.max( x, y ) ] ];

    }

    // Encodes two natural numbers using Cantor's pairing function.
    // https://en.wikipedia.org/wiki/Pairing_function
    encode_pair( x, y ) {

        return ( 1 / 2 ) * ( x + y ) * ( x + y + 1 ) + y;

    }

    // If the hash has both the key and the reverseKey, that's not good.
    // Otherwise, if the hash has only one key, then the half-edge we are adding
    // is opposite to the one already in the hash at that key.
    // If the hash doesn't have any key, then just add it in.
    hash_halfedge( vIndexPair, halfedge ) {

        let hash = this;
        let key = this.encode_pair( vIndexPair[0], vIndexPair[1] );
        let reverseKey = this.encode_pair( vIndexPair[1], vIndexPair[0] );

        if ( hash.has( key ) && hash.has( reverseKey ) ) {

            throw new Error(`Geometry is non-manifold bro.\n` +
                `The edge along the vertices sss touches more than two faces!`);

        }
        else if ( hash.has( key ) ) {

            halfedge.oppHalfEdge = hash.get( key );
            hash.get( key ).oppHalfEdge = halfedge;
            hash.set( reverseKey, halfedge );

        }
        else {

            hash.set( key, halfedge );

        }

    }

}