"use strict";

class HalfEdgeMesh {

    constructor( mesh ) {

        this.mesh = mesh;
        this.heVertices = [];
        this.heFaces = [];
        this.heHash = new HalfEdgeHash( );

    }

    build() {

        this.buildVertices();
        this.buildFaces();

    }

    // Transform each vertex from the simple mesh into a HalfEdgeVertex.
    buildVertices() {

        let self = this;
        self.mesh.vertices.forEach( v => {
            self.heVertices.push( new HalfEdgeVertex( v[0], v[1], v[2] ) );
        });

    }

    // Transform each face from the simple mesh into a HalfEdgeFace, giving each face an arbitrary orientation.
    buildFaces() {

        let self = this;
        self.mesh.faces.forEach( face => {

            let halfEdgeFace = new HalfEdgeFace();
            halfEdgeFace.oriented = false;

            let faceHalEdges = [];
            face.forEach( v => {
                let halfEdge = new HalfEdge();
                halfEdge.adjFace = halfEdgeFace;
                faceHalEdges.push( halfEdge );
            });

            let sides = faceHalEdges.length;
            for ( let i = 0; i < sides; i++ ) {
                faceHalEdges[(i + 1) % sides].endVertex = self.heVertices[ face[(i + 1) % sides] ];
                faceHalEdges[i].nextHalfEdge = faceHalEdges[(i + 1) % sides];
                self.heVertices[ face[i] ].outHalfEdge = faceHalEdges[(i + 1) % sides];

                let key = self.heHash.form_halfedge_key( face[i], face[(i + 1) % sides] );
                self.heHash.hash_halfedge( key, faceHalEdges[(i + 1) % sides] );
            }

            halfEdgeFace.adjHalfEdge = faceHalEdges[0];
            self.heFaces.push( halfEdgeFace );

        });

    }

    // Iteratively orient the faces of the mesh.
    orient() {

        this.heFaces.oriented = true;
        let stack = [ this.heFaces[0] ];
        while ( stack.length > 0 ) {
            let face = stack.pop();
            let orientedFaces = face.orient_adj_faces();
            orientedFaces.forEach( face => stack.push(face) );
        }

    }

    // Gets the count of vertices in the mesh.
    get vertices() {
        if ( this.heVertices.length != this.mesh.vertices.length ) {
            alert("Not every vertex from the obj file was transformed into a HalfEdgeVertex.");
        }
        else {
            return this.heVertices.length;
        }
    }

    // Gets the count of faces in the mesh.
    get faces() {
        if ( this.heFaces.length != this.mesh.faces.length ) {
            alert("Not every face from the obj file was transformed into a HalfEdgeFace.");
        }
        else {
            return this.heFaces.length;
        }
    }

    // Gets the count of the total number of edges for this mesh.
    // Boundary half-edges count as 1, and nonboundary half-edges count as 2.
    get edges() {

        let boundaryEdges = 0;
        let nonboundaryEdges = 0;
        let hash = this.heHash;
        for ( let key in hash ) {
            if ( hash[key].is_boundary_edge() ) {
                boundaryEdges += 1;
            }
            else {
                nonboundaryEdges += 1;
            }
        }
        return boundaryEdges + nonboundaryEdges / 2;

    }

    // Gets an array of the boundary edges.
    get boundary_edges() {

        let boundaryEdges = [];
        let hash = this.heHash;
        for ( let key in hash ) {
            if ( hash[key].is_boundary_edge() ) {
                boundaryEdges.push( hash[key] );
            }
        }
        return boundaryEdges;

    }

    // Gets an array of the boundary vertices.
    get boundary_vertices() {
        return this.heVertices.filter( hev => hev.is_boundary_vertex() );
    }

    // Gets an array of boundary components of this mesh.
    // A boundary component is an array of boundary vertices that are all mutually adjacent.
    get boundaries() {

        let boundaryComponents = [];

        let boundaryVertices = this.boundary_vertices;

        while ( boundaryVertices.length > 0 ) {
            let component = [ boundaryVertices.shift() ];

            boundaryVertices.forEach( bv => {
                if ( component.some( x => x.adjacent_to_for_boundary_vertex(bv) ) ) {
                    component.push(bv);
                }
            });
            boundaryVertices = boundaryVertices.filter( bv => component.indexOf(bv) < 0 );

            boundaryComponents.push( component );
        }

        return boundaryComponents;

    }

    // Gets the Euler characteristic of the mesh.
    get characteristic() {
        return this.vertices - this.edges + this.faces;
    }

    // Gets the genus of the mesh.
    get genus() {
        return 1 - (this.characteristic + this.boundaries.length) / 2;
    }

}