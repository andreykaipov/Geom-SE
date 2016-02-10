
function updateColor() {
    return function() {
        loadedObject.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material.color.setHex( guiControls.baseColor );

                pickedColor = child.material.color;
            }
        });
    }
}


function updateShading() {
    return function() {
        loadedObject.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material.shading = (child.material.shading === 1) ? 2 : 1;
                child.material.needsUpdate = true;

                pickedShading = child.material.shading;
            }
        });
    }
}
