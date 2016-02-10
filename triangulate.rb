# ARGV[0] is the source .obj file to be triangulated.
# ARGV[1] is the triangulated .obj file with a name of your choice.
#
# Example:
# ruby triangulate.rb ../3D_Models/82porsche.obj 82porsche-triangulated.obj

output = File.open( ARGV[1], "w" )

File.open( ARGV[0] ) do |file|

    file.each_line do |line|

        if ( line[0] == 'f' )

            vertices = line.slice(2..-1).split(' ')
            fixed_vertex = vertices[0];

            # We can fill up a polygon with (|V| - 2) triangles.
            (vertices.length - 2).times do |i|
                output << 'f' + " " + fixed_vertex + " " + vertices[i+1] + " " + vertices[i+2]
                output << "\n"
            end

        else

            output << line

        end

    end

end

output.close
