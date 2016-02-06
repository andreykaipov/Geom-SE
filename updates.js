
function updateColor() {
    return function() {
        object.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                //console.log(guiControls.baseColor)
                var color = guiControls.baseColor;
                //console.log(color);
                child.material.color.setHex(color);
            }
        });
    }
}

function updateShading() {
    return function() {
        object.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material.shading = (child.material.shading === 1) ? 2 : 1;
                child.material.needsUpdate = true;
            }
        });
    }
}
