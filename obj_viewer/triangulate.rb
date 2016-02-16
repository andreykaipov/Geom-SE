#
# @author Andrey Kaipov
#
# ARGV[0] is the source .obj file to be triangulated.
# ARGV[1] is the triangulated .obj file with a name of your choice.
#
# Further, this script removes vertex texture coordinates, vertex normals,
# and parameter space vertices. See https://en.wikipedia.org/wiki/Wavefront_.obj_file#File_format.
# We compute our own face normals and vertex normals.
#
# Example:
# ruby triangulate.rb ../3D_Models/82porsche.obj 82porsche-triangulated.obj

output = File.open( ARGV[1], "w" )

File.open( ARGV[0] ) do |file|

    file.each_line do |line|

        first_char = line[0];
        second_char = line[1];

        if ( first_char == 'f' && second_char == ' ' )

            vertices = line.slice(2..-1).split(' ')
            fixed_vertex = vertices[0];

            # We can fill up a polygon with (|V| - 2) triangles.
            (vertices.length - 2).times do |i|
                output << 'f' + " " + fixed_vertex + " " + vertices[i+1] + " " + vertices[i+2]
                output << "\n"
            end

        elsif ( first_char == 'v' && second_char == ' ' )

            output << line

        end

    end

end

output.close
