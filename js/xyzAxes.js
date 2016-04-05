"use strict";

function getAxes( length ) {

    let axes = new THREE.Object3D();
    
    axes.add( getAxis( "+x", 100 ) );
    axes.add( getAxis( "-x", 100 ) );
    axes.add( getAxis( "+y", 100 ) );
    axes.add( getAxis( "-y", 100 ) );
    axes.add( getAxis( "+z", 100 ) );
    axes.add( getAxis( "-z", 100 ) );

    return axes;
    
}

function getAxis( axis, length ) {

    let sign = axis[ 0 ]; // "+" or "-"
    let coordinate = axis[ 1 ]; // "x", "y", or "z"

    // Make axis's geometry.
    let axisGeometry = new THREE.Geometry();
    let origin = new THREE.Vector3( 0, 0, 0 );
    let endPoint = new THREE.Vector3( 0, 0, 0 );
    endPoint[ coordinate ] = parseInt( sign + length );
    axisGeometry.vertices.push( origin, endPoint );

    // Make axis's material.
    let axisMaterial = new THREE.Material();

    if ( sign == "+" ) {

        axisMaterial = new THREE.LineDashedMaterial({ color: getAxisColor( axis ) });

    }
    else if ( axis[0] == "-" ) {

        axisGeometry.computeLineDistances();
        axisMaterial = new THREE.LineDashedMaterial({ color: getAxisColor( axis ), gapSize: 0.2, dashSize: 0.5});

    }

    return new THREE.Line( axisGeometry, axisMaterial );

}

function getAxisColor( axis ) {

    if ( axis[1] == "x" ) return new THREE.Color( 0xff0000 );
    if ( axis[1] == "y" ) return new THREE.Color( 0x00ff00 );
    if ( axis[1] == "z" ) return new THREE.Color( 0x0000ff );

}
