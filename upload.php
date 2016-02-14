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
    // if everything is ok, try to upload file
}

if ( $uploadOk == 1 ) {

    $obj_file_to_read = fopen( $_FILES["fileToUpload"]["tmp_name"], "r" );
    $triangulated_obj_file = fopen ( $target_file, "w+" );
    $numVertices = 0;
    $numFaces = 0;

    while ( ($line = fgets($obj_file_to_read) ) !== false ) {

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

    $numEdges = (3 / 2) * $numFaces;
    $genus = 1 - ($numVertices / 2) + ($numFaces / 4);

    fclose( $obj_file_to_read );
    fclose( $triangulated_obj_file );


    $uploadsDAT = fopen( "uploads/.uploads.dat", "a+" );

    $tags = $_POST["tags"];
    $text = "{ name: \"{$_FILES["fileToUpload"]["name"]}\", vertices: {$numVertices}, edges: {$numEdges}, faces: {$numFaces}, genus: {$genus}, tags: \"{$tags}\" }\n";

    fwrite( $uploadsDAT, $text );

    fclose( $uploadsDAT );

    move_uploaded_file( $_FILES["fileToUpload"]["tmp_name"], $triangulated_target_file );

    echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";

}
else {
    echo "There was an error uploading your file.";
}

?>
