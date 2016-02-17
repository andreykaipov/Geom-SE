<?php

$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$fileType = pathinfo( $target_file, PATHINFO_EXTENSION );

// Check if file already exists
if ( file_exists($target_file) ) {
    echo "Sorry, file already exists.<br>";
    $uploadOk = 0;
}

// Check file size. Needs to be < 1 MB
if ($_FILES["fileToUpload"]["size"] > 1000000) {
    echo "Sorry, your file is too large.<br>";
    $uploadOk = 0;
}

// Allow certain file formats
if ($fileType != "obj" ) {
    echo "Sorry, only OBJ files are allowed.<br>";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ( $uploadOk == 0 ) {
    echo "Your file was not uploaded.";
}

// Check the folder and file permissions before you think the upload/write is not working!!
if ( $uploadOk == 1 ) {

    // Create a new file in our directory. We will write our triangulated obj file to it.
    $triangulated_obj_file = fopen ( $target_file, "w+" );

    // Make an array of lines from our obj file.
    $obj_file_arr = file( $_FILES["fileToUpload"]["tmp_name"] );

    // This is important data. :-)
    $numVertices = 0;
    $numFaces = 0;

    // Do the typical fan algorithm like in the OBJ_Viewer JS code.
    foreach ( array_unique($obj_file_arr) as $line ) {

        if ( $line[0] == 'v' && $line[1] == ' ' ) {
            fwrite( $triangulated_obj_file, $line );
            $numVertices++;
        }

        if ( $line[0] == 'f' && $line[1] == ' ' ) {

            $vertices = explode( ' ', substr(trim($line), 2) );
            $fixed_vertex = $vertices[0];

            for ( $i = 1; $i <= count($vertices) - 2; $i++ ) {
                fwrite( $triangulated_obj_file, 'f' . ' ' . $fixed_vertex . ' ' . $vertices[$i]  . ' ' . $vertices[$i+1] . "\n" );
                $numFaces++;
            }

        }

    }

    fclose( $triangulated_obj_file );

    // Use the Euler characteristic formula for closed surfaces, 2 - 2g = V - E + F.
    $numEdges = (3 / 2) * $numFaces;
    $genus = 1 - ($numVertices / 2) + ($numFaces / 4);

    // Write to our json data file.
    $uploads_data = fopen( "uploads/.uploads.json", "r+" );
    $obj_id = uniqid(rand());
    $tags = $_POST["tags"];
    $obj_info = "{ \"name\": \"{$_FILES["fileToUpload"]["name"]}\", \"id\": \"{$obj_id}\", \"path\": \"{$target_file}\", \"vertices\": {$numVertices}, \"edges\": {$numEdges}, \"faces\": {$numFaces}, \"genus\": {$genus}, \"tags\": \"{$tags}\" }";

    // These are some manipulations to keep the closing array bracket at the end.
    fseek( $uploads_data, -2, SEEK_END );
    fwrite( $uploads_data, ",\n" . $obj_info . " ]" );
    fclose( $uploads_data );

    echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";

}
else {
    echo "There was an error uploading your file.";
}

?>
