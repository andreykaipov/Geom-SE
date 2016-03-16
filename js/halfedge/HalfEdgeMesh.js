"use strict";

class HalfEdgeMesh {

    constructor( mesh ) {

        this.mesh = mesh;
        this.heVertices = new Map();
        this.heFaces = new Array();
        this.heHash = new HalfEdgeHash();

    }

    build() {

        this.buildVertices();
        this.buildFaces();
        this.checkVerticesAndEdges();

    }

    // Transform each vertex from the simple mesh into a HalfEdgeVertex.
    buildVertices() {

        let self = this;
        let simpleVertices = self.mesh.vertices;

        simpleVertices.forEach( (v, vIndex) => {

            this.heVertices.set( vIndex, new HalfEdgeVertex( v[0], v[1], v[2] ) );

        });

    }

    // Transform each face from the simple mesh into a HalfEdgeFace, giving each face an arbitrary orientation.
    buildFaces() {

        let self = this;

        self.mesh.faces.forEach( face => {

            // Create the HalfEdgeFace representation, and the half-edges associated for this face.
            let halfEdgeFace = new HalfEdgeFace();
            let halfEdgesOfFace = [];
            face.forEach( _ => {
                let halfEdge = new HalfEdge();
                halfEdge.adjFace = halfEdgeFace;
                halfEdgesOfFace.push( halfEdge );
            });
            halfEdgeFace.adjHalfEdge = halfEdgesOfFace[0];

            // Now give each face an arbitrary orientation.
            let sides = face.length;
            face.forEach( (vIndex, i) => {
                let prevI = ((i - 1) + sides) % sides;
                let prevVIndex = face[ prevI ];

                halfEdgesOfFace[i].endVertex = self.heVertices.get(vIndex);
                halfEdgesOfFace[prevI].nextHalfEdge = halfEdgesOfFace[i];
                self.heVertices.get(prevVIndex).outHalfEdge = halfEdgesOfFace[i];

                let vIndexPair = self.heHash.form_pair( prevVIndex, vIndex );
                self.heHash.hash_halfedge( vIndexPair, halfEdgesOfFace[i] );
            });

            self.heFaces.push( halfEdgeFace );

        });

    }

    checkVerticesAndEdges() {

        if ( this.vertices !== this.mesh.vertices.size ) {
            throw new Error("Not every vertex from the obj file was transformed into a HalfEdgeVertex.");
        }
        if ( this.heFaces.length != this.mesh.faces.length ) {
            throw new Error("Not every face from the obj file was transformed into a HalfEdgeFace.");
        }
        if ( this.boundary_edges.length !== this.boundary_vertices.length ) {
            throw new Error("Boundary edges not equal to bujdf non-manifold");
        }

    }

    // Iteratively orient the faces of the mesh.
    orient() {

        let unorientedFaces = this.heFaces;
        let disconnectedGroups = 0;

        while ( unorientedFaces.length > 0 ) {

            unorientedFaces[0].oriented = true;

            let stack = [ unorientedFaces[0] ];

            while ( stack.length > 0 ) {

                let face = stack.pop();

                let orientedFaces = face.orient_adj_faces();

                orientedFaces.forEach( face => stack.push(face) );

            }

            unorientedFaces = unorientedFaces.filter( face => ! face.is_oriented() );
            disconnectedGroups += 1;

        }

        this.disconnectedGroups = disconnectedGroups;

        return true;

    }

    // Checks to see if every HalfEdgeFace of this mesh is properly oriented.
    // Equivalently, we ask if there are no faces that not properly oriented.
    everyFaceOriented() {

        return ! this.heFaces.some( hef => ! hef.is_oriented() );

    }

    // Checks to see if this mesh has degenerate faces.
    // What did I need this for again..?
    hasDegenerateFaces() {

        return this.heFaces.some( hef => hef.is_degenerate() );

    }

    // Gets the count of vertices in the mesh.
    get vertices() {
        return this.heVertices.size;
    }

    // Gets the count of faces in the mesh.
    get faces() {
        return this.heFaces.length;
    }

    // Gets the count of the total number of edges for this mesh.
    // Boundary half-edges count as 1, and nonboundary half-edges count as 2.
    get edges() {

        let boundaryEdges = 0;
        let nonboundaryEdges = 0;

        this.heHash.forEach( (halfedge, _) => {

            halfedge.is_boundary_edge() ? boundaryEdges += 1
                                        : nonboundaryEdges += 1;

        });

        return boundaryEdges + nonboundaryEdges / 2;

    }

    // Gets an array of the boundary edges.
    get boundary_edges() {

        let boundaryEdges = [];

        this.heHash.forEach( (halfedge, _) => {

            if ( halfedge.is_boundary_edge() ) {

                boundaryEdges.push( halfedge );

            }

        });

        return boundaryEdges;

    }

    // Gets an array of the boundary vertices.
    get boundary_vertices() {

        let boundaryVertices = [];

        this.heVertices.forEach( hev => {

            if ( hev.is_boundary_vertex() ) {

                boundaryVertices.push( hev );

            }

        });

        return boundaryVertices;

    }

    // Gets an array of boundary components of this mesh.
    // A boundary component is an array of boundary vertices that are all mutually adjacent.
    // This algorithm scales poorly for obj files with many boundaries!
    get boundaries() {

        let boundaryComponents = [];
        let boundaryVertices = this.boundary_vertices;

        while ( boundaryVertices.length > 0 ) {

            let boundaryComponent = [];
            let discovered = [ boundaryVertices.shift() ];

            while ( discovered.length > 0 ) {

                let vertex = discovered.pop();
                boundaryComponent.push( vertex );

                boundaryVertices.forEach( bv => {
                    if ( vertex.adjacent_via_boundary_edge_to(bv) ) {
                        discovered.push( bv );
                    }
                });

                boundaryVertices = boundaryVertices.filter( bv => discovered.indexOf(bv) < 0 );

            }

            boundaryComponents.push( boundaryComponent );

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